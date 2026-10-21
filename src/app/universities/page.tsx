
import {MarketingLayout,MarketingHero,MarketingFeatureGrid,MarketingCta,marketingPageMetadata} from "@/components/marketing/marketing-layout";
const title="For Universities — 42 LMS";
const description="Develop employable graduates: evaluate performance across exams, assignments, projects, and interviews, identify gaps early, and improve career readiness.";
// The shared marketing layout emits the Organization, WebSite, WebPage and
// BreadcrumbList JSON-LD graph when the route's canonical metadata is supplied.
export const metadata=marketingPageMetadata("/universities",title,description);
export default function UniversitiesPage(){
 return <MarketingLayout path="/universities" pageTitle={title} pageDescription={description}>
  <MarketingHero eyebrow="For universities" title="Develop employable graduates through learning and placements"
   description="Bring academics, applied projects and campus placements together to strengthen student outcomes."/>
  <div className="min-w-0" aria-label="Campus roles"><MarketingFeatureGrid title="For the entire campus" items={[
    {title:"Students",description:"Understand what to learn next, build practical evidence and prepare for hiring."},
    {title:"Faculty",description:"Create learning experiences, track progress and coordinate assessments."},
    {title:"Mentors",description:"Help student teams move from planning through project delivery."},
    {title:"Placement teams",description:"Work with employers and students through recruitment, selection and offers."},
    {title:"Administrators",description:"Connect academic structure, learner rosters and placement operations."},
  ]}/></div>
  <MarketingCta title="Prepare graduates for meaningful opportunities"/>
 </MarketingLayout>;
}