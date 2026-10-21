import MarketingLayout from "@/components/marketing/MarketingLayout";
import { PageHero, AudienceDetail, IntegrationsStrip, PlatformPillars, CtaBand } from "@/components/marketing/sections";
import { ENTERPRISES } from "@/components/marketing/data";

const DESC =
  "Build high-performing workforces: connect GitHub, Slack, Teams, CRM, ERP and HRMS, understand capabilities in real time, and close capability gaps automatically.";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://42lms.com/enterprises#webpage",
      url: "https://42lms.com/enterprises",
      name: "For Enterprises — 42 LMS",
      description: DESC,
      isPartOf: { "@id": "https://42lms.com/#website" },
      about: { "@id": "https://42lms.com/#organization" },
      inLanguage: "en",
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://42lms.com/enterprises#breadcrumb",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://42lms.com/" },
        { "@type": "ListItem", position: 2, name: "For Enterprises", item: "https://42lms.com/enterprises" },
      ],
    },
  ],
};

export default function Enterprises() {
  return (
    <MarketingLayout path="/enterprises" title="For Enterprises — 42 LMS" description={DESC} jsonLd={jsonLd}>
      <PageHero
        eyebrow="For Enterprises"
        title="Build High-Performing Workforces with AI"
        lede="Connect GitHub, Slack, Teams, CRM, ERP and HRMS, understand capabilities in real time, and close capability gaps automatically."
      />
      <AudienceDetail data={ENTERPRISES} />
      <IntegrationsStrip />
      <PlatformPillars />
      <CtaBand
        title="Turn workforce capability into business performance"
        sub="See how 42 LMS drives productivity, faster onboarding, and stronger workforce capabilities."
      />
    </MarketingLayout>
  );
}

Enterprises.nolayout = true;
