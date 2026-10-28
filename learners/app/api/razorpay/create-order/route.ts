import Razorpay from 'razorpay';
import { calculateShipping } from '@/lib/shipping';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';

type CartItemInput = {
  id: string;
  quantity: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  if (!isRecord(body)) {
    return Response.json({ error: 'Order details are required.' }, { status: 400 });
  }

  const name = requiredText(body.name);
  const email = requiredText(body.email);
  const phone = requiredText(body.phone);
  const address = requiredText(body.address);
  const city = requiredText(body.city);
  const state = requiredText(body.state);
  const pincode = requiredText(body.pincode);

  if (!name || !email || !phone || !address || !city || !state || !pincode) {
    return Response.json({ error: 'Please provide all required delivery details.' }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: 'Please provide a valid email address.' }, { status: 400 });
  }

  if (!/^\d{10}$/.test(phone)) {
    return Response.json({ error: 'Phone number must contain exactly 10 digits.' }, { status: 400 });
  }

  if (!/^\d{6}$/.test(pincode)) {
    return Response.json({ error: 'Pincode must contain exactly 6 digits.' }, { status: 400 });
  }

  if (!Array.isArray(body.cartItems) || body.cartItems.length === 0) {
    return Response.json({ error: 'Your cart is empty.' }, { status: 400 });
  }

  const cartItems: CartItemInput[] = [];
  const itemIds = new Set<string>();

  for (const item of body.cartItems) {
    if (
      !isRecord(item) ||
      Object.keys(item).length !== 2 ||
      !Object.hasOwn(item, 'id') ||
      !Object.hasOwn(item, 'quantity') ||
      typeof item.id !== 'string' ||
      !item.id.trim() ||
      typeof item.quantity !== 'number' ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      return Response.json(
        { error: 'Each cart item must contain only a book id and a positive whole-number quantity.' },
        { status: 400 },
      );
    }

    const id = item.id.trim();
    if (itemIds.has(id)) {
      return Response.json({ error: 'Each book may appear only once in the cart.' }, { status: 400 });
    }

    itemIds.add(id);
    cartItems.push({ id, quantity: item.quantity });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return Response.json({ error: 'Razorpay is not configured.' }, { status: 500 });
  }

  try {
    const adminSupabase = createSupabaseAdminClient();
    const { data: books, error: booksError } = await adminSupabase
      .from('books')
      .select('id, title, price, stock, weight_grams, is_active')
      .in('id', cartItems.map((item) => item.id));

    if (booksError) {
      console.error('[razorpay create-order] Failed to load books:', booksError);
      throw booksError;
    }

    const pricedItems = [];

    for (const item of cartItems) {
      const book = books?.find((candidate) => candidate.id === item.id);

      if (!book) {
        return Response.json(
          { error: 'A book in your cart could not be found. Please refresh your cart.' },
          { status: 400 },
        );
      }

      if (!book.is_active) {
        return Response.json(
          { error: `${book.title} is no longer available for purchase.` },
          { status: 400 },
        );
      }

      if (book.weight_grams === null || book.weight_grams === undefined) {
        console.error(
          `[razorpay create-order] Book "${book.title}" (${book.id}) has no weight_grams.`,
        );
        return Response.json(
          { error: `Delivery weight is missing for "${book.title}". Please contact support.` },
          { status: 400 },
        );
      }

      const price = Number(book.price);
      const stock = Number(book.stock);
      const weightGrams = Number(book.weight_grams);

      if (!Number.isFinite(price) || price < 0 || !Number.isFinite(stock)) {
        console.error(`[razorpay create-order] Book "${book.title}" (${book.id}) has invalid pricing or stock.`);
        throw new Error(`Book has invalid pricing or stock: ${book.id}`);
      }

      if (!Number.isFinite(weightGrams) || weightGrams < 0) {
        console.error(`[razorpay create-order] Book "${book.title}" (${book.id}) has invalid weight_grams.`);
        return Response.json(
          { error: `Delivery weight is invalid for "${book.title}". Please contact support.` },
          { status: 400 },
        );
      }

      if (stock < item.quantity) {
        return Response.json(
          {
            error:
              stock > 0
                ? `Only ${stock} ${stock === 1 ? 'copy' : 'copies'} of "${book.title}" are in stock.`
                : `"${book.title}" is out of stock.`,
          },
          { status: 400 },
        );
      }

      pricedItems.push({ ...item, title: book.title, price, weight_grams: weightGrams });
    }

    const subtotalPaise = pricedItems.reduce(
      (subtotal, item) => subtotal + Math.round(item.price * 100) * item.quantity,
      0,
    );
    const subtotal = subtotalPaise / 100;
    const shipping = calculateShipping(pricedItems);
    const totalPaise = subtotalPaise + Math.round(shipping.shippingAmount * 100);
    const total = totalPaise / 100;

    if (!Number.isSafeInteger(totalPaise) || totalPaise <= 0) {
      return Response.json({ error: 'The calculated order total is invalid.' }, { status: 400 });
    }

    console.log('[razorpay create-order] Inserting customer.');
    const { data: customer, error: customerError } = await adminSupabase
      .from('customers')
      .insert({ name, email, phone, address, city, state, pincode })
      .select('id')
      .single();

    if (customerError || !customer) {
      console.error('[razorpay create-order] Failed to insert customer:', customerError);
      throw customerError || new Error('Customer insert returned no row.');
    }

    console.log('[razorpay create-order] Inserting awaiting-payment order.');
    const { data: savedOrder, error: orderError } = await adminSupabase
      .from('orders')
      .insert({
        customer_id: customer.id,
        subtotal_amount: subtotal,
        shipping_amount: shipping.shippingAmount,
        total_weight_grams: shipping.totalGrams,
        total_amount: total,
        status: 'awaiting_payment',
      })
      .select('id')
      .single();

    if (orderError || !savedOrder) {
      console.error('[razorpay create-order] Failed to insert order:', orderError);
      throw orderError || new Error('Order insert returned no row.');
    }

    const { error: itemsError } = await adminSupabase.from('order_items').insert(
      pricedItems.map((item) => ({
        order_id: savedOrder.id,
        book_id: item.id,
        quantity: item.quantity,
        price_at_purchase: item.price,
      })),
    );

    if (itemsError) {
      console.error('[razorpay create-order] Failed to insert order items:', itemsError);
      throw itemsError;
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const razorpayOrder = await razorpay.orders.create({
      amount: totalPaise,
      currency: 'INR',
      notes: { order_id: String(savedOrder.id) },
    });

    const { error: updateError } = await adminSupabase
      .from('orders')
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq('id', savedOrder.id);

    if (updateError) {
      console.error('[razorpay create-order] Failed to save Razorpay order id:', updateError);
      throw updateError;
    }

    return Response.json({
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      breakdown: {
        subtotal,
        shipping: shipping.shippingAmount,
        billedKg: shipping.billedKg,
        total,
      },
    });
  } catch (error) {
    console.error('[razorpay create-order] Unable to create order:', error);
    return Response.json({ error: 'Unable to create the Razorpay order.' }, { status: 500 });
  }
}
