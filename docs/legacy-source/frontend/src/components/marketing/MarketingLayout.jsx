import Head from "next/head";
import s from "./marketing.module.scss";
import MarketingHeader from "./MarketingHeader";
import MarketingFooter from "./MarketingFooter";

const SITE = "https://42lms.com";
const DEFAULT_DESC =
  "42 LMS is an autonomous AI platform that builds employable graduates and high-performing workforces with personalized learning, AI assessments, and talent intelligence.";

// Site-wide entity graph (Organization + WebSite) — emitted on every marketing page.
// No `sameAs` (footer socials are placeholders) and no WebSite SearchAction (no on-site search).
const orgWebsiteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE}/#organization`,
      name: "42 LMS",
      legalName: "JRSPF Technologies Pvt. Ltd.",
      url: `${SITE}/`,
      logo: {
        "@type": "ImageObject",
        "@id": `${SITE}/#logo`,
        url: `${SITE}/assets/images/login/logoo.png`,
        width: 250,
        height: 250,
        caption: "42 LMS",
      },
      image: { "@id": `${SITE}/#logo` },
      description:
        "42 LMS is an autonomous AI platform that builds employable graduates and high-performing workforces — personalized learning, AI assessments, and talent intelligence.",
      contactPoint: {
        "@type": "ContactPoint",
        email: "hello@42lms.com",
        contactType: "sales",
      },
      // sameAs: [],  // TODO: add real X / LinkedIn / Facebook / Instagram profile URLs (footer links are placeholders).
    },
    {
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      url: `${SITE}/`,
      name: "42 LMS",
      description: "The AI Talent & Workforce Operating System",
      publisher: { "@id": `${SITE}/#organization` },
      inLanguage: "en",
    },
  ],
};

export default function MarketingLayout({
  children,
  title = "42 LMS — The AI Talent & Workforce Operating System",
  description = DEFAULT_DESC,
  path = "/",
  jsonLd,
  imageAlt = "42 LMS — autonomous AI talent and workforce platform",
}) {
  const canonical = `${SITE}${path === "/" ? "" : path}`;
  const ogImage = `${SITE}/og-image.png`;

  return (
    <div className={s.page}>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta
          name="robots"
          content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="canonical" href={canonical} />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:site_name" content="42 LMS" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:secure_url" content={ogImage} />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={imageAlt} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
        <meta name="twitter:image:alt" content={imageAlt} />

        {/* Structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgWebsiteJsonLd) }}
        />
        {jsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        )}
      </Head>

      <a href="#main-content" className={s.skipLink}>
        Skip to main content
      </a>
      <MarketingHeader />
      <main id="main-content">{children}</main>
      <MarketingFooter />
    </div>
  );
}
