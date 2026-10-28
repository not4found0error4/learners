// The catalogue heading and introduction are placeholder copy.
import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import ShopCatalog, { type ShopBook } from '@/components/ShopCatalog';

export default async function ShopPage() {
  const { data, error } = await supabase
    .from('books')
    .select('id, title, price, stock, weight_grams, cover_image_url, categories, is_bestseller, class_level, language, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    return <p className="p-8 text-red-600">Failed to load books: {error.message}</p>;
  }

  return (
    <main className="w-full">
      <section className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
        <header className="mb-10 max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-red">
            Our catalogue
          </p>
          <h1 className="font-heading text-4xl font-bold leading-tight text-brand-blue sm:text-5xl">
            Books for every classroom
          </h1>
          <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
            Explore thoughtful learning resources for curious readers, growing minds, and
            classrooms at every stage.
          </p>
        </header>
        <Suspense fallback={null}>
          <ShopCatalog books={(data ?? []) as ShopBook[]} />
        </Suspense>
      </section>
    </main>
  );
}
