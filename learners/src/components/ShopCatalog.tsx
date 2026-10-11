'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { BOOK_CATEGORIES } from '@/lib/categories';

export type ShopBook = {
  id: string;
  title: string;
  price: number;
  stock: number;
  cover_image_url: string | null;
  category: string | null;
  is_bestseller: boolean;
  class_level: string | null;
  language: string;
  created_at: string;
};

type ShopCatalogProps = {
  books: ShopBook[];
  initialCategory: string;
};

type SortOption = 'title-asc' | 'title-desc' | 'price-asc' | 'price-desc' | 'newest';

const PAGE_SIZE = 9;
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'title-asc', label: 'Title A-Z' },
  { value: 'title-desc', label: 'Title Z-A' },
  { value: 'price-asc', label: 'Price low to high' },
  { value: 'price-desc', label: 'Price high to low' },
  { value: 'newest', label: 'Newest' },
];

function isSortOption(value: string): value is SortOption {
  return SORT_OPTIONS.some((option) => option.value === value);
}

export default function ShopCatalog({ books, initialCategory }: ShopCatalogProps) {
  const [category, setCategory] = useState(() =>
    BOOK_CATEGORIES.some(({ slug }) => slug === initialCategory) ? initialCategory : '',
  );
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const categoryCounts = useMemo(
    () =>
      new Map(
        BOOK_CATEGORIES.map(({ slug }) => [
          slug,
          books.filter((book) => book.category === slug).length,
        ]),
      ),
    [books],
  );

  const matchingBooks = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    const filteredBooks = books.filter((book) => {
      const matchesCategory = !category || book.category === category;
      const matchesSearch = !normalizedSearch || book.title.toLocaleLowerCase().includes(normalizedSearch);
      return matchesCategory && matchesSearch;
    });

    return filteredBooks.sort((first, second) => {
      switch (sort) {
        case 'title-asc':
          return first.title.localeCompare(second.title);
        case 'title-desc':
          return second.title.localeCompare(first.title);
        case 'price-asc':
          return first.price - second.price;
        case 'price-desc':
          return second.price - first.price;
        case 'newest':
          return Date.parse(second.created_at) - Date.parse(first.created_at);
      }
    });
  }, [books, category, search, sort]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (category) {
      url.searchParams.set('category', category);
    } else {
      url.searchParams.delete('category');
    }
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }, [category]);

  function selectCategory(value: string) {
    setCategory(value);
    setVisibleCount(PAGE_SIZE);
  }

  function updateSearch(value: string) {
    setSearch(value);
    setVisibleCount(PAGE_SIZE);
  }

  function updateSort(value: string) {
    if (isSortOption(value)) {
      setSort(value);
      setVisibleCount(PAGE_SIZE);
    }
  }

  return (
    <div>
      <div className="rounded-3xl bg-white p-5 shadow-lg shadow-slate-900/5 sm:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2" aria-label="Filter by category">
            <CategoryPill
              active={!category}
              count={books.length}
              label="All titles"
              onClick={() => selectCategory('')}
            />
            {BOOK_CATEGORIES.filter(({ slug }) => (categoryCounts.get(slug) ?? 0) > 0).map(
              ({ slug, label }) => (
                <CategoryPill
                  key={slug}
                  active={category === slug}
                  count={categoryCounts.get(slug) ?? 0}
                  label={label}
                  onClick={() => selectCategory(slug)}
                />
              ),
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative block min-w-0 flex-1 sm:min-w-64">
              <span className="sr-only">Search by title</span>
              <Search
                aria-hidden="true"
                className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <input
                className="min-h-11 w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
                onChange={(event) => updateSearch(event.target.value)}
                placeholder="Search by title"
                type="search"
                value={search}
              />
            </label>
            <label>
              <span className="sr-only">Sort books</span>
              <select
                className="min-h-11 w-full rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 sm:w-auto"
                onChange={(event) => updateSort(event.target.value)}
                value={sort}
              >
                {SORT_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <p className="my-6 text-sm text-slate-500" aria-live="polite">
        Showing {Math.min(visibleCount, matchingBooks.length)} of {matchingBooks.length} titles
      </p>

      {matchingBooks.length === 0 ? (
        <div className="rounded-3xl bg-white px-6 py-14 text-center shadow-sm">
          <h2 className="font-heading text-xl font-semibold text-blue-950">
            No titles match those filters
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Try another search or clear your filters to browse the full catalogue.
          </p>
          <button
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full border border-brand-blue px-5 text-sm font-semibold text-brand-blue transition-colors hover:bg-blue-50"
            onClick={() => {
              setCategory('');
              updateSearch('');
              updateSort('newest');
            }}
            type="button"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {matchingBooks.slice(0, visibleCount).map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
          {visibleCount < matchingBooks.length && (
            <div className="mt-9 text-center">
              <button
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-brand-blue px-7 text-sm font-semibold text-brand-blue transition-colors hover:bg-blue-50"
                onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
                type="button"
              >
                Load more titles
              </button>
            </div>
          )}
        </>
      )}

      <div className="mt-14 rounded-3xl bg-indigo-50 p-6 shadow-sm sm:p-9 lg:flex lg:items-center lg:justify-between lg:gap-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-red">
            Looking for something specific?
          </p>
          <h2 className="mt-3 font-heading text-2xl font-bold leading-snug text-blue-950 sm:text-3xl">
            Tell us your class, board and subject, and we will send the right title list.
          </h2>
        </div>
        <Link
          className="mt-6 inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-brand-red px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 lg:mt-0"
          href="/contact?enquiry=institutional"
        >
          Enquire to order
        </Link>
      </div>
    </div>
  );
}

function CategoryPill({
  active,
  count,
  label,
  onClick,
}: {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors ${
        active
          ? 'bg-brand-blue text-white'
          : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-brand-blue'
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
      <span className={`text-xs ${active ? 'text-white/75' : 'text-slate-400'}`}>{count}</span>
    </button>
  );
}

function BookCard({ book }: { book: ShopBook }) {
  const coverUrl = book.cover_image_url || 'https://placehold.co/300x400';
  const isSvgCover = /\.svg(?:[?#]|$)/i.test(coverUrl);
  const categoryLabel = BOOK_CATEGORIES.find(({ slug }) => slug === book.category)?.label;

  return (
    <Link
      className={`group overflow-hidden rounded-3xl bg-white shadow-md shadow-slate-900/5 transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10 ${
        book.stock === 0 ? 'opacity-75' : ''
      }`}
      href={`/books/${book.id}`}
    >
      <div className="relative aspect-3/4 overflow-hidden bg-[#f3f1ed] p-4 sm:p-5">
        <Image
          alt={book.title}
          className="object-contain transition-transform duration-300 group-hover:scale-[1.02]"
          fill
          src={coverUrl}
          unoptimized={isSvgCover}
          sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
        />
        {book.is_bestseller && (
          <span className="absolute left-4 top-4 rounded-full bg-brand-blue px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
            Bestseller
          </span>
        )}
        {book.stock === 0 && (
          <span className="absolute right-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
            Out of stock
          </span>
        )}
      </div>
      <div className="p-5 sm:p-6">
        {categoryLabel && (
          <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-brand-blue">
            {categoryLabel}
          </span>
        )}
        <h2 className="mt-3 line-clamp-2 min-h-14 font-heading text-lg font-semibold leading-7 text-blue-950">
          {book.title}
        </h2>
        <p className="mt-2 font-heading text-lg font-bold text-brand-blue">
          ₹{Number(book.price).toFixed(2)}
        </p>
      </div>
    </Link>
  );
}
