import type { Metadata } from "next";
import Link from "next/link";
import {
  MarketingLayout, MarketingHero, MarketingFeatureGrid, MarketingCta,
  marketingPageMetadata,
} from "@/components/marketing/marketing-layout";

const site = "https://42lms.com";
const title = "42 LMS | Talent development";
const description = "Connected learning, projects and placements for universities and enterprises.";
export const metadata: Metadata = marketingPageMetadata("/", title, description);

/** Legacy home uses eight distinct visual bands. The seven agent positions,
 * integration chips and six pillars now describe shipped, non-AI LMS workflows.
 */
const workspaceCapabilities = [
  { title: "Learning", description: "Publish courses, lessons, resources and structured learning activities." },
  { title: "Assessments", description: "Build quizzes, assignments, deadlines and faculty review workflows." },
  { title: "Projects", description: "Run team projects with tasks, milestones, submissions and reviews." },
  { title: "Mentoring", description: "Bring mentors and learners together around project progress and feedback." },
  { title: "Placement preparation", description: "Manage readiness, eligibility and student verification." },
  { title: "Recruitment", description: "Coordinate recruiter requests, drives, rounds and candidate selection." },
  { title: "College operations", description: "Connect academic programs, batches, classes and responsible teams." },
] as const;

const workflowSignals = [
  "Courses", "Lessons", "Quizzes", "Assignments", "Attendance",
  "Student progress", "Team projects", "Mentor reviews", "Placement drives", "Interviews",
] as const;

const pillars = [
  { title: "Learning management", description: "Courses, learning resources, assignments and quizzes in one workspace." },
  { title: "Academic operations", description: "Manage programs, batches, sections, faculty and teaching assignments." },
  { title: "Applied projects", description: "Give teams real tasks, deadlines, reviews and final deliverables." },
  { title: "Mentor collaboration", description: "Help mentors guide teams, give feedback and review progress." },
  { title: "Placement operations", description: "Work through eligibility, verification, drives, rounds and offers." },
  { title: "Reporting and oversight", description: "Review academic and placement progress with scoped role access." },
] as const;

const audiences = [
  {
    title: "Universities",
    eyebrow: "For Universities",
    headline: "Develop Employable Graduates",
    href: "/universities",
    points: [
      "Connect classroom learning, assignments and projects.",
      "Help faculty and mentors follow student progress.",
      "Manage placement eligibility and recruiting workflows.",
    ],
    outcomes: ["Learning Progress", "Project Experience", "Placement Readiness"],
  },
  {
    title: "Enterprises",
    eyebrow: "For Enterprises",
    headline: "Build Stronger Talent Pipelines",
    href: "/enterprises",
    points: [
      "Collaborate with college placement teams.",
      "Review eligible candidates through organized hiring rounds.",
      "Coordinate interviews, selections and offers.",
    ],
    outcomes: ["Candidate Visibility", "Structured Interviews", "Hiring Coordination"],
  },
] as const;

