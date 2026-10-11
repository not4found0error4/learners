// All text and the image on this page are placeholders to be replaced with real content.
import { BookOpen } from 'lucide-react';

export default function AboutPage() {
  return (
    <main className="w-full">
      <section className="mx-auto grid w-full max-w-7xl items-start gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 lg:px-10 lg:py-24">
        <div className="max-w-2xl">
          <h1 className="font-heading text-4xl font-bold leading-tight text-brand-blue sm:text-5xl">
            Inspiring Young Minds. Shaping Brighter Futures.
          </h1>
          <div className="mt-7 space-y-5 text-base leading-8 text-slate-600 sm:text-lg">
            <p>
              Learners Publications is a progressive educational publishing house dedicated to shaping meaningful learning experiences for young minds. 
              We believe that true learning begins with curiosity, grows through creativity, and becomes meaningful through joyful experiences. Our educational resources are thoughtfully designed to make learning engaging, purposeful and enjoyable for every child.
            </p>
            <p>
              We create age-appropriate learning materials that strengthen conceptual understanding, critical thinking, creativity, communication, problem-solving skills and overall development. Every book is carefully developed to complement classroom teaching while encouraging children to explore, participate, practise and learn with confidence.
            </p>
            <p>
              We believe a good book can make a complex idea feel clear and
              inspire a reader to keep asking questions. That belief guides
              the care we bring to every subject, page, and activity.
            </p>
            <p>
              At Learners Publications, we bring together quality content, thoughtful design, engaging activities and structured learning to meet the evolving needs of schools, teachers, parents and students.
            </p>
            <p>
              Our commitment goes beyond creating books. We strive to create learning experiences that inspire children today and prepare them for tomorrow.
            </p>
          </div>
        </div>

        <aside className="w-full max-w-lg lg:sticky lg:top-28 lg:justify-self-end">
          <div className="rounded-2xl bg-white p-3 shadow-xl shadow-slate-900/10">
            <div
              aria-label="Placeholder illustration of a book"
              className="flex aspect-4/5 items-center justify-center rounded-2xl bg-blue-100 text-brand-blue"
            >
              <BookOpen aria-hidden="true" className="h-20 w-20" strokeWidth={1.5} />
            </div>
          </div>
          <div className="mt-5 rounded-2xl bg-indigo-50 p-5 shadow-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-red">
              Our promise
            </p>
            <p className="mt-2 font-heading text-lg font-semibold leading-snug text-blue-950 sm:text-xl">
              Books that make learning clear, engaging, and full of possibility.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
