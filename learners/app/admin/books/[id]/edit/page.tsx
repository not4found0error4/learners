'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import BookForm, { type AdminBook } from '@/components/admin/BookForm';

type EditableBook = AdminBook & { id: string };

export default function EditBookPage() {
  const params = useParams<{ id: string }>();
  const [book, setBook] = useState<EditableBook | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadBook() {
      const response = await fetch(`/api/admin/books/${params.id}`);
      const result = await response.json();
      if (!response.ok) {
        setErrorMessage(result.error || 'Unable to load book.');
      } else {
        setBook(result.book);
      }
    }

    void loadBook();
  }, [params.id]);

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900 md:p-10">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin/books" className="text-sm text-gray-600 hover:underline">Back to Books</Link>
        <h1 className="my-6 text-3xl font-bold">Edit Book</h1>
        {errorMessage && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p>}
        {!book && !errorMessage && <p>Loading book...</p>}
        {book && <div className="rounded border bg-white p-6 md:p-8"><BookForm book={book} /></div>}
      </div>
    </main>
  );
}
