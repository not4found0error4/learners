import { NextRequest, NextResponse } from 'next/server';
import { hasAuthenticatedAdminSession } from '@/lib/adminAuth';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';

type RouteContext = { params: Promise<{ id: string }> };

const validStatuses = ['pending', 'paid', 'packed', 'shipped', 'delivered', 'cancelled'];

export async function GET(request: NextRequest, context: RouteContext) {
  if (!(await hasAuthenticatedAdminSession(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, customer_id, subtotal_amount, shipping_amount, total_weight_grams, total_amount, status, razorpay_order_id, razorpay_payment_id, created_at,
      customers(id, name, email, phone, address, city, state, pincode),
      order_items(id, book_id, quantity, price_at_purchase, books(title)),
      order_status_history(id, old_status, new_status, changed_at)
    `)
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ order: data });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!(await hasAuthenticatedAdminSession(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const { status } = await request.json();
  if (typeof status !== 'string' || !validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid order status.' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('status')
    .eq('id', id)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: orderError?.message || 'Order not found.' }, { status: 404 });
  }

  if (order.status === status) {
    return NextResponse.json({ error: 'The order already has this status.' }, { status: 400 });
  }

  const { error } = await supabase.from('orders').update({ status }).eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { error: historyError } = await supabase.from('order_status_history').insert({
    order_id: id,
    old_status: order.status,
    new_status: status,
  });
  if (historyError) {
    console.error('[admin orders] Failed to record status history:', historyError);
    return NextResponse.json({ error: 'Status changed, but status history could not be recorded.' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    status,
    stockWasReduced: status === 'cancelled' && ['paid', 'packed'].includes(order.status),
  });
}
