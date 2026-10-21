import type { Metadata } from "next";
import { MarketingLayout } from "@/components/marketing/marketing-layout";

const SITE = "https://42lms.com";
const DEMO_TITLE = "Request a Demo — 42 LMS";
// The old marketing page promised AI agents and AI assessments. Those are
// deliberately absent from the product; keep the four-step layout, not those claims.
const DEMO_DESCRIPTION =
  "See how 42 LMS supports connected learning, practical projects and placement operations. Request a personalized walkthrough.";
const DEMO_EMAIL = "hello@42lms.com";
const DEMO_MAILTO = "mailto:" + DEMO_EMAIL +
  "?subject=" + encodeURIComponent(DEMO_TITLE) +
  "&body=" + encodeURIComponent(
    "Hi 42 LMS team,\n\nI'd like to see a demo.\n\nName:\nOrganization:\nRole:\nPhone:\nWhat you're looking to solve:\n\nThanks!",
  );
const EXPECTATIONS = [
  "A walkthrough of connected learning, projects and placement operations",
  "How learners, faculty, mentors and placement teams work together",
  "A tailored view for universities or enterprises",
  "Clear next steps — no obligation",
] as const;
const demoJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ContactPage",
      "@id": SITE + "/request-demo#webpage",
      url: SITE + "/request-demo",
      name: DEMO_TITLE,
      description: DEMO_DESCRIPTION,
      isPartOf: { "@id": SITE + "/#website" },
      about: { "@id": SITE + "/#organization" },
      inLanguage: "en",
    },
    {
      "@type": "BreadcrumbList",
      "@id": SITE + "/request-demo#breadcrumb",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" },
        { "@type": "ListItem", position: 2, name: "Request a Demo", item: SITE + "/request-demo" },
      ],
    },
  ],
};

export const metadata: Metadata = {
  title: DEMO_TITLE,
  description: DEMO_DESCRIPTION,
  alternates: { canonical: SITE + "/request-demo" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "42 LMS",
    title: DEMO_TITLE,
    description: DEMO_DESCRIPTION,
    url: SITE + "/request-demo",
    images: [{ url: SITE + "/og-image.png", width: 1200, height: 630, alt: "42 LMS" }],
  },
  twitter: {
    card: "summary_large_image",
    title: DEMO_TITLE,
    description: DEMO_DESCRIPTION,
    images: [SITE + "/og-image.png"],
  },
};

export default function RequestDemoPage() {
  return (
    <MarketingLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(demoJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <section aria-labelledby="request-demo-title" className="mx-auto w-full min-w-0 py-14 min-[768px]:py-20">
        <header className="mx-auto mb-10 max-w-[720px] text-center">
          <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-[var(--lms-primary-text)]">
            Request a Demo
          </p>
          <h1 id="request-demo-title" className="mb-[14px] text-[clamp(26px,4vw,38px)] font-semibold leading-[1.2] text-[var(--lms-heading)]">
            See 42 LMS in action
          </h1>
          <p className="text-[clamp(16px,2vw,18px)] leading-[1.6] text-[var(--lms-body-text)]">
            Tell us a little about your organization and we&apos;ll set up a personalized walkthrough.
          </p>
        </header>

        <div className="mx-auto grid max-w-[920px] min-w-0 grid-cols-1 gap-[22px] min-[900px]:grid-cols-2">
          <article className="min-w-0 rounded-[18px] border border-[#dce7e9] bg-white p-[30px]">
            <h2 className="mb-4 mt-2 text-2xl font-semibold text-[var(--lms-heading)]">
              What to expect
            </h2>
            <ul className="m-0 list-none p-0">
              {EXPECTATIONS.map(item => (
                <li key={item} className="flex items-start gap-[10px] py-[7px] text-[15px] leading-6 text-[var(--lms-body-text)]">
                  <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"
                    className="mt-[1px] shrink-0 text-[var(--lms-primary-text)]"
                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m4 12 5 5L20 6" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="min-w-0 rounded-[18px] border border-transparent bg-[#142f3b] p-[30px] text-white">
            <h2 className="mb-4 mt-2 text-2xl font-semibold text-white">Get in touch</h2>
            <p className="leading-6 text-white/85">
              Email us and a specialist will reach out to schedule your demo.
            </p>
            <div className="mt-[18px] flex flex-wrap justify-start gap-3">
              <a href={DEMO_MAILTO}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--lms-control-radius)] bg-[var(--lms-primary)] px-5 py-3 text-center text-sm font-semibold text-white hover:bg-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-white">
                Email us to book a demo
                <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14m-6-6 6 6-6 6" />
                </svg>
              </a>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/75">
              or write to{" "}
              <a href={"mailto:" + DEMO_EMAIL} className="font-semibold text-[#9ee4e8] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                {DEMO_EMAIL}
              </a>
            </p>
          </article>
        </div>
      </section>
    </MarketingLayout>
  );
}
