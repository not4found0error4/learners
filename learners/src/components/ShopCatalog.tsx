'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  BOOK_CATEGORIES,
  getCategoryLabel,
  LEVEL_CATEGORIES,
  SUBJECT_CATEGORIES,
} from '@/lib/categories';

export type ShopBook = {
  id: string;
  title: string;
  price: number;
  stock: number;
  weight_grams: number | null;
  cover_image_url: string | null;
  categories: string[];
  is_bestseller: boolean;
  class_level: string | null;
  language: string;
  created_at: string;
};

type ShopCatalogProps = {
  books: ShopBook[];
};

const PAGE_SIZE = 9;

export default function ShopCatalog({ books }: ShopCatalogProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const levelParam = searchParams.get('level');
  const subjectParam = searchParams.get('subject');
  const legacyCategorySlug = searchParams.get('category') ?? '';
  const mappedLegacyCategorySlug = legacyCategorySlug === 'mathematics'
    ? 'maths'
    : /^class-[1-8]$/.test(legacyCategorySlug)
      ? 'class-1-8'
      : legacyCategorySlug;
  const legacyCategory = BOOK_CATEGORIES.find(({ slug }) => slug === mappedLegacyCategorySlug);
  const level = levelParam
    ? LEVEL_CATEGORIES.some(({ slug }) => slug === levelParam)
      ? levelParam
      : ''
    : legacyCategory?.group === 'level' ? legacyCategory.slug : '';
  const subject = subjectParam
    ? SUBJECT_CATEGORIES.some(({ slug }) => slug === subjectParam)
      ? subjectParam
      : ''
    : legacyCategory?.group === 'subject' ? legacyCategory.slug : '';
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const categoryCounts = useMemo(
    () =>
      new Map(
        BOOK_CATEGORIES.map(({ slug }) => [
          slug,
          books.filter((book) => book.categories?.includes(slug)).length,
        ]),
      ),
    [books],
  );

  const matchingBooks = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    const filteredBooks = books.filter((book) => {
      const matchesLevel = !level || book.categories?.includes(level);
      const matchesSubject = !subject || book.categories?.includes(subject);
      const matchesSearch = !normalizedSearch || book.title.toLocaleLowerCase().includes(normalizedSearch);
      return matchesLevel && matchesSubject && matchesSearch;
    });

    return filteredBooks.sort(
      (first, second) => Date.parse(second.created_at) - Date.parse(first.created_at),
    );
  }, [books, level, subject, search]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setVisibleCount(PAGE_SIZE), 0);
    return () => window.clearTimeout(timeout);
  }, [level, subject]);

  function updateFilter(group: 'level' | 'subject', value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('category');
    if (value) params.set(group, value);
    else params.delete(group);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    setVisibleCount(PAGE_SIZE);
  }

  function clearFilters() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('category');
    params.delete('level');
    params.delete('subject');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    updateSearch('');
  }

  function updateSearch(value: string) {
    setSearch(value);
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <div>
      <div className="rounded-3xl bg-white p-3 shadow-lg shadow-slate-900/5 sm:p-4">
        <div className="flex flex-col gap-3">
          <label className="relative block w-full">
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

          <div className="grid gap-3 md:grid-cols-2">
            <CategoryRow
              categories={LEVEL_CATEGORIES}
              categoryCounts={categoryCounts}
              selected={level}
              allLabel="All levels"
              allCount={books.length}
              rowLabel="Level"
              ariaLabel="Filter by level"
              onSelect={(value) => updateFilter('level', value)}
            />
            <CategoryRow
              categories={SUBJECT_CATEGORIES}
              categoryCounts={categoryCounts}
              selected={subject}
              allLabel="All subjects"
              allCount={books.length}
              rowLabel="Subject"
              ariaLabel="Filter by subject"
              onSelect={(value) => updateFilter('subject', value)}
            />
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
            onClick={clearFilters}
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

function CategoryRow({
  categories,
  categoryCounts,
  selected,
  allLabel,
  allCount,
  rowLabel,
  ariaLabel,
  onSelect,
}: {
  categories: typeof LEVEL_CATEGORIES | typeof SUBJECT_CATEGORIES;
  categoryCounts: Map<string, number>;
  selected: string;
  allLabel: string;
  allCount: number;
  rowLabel: string;
  ariaLabel: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-sm font-semibold text-blue-950">{rowLabel}</span>
      <div
        className="flex min-w-0 flex-nowrap gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0"
        aria-label={ariaLabel}
      >
        <CategoryPill
          active={!selected}
          count={allCount}
          label={allLabel}
          onClick={() => onSelect('')}
        />
        {categories.filter(({ slug }) => (categoryCounts.get(slug) ?? 0) > 0).map(({ slug, label }) => (
          <CategoryPill
            key={slug}
            active={selected === slug}
            count={categoryCounts.get(slug) ?? 0}
            label={label}
            onClick={() => onSelect(slug)}
          />
        ))}
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
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
        active
          ? 'bg-brand-blue text-white'
          : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-brand-blue'
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
      <span className={`text-[10px] ${active ? 'text-white/75' : 'text-slate-400'}`}>{count}</span>
    </button>
  );
}

function BookCard({ book }: { book: ShopBook }) {
  const coverUrl = book.cover_image_url || 'https://placehold.co/300x400';
  const isSvgCover = /\.svg(?:[?#]|$)/i.test(coverUrl);
  const categoryLabels = book.categories
    .map((slug) => getCategoryLabel(slug))
    .filter((label): label is string => label !== undefined);

  return (
    <Link
      className={`group overflow-hidden rounded-3xl bg-white shadow-md shadow-slate-900/5 transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10 ${
        book.stock === 0 ? 'opacity-75' : ''
      }`}
      href={`/books/${book.id}`}
    >
      <div className="relative aspect-4/5 bg-[#f3f1ed] p-4">
        <div className="relative flex h-full w-full items-center justify-center">
          <Image
            alt={book.title}
            className="rounded-sm object-contain drop-shadow-lg transition-transform duration-300 group-hover:scale-[1.02]"
            fill
            src={coverUrl}
            unoptimized={isSvgCover}
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
          />
        </div>
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
        {categoryLabels.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {categoryLabels.map((label) => (
              <span key={label} className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-brand-blue">
                {label}
              </span>
            ))}
          </div>
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
