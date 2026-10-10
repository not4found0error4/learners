'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, totalPrice } = useCart();

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 w-full">
      <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

      {items.length === 0 ? (
        <div className="border rounded-lg p-8 text-center">
          <p className="text-gray-600">Your cart is empty.</p>
          <Link
            href="/shop"
            className="inline-block mt-4 bg-black text-white px-5 py-2 rounded-lg"
          >
            Browse Books
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="divide-y border rounded-lg">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-4 flex gap-4 items-center"
              >
                <div className="relative w-20 h-24 bg-gray-100 rounded overflow-hidden shrink-0">
                  <Image
                    src={item.cover_image_url || 'https://placehold.co/300x400'}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold truncate">{item.title}</h2>
                  <p className="text-gray-600 mt-1">₹{item.price}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      type="button"
                      aria-label={`Decrease quantity of ${item.title}`}
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="border rounded w-8 h-8"
                    >
                      -
                    </button>
                    <span className="w-5 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      aria-label={`Increase quantity of ${item.title}`}
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="border rounded w-8 h-8"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">₹{item.price * item.quantity}</p>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-600 text-sm mt-3"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-end gap-4">
            <p className="text-xl font-bold">Total: ₹{totalPrice}</p>
            <Link
              href="/checkout"
              className="bg-black text-white px-6 py-3 rounded-lg"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
