import type { Metadata } from "next";
import Link from "next/link";
import { MarketingLayout, MarketingHero, MarketingFeatureGrid, MarketingCta } from "@/components/marketing/marketing-layout";
export const metadata: Metadata = {title:"42 LMS | Talent development",description:"Connected learning, projects and placements for universities and enterprises."};
export default function HomeMarketingPage() {
 return <MarketingLayout>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({"@context":"https://schema.org","@type":"SoftwareApplication",name:"42 LMS",applicationCategory:"EducationalApplication",operatingSystem:"Web"})}} />
  <MarketingHero eyebrow="Connected talent development" title="One connected platform for learning, projects and placements"
    description="Help students build skills, deliver projects, get mentored, and connect to employers. One experience for every role." />
  <MarketingFeatureGrid title="A connected campus and employer team" items={[
    {title:"Learning",description:"Courses, guided paths, quizzes, assignments and learning progress."},
    {title:"Projects",description:"Team projects with mentors, tasks, reviews and real delivery."},
    {title:"Placement",description:"Eligibility, opportunities, screening, interviews and offers."},
    {title:"Faculty",description:"Manage academic programs, courses, cohorts and progress."},
    {title:"Mentor",description:"Guide project teams and give timely actionable feedback."},
    {title:"HR and recruiters",description:"Collaborate with placement teams through a connected hiring workflow."}
  ]}/>
  <section className="grid min-w-0 gap-4 sm:grid-cols-2" aria-label="Who the platform serves">
   <Link href="/universities" className="group flex min-h-11 min-w-0 flex-col justify-center rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5 transition-colors hover:border-[var(--lms-teal-deep)] hover:bg-primary-subtle/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)] sm:p-6"><h2 className="break-words text-xl font-semibold">Universities</h2><p className="mt-2 text-body">Develop employable graduates with integrated learning and placements.</p></Link>
   <Link href="/enterprises" className="group flex min-h-11 min-w-0 flex-col justify-center rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5 transition-colors hover:border-[var(--lms-teal-deep)] hover:bg-primary-subtle/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)] sm:p-6"><h2 className="break-words text-xl font-semibold">Enterprises</h2><p className="mt-2 text-body">Build talent pipelines with visible skills and practical experience.</p></Link>
  </section>
  <MarketingFeatureGrid title="Connected platform pillars" items={[
    {title:"Personalised learning",description:"Give each learner a clear next step."},
    {title:"Integrations",description:"Bring academic, learner and employer workflows together."},
    {title:"Applied experience",description:"Connect theory and practice through projects."},
    {title:"Career readiness",description:"Take learners from preparation through hiring."}
  ]}/>
  <section className="min-w-0 space-y-4"><h2 className="text-2xl font-semibold">One continuous journey</h2>
   <ol className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">{["Learn","Build","Demonstrate","Get hired"].map((step,i)=><li className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4 sm:p-6" key={step}><span className="text-sm text-primary-text">0{i+1}</span><p className="mt-2 font-semibold">{step}</p></li>)}</ol>
  </section>
  <MarketingCta title="See how 42 LMS connects the talent journey" />
 </MarketingLayout>;
}