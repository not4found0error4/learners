import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';

type Book = {
  id: string;
  title: string;
  author: string;
  price: number;
  stock: number;
  cover_image_url: string | null;
};

export default async function HomePage() {
  const { data: books, error } = await supabase
    .from('books')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    return <p className="p-8 text-red-600">Failed to load books: {error.message}</p>;
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">Our Books</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {books?.map((book: Book) => (
          <Link
            key={book.id}
            href={`/books/${book.id}`}
            className="block border rounded-lg overflow-hidden hover:shadow-lg transition"
          >
            <div className="relative w-full h-56 bg-gray-100">
              <Image
                src={book.cover_image_url || 'https://placehold.co/300x400'}
                alt={book.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-3">
              <h2 className="font-semibold text-sm truncate">{book.title}</h2>
              <p className="text-gray-500 text-xs">{book.author}</p>
              <p className="mt-1 font-bold">₹{book.price}</p>
              {book.stock === 0 && (
                <span className="text-red-500 text-xs">Out of stock</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
