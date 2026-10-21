import MarketingLayout from "@/components/marketing/MarketingLayout";
import Icon from "@/components/marketing/icons";
import { DEMO_MAILTO, BRAND } from "@/components/marketing/data";
import s from "@/components/marketing/marketing.module.scss";

const EXPECT = [
  "A walkthrough of the autonomous AI talent platform",
  "How AI assessments and skills intelligence work for your context",
  "A tailored view for universities or enterprises",
  "Clear next steps — no obligation",
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ContactPage",
      "@id": "https://42lms.com/request-demo#webpage",
      url: "https://42lms.com/request-demo",
      name: "Request a Demo — 42 LMS",
      description:
        "See how 42 LMS builds employable graduates and high-performing workforces. Request a personalized demo.",
      isPartOf: { "@id": "https://42lms.com/#website" },
      about: { "@id": "https://42lms.com/#organization" },
      inLanguage: "en",
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://42lms.com/request-demo#breadcrumb",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://42lms.com/" },
        { "@type": "ListItem", position: 2, name: "Request a Demo", item: "https://42lms.com/request-demo" },
      ],
    },
  ],
};

export default function RequestDemo() {
  return (
    <MarketingLayout
      path="/request-demo"
      title="Request a Demo — 42 LMS"
      description="See how 42 LMS builds employable graduates and high-performing workforces. Request a personalized demo."
      jsonLd={jsonLd}
    >
      <section className={s.section}>
        <div className={s.container}>
          <div className={s.sectionHead}>
            <span className={s.eyebrow}>Request a Demo</span>
            <h1 className={s.sectionTitle}>See 42 LMS in action</h1>
            <p className={s.sectionLede}>
              Tell us a little about your organization and we&apos;ll set up a personalized walkthrough.
            </p>
          </div>

          <div className={s.audience} style={{ maxWidth: 920, margin: "0 auto" }}>
            <article className={s.audienceCard}>
              <h2 className={s.audienceTitle}>What to expect</h2>
              <ul className={s.checkList}>
                {EXPECT.map((p) => (
                  <li key={p} className={s.checkItem}>
                    <Icon name="check" /> <span>{p}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className={`${s.audienceCard} ${s.audienceCardDark}`}>
              <h2 className={s.audienceTitle}>Get in touch</h2>
              <p style={{ color: "rgba(255,255,255,0.82)", marginTop: 0 }}>
                Email us and a specialist will reach out to schedule your demo.
              </p>
              <div className={s.ctaActions} style={{ justifyContent: "flex-start", marginTop: 18 }}>
                <a href={DEMO_MAILTO} className={`${s.btn} ${s.btnPrimary} ${s.btnLg}`}>
                  Email us to book a demo <Icon name="arrow" />
                </a>
              </div>
              <p style={{ color: "rgba(255,255,255,0.7)", marginTop: 16, fontSize: 14 }}>
                or write to{" "}
                <a href={`mailto:${BRAND.demoEmail}`} style={{ color: "#9ee4e8" }}>
                  {BRAND.demoEmail}
                </a>
              </p>
            </article>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

RequestDemo.nolayout = true;
