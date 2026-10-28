'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { AdminBook } from '@/components/admin/BookForm';
import { getCategoryLabel } from '@/lib/categories';

type ListedBook = AdminBook & { id: string; is_active: boolean };

export default function AdminBooksPage() {
  const [books, setBooks] = useState<ListedBook[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deletingBookId, setDeletingBookId] = useState<string | null>(null);
  const missingWeightCount = books.filter((book) => book.is_active && book.weight_grams === null).length;

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

    await toggleBook(book);
  }

  async function deleteBook(book: ListedBook) {
    if (!window.confirm(`Permanently delete “${book.title}”? This cannot be undone. Books referenced by existing orders cannot be deleted.`)) {
      return;
    }

    setDeletingBookId(book.id);
    setErrorMessage('');
    try {
      const response = await fetch(`/api/admin/books/${book.id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) {
        setErrorMessage(result.error || 'Unable to delete book.');
        return;
      }

      setBooks((currentBooks) => currentBooks.filter((currentBook) => currentBook.id !== book.id));
    } catch {
      setErrorMessage('Unable to delete book. Please try again.');
    } finally {
      setDeletingBookId(null);
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
        {!isLoading && (
          <p className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="status">
            {missingWeightCount} active {missingWeightCount === 1 ? 'book has' : 'books have'} no weight.
          </p>
        )}
        {isLoading ? <p>Loading books...</p> : (
          <div className="overflow-x-auto rounded border bg-white">
            <table className="w-full min-w-200 text-left text-sm">
              <thead className="border-b bg-gray-100 text-xs uppercase text-gray-600">
                <tr>
                  <th className="p-3">Cover</th><th className="p-3">Title</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3">Weight</th><th className="p-3">Status</th><th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book.id} className={`border-b last:border-0 ${book.is_active ? '' : 'bg-gray-100 text-gray-500'}`}>
                    <td className="p-3">{book.cover_image_url ? <img src={book.cover_image_url} alt="" className="h-14 w-10 object-cover" /> : <div className="flex h-14 w-10 items-center justify-center bg-gray-200 text-xs">None</div>}</td>
                    <td className="p-3">
                      <p className="font-medium">{book.title}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {book.categories.slice(0, 3).map((slug, index) => (
                          <span key={`${slug}-${index}`} className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                            {getCategoryLabel(slug) ?? slug}
                          </span>
                        ))}
                        {book.categories.length > 3 && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                            +{book.categories.length - 3}
                          </span>
                        )}
                        {book.is_bestseller && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                            Bestseller
                          </span>
                        )}
                      </div>
                    </td><td className="p-3">₹{Number(book.price).toFixed(2)}</td><td className="p-3">{book.stock}</td>
                    <td className="p-3">
                      {book.weight_grams === null ? (
                        <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">Weight missing</span>
                      ) : (
                        `${book.weight_grams} g`
                      )}
                    </td>
                    <td className="p-3"><span className={`rounded-full px-2 py-1 text-xs ${book.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{book.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td className="p-3"><div className="flex flex-wrap gap-2"><Link href={`/admin/books/${book.id}/edit`} className="rounded border px-3 py-1 hover:bg-gray-50">Edit</Link>{book.is_active ? <button type="button" onClick={() => void deactivateBook(book)} className="rounded border border-red-300 px-3 py-1 text-red-700 hover:bg-red-50">Deactivate</button> : <button type="button" onClick={() => void toggleBook(book)} className="rounded border border-green-300 px-3 py-1 text-green-700 hover:bg-green-50">Reactivate</button>}<button type="button" onClick={() => void deleteBook(book)} disabled={deletingBookId === book.id} className="rounded border border-red-300 px-3 py-1 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">{deletingBookId === book.id ? 'Deleting...' : 'Delete'}</button></div></td>
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
