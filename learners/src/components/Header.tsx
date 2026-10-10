'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';

const navigationLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About Us' },
  { href: '/director-message', label: "Director's Message" },
  { href: '/shop', label: 'Our Books' },
  { href: '/contact', label: 'Contact Us' },
];

export default function Header() {
  const { totalItems } = useCart();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function isActive(href: string) {
    if (href === '/') {
      return pathname === '/';
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  if (pathname.startsWith('/admin')) {
    return (
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex h-19 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white p-1 xl:h-16 xl:w-16">
              <Image
                src="/logo.jpg"
                alt="Learners Publications"
                width={60}
                height={60}
                className="h-full w-full object-contain"
                priority
              />
            </span>
            <span className="flex flex-col items-center font-heading leading-none text-center">
              <span className="whitespace-nowrap text-base font-bold leading-none text-blue-900 xl:text-xl">LEARNERS</span>
              <span className="whitespace-nowrap text-xs font-medium leading-none text-red-600 xl:text-[15px]">PUBLICATIONS</span>
            </span>
          </Link>
          <Link
            href="/cart"
            aria-label={`Cart with ${totalItems} items`}
            className="relative inline-flex h-12 w-12 items-center justify-center rounded-full text-blue-900 transition-colors hover:bg-blue-50"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.5L21 8H6" />
              <circle cx="10" cy="20" r="1" />
              <circle cx="18" cy="20" r="1" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs text-white">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white">
      <div className="mx-auto flex min-h-21 max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:px-4 lg:gap-4 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2 xl:gap-3" onClick={() => setIsMenuOpen(false)}>
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white p-1 md:h-12 md:w-12 xl:h-16 xl:w-16">
            <Image
              src="/logo.jpg"
              alt="Learners Publications"
              width={60}
              height={60}
              className="h-full w-full object-contain"
              priority
            />
          </span>
          <span className="flex flex-col items-center font-heading leading-none text-center">
            <span className="whitespace-nowrap text-base font-bold leading-none text-blue-900 xl:text-xl">LEARNERS</span>
            <span className="whitespace-nowrap text-xs font-medium leading-none text-red-600 xl:text-[15px]">PUBLICATIONS</span>
          </span>
        </Link>

        <nav aria-label="Main navigation" className="hidden flex-1 items-center justify-center gap-1 text-base md:flex xl:gap-3 xl:text-xl">
          {navigationLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={`relative isolate whitespace-nowrap rounded-full px-1 py-2.5 font-medium transition-colors before:absolute before:inset-y-0 before:-inset-x-2 before:rounded-full before:content-[''] xl:px-3 ${
                isActive(link.href)
                  ? 'text-blue-900 before:bg-blue-50'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-blue-900'
              }`}
            >
              <span className="relative z-10">{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1 xl:gap-2">
          <Link
            href="/cart"
            aria-label={`Cart with ${totalItems} items`}
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-blue-900 transition-colors hover:bg-blue-50 xl:h-12 xl:w-12"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.5L21 8H6" />
              <circle cx="10" cy="20" r="1" />
              <circle cx="18" cy="20" r="1" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs text-white">
                {totalItems}
              </span>
            )}
          </Link>
          <Link
            href="/shop"
            className="hidden h-11 items-center justify-center rounded-full bg-blue-900 px-3 text-base font-semibold text-white transition-colors hover:bg-blue-800 md:inline-flex xl:h-12 xl:px-5 xl:text-xl"
          >
            Shop Books
          </Link>
          <button
            type="button"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setIsMenuOpen((open) => !open)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-blue-900 transition-colors hover:bg-blue-50 md:hidden"
          >
            <span aria-hidden="true" className="text-2xl leading-none">{isMenuOpen ? '×' : '☰'}</span>
          </button>
        </div>
      </div>
      {isMenuOpen && (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="border-t border-slate-100 bg-white px-4 py-3 md:hidden">
          {navigationLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              onClick={() => setIsMenuOpen(false)}
              className={`relative isolate mb-2 block rounded-full px-4 py-3 text-base font-medium transition-colors before:absolute before:inset-y-0 before:-inset-x-2 before:rounded-full before:content-[''] ${
                isActive(link.href)
                  ? 'text-blue-900 before:bg-blue-50'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-blue-900'
              }`}
            >
              <span className="relative z-10">{link.label}</span>
            </Link>
          ))}
          <Link
            href="/shop"
            onClick={() => setIsMenuOpen(false)}
            className="mt-3 flex h-11 items-center justify-center rounded-full bg-blue-900 px-5 text-base font-semibold text-white transition-colors hover:bg-blue-800"
          >
            Shop Books
          </Link>
        </nav>
      )}
    </header>
  );
}
