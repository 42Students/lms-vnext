import type { Metadata } from "next";
import { MarketingLayout, MarketingHero, MarketingFeatureGrid, MarketingCta } from "@/components/marketing/marketing-layout";
export const metadata: Metadata = {title:"Platform | 42 LMS",description:"One connected platform for learning, projects and placements."};
export default function PlatformMarketingPage() {
 return <MarketingLayout>
  <MarketingHero eyebrow="42 LMS platform" title="One connected platform for learning, projects and placements."
    description="A connected place for learning, guided projects, assessments, recruitment, and workforce development."/>
  <MarketingFeatureGrid title="Every role has a purpose-built workspace" items={[
   {title:"Learner workspace",description:"Courses, skills, assessments, career planning and project work."},
   {title:"Faculty workspace",description:"Academic content, assignments, progress and course delivery."},
   {title:"Mentor workspace",description:"Review milestones, guide teams and track outcomes."},
   {title:"Placement workspace",description:"Opportunities, candidates, interviews and hiring decisions."},
   {title:"HR workspace",description:"Collaborate with placement teams on applications and selection."},
   {title:"Administrator",description:"Bring academic structure and people management into one place."}
  ]}/>
  <MarketingFeatureGrid title="Connected platform pillars" items={[
   {title:"Learning",description:"Courses, assessments and academic progress."},
   {title:"Projects",description:"Practical teamwork, mentoring and portfolio evidence."},
   {title:"Placements",description:"From candidate eligibility through offers and joining."},
   {title:"Integrations",description:"Reduce handoffs between academic and hiring workflows."}
  ]}/>
  <section className="min-w-0 space-y-3 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4 sm:p-6"><h2 className="text-2xl font-semibold">A complete talent lifecycle</h2>
   <p className="break-words text-base leading-7 text-body">Discover needs → Learn → Build → Demonstrate → Interview → Grow.</p></section>
  <MarketingCta title="Explore the platform with our team" />
 </MarketingLayout>;
}