'use client';

import { Minus, Plus } from 'lucide-react';
import { useCart, type CartBook } from '@/context/CartContext';

type AddToCartButtonProps = {
  book: CartBook;
  maxQuantity: number;
  disabled?: boolean;
};

export default function AddToCartButton({
  book,
  maxQuantity,
  disabled = false,
}: AddToCartButtonProps) {
  const { items, addToCart, updateQuantity } = useCart();
  const quantity = items.find((item) => item.id === book.id)?.quantity ?? 0;

  function handleAddToCart() {
    addToCart(book);
  }

  if (quantity > 0) {
    return (
      <div className="flex flex-wrap items-center gap-4">
        <div
          aria-label={`Quantity of ${book.title} in cart`}
          className="inline-flex h-12 items-center gap-2 rounded-full border border-slate-200 bg-white p-1"
          role="group"
        >
          <button
            type="button"
            aria-label={`Decrease quantity of ${book.title}`}
            disabled={quantity <= 1}
            onClick={() => updateQuantity(book.id, quantity - 1)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
          >
            <Minus aria-hidden="true" className="h-4 w-4" />
          </button>
          <span aria-live="polite" className="min-w-8 text-center text-sm font-semibold text-blue-950">
            {quantity}
          </span>
          <button
            type="button"
            aria-label={`Increase quantity of ${book.title}`}
            disabled={disabled || quantity >= maxQuantity}
            onClick={() => updateQuantity(book.id, quantity + 1)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <span className="text-sm font-semibold text-green-700">Added to cart</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled || maxQuantity < 1}
      onClick={handleAddToCart}
      className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand-red px-7 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
    >
      {disabled || maxQuantity < 1 ? 'Out of stock' : 'Add to Cart'}
    </button>
  );
}
