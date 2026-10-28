import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { notFound } from 'next/navigation';

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: book, error } = await supabase
    .from('books')
    .select('id, title, description, price, stock, cover_image_url, categories')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error || !book) {
    notFound();
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="grid md:grid-cols-2 gap-10">
        <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
          <Image
            src={book.cover_image_url || 'https://placehold.co/300x400'}
            alt={book.title}
            fill
            className="object-cover"
          />
        </div>

        <div>
          <h1 className="text-3xl font-bold">{book.title}</h1>
          <p className="text-2xl font-bold mt-4">₹{book.price}</p>

          {book.stock > 0 ? (
            <p className="text-green-600 text-sm mt-1">In stock ({book.stock} left)</p>
          ) : (
            <p className="text-red-500 text-sm mt-1">Out of stock</p>
          )}

          <p className="mt-6 text-gray-700 leading-relaxed">{book.description}</p>

          <button
            disabled={book.stock === 0}
            className="mt-8 bg-black text-white px-6 py-3 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </main>
  );
}
