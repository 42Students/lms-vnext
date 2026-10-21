import MarketingLayout from "@/components/marketing/MarketingLayout";
import {
  PageHero,
  AgentGrid,
  PlatformPillars,
  IntegrationsStrip,
  LifecycleStrip,
  CtaBand,
} from "@/components/marketing/sections";

const DESC =
  "One autonomous AI platform: AI assessments, skills intelligence, personalized learning, knowledge intelligence, AI agents, and analytics.";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://42lms.com/platform#webpage",
      url: "https://42lms.com/platform",
      name: "Platform — 42 LMS",
      description: DESC,
      isPartOf: { "@id": "https://42lms.com/#website" },
      about: { "@id": "https://42lms.com/#organization" },
      inLanguage: "en",
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://42lms.com/platform#breadcrumb",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://42lms.com/" },
        { "@type": "ListItem", position: 2, name: "Platform", item: "https://42lms.com/platform" },
      ],
    },
  ],
};

export default function Platform() {
  return (
    <MarketingLayout path="/platform" title="Platform — 42 LMS" description={DESC} jsonLd={jsonLd}>
      <PageHero
        eyebrow="The platform"
        title="One autonomous AI platform for talent and workforce development"
        lede="AI assessments, skills intelligence, personalized learning, knowledge intelligence, AI agents, and analytics — working together to continuously develop every individual."
      />
      <AgentGrid lede="42 LMS deploys specialized AI agents that work together to continuously develop every individual." />
      <PlatformPillars />
      <IntegrationsStrip />
      <LifecycleStrip />
      <CtaBand />
    </MarketingLayout>
  );
}

Platform.nolayout = true;
