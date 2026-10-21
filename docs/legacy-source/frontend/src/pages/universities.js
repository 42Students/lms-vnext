import MarketingLayout from "@/components/marketing/MarketingLayout";
import { PageHero, AudienceDetail, AgentGrid, LifecycleStrip, CtaBand } from "@/components/marketing/sections";
import { UNIVERSITIES } from "@/components/marketing/data";

const DESC =
  "Develop employable graduates: evaluate performance across exams, assignments, projects, and interviews, identify gaps early, and improve career readiness.";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://42lms.com/universities#webpage",
      url: "https://42lms.com/universities",
      name: "For Universities — 42 LMS",
      description: DESC,
      isPartOf: { "@id": "https://42lms.com/#website" },
      about: { "@id": "https://42lms.com/#organization" },
      inLanguage: "en",
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://42lms.com/universities#breadcrumb",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://42lms.com/" },
        { "@type": "ListItem", position: 2, name: "For Universities", item: "https://42lms.com/universities" },
      ],
    },
  ],
};

export default function Universities() {
  return (
    <MarketingLayout path="/universities" title="For Universities — 42 LMS" description={DESC} jsonLd={jsonLd}>
      <PageHero
        eyebrow="For Universities"
        title="Develop Employable Graduates with AI"
        lede="Evaluate performance across exams, assignments, projects, and interviews, identify gaps early, and improve career readiness."
      />
      <AudienceDetail data={UNIVERSITIES} />
      <AgentGrid
        eyebrow="How it helps"
        title="AI agents that support every student"
        lede="From tutoring to assessment to career guidance — personalized for each learner."
      />
      <LifecycleStrip />
      <CtaBand
        title="Graduate students who are ready for work"
        sub="See how 42 LMS improves student outcomes, employability, and placement readiness."
      />
    </MarketingLayout>
  );
}

Universities.nolayout = true;
