import type {Metadata} from "next";
import {MarketingLayout,MarketingHero,MarketingFeatureGrid,MarketingCta} from "@/components/marketing/marketing-layout";
export const metadata:Metadata={title:"Enterprises | 42 LMS",description:"Build stronger workforces through learning and hiring."};
export default function EnterprisesPage(){
 return <MarketingLayout>
  <MarketingHero eyebrow="For enterprises" title="Build stronger workforces through learning and hiring"
    description="Connect capability building, evidence of skills and employer-facing recruitment workflows."/>
  <div className="min-w-0" aria-label="Enterprise capabilities"><MarketingFeatureGrid title="Talent development that connects to work" items={[
   {title:"Skills and learning",description:"Provide structured learning and meaningful ways to demonstrate progress."},
   {title:"Applied projects",description:"Use mentored delivery and feedback to build practical capabilities."},
   {title:"Candidate evaluation",description:"Collaborate with placement teams to review applicants and hiring stages."},
   {title:"Hiring operations",description:"Keep interviews, offers and follow-up connected to candidate records."},
  ]}/></div>
  <MarketingCta title="Support workforce development from learning to hiring"/>
 </MarketingLayout>;
}