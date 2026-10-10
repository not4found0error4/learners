'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type Customer = { name: string; email: string; phone: string; address: string; city: string; state: string; pincode: string } | null;
type OrderItem = { id: string; quantity: number; price_at_purchase: number; books: { title: string } | { title: string }[] | null };
type StatusHistoryEntry = { id: number; old_status: string; new_status: string; changed_at: string };
type Order = { id: string; total_amount: number; status: string; razorpay_order_id: string; razorpay_payment_id: string; created_at: string; customers: Customer | Customer[]; order_items: OrderItem[]; order_status_history: StatusHistoryEntry[] };

const statusStyles: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-800', paid: 'bg-blue-100 text-blue-800', packed: 'bg-orange-100 text-orange-800', shipped: 'bg-purple-100 text-purple-800', delivered: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800' };
const statuses = ['pending', 'paid', 'packed', 'shipped', 'delivered', 'cancelled'];

function first<T>(value: T | T[]) { return Array.isArray(value) ? value[0] : value; }

export default function AdminOrderDetailPage() {
  const routeParams = useParams<{ id: string }>();
  const orderId = routeParams.id;
  const [order, setOrder] = useState<Order | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [stockReminder, setStockReminder] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/orders/${orderId}`)
      .then(async (response) => ({ response, result: await response.json() }))
      .then(({ response, result }) => {
        if (!response.ok) setErrorMessage(result.error || 'Unable to load order.');
        else setOrder(result.order);
        setIsLoading(false);
      })
      .catch(() => { setErrorMessage('Unable to load order.'); setIsLoading(false); });
  }, [orderId]);

  async function updateStatus(status: string) {
    const confirmation = status === 'cancelled'
      ? 'Mark this order as cancelled? This usually means the order won\'t be fulfilled. You can still change the status again later if needed.'
      : `Change this order from ${order?.status} to ${status}?`;
    if (!window.confirm(confirmation)) {
      return;
    }

    setIsUpdating(true);
    setSuccessMessage('');
    setErrorMessage('');
    const response = await fetch(`/api/admin/orders/${orderId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    const result = await response.json();
    if (!response.ok) setErrorMessage(result.error || 'Unable to update status.');
    else {
      setOrder((current) => current ? {
        ...current,
        status,
        order_status_history: [...(current.order_status_history || []), {
          id: Date.now(),
          old_status: current.status,
          new_status: status,
          changed_at: new Date().toISOString(),
        }],
      } : current);
      setStockReminder(result.stockWasReduced === true);
      setSuccessMessage(`Order marked ${status}.`);
    }
    setIsUpdating(false);
  }

  if (isLoading) return <main className="min-h-screen bg-gray-50 p-6 text-gray-900 md:p-10">Loading order...</main>;
  if (!order) return <main className="min-h-screen bg-gray-50 p-6 text-gray-900 md:p-10"><p className="text-red-700">{errorMessage || 'Order not found.'}</p></main>;
  const customer = first(order.customers);

  return <main className="min-h-screen bg-gray-50 p-6 text-gray-900 md:p-10"><div className="mx-auto max-w-5xl">
    <Link href="/admin/orders" className="text-sm text-gray-600 hover:underline">Back to Orders</Link>
    <div className="my-6 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-bold">Order {order.id}</h1><p className="mt-1 text-sm text-gray-500">{new Date(order.created_at).toLocaleString()}</p></div><span className={`rounded-full px-3 py-1 text-sm ${statusStyles[order.status] || 'bg-gray-100'}`}>{order.status}</span></div>
    {errorMessage && <p className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p>}{successMessage && <p className="mb-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">{successMessage}</p>}
    <div className="grid gap-6 lg:grid-cols-3"><section className="rounded border bg-white p-5 lg:col-span-1"><h2 className="mb-3 text-lg font-semibold">Customer</h2><p className="font-medium">{customer?.name}</p><p>{customer?.email}</p><p>{customer?.phone}</p><p className="mt-3">{customer?.address}<br />{customer?.city}, {customer?.state} {customer?.pincode}</p></section>
    <section className="rounded border bg-white p-5 lg:col-span-2"><h2 className="mb-3 text-lg font-semibold">Items</h2><div className="divide-y">{order.order_items.map((item) => { const book = first(item.books); return <div key={item.id} className="flex justify-between gap-4 py-3"><div><p className="font-medium">{book?.title || 'Book'}</p><p className="text-sm text-gray-500">{item.quantity} × ₹{Number(item.price_at_purchase).toFixed(2)}</p></div><p>₹{(item.quantity * Number(item.price_at_purchase)).toFixed(2)}</p></div>; })}</div><div className="mt-4 flex justify-between border-t pt-4 text-lg font-bold"><span>Total</span><span>₹{Number(order.total_amount).toFixed(2)}</span></div></section></div>
    <section className="mt-6 rounded border bg-white p-5"><h2 className="mb-3 text-lg font-semibold">Payment and status</h2><div className="grid gap-2 text-sm md:grid-cols-2"><p><strong>Razorpay order:</strong> {order.razorpay_order_id}</p><p><strong>Razorpay payment:</strong> {order.razorpay_payment_id}</p></div><div className="mt-5 flex flex-wrap items-center gap-3"><label className="text-sm font-medium" htmlFor="order-status">Update status</label><select id="order-status" value={order.status} disabled={isUpdating} onChange={(event) => void updateStatus(event.target.value)} className="rounded border px-3 py-2">{statuses.map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}</select></div>{stockReminder && <p className="mt-4 rounded border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">Note: stock was already reduced for this order. If you want to restock these items, do it manually in the Books section.</p>}</section>
    <section className="mt-6 rounded border bg-white p-5"><h2 className="mb-3 text-lg font-semibold">Status History</h2>{order.order_status_history?.length ? <ol className="space-y-3">{[...order.order_status_history].reverse().map((entry) => <li key={entry.id} className="flex flex-wrap justify-between gap-2 border-b pb-3 text-sm last:border-0 last:pb-0"><span><strong>{entry.old_status}</strong> → <strong>{entry.new_status}</strong></span><time className="text-gray-500">{new Date(entry.changed_at).toLocaleString()}</time></li>)}</ol> : <p className="text-sm text-gray-500">No status changes recorded yet.</p>}</section>
  </div></main>;
}
