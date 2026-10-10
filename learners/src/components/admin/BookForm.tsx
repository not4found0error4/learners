'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export type AdminBook = {
  id?: string;
  title: string;
  author: string;
  description: string | null;
  price: number;
  stock: number;
  isbn: string | null;
  cover_image_url: string | null;
};

type BookFormProps = {
  book?: AdminBook;
};

export default function BookForm({ book }: BookFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(book?.title || '');
  const [author, setAuthor] = useState(book?.author || '');
  const [description, setDescription] = useState(book?.description || '');
  const [price, setPrice] = useState(book ? String(book.price) : '');
  const [stock, setStock] = useState(book ? String(book.stock) : '');
  const [isbn, setIsbn] = useState(book?.isbn || '');
  const [coverImageUrl, setCoverImageUrl] = useState(book?.cover_image_url || '');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');

    const numericPrice = Number(price);
    const numericStock = Number(stock);
    if (!title.trim() || !author.trim() || !Number.isFinite(numericPrice) || numericPrice <= 0 || !Number.isFinite(numericStock) || numericStock <= 0) {
      setErrorMessage('Title, author, price, and stock are required. Price and stock must be positive.');
      return;
    }

    setIsSaving(true);
    const formData = new FormData();
    formData.set('title', title.trim());
    formData.set('author', author.trim());
    formData.set('description', description.trim());
    formData.set('price', String(numericPrice));
    formData.set('stock', String(numericStock));
    formData.set('isbn', isbn.trim());
    formData.set('coverImageUrl', coverImageUrl.trim());
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
        <span className="mb-1 block text-sm font-medium">Author *</span>
        <input required value={author} onChange={(event) => setAuthor(event.target.value)} className="w-full rounded border px-3 py-2" />
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
