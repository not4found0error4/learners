'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Order = {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  customers: { name: string } | { name: string }[] | null;
};

const statuses = ['all', 'pending', 'paid', 'packed', 'shipped', 'delivered', 'cancelled'];
const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  packed: 'bg-orange-100 text-orange-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

function customerName(order: Order) {
  return Array.isArray(order.customers) ? order.customers[0]?.name : order.customers?.name || 'Unknown customer';
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedId, setCopiedId] = useState('');
  const [summary, setSummary] = useState({ total: 0, paid: 0 });

  useEffect(() => {
    fetch(`/api/admin/orders?status=${filter}`)
      .then(async (response) => ({ response, result: await response.json() }))
      .then(({ response, result }) => {
        if (!response.ok) setErrorMessage(result.error || 'Unable to load orders.');
        else { setOrders(result.orders || []); setSummary(result.summary || { total: 0, paid: 0 }); }
        setIsLoading(false);
      })
      .catch(() => {
        setErrorMessage('Unable to load orders.');
        setIsLoading(false);
      });
  }, [filter]);

  async function copyOrderId(id: string) {
    await navigator.clipboard.writeText(id);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(''), 1500);
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900 md:p-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/admin" className="text-sm text-gray-600 hover:underline">Admin Dashboard</Link>
            <h1 className="mt-2 text-3xl font-bold">Orders</h1>
          </div>
          <label className="text-sm font-medium">Filter status
            <select value={filter} onChange={(event) => { setIsLoading(true); setFilter(event.target.value); }} className="ml-2 rounded border bg-white px-3 py-2">
              {statuses.map((status) => <option key={status} value={status}>{status === 'all' ? 'All' : status[0].toUpperCase() + status.slice(1)}</option>)}
            </select>
          </label>
        </div>
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded border bg-white p-4"><p className="text-sm text-gray-500">Total orders</p><p className="mt-1 text-2xl font-bold">{summary.total}</p></div>
          <div className="rounded border bg-white p-4"><p className="text-sm text-gray-500">Paid, needs packing</p><p className="mt-1 text-2xl font-bold text-blue-700">{summary.paid}</p></div>
        </div>
        {errorMessage && <p className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p>}
        {isLoading ? <p>Loading orders...</p> : <div className="overflow-x-auto rounded border bg-white">
          <table className="w-full min-w-200 text-left text-sm">
            <thead className="border-b bg-gray-100 text-xs uppercase text-gray-600"><tr><th className="p-3">Order ID</th><th className="p-3">Customer</th><th className="p-3">Total</th><th className="p-3">Status</th><th className="p-3">Date</th></tr></thead>
            <tbody>
              {orders.map((order) => <tr key={order.id} className="border-b last:border-0 hover:bg-gray-50"><td className="p-3"><div className="flex items-center gap-2"><Link href={`/admin/orders/${order.id}`} className="font-mono text-blue-700 hover:underline">{order.id.slice(0, 8)}...</Link><button type="button" onClick={() => void copyOrderId(order.id)} className="rounded border px-2 py-1 text-xs">{copiedId === order.id ? 'Copied' : 'Copy'}</button></div></td><td className="p-3">{customerName(order)}</td><td className="p-3">₹{Number(order.total_amount).toFixed(2)}</td><td className="p-3"><span className={`rounded-full px-2 py-1 text-xs ${statusStyles[order.status] || 'bg-gray-100 text-gray-700'}`}>{order.status}</span></td><td className="p-3">{new Date(order.created_at).toLocaleString()}</td></tr>)}
            </tbody>
          </table>
          {orders.length === 0 && <p className="p-8 text-center text-gray-500">No orders found.</p>}
        </div>}
      </div>
    </main>
  );
}
