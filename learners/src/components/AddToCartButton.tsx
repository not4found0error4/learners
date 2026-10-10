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
      className="mt-8 bg-black text-white px-6 py-3 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
    >
      {isAdded ? 'Added' : 'Add to Cart'}
    </button>
  );
}
