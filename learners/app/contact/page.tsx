// The address, phones, emails, hours, and card copy are placeholders to be replaced with real business details.
import { Building2, Clock3, Mail, MapPin, Phone, Truck } from 'lucide-react';
import ContactForm from './contact-form';

type ContactPageProps = {
  searchParams: Promise<{ enquiry?: string | string[] }>;
};

const officeDetails = [
  {
    icon: MapPin,
    label: 'Address',
    lines: ['Registered office address placeholder'],
  },
  {
    icon: Phone,
    label: 'Phone',
    lines: ['(000) 000-0000', '(000) 000-0001'],
  },
  {
    icon: Mail,
    label: 'Email',
    lines: ['hello@example.com', 'orders@example.com'],
  },
  {
    icon: Clock3,
    label: 'Hours',
    lines: ['Business hours placeholder'],
  },
];

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const { enquiry } = await searchParams;
  const initialEnquiryType =
    enquiry === 'institutional' || (Array.isArray(enquiry) && enquiry.includes('institutional'))
      ? 'School or institutional order'
      : undefined;

  return (
    <main className="w-full">
      <section className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
        <div className="max-w-3xl">
          <h1 className="font-heading text-4xl font-bold leading-tight text-brand-blue sm:text-5xl">
            We would like to hear from you
          </h1>
          <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
            Whether you are placing a school order, asking about a title or requesting our
            catalogue, write to us below. Enquiries are answered within two working days.
          </p>
        </div>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1.35fr_0.85fr] lg:gap-10">
          <ContactForm initialEnquiryType={initialEnquiryType} />

          <aside className="space-y-5">
            <div className="rounded-2xl bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
              <span className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold text-brand-blue">
                Registered office
              </span>
              <div className="mt-6 space-y-5">
                {officeDetails.map(({ icon: Icon, label, lines }) => (
                  <div key={label} className="flex gap-3">
                    <Icon
                      aria-hidden="true"
                      className="mt-0.5 h-5 w-5 shrink-0 text-brand-red"
                      strokeWidth={1.8}
                    />
                    <div>
                      <p className="text-sm font-semibold text-blue-950">{label}</p>
                      {lines.map((line) => (
                        <p key={line} className="mt-1 text-sm leading-6 text-slate-600">
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-indigo-50 p-6 shadow-sm sm:p-7">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-brand-blue shadow-sm">
                <Building2 aria-hidden="true" className="h-6 w-6" strokeWidth={1.8} />
              </span>
              <h2 className="mt-4 font-heading text-xl font-semibold text-blue-950">
                Institutional desk
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Get in touch with our team about school, library, and distributor orders. We are
                happy to help you find the right books for your community.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
              <Truck aria-hidden="true" className="h-7 w-7 text-brand-red" strokeWidth={1.8} />
              <h2 className="mt-4 font-heading text-xl font-semibold text-blue-950">
                Despatch &amp; delivery
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Our team prepares orders with care and will share helpful updates as your books
                make their way to you.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
