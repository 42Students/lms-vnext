import MarketingLayout from "@/components/marketing/MarketingLayout";
import {
  Hero,
  Personalization,
  AgentGrid,
  IntegrationsStrip,
  AudienceSplit,
  PlatformPillars,
  LifecycleStrip,
  CtaBand,
} from "@/components/marketing/sections";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": "https://42lms.com/#software",
  name: "42 LMS",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "EducationalApplication",
  operatingSystem: "Web",
  url: "https://42lms.com/",
  description:
    "42 LMS is an autonomous AI platform that builds employable graduates and high-performing workforces — personalized learning, AI assessments, and talent intelligence.",
  publisher: { "@id": "https://42lms.com/#organization" },
  isAccessibleForFree: false,
};

export default function Home() {
  return (
    <MarketingLayout path="/" jsonLd={jsonLd}>
      <Hero />
      <Personalization />
      <AgentGrid />
      <IntegrationsStrip />
      <AudienceSplit />
      <PlatformPillars />
      <LifecycleStrip />
      <CtaBand />
    </MarketingLayout>
  );
}

// Public marketing page — no authenticated dashboard chrome.
Home.nolayout = true;
