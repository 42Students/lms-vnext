import type { Metadata } from "next";
import {
  MarketingLayout, MarketingHero, MarketingFeatureGrid, MarketingCta,
  marketingPageMetadata,
} from "@/components/marketing/marketing-layout";
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";

const site = "https://42lms.com";
// The legacy AI-title has been intentionally retired with the AI features.
const title = "42 LMS — Learning, Projects and Placements";
const description = "Connected learning, projects and placements for universities and enterprises.";
export const metadata: Metadata = {...marketingPageMetadata("/", title, description),title:{absolute:title}};

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

    <nav aria-label="Explore 42 LMS by audience"
     className="flex min-w-0 flex-col gap-3 border-b border-[var(--lms-canvas-border)] py-6 sm:flex-row sm:flex-wrap sm:items-center">
     <p className="text-sm font-semibold text-[var(--lms-heading)] sm:mr-2">Find your path</p>
     <TextLink variant="bare" href="/universities" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-4 py-3 text-sm font-semibold text-[var(--lms-primary-text)] focus-ring sm:w-auto">For Universities</TextLink>
     <TextLink variant="bare" href="/enterprises" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-4 py-3 text-sm font-semibold text-[var(--lms-primary-text)] focus-ring sm:w-auto">For Enterprises</TextLink>
     <TextLink variant="bare" href="#home-journey" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-4 py-3 text-sm font-semibold text-[var(--lms-primary-text)] focus-ring sm:w-auto">See the learner journey</TextLink>
    </nav>

    {/* 2. Personalization: the legacy quote band, without retired AI promises. */}
    <section aria-labelledby="home-personalization" className="relative left-1/2 w-screen -translate-x-1/2 bg-[color:var(--lms-neutral-50)] px-5 py-16 md:py-24">
      <div className="mx-auto max-w-[1180px] text-center">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--lms-primary-text)]">Every individual is different</p>
        <Heading level={2} id="home-personalization" className="mx-auto mt-5 max-w-[852px] text-3xl md:text-5xl leading-[1.25] tracking-tight text-[var(--lms-heading)]">Why should learning be the same?</Heading>
        <p className="mx-auto mt-6 max-w-[752px] text-base leading-7 text-[var(--lms-body-text)]">
          Students learn, practice and demonstrate their skills in different ways. 42 LMS
          keeps their courses, project work, mentor feedback and career preparation
          connected so everyone can follow a clear path forward.
        </p>
      </div>
    </section>

    {/* 3. Seven icon cards keep the original three-column agent-grid density. */}
    <MarketingFeatureGrid title="One connected team developing talent" items={workspaceCapabilities} />

    {/* 4. Legacy tinted chips strip, limited to actual workflow signals. */}
    <section aria-labelledby="home-integrations" className="relative left-1/2 w-screen -translate-x-1/2 bg-[color:var(--lms-primary-subtle)] px-5 py-16 md:py-20">
      <div className="mx-auto max-w-[1180px] space-y-6">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--lms-primary-text)]">Connected workflows</p>
        <Heading level={2} id="home-integrations" className="max-w-[800px] text-2xl md:text-3xl leading-tight text-[var(--lms-heading)]">The signals that matter, in one place</Heading>
        <p className="max-w-[780px] text-base leading-7 text-[var(--lms-body-text)]">A shared view of student learning, projects and hiring coordination, grounded in real LMS workflows.</p>
        <ul className="flex flex-wrap gap-3" aria-label="Connected platform workflows">
          {workflowSignals.map(label => <li key={label} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[color:var(--lms-border)] bg-surface px-4 py-2 text-sm font-semibold text-[var(--lms-heading)] shadow-(--lms-elevation-2)">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[color:var(--lms-button-primary)]" />{label}
          </li>)}
        </ul>
      </div>
    </section>

    {/* 5. Legacy two-audience split: checklist, outcomes pills and dark second half. */}
    <section aria-labelledby="home-audiences" className="relative left-1/2 w-screen -translate-x-1/2 bg-surface px-5 py-16 md:py-20">
      <div className="mx-auto max-w-[1180px] space-y-9">
        <div className="space-y-3 text-center">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--lms-primary-text)]">Who it&apos;s for</p>
          <Heading level={2} id="home-audiences" className="text-2xl md:text-3xl text-[var(--lms-heading)]">One platform. Two outcomes.</Heading>
          <p className="text-[var(--lms-body-text)]">Connect the people developing talent with the people hiring it.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {audiences.map((audience, index) => <article key={audience.title}
            className={"flex min-w-0 flex-col rounded-[20px] border p-6 shadow-(--lms-elevation-3) md:p-9 " +
              (index === 1 ? "border-[color:var(--lms-button-primary-hover)] bg-[color:var(--lms-brand-dark)] text-[color:var(--lms-on-primary)]" : "border-[color:var(--lms-border)] bg-surface text-[var(--lms-heading)]")}>
            <p className={"text-xs font-bold uppercase tracking-[.16em] " + (index === 1 ? "text-[color:var(--lms-primary-light)]" : "text-[var(--lms-primary-text)]")}>{audience.eyebrow}</p>
            <Heading level={3} size="2xl" className="mt-3 leading-tight">{audience.headline}</Heading>
            <ul className="mt-6 flex-1 space-y-4">
              {audience.points.map(point => <li key={point} className="flex items-start gap-3 text-sm leading-6">
                <span aria-hidden="true" className={"mt-0.5 font-bold " + (index === 1 ? "text-[color:var(--lms-primary-light)]" : "text-[var(--lms-primary-text)]")}>✓</span>
                <span>{point}</span>
              </li>)}
            </ul>
            <ul aria-label={audience.title + " outcomes"} className="mt-7 flex flex-wrap gap-2">
              {audience.outcomes.map(outcome => <li key={outcome} className={"rounded-full px-3 py-1.5 text-xs font-semibold " +
                (index === 1 ? "bg-[color:color-mix(in_srgb,var(--lms-white)_15%,transparent)] text-[color:var(--lms-on-primary)]" : "bg-[color:var(--lms-primary-subtle)] text-[color:var(--lms-button-primary-hover)]")}>{outcome}</li>)}
            </ul>
            <TextLink variant="bare" href={audience.href} className={"mt-7 inline-flex min-h-11 self-start items-center justify-center rounded-full px-5 font-semibold focus-ring " +
              (index === 1 ? "bg-surface text-[color:var(--lms-brand-dark)] hover:bg-[color:var(--lms-primary-subtle)] focus-ring-on-dark" : "border border-[color:var(--lms-button-primary)] text-[color:var(--lms-button-primary)] hover:bg-[color:var(--lms-primary-subtle)]")}>
              For {audience.title}<span aria-hidden="true" className="ml-2">↗</span>
            </TextLink>
          </article>)}
        </div>
      </div>
    </section>

    {/* 6. Six original pillar slots, now tied only to implemented modules. */}
    <MarketingFeatureGrid title="Everything you need to develop talent" items={pillars} />

    {/* 7. Horizontal lifecycle with step arrows (four approved non-AI stages). */}
    <section id="home-journey" aria-labelledby="home-journey-heading" className="relative left-1/2 w-screen -translate-x-1/2 scroll-mt-24 bg-surface px-5 py-16 md:py-20">
      <div className="mx-auto max-w-[1180px] space-y-8">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--lms-primary-text)]">Continuous talent development</p>
        <Heading level={2} id="home-journey-heading" className="text-2xl md:text-3xl text-[var(--lms-heading)]">Learn. Build. Demonstrate. Get hired.</Heading>
        <p className="max-w-[760px] leading-7 text-[var(--lms-body-text)]">Follow the learner journey from academic work and project experience through to recruitment.</p>
        <ol className="flex flex-wrap items-center gap-3 rounded-[18px] border border-[color:var(--lms-border)] bg-[color:var(--lms-neutral-50)] p-5">
          {["Learn", "Build", "Demonstrate", "Get hired"].map((step,index) => <li key={step} className="inline-flex min-h-11 items-center gap-3">
            <span className="rounded-full border border-[color:var(--lms-neutral-300)] bg-surface px-5 py-3 text-sm font-bold text-[color:var(--lms-button-primary-hover)]">{step}</span>
            {index < 3 ? <span aria-hidden="true" className="text-xl text-[color:var(--lms-button-primary)]">→</span> : null}
          </li>)}
        </ol>
      </div>
    </section>

    {/* 8. Dark gradient CTA with the original pair of destination actions. */}
    <MarketingCta title="Build the next generation of talent"
      subline="See how 42 LMS connects learning, applied experience and placement operations in one platform." />
  </MarketingLayout>;
}
