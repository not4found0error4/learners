'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { AdminBook } from '@/components/admin/BookForm';

type ListedBook = AdminBook & { id: string; is_active: boolean };

export default function AdminBooksPage() {
  const [books, setBooks] = useState<ListedBook[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/books')
      .then(async (response) => ({ response, result: await response.json() }))
      .then(({ response, result }) => {
        if (!response.ok) {
          setErrorMessage(result.error || 'Unable to load books.');
        } else {
          setBooks(result.books || []);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setErrorMessage('Unable to load books.');
        setIsLoading(false);
      });
  }, []);

  async function deactivateBook(book: ListedBook) {
    if (!window.confirm(`Deactivate “${book.title}”? It will remain available in historical orders.`)) {
      return;
    }

    const response = await fetch(`/api/admin/books/${book.id}`, { method: 'DELETE' });
    if (response.ok) {
      setBooks((currentBooks) => currentBooks.map((currentBook) => currentBook.id === book.id ? { ...currentBook, is_active: false } : currentBook));
    } else {
      const result = await response.json();
      setErrorMessage(result.error || 'Unable to deactivate book.');
    }
  }

  async function toggleBook(book: ListedBook) {
    const response = await fetch(`/api/admin/books/${book.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !book.is_active }),
    });
    if (response.ok) {
      setBooks((currentBooks) => currentBooks.map((currentBook) => currentBook.id === book.id ? { ...currentBook, is_active: !book.is_active } : currentBook));
    } else {
      const result = await response.json();
      setErrorMessage(result.error || 'Unable to update book status.');
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900 md:p-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/admin" className="text-sm text-gray-600 hover:underline">Admin Dashboard</Link>
            <h1 className="mt-2 text-3xl font-bold">Books</h1>
          </div>
          <Link href="/admin/books/new" className="rounded bg-black px-4 py-2 text-sm font-medium text-white">Add New Book</Link>
        </div>
        {errorMessage && <p className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p>}
        {isLoading ? <p>Loading books...</p> : (
          <div className="overflow-x-auto rounded border bg-white">
            <table className="w-full min-w-200 text-left text-sm">
              <thead className="border-b bg-gray-100 text-xs uppercase text-gray-600">
                <tr>
                  <th className="p-3">Cover</th><th className="p-3">Title</th><th className="p-3">Author</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3">Status</th><th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book.id} className={`border-b last:border-0 ${book.is_active ? '' : 'bg-gray-100 text-gray-500'}`}>
                    <td className="p-3">{book.cover_image_url ? <img src={book.cover_image_url} alt="" className="h-14 w-10 object-cover" /> : <div className="flex h-14 w-10 items-center justify-center bg-gray-200 text-xs">None</div>}</td>
                    <td className="p-3 font-medium">{book.title}</td><td className="p-3">{book.author}</td><td className="p-3">₹{Number(book.price).toFixed(2)}</td><td className="p-3">{book.stock}</td>
                    <td className="p-3"><span className={`rounded-full px-2 py-1 text-xs ${book.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{book.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td className="p-3"><div className="flex flex-wrap gap-2"><Link href={`/admin/books/${book.id}/edit`} className="rounded border px-3 py-1 hover:bg-gray-50">Edit</Link>{book.is_active ? <button type="button" onClick={() => void deactivateBook(book)} className="rounded border border-red-300 px-3 py-1 text-red-700 hover:bg-red-50">Deactivate</button> : <button type="button" onClick={() => void toggleBook(book)} className="rounded border border-green-300 px-3 py-1 text-green-700 hover:bg-green-50">Reactivate</button>}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {books.length === 0 && <p className="p-8 text-center text-gray-500">No books found.</p>}
          </div>
        )}
      </div>
    </main>
  );
}
