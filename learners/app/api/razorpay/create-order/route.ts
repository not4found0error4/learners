import Razorpay from 'razorpay';

export async function POST(request: Request) {
  try {
    const {
      amount: amountInRupees,
      customerName,
      customerEmail,
      customerPhone,
      address,
      city,
      state,
      pincode,
      cartItems,
    } = await request.json();

    if (
      typeof amountInRupees !== 'number' ||
      !Number.isFinite(amountInRupees) ||
      amountInRupees <= 0
    ) {
      return Response.json({ error: 'A valid order amount is required.' }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return Response.json({ error: 'Razorpay is not configured.' }, { status: 500 });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.create({
      amount: Math.round(amountInRupees * 100),
      currency: 'INR',
      notes: {
        customer_name: String(customerName || ''),
        customer_email: String(customerEmail || ''),
        customer_phone: String(customerPhone || ''),
        address: String(address || ''),
        city: String(city || ''),
        state: String(state || ''),
        pincode: String(pincode || ''),
        cart_items: JSON.stringify(Array.isArray(cartItems) ? cartItems : []),
      },
    });

    return Response.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch {
    return Response.json({ error: 'Unable to create the Razorpay order.' }, { status: 500 });
  }
}