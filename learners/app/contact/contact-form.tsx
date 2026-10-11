'use client';

import { FormEvent, useState } from 'react';

const enquiryTypes = [
  'General enquiry',
  'School or institutional order',
  'Distributor enquiry',
  'Catalogue request',
  'Order support',
];

export default function ContactForm({
  initialEnquiryType,
}: {
  initialEnquiryType?: string;
}) {
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [enquiryType, setEnquiryType] = useState(initialEnquiryType ?? enquiryTypes[0]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      const result: { error?: string } = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'We could not send your message. Please try again.');
      }

      setIsSubmitted(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'We could not send your message. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return (
      <div
        className="rounded-3xl bg-white p-8 shadow-xl shadow-slate-900/10 sm:p-10"
        role="status"
      >
        <p className="font-heading text-2xl font-semibold text-brand-blue">
          Thank you, we&apos;ll be in touch.
        </p>
      </div>
    );
  }

  const inputClassName =
    'mt-2 min-h-12 w-full rounded-full border border-slate-200 bg-slate-50 px-5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15';
  const labelClassName = 'text-sm font-semibold text-brand-blue';

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 sm:p-8 lg:p-10"
    >
      <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
        <label className={labelClassName}>
          Your name <span className="text-brand-red">*</span>
          <input
            autoComplete="name"
            className={inputClassName}
            maxLength={200}
            name="name"
            placeholder="Your name"
            required
          />
        </label>
        <label className={labelClassName}>
          Email <span className="text-brand-red">*</span>
          <input
            autoComplete="email"
            className={inputClassName}
            maxLength={254}
            name="email"
            placeholder="you@example.com"
            required
            type="email"
          />
        </label>
        <label className={labelClassName}>
          Phone
          <input
            autoComplete="tel"
            className={inputClassName}
            maxLength={50}
            name="phone"
            placeholder="Phone number"
            type="tel"
          />
        </label>
        <label className={labelClassName}>
          School / organisation
          <input
            autoComplete="organization"
            className={inputClassName}
            maxLength={200}
            name="organization"
            placeholder="School or organisation"
          />
        </label>
        <label className={labelClassName}>
          Enquiry type
          <select
            className={inputClassName}
            name="enquiryType"
            onChange={(event) => setEnquiryType(event.target.value)}
            value={enquiryType}
          >
            {enquiryTypes.map((enquiryType) => (
              <option key={enquiryType} value={enquiryType}>
                {enquiryType}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClassName}>
          Subject
          <input
            className={inputClassName}
            maxLength={200}
            name="subject"
            placeholder="What is this about?"
          />
        </label>
        <label className={`${labelClassName} sm:col-span-2`}>
          How can we help? <span className="text-brand-red">*</span>
          <textarea
            className="mt-2 min-h-36 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
            maxLength={10000}
            name="message"
            placeholder="Write your message"
            required
            rows={5}
          />
        </label>
      </div>

      {errorMessage && (
        <p className="mt-5 text-sm leading-6 text-red-700" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="mt-7 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <button
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand-red px-7 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Sending...' : 'Send message'}
        </button>
        <p className="text-sm text-slate-500">Fields marked * are required</p>
      </div>
    </form>
  );
}
