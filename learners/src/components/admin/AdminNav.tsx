'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/books', label: 'Books' },
  { href: '/admin/orders', label: 'Orders' },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/admin/login');
    router.refresh();
  }

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4 md:px-10">
        <Link href="/admin" className="text-lg font-bold tracking-tight">Learners Admin</Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded px-3 py-2 ${pathname === link.href ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {link.label}
            </Link>
          ))}
          <button type="button" onClick={() => void handleLogout()} className="rounded border px-3 py-2 text-gray-700 hover:bg-gray-50">
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}
