'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BOOK_CATEGORIES } from '@/lib/categories';

export type AdminBook = {
  id?: string;
  title: string;
  description: string | null;
  price: number;
  stock: number;
  isbn: string | null;
  cover_image_url: string | null;
  category: string | null;
  is_bestseller: boolean;
  class_level: string | null;
  language: string;
};

type BookFormProps = {
  book?: AdminBook;
};

export default function BookForm({ book }: BookFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(book?.title || '');
  const [description, setDescription] = useState(book?.description || '');
  const [price, setPrice] = useState(book ? String(book.price) : '');
  const [stock, setStock] = useState(book ? String(book.stock) : '');
  const [isbn, setIsbn] = useState(book?.isbn || '');
  const [coverImageUrl, setCoverImageUrl] = useState(book?.cover_image_url || '');
  const [category, setCategory] = useState(book?.category || '');
  const [isBestseller, setIsBestseller] = useState(book?.is_bestseller ?? false);
  const [classLevel, setClassLevel] = useState(book?.class_level || '');
  const [language, setLanguage] = useState(book?.language || 'English');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');

    const numericPrice = Number(price);
    const numericStock = Number(stock);
    if (!title.trim() || !Number.isFinite(numericPrice) || numericPrice <= 0 || !Number.isFinite(numericStock) || numericStock <= 0) {
      setErrorMessage('Title, price, and stock are required. Price and stock must be positive.');
      return;
    }

    setIsSaving(true);
    const formData = new FormData();
    formData.set('title', title.trim());
    formData.set('description', description.trim());
    formData.set('price', String(numericPrice));
    formData.set('stock', String(numericStock));
    formData.set('isbn', isbn.trim());
    formData.set('coverImageUrl', coverImageUrl.trim());
    formData.set('category', category);
    formData.set('is_bestseller', String(isBestseller));
    formData.set('class_level', classLevel.trim());
    formData.set('language', language.trim() || 'English');
    if (coverFile) {
      formData.set('coverFile', coverFile);
    }

    const response = await fetch(book?.id ? `/api/admin/books/${book.id}` : '/api/admin/books', {
      method: book?.id ? 'PUT' : 'POST',
      body: formData,
    });
    const result = await response.json();

    if (!response.ok) {
      setErrorMessage(result.error || 'Unable to save book.');
      setIsSaving(false);
      return;
    }

    router.push('/admin/books');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Title *</span>
        <input required value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded border px-3 py-2" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Description</span>
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={5} className="w-full rounded border px-3 py-2" />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Price *</span>
          <input required min="0.01" step="0.01" type="number" value={price} onChange={(event) => setPrice(event.target.value)} className="w-full rounded border px-3 py-2" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Stock *</span>
          <input required min="1" step="1" type="number" value={stock} onChange={(event) => setStock(event.target.value)} className="w-full rounded border px-3 py-2" />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">ISBN</span>
        <input value={isbn} onChange={(event) => setIsbn(event.target.value)} className="w-full rounded border px-3 py-2" />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Category</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full rounded border bg-white px-3 py-2"
          >
            <option value="">No category</option>
            {BOOK_CATEGORIES.map(({ slug, label }) => (
              <option key={slug} value={slug}>{label}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium">
          <input
            checked={isBestseller}
            onChange={(event) => setIsBestseller(event.target.checked)}
            type="checkbox"
          />
          Mark as bestseller
        </label>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Class / level</span>
          <input
            value={classLevel}
            onChange={(event) => setClassLevel(event.target.value)}
            placeholder="e.g. Class 4"
            className="w-full rounded border px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Language</span>
          <input
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            placeholder="English"
            className="w-full rounded border px-3 py-2"
          />
        </label>
      </div>
      <div className="space-y-3 rounded border p-4">
        <div>
          <p className="text-sm font-medium">Cover image</p>
          <p className="text-xs text-gray-500">Upload a file, or paste an image URL instead.</p>
        </div>
        <input type="file" accept="image/*" onChange={(event) => setCoverFile(event.target.files?.[0] || null)} className="block w-full text-sm" />
        <label className="block">
          <span className="mb-1 block text-sm">Image URL</span>
          <input type="url" value={coverImageUrl} onChange={(event) => setCoverImageUrl(event.target.value)} placeholder="https://..." className="w-full rounded border px-3 py-2" />
        </label>
      </div>
      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={isSaving} className="rounded bg-black px-5 py-2 text-white disabled:opacity-50">
          {isSaving ? 'Saving...' : book?.id ? 'Save Changes' : 'Add Book'}
        </button>
        <button type="button" onClick={() => router.push('/admin/books')} className="rounded border px-5 py-2">
          Cancel
        </button>
      </div>
    </form>
  );
}
