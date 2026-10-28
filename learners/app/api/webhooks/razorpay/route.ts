import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  ADMIN_EMAIL,
  buildAdminOrderNotificationEmail,
  buildOrderConfirmationEmail,
  sendEmail,
} from '@/lib/email';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';

type RazorpayPayload = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        amount?: number;
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

    if (!payment?.id || !payment.order_id || typeof payment.amount !== 'number') {
      throw new Error('Captured payment payload is missing required fields.');
    }

    const adminSupabase = createSupabaseAdminClient();

    console.log('[razorpay webhook] Looking up order:', payment.order_id);
    const { data: order, error: orderLookupError } = await adminSupabase
      .from('orders')
      .select(
        'id, status, customer_id, total_amount, subtotal_amount, shipping_amount, total_weight_grams',
      )
      .eq('razorpay_order_id', payment.order_id)
      .maybeSingle();

    if (orderLookupError) {
      console.error('[razorpay webhook] Failed to find order:', orderLookupError);
      throw orderLookupError;
    }

    if (!order) {
      console.error('[razorpay webhook] No order found for captured payment:', payment.order_id);
      return Response.json({ received: true });
    }

    if (order.status !== 'awaiting_payment') {
      console.log(
        '[razorpay webhook] Order already processed or not awaiting payment:',
        payment.order_id,
        order.status,
      );
      return Response.json({ received: true });
    }

    const totalAmount = Number(order.total_amount);
    const expectedAmountPaise = Math.round(totalAmount * 100);

    if (payment.amount !== expectedAmountPaise) {
      console.warn('[razorpay webhook] PAYMENT AMOUNT MISMATCH; processing captured payment:', {
        orderId: order.id,
        razorpayOrderId: payment.order_id,
        expectedAmountPaise,
        capturedAmountPaise: payment.amount,
      });
    }

    const [customerResult, itemsResult] = await Promise.all([
      adminSupabase
        .from('customers')
        .select('name, email, phone, address, city, state, pincode')
        .eq('id', order.customer_id)
        .maybeSingle(),
      adminSupabase
        .from('order_items')
        .select('book_id, quantity, price_at_purchase, books(title)')
        .eq('order_id', order.id),
    ]);

    if (customerResult.error || !customerResult.data) {
      console.error('[razorpay webhook] Failed to load order customer:', customerResult.error);
      throw customerResult.error || new Error('Order customer was not found.');
    }

    if (itemsResult.error || !itemsResult.data?.length) {
      console.error('[razorpay webhook] Failed to load order items:', itemsResult.error);
      throw itemsResult.error || new Error('Order has no saved items.');
    }

    const { data: claimedOrder, error: claimError } = await adminSupabase
      .from('orders')
      .update({ status: 'paid', razorpay_payment_id: payment.id })
      .eq('id', order.id)
      .eq('status', 'awaiting_payment')
      .select('id')
      .maybeSingle();

    if (claimError) {
      console.error('[razorpay webhook] Failed to mark order paid:', claimError);
      throw claimError;
    }

    if (!claimedOrder) {
      console.log('[razorpay webhook] Order was already claimed by another delivery:', payment.order_id);
      return Response.json({ received: true });
    }

    for (const item of itemsResult.data) {
      const { data: book, error: bookError } = await adminSupabase
        .from('books')
        .select('title, stock')
        .eq('id', item.book_id)
        .maybeSingle();

      if (bookError || !book) {
        console.warn(
          `[razorpay webhook] Could not read stock for book ${item.book_id}; payment remains processed:`,
          bookError,
        );
        continue;
      }

      if (book.stock < item.quantity) {
        console.warn(
          `[razorpay webhook] Insufficient stock for "${book.title}" (${item.book_id}); payment remains processed.`,
        );
        continue;
      }

      const { data: updatedBook, error: stockError } = await adminSupabase
        .from('books')
        .update({ stock: book.stock - item.quantity })
        .eq('id', item.book_id)
        .eq('stock', book.stock)
        .gte('stock', item.quantity)
        .select('id')
        .maybeSingle();

      if (stockError) {
        console.warn(
          `[razorpay webhook] Failed to decrement stock for "${book.title}" (${item.book_id}); payment remains processed:`,
          stockError,
        );
      } else if (!updatedBook) {
        console.warn(
          `[razorpay webhook] Stock changed before decrementing "${book.title}" (${item.book_id}); payment remains processed.`,
        );
      }
    }

    const customer = customerResult.data;
    const emailItems = itemsResult.data.map((item) => {
      const bookRelation = item.books;
      const book = Array.isArray(bookRelation) ? bookRelation[0] : bookRelation;

      return {
        title: book?.title || 'Book',
        price: Number(item.price_at_purchase),
        quantity: item.quantity,
      };
    });
    const subtotal = Number(order.subtotal_amount);
    const shipping = Number(order.shipping_amount);
    const totalWeightGrams = Number(order.total_weight_grams);
    const summary = {
      subtotal,
      shipping,
      billedKg:
        emailItems.length > 0 ? Math.max(1, Math.ceil(totalWeightGrams / 1000)) : 0,
      total: totalAmount,
    };
    const orderId = String(order.id);
    const shippingAddress = [customer.address, customer.city, customer.state, customer.pincode]
      .filter(Boolean)
      .join(', ');

    try {
      await sendEmail(
        customer.email,
        `Order confirmation - ${orderId}`,
        buildOrderConfirmationEmail(customer.name, orderId, emailItems, summary, shippingAddress),
      );
      console.log('[razorpay webhook] Customer confirmation email sent:', customer.email);
    } catch (error) {
      console.error('[razorpay webhook] Customer confirmation email failed:', error);
    }

    try {
      await sendEmail(
        ADMIN_EMAIL,
        `New order received - ${orderId}`,
        buildAdminOrderNotificationEmail(customer.name, orderId, emailItems, summary),
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
