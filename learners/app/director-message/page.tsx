// The name, text, quote, and portrait on this page are placeholders to be replaced with real content.
import { Dancing_Script } from 'next/font/google';
import { UserRound } from 'lucide-react';

const signatureFont = Dancing_Script({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export default function DirectorMessagePage() {
  return (
    <main className="w-full">
      <section className="mx-auto grid w-full max-w-7xl items-start gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16 lg:px-10 lg:py-24">
        <aside className="w-full max-w-sm lg:sticky lg:top-28">
          <div className="rounded-2xl bg-white p-3 shadow-xl shadow-slate-900/10">
            <div
              aria-label="Placeholder portrait"
              className="flex aspect-4/5 items-center justify-center rounded-2xl bg-blue-100 text-brand-blue"
            >
              <UserRound aria-hidden="true" className="h-20 w-20" strokeWidth={1.5} />
            </div>
          </div>
          <p className={`${signatureFont.className} mt-6 text-center text-4xl text-blue-950`}>
            Manoj Rawat
          </p>
          <p className="mt-2 text-center text-xs font-semibold uppercase tracking-wide text-brand-red">
            Director, Learners Publications
          </p>
        </aside>

        <div className="max-w-3xl">
          <h1 className="font-heading text-4xl font-bold leading-tight text-brand-blue sm:text-5xl">
            Welcome to Learners Publications.
          </h1>
          <div className="mt-7 space-y-5 text-base leading-8 text-slate-600 sm:text-lg">
            <p>
              <span className="float-left mr-2 font-serif text-6xl font-semibold leading-[0.85] text-brand-red">
                It
              </span> is my privilege to welcome you to an organisation built on a simple yet powerful belief — every child deserves meaningful learning opportunities and every learner has the potential to achieve more. 
              At Learners Publications, we believe that a good book is more than a collection of lessons. It is a gateway to curiosity, a companion in learning and a foundation for lifelong growth.
            </p>
            <p>
              Our aim is to develop educational resources that combine strong academic content with creativity, engaging activities and child-friendly presentation, while keeping quality and affordability at the heart of what we do. 
              We continuously listen to the changing needs of students, teachers and schools and transform those insights into learning resources that make teaching more effective and learning more enjoyable.
            </p>
            <p>
              Every resource we create reflects our commitment to quality, innovation, conceptual clarity and joyful learning. We are equally committed to supporting educators with dependable resources and empowering children to become confident, curious and independent learners.
            </p>
            <p>
              I sincerely thank our dedicated team, educators, authors, designers and valued school partners for their trust, support and continued association with Learners Publications.  
            </p>
          </div>

          <blockquote className="mt-8 rounded-2xl bg-indigo-50 p-6 font-heading text-xl font-semibold leading-relaxed text-blue-950 shadow-sm sm:p-8 sm:text-2xl">
            “A thoughtful book can turn curiosity into a lifelong love of learning.”
          </blockquote>

          <div className="mt-8 space-y-5 text-base leading-8 text-slate-600 sm:text-lg">
            <p>
              Together, let us create a learning environment where every page inspires, every activity engages and every learner grows.
            </p>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <p className="text-base leading-7 text-slate-600 sm:text-lg">
              With warm regards,
            </p>
            <p className={`${signatureFont.className} mt-2 text-4xl text-blue-950`}>
              Manoj Rawat
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
