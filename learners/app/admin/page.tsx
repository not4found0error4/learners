import Link from 'next/link';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';

type Order = { id: string; total_amount: number; status: string; created_at: string };
type OrderItem = { order_id: string; book_id: string; quantity: number; books: { title: string } | { title: string }[] | null };

const statuses = ['pending', 'paid', 'packed', 'shipped', 'delivered', 'cancelled'] as const;
const statusStyles: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-800', paid: 'bg-blue-100 text-blue-800', packed: 'bg-orange-100 text-orange-800', shipped: 'bg-purple-100 text-purple-800', delivered: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800' };

function bookTitle(book: OrderItem['books']) { return Array.isArray(book) ? book[0]?.title || 'Unknown book' : book?.title || 'Unknown book'; }
function label(status: string) { return status[0].toUpperCase() + status.slice(1); }

export default async function AdminDashboardPage() {
  const supabase = createSupabaseAdminClient();
  const [{ data: orders, error: ordersError }, { data: orderItems, error: itemsError }] = await Promise.all([
    supabase.from('orders').select('id, total_amount, status, created_at').order('created_at', { ascending: false }),
    supabase.from('order_items').select('order_id, book_id, quantity, books(title)'),
  ]);

  if (ordersError || itemsError) return <main className="mx-auto max-w-7xl p-6 md:p-10"><div className="rounded border border-red-200 bg-red-50 p-4 text-red-700">Unable to load dashboard data: {(ordersError || itemsError)?.message}</div></main>;

  const allOrders = (orders || []) as Order[];
  const allItems = (orderItems || []) as OrderItem[];
  const completedOrders = allOrders.filter((order) => order.status !== 'cancelled');
  const completedIds = new Set(completedOrders.map((order) => order.id));
  const revenue = completedOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const counts = Object.fromEntries(statuses.map((status) => [status, allOrders.filter((order) => order.status === status).length]));
  const soldBooks = new Map<string, { title: string; quantity: number }>();

  for (const item of allItems) {
    if (!completedIds.has(item.order_id)) continue;
    const current = soldBooks.get(item.book_id) || { title: bookTitle(item.books), quantity: 0 };
    current.quantity += Number(item.quantity || 0);
    soldBooks.set(item.book_id, current);
  }

  const topBooks = [...soldBooks.values()].sort((first, second) => second.quantity - first.quantity).slice(0, 5);
  const recentOrders = allOrders.slice(0, 8);

  return <main className="mx-auto max-w-7xl p-6 md:p-10">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-gray-500">Overview</p><h1 className="mt-1 text-3xl font-bold">Dashboard</h1></div><Link href="/admin/orders" className="rounded border bg-white px-4 py-2 text-sm hover:bg-gray-50">View all orders</Link></div>
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded border bg-white p-5"><p className="text-sm text-gray-500">Total Orders</p><p className="mt-2 text-3xl font-bold">{allOrders.length}</p></div><div className="rounded border bg-white p-5"><p className="text-sm text-gray-500">Total Revenue</p><p className="mt-2 text-3xl font-bold">₹{revenue.toFixed(2)}</p><p className="mt-1 text-xs text-gray-500">Excludes cancelled orders</p></div>{statuses.map((status) => <div key={status} className="rounded border bg-white p-5"><p className="text-sm text-gray-500">{label(status)}</p><p className="mt-2 text-3xl font-bold">{counts[status]}</p><span className={`mt-2 inline-block rounded-full px-2 py-1 text-xs ${statusStyles[status]}`}>{label(status)} orders</span></div>)}</section>
    <div className="mt-8 grid gap-6 lg:grid-cols-2"><section className="rounded border bg-white p-5"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-semibold">Best-selling books</h2><Link href="/admin/books" className="text-sm text-blue-700 hover:underline">Manage books</Link></div>{topBooks.length ? <ol className="divide-y">{topBooks.map((book, index) => <li key={`${book.title}-${index}`} className="flex items-center justify-between gap-4 py-3"><div className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold">{index + 1}</span><span>{book.title}</span></div><strong>{book.quantity} sold</strong></li>)}</ol> : <p className="text-sm text-gray-500">No completed order items yet.</p>}</section><section className="rounded border bg-white p-5"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-semibold">Recent Orders</h2><Link href="/admin/orders" className="text-sm text-blue-700 hover:underline">View all orders</Link></div>{recentOrders.length ? <div className="divide-y">{recentOrders.map((order) => <Link key={order.id} href={`/admin/orders/${order.id}`} className="flex items-center justify-between gap-4 py-3 hover:bg-gray-50"><div><p className="font-mono text-sm text-blue-700">{order.id.slice(0, 8)}...</p><p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString()}</p></div><div className="text-right"><p className="font-medium">₹{Number(order.total_amount).toFixed(2)}</p><span className={`rounded-full px-2 py-1 text-xs ${statusStyles[order.status] || 'bg-gray-100 text-gray-700'}`}>{label(order.status)}</span></div></Link>)}</div> : <p className="text-sm text-gray-500">No orders yet.</p>}</section></div>
  </main>;
}
