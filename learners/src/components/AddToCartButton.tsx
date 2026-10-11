'use client';

import { useEffect, useState } from 'react';
import { useCart, type CartBook } from '@/context/CartContext';

type AddToCartButtonProps = {
  book: CartBook;
  disabled?: boolean;
};

export default function AddToCartButton({
  book,
  disabled = false,
}: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    if (!isAdded) {
      return;
    }

    const resetTimer = window.setTimeout(() => setIsAdded(false), 1000);

    return () => window.clearTimeout(resetTimer);
  }, [isAdded]);

  function handleAddToCart() {
    addToCart(book);
    setIsAdded(true);
  }

  return (
    <button
      type="button"
      disabled={disabled || isAdded}
      onClick={handleAddToCart}
      className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand-red px-7 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
    >
      {disabled ? 'Out of stock' : isAdded ? 'Added' : 'Add to Cart'}
    </button>
  );
}
