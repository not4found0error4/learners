'use client';

import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BOOK_CATEGORIES } from '@/lib/categories';

const companyLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About Us' },
  { href: '/director-message', label: "Director's Message" },
  { href: '/shop', label: 'Our Books' },
  { href: '/contact', label: 'Contact Us' },
];

// Placeholder contact information; replace with verified business details before launch.
const contactDetails = [
  { icon: MapPin, text: '123 Learning Lane, Your City, India' },
  { icon: Phone, text: '+91 00000 00000', href: 'tel:+910000000000' },
  { icon: Mail, text: 'hello@example.com', href: 'mailto:hello@example.com' },
  { icon: Clock, text: 'Monday-Friday, 9:00 AM-5:00 PM' },
];

export default function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-5 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:gap-8 lg:px-10 lg:py-14">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white p-1">
              <Image
                src="/logo.jpg"
                alt=""
                width={48}
                height={48}
                className="h-full w-full object-contain"
              />
            </span>
            <span className="flex flex-col items-center font-heading leading-none">
              <span className="text-base font-bold text-blue-900">LEARNERS</span>
              <span className="mt-0.5 text-[10px] font-medium text-red-600">PUBLICATIONS</span>
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-600">
            Placeholder description about Learners Publications and the books we create for schools, students, and families.
          </p>
        </div>

        <div>
          <h2 className="font-heading text-base font-semibold text-blue-900">Departments</h2>
          <ul className="mt-4 space-y-3">
            {BOOK_CATEGORIES.map(({ slug, label }) => (
              <li key={slug}>
                <Link href={`/shop?category=${slug}`} className="text-sm text-slate-600 transition-colors hover:text-brand-red">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-heading text-base font-semibold text-blue-900">Company</h2>
          <ul className="mt-4 space-y-3">
            {companyLinks.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="text-sm text-slate-600 transition-colors hover:text-brand-red">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-heading text-base font-semibold text-blue-900">Reach Us</h2>
          <ul className="mt-4 space-y-4">
            {contactDetails.map(({ icon: Icon, text, href }) => (
              <li key={text} className="flex items-start gap-3">
                <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" strokeWidth={1.8} />
                {href ? (
                  <a href={href} className="text-sm leading-5 text-slate-600 transition-colors hover:text-brand-red">
                    {text}
                  </a>
                ) : (
                  <span className="text-sm leading-5 text-slate-600">{text}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-200">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-5 py-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <p>© {new Date().getFullYear()} Learners Publications. All rights reserved.</p>
          <p>Printed for schools, students and families</p>
        </div>
      </div>
    </footer>
  );
}