'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useCart } from '@/context/CartContext';

type RazorpayCheckout = {
  open: () => void;
  on: (event: string, handler: (response: { error?: { description?: string } }) => void) => void;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  handler: (response: { razorpay_payment_id: string }) => void;
  modal: { ondismiss: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayCheckout;
  }
}

let razorpayScriptPromise: Promise<void> | undefined;

function loadRazorpayScript() {
  if (window.Razorpay) {
    return Promise.resolve();
  }

  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[data-razorpay-checkout]',
      );

      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener('error', () => reject(new Error('Payment script failed to load.')), {
          once: true,
        });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.dataset.razorpayCheckout = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Payment script failed to load.'));
      document.body.appendChild(script);
    });
  }

  return razorpayScriptPromise.catch((error) => {
    razorpayScriptPromise = undefined;
    throw error;
  });
}

type CheckoutForm = {
  fullName: string;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
};

const initialForm: CheckoutForm = {
  fullName: '',
  email: '',
  phone: '',
  addressLine: '',
  city: '',
  state: '',
  pincode: '',
  landmark: '',
};

export default function CheckoutPage() {
  const { items, totalPrice } = useCart();
  const [form, setForm] = useState<CheckoutForm>(initialForm);
  const [validationError, setValidationError] = useState('');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const requiredFields = [
    form.fullName,
    form.email,
    form.phone,
    form.addressLine,
    form.city,
    form.state,
    form.pincode,
  ];
  const isFormComplete = requiredFields.every((field) => field.trim() !== '');

  function updateField(field: keyof CheckoutForm, value: string) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
    setValidationError('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isFormComplete) {
      setValidationError('Please complete all required fields.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    if (!/^\d{10}$/.test(form.phone)) {
      setValidationError('Phone number must contain exactly 10 digits.');
      return;
    }

    if (!/^\d{6}$/.test(form.pincode)) {
      setValidationError('Pincode must contain exactly 6 digits.');
      return;
    }

    setValidationError('');
    setPaymentMessage('');
    setIsProcessingPayment(true);

    try {
      const orderResponse = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalPrice,
          customerName: form.fullName,
          customerEmail: form.email,
          customerPhone: form.phone,
          address: form.addressLine,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          cartItems: items.map(({ id, title, price, quantity }) => ({
            id,
            title,
            price,
            quantity,
          })),
        }),
      });
      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(orderData.error || 'Unable to create the payment order.');
      }

      await loadRazorpayScript();

      const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      if (!publicKey || !window.Razorpay) {
        throw new Error('Payment checkout is unavailable. Please try again.');
      }

      let paymentCompleted = false;
      const razorpay = new window.Razorpay({
        key: publicKey,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Learners',
        description: 'Book order',
        order_id: orderData.id,
        prefill: {
          name: form.fullName,
          email: form.email,
          contact: form.phone,
        },
        handler: (response) => {
          paymentCompleted = true;
          setIsProcessingPayment(false);
          setPaymentMessage(`Payment successful, order ID: ${response.razorpay_payment_id}`);
        },
        modal: {
          ondismiss: () => {
            setIsProcessingPayment(false);
            if (!paymentCompleted) {
              setPaymentMessage('Payment was cancelled. You can retry when ready.');
            }
          },
        },
      });

      razorpay.on('payment.failed', (response) => {
        setIsProcessingPayment(false);
        setPaymentMessage(response.error?.description || 'Payment failed. Please try again.');
      });
      razorpay.open();
    } catch (error) {
      setIsProcessingPayment(false);
      setPaymentMessage(error instanceof Error ? error.message : 'Payment failed. Please try again.');
    }
  }

  if (items.length === 0) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10 w-full">
        <div className="border rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold">Your cart is empty</h1>
          <p className="text-gray-600 mt-2">Add a book before checking out.</p>
          <Link
            href="/shop"
            className="inline-block mt-5 bg-black text-white px-5 py-2 rounded-lg"
          >
            Browse Books
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 w-full">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <div className="grid lg:grid-cols-[1fr_360px] gap-10 items-start">
        <form onSubmit={handleSubmit} className="space-y-5">
          <h2 className="text-xl font-semibold">Delivery details</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <label className="sm:col-span-2 block">
              <span className="block text-sm font-medium mb-1">Full name</span>
              <input
                required
                value={form.fullName}
                onChange={(event) => updateField('fullName', event.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium mb-1">Email</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium mb-1">Phone number</span>
              <input
                required
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                value={form.phone}
                onChange={(event) => updateField('phone', event.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </label>
            <label className="sm:col-span-2 block">
              <span className="block text-sm font-medium mb-1">Address line</span>
              <input
                required
                value={form.addressLine}
                onChange={(event) => updateField('addressLine', event.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium mb-1">City</span>
              <input
                required
                value={form.city}
                onChange={(event) => updateField('city', event.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium mb-1">State</span>
              <input
                required
                value={form.state}
                onChange={(event) => updateField('state', event.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium mb-1">Pincode</span>
              <input
                required
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={form.pincode}
                onChange={(event) => updateField('pincode', event.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium mb-1">Landmark (optional)</span>
              <input
                value={form.landmark}
                onChange={(event) => updateField('landmark', event.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </label>
          </div>
          {(validationError || paymentMessage) && (
            <p className={`text-sm ${validationError ? 'text-red-600' : 'text-green-700'}`} role="alert">
              {validationError || paymentMessage}
            </p>
          )}
          <button
            type="submit"
            disabled={!isFormComplete || isProcessingPayment}
            className="bg-black text-white px-6 py-3 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isProcessingPayment ? 'Processing payment...' : 'Proceed to Payment'}
          </button>
        </form>

        <aside className="border rounded-lg p-5 lg:sticky lg:top-6">
          <h2 className="text-xl font-semibold mb-5">Order summary</h2>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between gap-4 text-sm">
                <span className="min-w-0">
                  <span className="block truncate">{item.title}</span>
                  <span className="text-gray-500">Qty: {item.quantity}</span>
                </span>
                <span className="font-medium shrink-0">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="border-t mt-5 pt-5 flex justify-between font-bold">
            <span>Total</span>
            <span>₹{totalPrice}</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
