import type { Metadata } from "next";
import { MarketingLayout, MarketingHero, MarketingFeatureGrid, MarketingCta } from "@/components/marketing/marketing-layout";
export const metadata: Metadata = {title:"Platform | 42 LMS",description:"One autonomous AI platform for talent and workforce development."};
export default function PlatformMarketingPage() {
 return <MarketingLayout>
  <MarketingHero eyebrow="42 LMS platform" title="One autonomous AI platform for talent and workforce development"
    description="A connected place for learning, guided projects, assessments, recruitment, and workforce development."/>
  <MarketingFeatureGrid title="Every role has a purpose-built workspace" items={[
   {title:"Learner agent",description:"Courses, skills, assessments, career planning and project work."},
   {title:"Faculty agent",description:"Academic content, assignments, progress and course delivery."},
   {title:"Mentor agent",description:"Review milestones, guide teams and track outcomes."},
   {title:"Placement agent",description:"Opportunities, candidates, interviews and hiring decisions."},
   {title:"HR agent",description:"Collaborate with placement teams on applications and selection."},
   {title:"Administrator",description:"Bring academic structure and people management into one place."}
  ]}/>
  <MarketingFeatureGrid title="Connected platform pillars" items={[
   {title:"Learning",description:"Courses, assessments and personalized guidance."},
   {title:"Projects",description:"Practical teamwork, mentoring and portfolio evidence."},
   {title:"Placements",description:"From candidate eligibility through offers and joining."},
   {title:"Integrations",description:"Reduce handoffs between academic and hiring workflows."}
  ]}/>
  <section className="space-y-3"><h2 className="text-2xl font-semibold">A complete talent lifecycle</h2>
   <p className="text-body">Discover needs → Learn → Build → Demonstrate → Interview → Grow.</p></section>
  <MarketingCta title="Explore the platform with our team" />
 </MarketingLayout>;
}