'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useCart, type CheckoutDetails } from '@/context/CartContext';
import { calculateShipping, SHIPPING_RATE_PER_KG } from '@/lib/shipping';

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

export default function CheckoutPage() {
  const {
    items,
    totalPrice,
    clearCart,
    checkoutDetails,
    setCheckoutDetails,
    clearCheckoutDetails,
  } = useCart();
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
  const [form, setForm] = useState<CheckoutDetails>(checkoutDetails);
  const [validationError, setValidationError] = useState('');
  const [paymentResult, setPaymentResult] = useState<'success' | 'failed' | null>(null);
  const [paymentFailure, setPaymentFailure] = useState('');
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

  function updateField(field: keyof CheckoutDetails, value: string) {
    const updatedForm = { ...form, [field]: value };
    setForm(updatedForm);
    setCheckoutDetails(updatedForm);
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
    setPaymentResult(null);
    setPaymentFailure('');
    setIsProcessingPayment(true);

    try {
      const orderResponse = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.fullName,
          email: form.email,
          phone: form.phone,
          address: form.addressLine,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          cartItems: items.map(({ id, quantity }) => ({ id, quantity })),
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
      let paymentFailed = false;
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
        handler: () => {
          paymentCompleted = true;
          setIsProcessingPayment(false);
          clearCart();
          clearCheckoutDetails();
          setPaymentResult('success');
        },
        modal: {
          ondismiss: () => {
            setIsProcessingPayment(false);
            if (!paymentCompleted && !paymentFailed) {
              setPaymentFailure('Payment was cancelled. Your order was not placed.');
              setPaymentResult('failed');
            }
          },
        },
      });

      razorpay.on('payment.failed', (response) => {
        paymentFailed = true;
        setIsProcessingPayment(false);
        setPaymentFailure(response.error?.description || 'Payment failed. Your order was not placed.');
        setPaymentResult('failed');
      });
      razorpay.open();
    } catch (error) {
      setIsProcessingPayment(false);
      setValidationError(error instanceof Error ? error.message : 'Payment failed. Please try again.');
    }
  }

  const paymentResultWindow = paymentResult && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      role="presentation"
    >
      <section
        aria-labelledby="payment-result-title"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
        role="dialog"
      >
        {paymentResult === 'success' ? (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700" aria-hidden="true">
              ✓
            </div>
            <h2 id="payment-result-title" className="mt-4 text-center text-2xl font-bold text-blue-950">
              Order placed
            </h2>
            <p className="mt-2 text-center text-sm text-slate-600">
              Thank you, {form.fullName}. Your payment was successful.
            </p>
            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm">
              <h3 className="font-semibold text-blue-950">Delivery details</h3>
              <dl className="mt-3 space-y-2 text-slate-600">
                <div className="flex justify-between gap-4"><dt>Name</dt><dd className="text-right font-medium text-slate-900">{form.fullName}</dd></div>
                <div className="flex justify-between gap-4"><dt>Email</dt><dd className="break-all text-right font-medium text-slate-900">{form.email}</dd></div>
                <div className="flex justify-between gap-4"><dt>Phone</dt><dd className="text-right font-medium text-slate-900">{form.phone}</dd></div>
                <div>
                  <dt>Address</dt>
                  <dd className="mt-1 font-medium text-slate-900">
                    {[form.addressLine, form.landmark, form.city, form.state, form.pincode].filter(Boolean).join(', ')}
                  </dd>
                </div>
              </dl>
            </div>
            <Link
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-brand-red px-6 text-sm font-semibold text-white transition-colors hover:bg-red-700"
              href="/shop"
            >
              Browse more
            </Link>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl font-semibold text-red-700" aria-hidden="true">
              ×
            </div>
            <h2 id="payment-result-title" className="mt-4 text-center text-2xl font-bold text-blue-950">
              Order not placed
            </h2>
            <p className="mt-2 text-center text-sm text-slate-600">
              {paymentFailure || 'Your payment could not be completed. Your cart is still saved.'}
            </p>
            <p className="mt-2 text-center text-sm text-slate-500">Your cart is still saved.</p>
            <Link
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-brand-blue px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-dark"
              href="/cart"
            >
              Try again
            </Link>
          </>
        )}
      </section>
    </div>
  );

  if (items.length === 0 && paymentResult !== 'success') {
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
    <>
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
          {validationError && (
            <p className="text-sm text-red-600" role="alert">
              {validationError}
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
          <div className="mt-5 space-y-4 border-t pt-5 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-gray-600">Subtotal</span>
              <span className="shrink-0 font-medium">₹{totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <div>
                <p className="text-gray-600">Delivery charge</p>
                {shippingEstimate ? (
                  <p className="mt-1 text-xs text-gray-500">
                    {(shippingEstimate.totalGrams / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} kg, billed as {shippingEstimate.billedKg} kg at ₹{SHIPPING_RATE_PER_KG}/kg
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">Calculated at checkout</p>
                )}
              </div>
              <span className="shrink-0 font-medium">
                {shippingEstimate ? `₹${shippingEstimate.shippingAmount.toFixed(2)}` : 'Calculated at checkout'}
              </span>
            </div>
            <div className="flex justify-between gap-3 border-t pt-4 text-base font-bold">
              <span>Total</span>
              <span>{estimatedTotal === null ? 'Calculated at checkout' : `₹${estimatedTotal.toFixed(2)}`}</span>
            </div>
            <p className="text-xs text-gray-500">
              Final delivery charge is confirmed at checkout.
            </p>
          </div>
        </aside>
      </div>
    </main>
    {paymentResultWindow}
    </>
  );
}
