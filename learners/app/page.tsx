import { BookOpen, Globe, PenLine, ShieldCheck, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { BOOK_CATEGORIES } from '@/lib/categories';
import { supabase } from '@/lib/supabase';

const valueHighlights = [
  {
    icon: ShieldCheck,
    title: 'Accuracy first',
    description: 'Placeholder copy about thoughtful review and dependable learning resources.',
    color: 'bg-blue-100 text-blue-800',
  },
  {
    icon: BookOpen,
    title: 'Curriculum aligned',
    description: 'Placeholder copy about books designed to support learning goals in class.',
    color: 'bg-red-100 text-red-700',
  },
  {
    icon: Users,
    title: 'Built with teachers',
    description: 'Placeholder copy about practical resources shaped around learners and educators.',
    color: 'bg-amber-100 text-amber-800',
  },
  {
    icon: Globe,
    title: 'Trusted worldwide',
    description: 'Placeholder copy about sharing knowledge with learning communities everywhere.',
    color: 'bg-emerald-100 text-emerald-800',
  },
];

const departments = [
  {
    slug: 'academic-textbooks',
    icon: BookOpen,
    description: 'Placeholder copy for clear, curriculum-focused books across school subjects.',
    color: 'bg-blue-100 text-blue-800',
  },
  {
    slug: 'workbooks',
    icon: PenLine,
    description: 'Placeholder copy for activities and exercises that help learners build skills.',
    color: 'bg-red-100 text-red-700',
  },
  {
    slug: 'general-knowledge',
    icon: Globe,
    description: 'Placeholder copy for engaging reads that encourage curiosity beyond the classroom.',
    color: 'bg-emerald-100 text-emerald-800',
  },
  {
    slug: 'early-years',
    icon: Users,
    description: 'Placeholder copy for welcoming first steps in reading and learning.',
    color: 'bg-amber-100 text-amber-800',
  },
  {
    slug: 'exam-prep',
    icon: ShieldCheck,
    description: 'Placeholder copy for practice resources that help learners prepare with confidence.',
    color: 'bg-indigo-100 text-indigo-800',
  },
];

export default async function HomePage() {
  const { data, error } = await supabase
    .from('books')
    .select('id, title, price, stock, cover_image_url, category, is_bestseller, class_level, language, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  const activeBooks = error ? [] : data ?? [];
  const bestsellers = activeBooks.filter((book) => book.is_bestseller);
  const books = (bestsellers.length > 0 ? bestsellers : activeBooks).slice(0, 4);
  const categoryCounts = new Map(
    BOOK_CATEGORIES.map(({ slug }) => [
      slug,
      activeBooks.filter((book) => book.category === slug).length,
    ]),
  );

  return (
    <main className="w-full">
      <section className="mx-auto grid w-full max-w-7xl items-center gap-14 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 lg:px-10 lg:py-24">
        <div className="max-w-2xl">
          <p className="mb-5 text-sm font-semibold uppercase text-brand-blue">
            Learners Publications
          </p>
          <h1 className="font-heading text-4xl font-bold leading-tight text-blue-950 sm:text-5xl">
            <span className="block">Knowledge that travels</span>
            <span className="block">
              the world,{' '}
              <span className="font-semibold italic text-brand-red">
                one page at a time.
              </span>
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            We create books that make learning clear, engaging, and accessible.
            From classroom essentials to curious reads, our publishing brings
            useful ideas to learners at every stage.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/shop"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand-red px-6 text-base font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
            >
              Shop Books
            </Link>
            <Link
              href="/about"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 bg-white px-6 text-base font-semibold text-blue-900 transition-colors hover:border-blue-300 hover:bg-blue-50"
            >
              Learn About Us
            </Link>
          </div>

          <div className="mt-12 grid max-w-xl grid-cols-3 gap-4 border-t border-slate-200 pt-7">
            <div>
              <p className="font-heading text-3xl font-bold text-blue-900">40+</p>
              <p className="mt-1 text-sm leading-5 text-slate-500">Years of publishing</p>
            </div>
            <div>
              <p className="font-heading text-3xl font-bold text-blue-900">1,200+</p>
              <p className="mt-1 text-sm leading-5 text-slate-500">Titles in print</p>
            </div>
            <div>
              <p className="font-heading text-3xl font-bold text-blue-900">12</p>
              <p className="mt-1 text-sm leading-5 text-slate-500">Learning categories</p>
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-lg pb-9 sm:pb-10 lg:pb-0">
          <div className="relative aspect-4/5 overflow-hidden rounded-2xl bg-blue-900 shadow-xl shadow-blue-950/10">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[url('/pattern-bg.png')] bg-cover bg-center opacity-20"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
              <span className="rounded-full border border-white/40 px-4 py-2 text-sm font-medium text-white/90">
                Image placeholder
              </span>
              <span className="max-w-xs font-heading text-2xl font-semibold leading-snug text-white sm:text-3xl">
                A world of learning, in every book
              </span>
            </div>
          </div>

          <div className="relative -mt-16 ml-3 max-w-sm rounded-2xl bg-white p-5 shadow-xl shadow-slate-900/10 sm:absolute sm:-bottom-7 sm:left-0 sm:ml-0 sm:mt-0 sm:-translate-x-8 sm:p-6">
            <p className="text-xs font-semibold uppercase text-brand-red">On our shelves</p>
            <p className="mt-2 font-heading text-lg font-semibold leading-snug text-blue-950">
              Textbooks, workbooks and general knowledge for every stage of school.
            </p>
            <Link
              href="/shop"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-blue hover:text-brand-blue-dark"
            >
              Browse the catalogue <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50/70">
        <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 sm:py-16 lg:px-10">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {valueHighlights.map(({ icon: Icon, title, description, color }) => (
              <article key={title} className="h-full rounded-2xl border border-[#ebe6df] bg-white p-6 shadow-sm xl:p-8">
                <span className={`flex h-14 w-14 items-center justify-center rounded-full ${color}`}>
                  <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <h3 className="mt-6 font-heading text-xl font-semibold text-blue-950">{title}</h3>
                <p className="mt-3 text-base leading-7 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase text-brand-blue">From the catalogue</p>
            <h2 className="mt-2 font-heading text-2xl font-bold text-blue-950 sm:text-3xl">
              Bestselling titles from our catalogue
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              A small selection of books to get you started. This introduction will be replaced with final catalogue copy.
            </p>
          </div>
          <Link
            href="/shop"
            className="hidden shrink-0 text-sm font-semibold text-brand-blue hover:text-brand-blue-dark sm:inline-flex"
          >
            View all books <span aria-hidden="true" className="ml-2">&rarr;</span>
          </Link>
        </div>

        {books.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
            {books.map((book) => (
              <Link
                key={book.id}
                href={`/books/${book.id}`}
                className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-lg"
              >
                <div className="relative aspect-4/5 bg-slate-100">
                  <Image
                    src={book.cover_image_url || '/pattern-bg.png'}
                    alt={book.title}
                    fill
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 260px"
                    className="object-cover transition-transform group-hover:scale-[1.02]"
                  />
                  {book.is_bestseller && (
                    <span className="absolute left-3 top-3 rounded-full bg-blue-900 px-3 py-1 text-xs font-semibold text-white">
                      Bestseller
                    </span>
                  )}
                </div>
                <div className="p-3 sm:p-4">
                  <h3 className="truncate font-semibold text-slate-900">{book.title}</h3>
                  <p className="mt-2 font-bold text-blue-950">₹{book.price}</p>
                  {book.stock === 0 && (
                    <span className="mt-1 inline-block text-xs text-red-600">Out of stock</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500">
            New titles are coming soon.
          </p>
        )}

        <Link
          href="/shop"
          className="mt-6 inline-flex text-sm font-semibold text-brand-blue hover:text-brand-blue-dark sm:hidden"
        >
          View all books <span aria-hidden="true" className="ml-2">&rarr;</span>
        </Link>
      </section>

      <section className="border-t border-slate-100 bg-slate-50/70">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-5 py-14 sm:px-8 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-20">
          <div className="relative mx-auto w-full max-w-lg">
            <div className="relative aspect-4/5 overflow-hidden rounded-2xl bg-blue-900 shadow-xl shadow-blue-950/10">
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[url('/pattern-bg.png')] bg-cover bg-center opacity-20"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
                <span className="rounded-full border border-white/40 px-4 py-2 text-sm font-medium text-white/90">
                  Image placeholder
                </span>
                <span className="max-w-xs font-heading text-2xl font-semibold leading-snug text-white sm:text-3xl">
                  Thoughtful books for every learner
                </span>
              </div>
            </div>
          </div>

          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase text-brand-blue">About the publisher</p>
            <h2 className="mt-3 font-heading text-3xl font-bold leading-tight text-blue-950 sm:text-4xl">
              A publishing house built around one idea: explain it properly.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600">
              Placeholder copy about the people and editorial care behind every title. We believe a clear explanation can make a difficult idea easier to understand.
            </p>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Placeholder copy about creating useful books for classrooms, teachers, and curious readers at every stage of learning.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-slate-200 pt-6">
              <div>
                <p className="font-heading text-2xl font-bold text-blue-900 sm:text-3xl">2,400+</p>
                <p className="mt-1 text-sm leading-5 text-slate-500">Partner schools</p>
              </div>
              <div>
                <p className="font-heading text-2xl font-bold text-blue-900 sm:text-3xl">40</p>
                <p className="mt-1 text-sm leading-5 text-slate-500">Editors & reviewers</p>
              </div>
              <div>
                <p className="font-heading text-2xl font-bold text-blue-900 sm:text-3xl">120</p>
                <p className="mt-1 text-sm leading-5 text-slate-500">Revised editions / year</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">Placeholder figures for layout only</p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase text-brand-blue">Explore our departments</p>
          <h2 className="mt-2 font-heading text-2xl font-bold text-blue-950 sm:text-3xl">
            A department for every stage of school
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Placeholder descriptions and title counts while our catalogue categories are being finalized.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {BOOK_CATEGORIES.map(({ slug, label }) => {
            const department = departments.find((item) => item.slug === slug);
            if (!department) {
              return null;
            }

            const { icon: Icon, description, color } = department;
            const count = categoryCounts.get(slug) ?? 0;

            return (
              <Link
                key={slug}
                href={`/shop?category=${slug}`}
                className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg sm:p-7"
              >
                <span className={`flex h-12 w-12 items-center justify-center rounded-full ${color}`}>
                  <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <h3 className="mt-5 font-heading text-xl font-semibold text-blue-950 group-hover:text-brand-blue">
                  {label}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{description}</p>
                {count > 0 && (
                  <span className="mt-5 inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-900">
                    {count} {count === 1 ? 'title' : 'titles'}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Placeholder quotes and role labels; replace with real customer testimonials later. */}
      <section className="border-t border-slate-100 bg-slate-50/70">
        <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
          <div className="mb-8 max-w-2xl">
            <p className="text-sm font-semibold uppercase text-brand-blue">From our community</p>
            <h2 className="mt-2 font-heading text-2xl font-bold text-blue-950 sm:text-3xl">
              Schools keep coming back to the same shelf.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <p className="text-base leading-7 text-slate-600">
                “Placeholder quote about books that make a complex topic easier to teach and understand.”
              </p>
              <div className="mt-6 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-800">
                  SP
                </span>
                <p className="font-semibold text-blue-950">School Principal</p>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <p className="text-base leading-7 text-slate-600">
                “Placeholder quote about finding useful titles for a welcoming and well-used school library.”
              </p>
              <div className="mt-6 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-sm font-semibold text-red-700">
                  L
                </span>
                <p className="font-semibold text-blue-950">Librarian</p>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <p className="text-base leading-7 text-slate-600">
                “Placeholder quote about resources that support learners throughout the school year.”
              </p>
              <div className="mt-6 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800">
                  AC
                </span>
                <p className="font-semibold text-blue-950">Academic Coordinator</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
        <div className="flex flex-col gap-8 rounded-2xl bg-blue-50 p-6 shadow-sm sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:p-12">
          <div className="max-w-2xl">
            <p className="inline-flex rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-blue-900">
              FOR SCHOOLS &amp; INSTITUTIONS
            </p>
            <h2 className="mt-5 font-heading text-3xl font-bold leading-tight text-blue-950 sm:text-4xl">
              Ordering for a whole school? We&apos;ll build the list with you.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Tell us what your students and teachers need. Our team can help you put together a catalogue selection for your institution.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand-red px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
            >
              Talk to our team
            </Link>
            <Link
              href="/shop"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-blue-200 bg-white px-6 text-sm font-semibold text-blue-900 transition-colors hover:bg-blue-100"
            >
              Browse catalogue
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}