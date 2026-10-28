import { supabase } from '@/lib/supabase';
import AddToCartButton from '@/components/AddToCartButton';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BOOK_CATEGORIES } from '@/lib/categories';

type BookCategory = (typeof BOOK_CATEGORIES)[number];

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: book, error } = await supabase
    .from('books')
    .select('id, title, description, price, stock, weight_grams, cover_image_url, class_level, language, categories')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error || !book) {
    notFound();
  }

  const coverUrl = book.cover_image_url || 'https://placehold.co/300x400';
  const isSvgCover = /\.svg(?:[?#]|$)/i.test(coverUrl);
  const categorySlugs: unknown = book.categories;
  const categories: BookCategory[] = Array.isArray(categorySlugs)
    ? categorySlugs
      .filter((slug): slug is string => typeof slug === 'string')
      .map((slug) => BOOK_CATEGORIES.find((category) => category.slug === slug))
      .filter((category): category is BookCategory => category !== undefined)
    : [];
  const classLevel = book.class_level?.trim();
  const language = book.language?.trim();
  const description = book.description?.trim();

  return (
    <main className="w-full">
      <section className="mx-auto grid w-full max-w-7xl items-start gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-24">
        <aside className="w-full lg:sticky lg:top-28">
          <div className="relative mx-auto aspect-4/5 w-full max-w-xl rounded-3xl bg-[#f3f1ed] p-8 shadow-xl shadow-slate-900/10">
            <div className="relative flex h-full w-full items-center justify-center">
              <Image
                src={coverUrl}
                alt={book.title}
                fill
                sizes="(max-width: 1023px) 100vw, 50vw"
                unoptimized={isSvgCover}
                className="rounded-sm object-contain drop-shadow-lg"
              />
            </div>
          </div>
        </aside>

        <div className="max-w-2xl">
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categories.map(({ slug, label, group }) => (
                <Link
                  key={slug}
                  href={`/shop?${group}=${slug}`}
                  className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-brand-blue transition-colors hover:bg-blue-100"
                >
                  {label}
                </Link>
              ))}
            </div>
          )}
          <h1 className={`${categories.length > 0 ? 'mt-4' : ''} font-heading text-3xl font-bold leading-tight text-blue-950 sm:text-4xl lg:text-5xl`}>
            {book.title}
          </h1>

          <div className="mt-7 rounded-2xl bg-slate-100 p-5 sm:p-6">
            <p className="font-heading text-3xl font-bold text-brand-blue sm:text-4xl">
              ₹{Number(book.price).toFixed(2)}
            </p>
          </div>

          {description && (
            <p className="mt-7 whitespace-pre-line text-base leading-8 text-slate-600">
              {description}
            </p>
          )}

          <div className="mt-8 border-t border-slate-200 pt-6">
            <dl className="space-y-4">
              {classLevel && <BookDetailRow label="Class / level" value={classLevel} />}
              {language && <BookDetailRow label="Language" value={language} />}
              <div className="flex items-center justify-between gap-4">
                <dt className="text-sm text-slate-500">Availability</dt>
                <dd
                  className={`inline-flex items-center gap-2 text-sm font-semibold ${
                    book.stock > 0 ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`h-2.5 w-2.5 rounded-full ${
                      book.stock > 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  {book.stock > 0 ? 'In stock' : 'Out of stock'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-5">
            <AddToCartButton
              book={{
                id: book.id,
                title: book.title,
                price: book.price,
                cover_image_url: book.cover_image_url,
                weight_grams: book.weight_grams,
              }}
              maxQuantity={book.stock}
              disabled={book.stock === 0}
            />
            <Link
              className="text-sm font-semibold text-brand-blue transition-colors hover:text-brand-blue-dark"
              href="/shop"
            >
              Back to catalogue
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function BookDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-right text-sm font-semibold text-blue-950">{value}</dd>
    </div>
  );
}
