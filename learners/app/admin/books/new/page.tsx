import Link from 'next/link';
import BookForm from '@/components/admin/BookForm';

export default function NewBookPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900 md:p-10">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin/books" className="text-sm text-gray-600 hover:underline">Back to Books</Link>
        <h1 className="my-6 text-3xl font-bold">Add New Book</h1>
        <div className="rounded border bg-white p-6 md:p-8"><BookForm /></div>
      </div>
    </main>
  );
}