export default function HomeMarketingPage() {
  return <MarketingLayout path="/" pageTitle={title} pageDescription={description}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
      "@context": "https://schema.org", "@type": "SoftwareApplication",
      "@id": site + "/#software", name: "42 LMS",
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "EducationalApplication", operatingSystem: "Web",
      url: site + "/", description,
      publisher: { "@id": site + "/#organization" }, isAccessibleForFree: false,
    }).replace(/</g, "\\u003c") }} />

    {/* 1. Hero: retains legacy two-line headline density and visual console panel. */}
    <MarketingHero eyebrow="✦ Connected talent development"
      title="Build employable graduates. Create stronger talent pipelines."
      description="One connected platform for learning, hands-on projects, mentoring and placements—built for universities and the employers who recruit from them." />

    {/* 2. Personalization: the legacy quote band, without retired AI promises. */}
    <section aria-labelledby="home-personalization" className="relative left-1/2 w-screen -translate-x-1/2 bg-[#f5faf9] px-5 py-16 min-[768px]:py-24">
      <div className="mx-auto max-w-[1180px] text-center">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--lms-primary-text)]">Every individual is different</p>
        <h2 id="home-personalization" className="mx-auto mt-5 max-w-[850px] text-[clamp(1.9rem,4vw,3.25rem)] font-semibold leading-[1.14] tracking-tight text-[var(--lms-heading)]">Why should learning be the same?</h2>
        <p className="mx-auto mt-6 max-w-[750px] text-base leading-7 text-[var(--lms-body-text)]">
          Students learn, practice and demonstrate their skills in different ways. 42 LMS
          keeps their courses, project work, mentor feedback and career preparation
          connected so everyone can follow a clear path forward.
        </p>
      </div>
    </section>

    {/* 3. Seven icon cards keep the original three-column agent-grid density. */}
    <MarketingFeatureGrid title="One connected team developing talent" items={workspaceCapabilities} />

    {/* 4. Legacy tinted chips strip, limited to actual workflow signals. */}
    <section aria-labelledby="home-integrations" className="relative left-1/2 w-screen -translate-x-1/2 bg-[#edf8f8] px-5 py-16 min-[768px]:py-20">
      <div className="mx-auto max-w-[1180px] space-y-6">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--lms-primary-text)]">Connected workflows</p>
        <h2 id="home-integrations" className="max-w-[800px] text-[clamp(1.6rem,3vw,2.25rem)] font-semibold leading-tight text-[var(--lms-heading)]">The signals that matter, in one place</h2>
        <p className="max-w-[780px] text-base leading-7 text-[var(--lms-body-text)]">A shared view of student learning, projects and hiring coordination, grounded in real LMS workflows.</p>
        <ul className="flex flex-wrap gap-3" aria-label="Connected platform workflows">
          {workflowSignals.map(label => <li key={label} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#cee9e9] bg-white px-4 py-2 text-sm font-semibold text-[var(--lms-heading)] shadow-[0_3px_12px_rgba(29,79,88,.04)]">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#0a7c88]" />{label}
          </li>)}
        </ul>
      </div>
    </section>

    {/* 5. Legacy two-audience split: checklist, outcomes pills and dark second half. */}
    <section aria-labelledby="home-audiences" className="relative left-1/2 w-screen -translate-x-1/2 bg-white px-5 py-16 min-[768px]:py-20">
      <div className="mx-auto max-w-[1180px] space-y-9">
        <div className="space-y-3 text-center">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--lms-primary-text)]">Who it&apos;s for</p>
          <h2 id="home-audiences" className="text-[clamp(1.7rem,3vw,2.4rem)] font-semibold text-[var(--lms-heading)]">One platform. Two outcomes.</h2>
          <p className="text-[var(--lms-body-text)]">Connect the people developing talent with the people hiring it.</p>
        </div>
        <div className="grid gap-5 min-[768px]:grid-cols-2">
          {audiences.map((audience, index) => <article key={audience.title}
            className={"flex min-w-0 flex-col rounded-[22px] border p-6 shadow-[0_8px_32px_rgba(21,73,83,.06)] min-[768px]:p-9 " +
              (index === 1 ? "border-[#164e5b] bg-[#153b4d] text-white" : "border-[#dce9e9] bg-white text-[var(--lms-heading)]")}>
            <p className={"text-xs font-bold uppercase tracking-[.14em] " + (index === 1 ? "text-[#9ee4e8]" : "text-[var(--lms-primary-text)]")}>{audience.eyebrow}</p>
            <h3 className="mt-3 text-2xl font-semibold leading-tight">{audience.headline}</h3>
            <ul className="mt-6 flex-1 space-y-4">
              {audience.points.map(point => <li key={point} className="flex items-start gap-3 text-sm leading-6">
                <span aria-hidden="true" className={"mt-0.5 font-bold " + (index === 1 ? "text-[#8bdddf]" : "text-[var(--lms-primary-text)]")}>✓</span>
                <span>{point}</span>
              </li>)}
            </ul>
            <ul aria-label={audience.title + " outcomes"} className="mt-7 flex flex-wrap gap-2">
              {audience.outcomes.map(outcome => <li key={outcome} className={"rounded-full px-3 py-1.5 text-xs font-semibold " +
                (index === 1 ? "bg-white/15 text-white" : "bg-[#e8f6f5] text-[#0b6976]")}>{outcome}</li>)}
            </ul>
            <Link href={audience.href} className={"mt-7 inline-flex min-h-11 self-start items-center justify-center rounded-full px-5 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 " +
              (index === 1 ? "bg-white text-[#154758] hover:bg-[#ebf8f8] focus-visible:outline-white" : "border border-[#0a7c88] text-[#0a7c88] hover:bg-[#e8f6f5]")}>
              For {audience.title}<span aria-hidden="true" className="ml-2">↗</span>
            </Link>
          </article>)}
        </div>
      </div>
    </section>

    {/* 6. Six original pillar slots, now tied only to implemented modules. */}
    <MarketingFeatureGrid title="Everything you need to develop talent" items={pillars} />

    {/* 7. Horizontal lifecycle with step arrows (four approved non-AI stages). */}
    <section aria-labelledby="home-journey-heading" className="relative left-1/2 w-screen -translate-x-1/2 bg-white px-5 py-16 min-[768px]:py-20">
      <div className="mx-auto max-w-[1180px] space-y-8">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--lms-primary-text)]">Continuous talent development</p>
        <h2 id="home-journey-heading" className="text-[clamp(1.6rem,3vw,2.25rem)] font-semibold text-[var(--lms-heading)]">Learn. Build. Demonstrate. Get hired.</h2>
        <p className="max-w-[760px] leading-7 text-[var(--lms-body-text)]">Follow the learner journey from academic work and project experience through to recruitment.</p>
        <ol className="flex flex-wrap items-center gap-3 rounded-[18px] border border-[#e0ebeb] bg-[#f9fcfc] p-5">
          {["Learn", "Build", "Demonstrate", "Get hired"].map((step,index) => <li key={step} className="inline-flex min-h-11 items-center gap-3">
            <span className="rounded-full border border-[#c9e5e4] bg-white px-5 py-3 text-sm font-bold text-[#0a6572]">{step}</span>
            {index < 3 ? <span aria-hidden="true" className="text-xl text-[#0a7c88]">→</span> : null}
          </li>)}
        </ol>
      </div>
    </section>

    {/* 8. Dark gradient CTA with the original pair of destination actions. */}
    <MarketingCta title="Build the next generation of talent"
      subline="See how 42 LMS connects learning, applied experience and placement operations in one platform." />
  </MarketingLayout>;
}
