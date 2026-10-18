import type {Metadata} from "next";
import {MarketingLayout,MarketingHero,MarketingFeatureGrid,MarketingCta} from "@/components/marketing/marketing-layout";
export const metadata:Metadata={title:"Universities | 42 LMS",description:"Develop employable graduates through learning and placements."};
export default function UniversitiesPage(){
 return <MarketingLayout>
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