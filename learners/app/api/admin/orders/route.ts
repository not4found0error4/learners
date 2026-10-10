import { NextRequest, NextResponse } from 'next/server';
import { hasAuthenticatedAdminSession } from '@/lib/adminAuth';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  if (!(await hasAuthenticatedAdminSession(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const status = request.nextUrl.searchParams.get('status');
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from('orders')
    .select('id, customer_id, total_amount, status, razorpay_order_id, razorpay_payment_id, created_at, customers(name)')
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: summaryOrders, error: summaryError } = await supabase
    .from('orders')
    .select('status');
  if (summaryError) {
    return NextResponse.json({ error: summaryError.message }, { status: 500 });
  }

  return NextResponse.json({
    orders: data,
    summary: {
      total: summaryOrders.length,
      paid: summaryOrders.filter((order) => order.status === 'paid').length,
    },
  });
}
