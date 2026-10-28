'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { calculateShipping, SHIPPING_RATE_PER_KG } from '@/lib/shipping';

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, totalItems, totalPrice } = useCart();
  const shippingItems = items.flatMap((item) =>
    item.weight_grams == null
      ? []
      : [{ weight_grams: item.weight_grams, quantity: item.quantity }],
  );
  const shippingEstimate =
    shippingItems.length === items.length ? calculateShipping(shippingItems) : null;
  const estimatedTotal = shippingEstimate
    ? totalPrice + shippingEstimate.shippingAmount
    : null;

  return (
    <main className="w-full">
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
        <header className="mb-8">
          <h1 className="font-heading text-3xl font-bold leading-tight text-blue-950 sm:text-4xl">
            Your Cart
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </p>
        </header>

        {items.length === 0 ? (
          <div className="mx-auto max-w-2xl rounded-3xl bg-white px-6 py-12 text-center shadow-lg shadow-slate-900/5 sm:px-10 sm:py-16">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-brand-blue">
              <ShoppingCart aria-hidden="true" className="h-7 w-7" strokeWidth={1.8} />
            </span>
            <h2 className="mt-6 font-heading text-2xl font-semibold text-blue-950">
              Your cart is empty
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Find a book to inspire your next learning adventure.
            </p>
            <Link
              className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-brand-blue px-7 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-blue-dark"
              href="/shop"
            >
              Browse our books
            </Link>
          </div>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[1.55fr_0.85fr] lg:gap-8">
            <div className="divide-y divide-slate-100 overflow-hidden rounded-3xl bg-white shadow-lg shadow-slate-900/5">
              {items.map((item) => {
                const coverUrl = item.cover_image_url || 'https://placehold.co/300x400';
                const isSvgCover = /\.svg(?:[?#]|$)/i.test(coverUrl);

                return (
                  <article key={item.id} className="p-4 sm:p-6">
                    <div className="flex min-w-0 items-start gap-4 sm:gap-5">
                      <Link
                        aria-label={`View ${item.title}`}
                        className="relative aspect-3/4 w-20 shrink-0 overflow-hidden rounded-xl bg-[#f3f1ed] sm:w-24"
                        href={`/books/${item.id}`}
                      >
                        <Image
                          alt={item.title}
                          className="object-contain p-2"
                          fill
                          sizes="96px"
                          src={coverUrl}
                          unoptimized={isSvgCover}
                        />
                      </Link>

                      <div className="min-w-0 flex-1">
                        <Link
                          className="line-clamp-2 break-words font-heading text-base font-semibold leading-6 text-blue-950 transition-colors hover:text-brand-blue sm:text-lg"
                          href={`/books/${item.id}`}
                        >
                          {item.title}
                        </Link>
                        <p className="mt-1 text-sm text-slate-500">
                          ₹{Number(item.price).toFixed(2)} each
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-4 sm:mt-5">
                      <div
                        aria-label={`Quantity for ${item.title}`}
                        className="inline-flex h-10 items-center gap-1 rounded-full border border-slate-200 bg-white p-1"
                      >
                        <button
                          aria-label={`Decrease quantity of ${item.title}`}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
                          disabled={item.quantity === 1}
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          type="button"
                        >
                          <Minus aria-hidden="true" className="h-4 w-4" />
                        </button>
                        <span className="min-w-7 text-center text-sm font-semibold text-blue-950">
                          {item.quantity}
                        </span>
                        <button
                          aria-label={`Increase quantity of ${item.title}`}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          type="button"
                        >
                          <Plus aria-hidden="true" className="h-4 w-4" />
                        </button>
                      </div>

                      <p className="ml-auto font-heading text-base font-bold text-blue-950 sm:text-lg">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </p>

                      <button
                        aria-label={`Remove ${item.title}`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-red-700/80 transition-colors hover:text-brand-red"
                        onClick={() => removeFromCart(item.id)}
                        type="button"
                      >
                        <Trash2 aria-hidden="true" className="h-4 w-4" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            <aside className="lg:sticky lg:top-28">
              <div className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-900/5 sm:p-8">
                <h2 className="font-heading text-xl font-semibold text-blue-950">
                  Order summary
                </h2>
                <div className="mt-6 flex items-start justify-between gap-3 border-b border-slate-100 pb-5 text-sm">
                  <span className="text-slate-600">Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
                  <span className="shrink-0 font-semibold text-blue-950">₹{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 py-5 text-sm">
                  <div>
                    <p className="text-slate-600">Delivery charge</p>
                    {shippingEstimate ? (
                      <p className="mt-1 text-xs text-slate-500">
                        {(shippingEstimate.totalGrams / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} kg, billed as {shippingEstimate.billedKg} kg at ₹{SHIPPING_RATE_PER_KG}/kg
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-slate-500">Calculated at checkout</p>
                    )}
                  </div>
                  <span className="shrink-0 font-semibold text-blue-950">
                    {shippingEstimate ? `₹${shippingEstimate.shippingAmount.toFixed(2)}` : 'Calculated at checkout'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 pt-5 font-heading font-bold text-blue-950">
                  <span>Total</span>
                  <span>{estimatedTotal === null ? 'Calculated at checkout' : `₹${estimatedTotal.toFixed(2)}`}</span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Final delivery charge is confirmed at checkout.
                </p>
                <Link
                  className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-brand-red px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
                  href="/checkout"
                >
                  Proceed to Checkout
                </Link>
                <Link
                  className="mt-5 inline-flex w-full justify-center text-sm font-semibold text-brand-blue transition-colors hover:text-brand-blue-dark"
                  href="/shop"
                >
                  Continue shopping
                </Link>
              </div>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
