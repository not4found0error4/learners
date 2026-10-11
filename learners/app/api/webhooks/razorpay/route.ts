import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  ADMIN_EMAIL,
  buildAdminOrderNotificationEmail,
  buildOrderConfirmationEmail,
  sendEmail,
} from '@/lib/email';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';

type CartItem = {
  id: string;
  title?: string;
  price: number;
  quantity: number;
};

type RazorpayPayload = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        amount?: number;
        notes?: Record<string, string>;
      };
    };
  };
};

function isValidSignature(body: string, signature: string, secret: string) {
  const expectedSignature = createHmac('sha256', secret).update(body).digest('hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  const receivedBuffer = Buffer.from(signature, 'utf8');

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

function parseCartItems(value: string | undefined): CartItem[] {
  if (!value) {
    throw new Error('Webhook notes do not contain cart items.');
  }

  const parsed: unknown = JSON.parse(value);

  if (!Array.isArray(parsed)) {
    throw new Error('Webhook cart items must be an array.');
  }

  return parsed.map((item) => {
    if (
      typeof item !== 'object' ||
      item === null ||
      typeof item.id !== 'string' ||
      typeof item.price !== 'number' ||
      typeof item.quantity !== 'number' ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      throw new Error('Webhook contains an invalid cart item.');
    }

    return item as CartItem;
  });
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('x-razorpay-signature');
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!signature || !webhookSecret || !isValidSignature(body, signature, webhookSecret)) {
    console.error('[razorpay webhook] Signature verification failed.');
    return Response.json({ error: 'Invalid webhook signature.' }, { status: 400 });
  }

  try {
    const payload = JSON.parse(body) as RazorpayPayload;

    if (payload.event !== 'payment.captured') {
      return Response.json({ received: true });
    }

    const payment = payload.payload?.payment?.entity;
    const notes = payment?.notes;

    if (!payment?.id || !payment.order_id || typeof payment.amount !== 'number' || !notes) {
      throw new Error('Captured payment payload is missing required fields.');
    }

    const cartItems = parseCartItems(notes.cart_items);
    const adminSupabase = createSupabaseAdminClient();

    console.log('[razorpay webhook] Checking for an existing order.');
    const { data: existingOrder, error: existingOrderError } = await adminSupabase
      .from('orders')
      .select('id')
      .eq('razorpay_order_id', payment.order_id)
      .maybeSingle();

    if (existingOrderError) {
      console.error('[razorpay webhook] Failed to check existing order:', existingOrderError);
      throw existingOrderError;
    }

    if (existingOrder) {
      console.log('[razorpay webhook] Order already processed:', payment.order_id);
      return Response.json({ received: true });
    }

    console.log('[razorpay webhook] Inserting customer.');
    const { data: customer, error: customerError } = await adminSupabase
      .from('customers')
      .insert({
        name: notes.customer_name,
        email: notes.customer_email,
        phone: notes.customer_phone,
        address: notes.address,
        city: notes.city,
        state: notes.state,
        pincode: notes.pincode,
      })
      .select('id')
      .single();

    if (customerError || !customer) {
      console.error('[razorpay webhook] Failed to insert customer:', customerError);
      throw customerError || new Error('Customer insert returned no row.');
    }

    console.log('[razorpay webhook] Inserting order.');
    const { data: order, error: orderError } = await adminSupabase
      .from('orders')
      .insert({
        customer_id: customer.id,
        total_amount: payment.amount / 100,
        status: 'paid',
        razorpay_order_id: payment.order_id,
        razorpay_payment_id: payment.id,
      })
      .select('id')
      .single();

    if (orderError || !order) {
      console.error('[razorpay webhook] Failed to insert order:', orderError);
      throw orderError || new Error('Order insert returned no row.');
    }

    for (const item of cartItems) {
      console.log('[razorpay webhook] Inserting order item:', item.id);
      const { error: itemError } = await adminSupabase.from('order_items').insert({
        order_id: order.id,
        book_id: item.id,
        quantity: item.quantity,
        price_at_purchase: item.price,
      });

      if (itemError) {
        console.error('[razorpay webhook] Failed to insert order item:', itemError);
        throw itemError;
      }

      console.log('[razorpay webhook] Decrementing stock:', item.id);
      const { data: book, error: bookError } = await adminSupabase
        .from('books')
        .select('stock')
        .eq('id', item.id)
        .single();

      if (bookError || !book) {
        console.error('[razorpay webhook] Failed to read book stock:', bookError);
        throw bookError || new Error(`Book not found: ${item.id}`);
      }

      if (book.stock < item.quantity) {
        console.warn(
          `[razorpay webhook] Insufficient stock for book ${item.id}; order item was saved.`,
        );
        continue;
      }

      const { data: updatedBook, error: stockError } = await adminSupabase
        .from('books')
        .update({ stock: book.stock - item.quantity })
        .eq('id', item.id)
        .gte('stock', item.quantity)
        .select('id')
        .maybeSingle();

      if (stockError) {
        console.error('[razorpay webhook] Failed to decrement book stock:', stockError);
        throw stockError;
      }

      if (!updatedBook) {
        console.warn(
          `[razorpay webhook] Stock changed before decrementing book ${item.id}; order item was saved.`,
        );
      }
    }

    const orderId = String(order.id);
    const totalAmount = payment.amount / 100;
    const shippingAddress = [notes.address, notes.city, notes.state, notes.pincode]
      .filter(Boolean)
      .join(', ');

    try {
      await sendEmail(
        notes.customer_email,
        `Order confirmation - ${orderId}`,
        buildOrderConfirmationEmail(
          notes.customer_name,
          orderId,
          cartItems,
          totalAmount,
          shippingAddress,
        ),
      );
      console.log('[razorpay webhook] Customer confirmation email sent:', notes.customer_email);
    } catch (error) {
      console.error('[razorpay webhook] Customer confirmation email failed:', error);
    }

    try {
      await sendEmail(
        ADMIN_EMAIL,
        `New order received - ${orderId}`,
        buildAdminOrderNotificationEmail(notes.customer_name, orderId, cartItems, totalAmount),
      );
      console.log('[razorpay webhook] Admin notification email sent:', ADMIN_EMAIL);
    } catch (error) {
      console.error('[razorpay webhook] Admin notification email failed:', error);
    }

    console.log('[razorpay webhook] Payment captured and order saved:', payment.order_id);
    return Response.json({ received: true });
  } catch (error) {
    console.error('[razorpay webhook] Failed to process payment.captured:', error);
    return Response.json({ error: 'Unable to process webhook.' }, { status: 500 });
  }
}