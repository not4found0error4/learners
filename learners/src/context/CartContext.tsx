'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

export type CartItem = {
  id: string;
  title: string;
  price: number;
  cover_image_url: string | null;
  weight_grams: number | null;
  quantity: number;
};

export type CartBook = Omit<CartItem, 'quantity'>;

export type CheckoutDetails = {
  fullName: string;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
};

type CartContextValue = {
  items: CartItem[];
  addToCart: (book: CartBook) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  checkoutDetails: CheckoutDetails;
  setCheckoutDetails: (details: CheckoutDetails) => void;
  clearCheckoutDetails: () => void;
  totalItems: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

const initialCheckoutDetails: CheckoutDetails = {
  fullName: '',
  email: '',
  phone: '',
  addressLine: '',
  city: '',
  state: '',
  pincode: '',
  landmark: '',
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [checkoutDetails, setCheckoutDetails] =
    useState<CheckoutDetails>(initialCheckoutDetails);

  function addToCart(book: CartBook) {
    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === book.id);

      if (existingItem) {
        return currentItems.map((item) =>
          item.id === book.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [...currentItems, { ...book, quantity: 1 }];
    });
  }

  function removeFromCart(id: string) {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
  }

  function updateQuantity(id: string, quantity: number) {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id ? { ...item, quantity } : item,
      ),
    );
  }

  function clearCart() {
    setItems([]);
  }

  function clearCheckoutDetails() {
    setCheckoutDetails(initialCheckoutDetails);
  }

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        checkoutDetails,
        setCheckoutDetails,
        clearCheckoutDetails,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }

  return context;
}
