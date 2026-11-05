import {MarketingLayout,MarketingHero,MarketingFeatureGrid,MarketingCta,marketingPageMetadata} from "@/components/marketing/marketing-layout";
import { Heading } from "@/components/ui/heading";
const title="For Universities — 42 LMS";
const description="Develop employable graduates: evaluate performance across exams, assignments, projects, and interviews, identify gaps early, and improve career readiness.";
// Legacy AI-only claims are intentionally retired. Layout/card/badge cardinality
// remains a faithful campus-oriented substitute using implemented LMS areas.
// Shared metadata already includes canonical, OG and Twitter summary fields.
const shared=marketingPageMetadata("/universities",title,description);
export const metadata={
  ...shared,
  openGraph:{...shared.openGraph,images:[{
    url:"/assets/images/legacy-42lms-logo.svg",width:151,height:37,
    type:"image/svg+xml",alt:"42 LMS for Universities",
  }]},
  twitter:{...shared.twitter,images:["/assets/images/legacy-42lms-logo.svg"]},
};
const capabilities=[
  {title:"Academics",description:"Manage departments, programs, batches, classes and course mappings in one college workspace."},
  {title:"Learning",description:"Deliver lessons, learning resources, assignments and quizzes to the right classes."},
  {title:"Assessment",description:"Track attendance, grades, submissions and completion without opaque AI scoring."},
  {title:"Projects",description:"Connect learners, mentors, milestones, tasks and final project deliveries."},
  {title:"Career readiness",description:"Bring verified profiles, placement eligibility and application evidence together."},
  {title:"Recruitment",description:"Coordinate hiring drives, selection rounds, interviews, companies and offers."},
  {title:"Administration",description:"Use membership-aware access, audit records and college-level operational controls."},
] as const;
const outcomes=[
  "Connected learning","Practical project evidence","Clear progress visibility",
  "Coordinated placements","College-owned access",
] as const;
const journey=[
  {label:"Set up",description:"Programs, classes and college roles"},
  {label:"Teach",description:"Courses, lessons and resources"},
  {label:"Assess",description:"Assignments, attendance and quizzes"},
  {label:"Build",description:"Mentored projects and milestones"},
  {label:"Prepare",description:"Eligibility, profiles and readiness"},
  {label:"Recruit",description:"Drives, interviews and offers"},
] as const;
export default function UniversitiesPage(){
 return <MarketingLayout path="/universities" pageTitle={title} pageDescription={description}>
  <MarketingHero eyebrow="For Universities" title="Develop employable graduates through learning and placements"
    description="Bring academics, applied projects and campus placements together to strengthen student outcomes."/>
  <section aria-labelledby="university-audience-heading"
    className="relative left-1/2 w-screen -translate-x-1/2 bg-surface py-14 md:py-20">
    <div className="mx-auto grid max-w-[1180px] gap-8 px-5 lg:grid-cols-[1.05fr_.95fr] lg:gap-12">
      <div className="min-w-0 space-y-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--lms-primary-text)]">Built for universities</p>
        <Heading level={2} id="university-audience-heading"
          className="text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.25] text-[var(--lms-heading)]">
          Support the complete student journey
        </Heading>
        <p className="max-w-xl text-base leading-7 text-[var(--lms-body-text)]">
          Academic teams and placement cells work with the same college-scoped learners and verified role permissions.
        </p>
      </div>
      <div className="min-w-0 rounded-[18px] border border-[var(--lms-canvas-border)] bg-[var(--lms-primary-subtle)] p-6 sm:p-8">
        <Heading level={3} size="lg" className="text-[var(--lms-heading)]">What your campus can coordinate</Heading>
        <ul className="mt-5 grid gap-4 text-sm text-[var(--lms-body-text)]">
          {["Academic setup and learner enrollment",
             "Courses, assessments and attendance",
             "Mentored projects and practical evidence",
             "Placement drives, interviews and offers"].map(text=>
            <li key={text} className="flex items-start gap-3">
              <span aria-hidden="true" className="font-bold text-[var(--lms-primary-text)]">✓</span>
              <span>{text}</span>
            </li>)}
        </ul>
      </div>
    </div>
    <ul aria-label="Campus outcomes"
      className="mx-auto mt-8 flex max-w-[1180px] flex-wrap gap-3 px-5">
      {outcomes.map(outcome=><li key={outcome}
        className="rounded-full border border-[var(--lms-canvas-border)] bg-[var(--lms-primary-subtle)] px-4 py-2 text-sm font-semibold text-[var(--lms-primary-text)]">
        {outcome}
      </li>)}
    </ul>
  </section>
  <div className="min-w-0" aria-label="Campus capabilities">
    <MarketingFeatureGrid title="For the entire campus" items={capabilities}/>
  </div>
  <section aria-labelledby="university-journey-heading"
    className="relative left-1/2 w-screen -translate-x-1/2 bg-[var(--lms-primary-subtle)] py-14 md:py-20">
    <div className="mx-auto max-w-[1180px] space-y-7 px-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--lms-primary-text)]">Connected journey</p>
      <Heading level={2} id="university-journey-heading"
        className="text-[clamp(1.75rem,3vw,2.25rem)] text-[var(--lms-heading)]">
        From classroom to career
      </Heading>
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {journey.map((stage,index)=><li key={stage.label}
          className="relative flex min-w-0 items-start gap-4 rounded-[14px] border border-[var(--lms-canvas-border)] bg-surface p-5">
          <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--lms-primary-subtle)] font-bold text-[var(--lms-primary-text)]">
            {index+1}
          </span>
          <div className="min-w-0">
            <Heading level={3} className="text-[var(--lms-heading)]">{stage.label}</Heading>
            <p className="mt-1 text-sm leading-6 text-[var(--lms-body-text)]">{stage.description}</p>
          </div>
          {index<journey.length-1?<span aria-hidden="true"
            className="absolute -right-3 top-1/2 z-(--lms-z-raised) hidden text-xl text-[var(--lms-primary-text)] lg:block">→</span>:null}
        </li>)}
      </ol>
    </div>
  </section>
  <MarketingCta title="Prepare graduates for meaningful opportunities"
    subline="Connect teaching, progress and placements with clear responsibilities across the college."/>
 </MarketingLayout>;
}
