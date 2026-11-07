import type { Metadata } from "next";
import {
  MarketingLayout, MarketingHero, MarketingFeatureGrid, MarketingCta, marketingPageMetadata,
} from "@/components/marketing/marketing-layout";
import { Heading } from "@/components/ui/heading";
import { ButtonLink } from "@/components/ui/button-link";

export const metadata: Metadata = marketingPageMetadata("/platform", "Platform | 42 LMS",
  "One connected platform for learning, projects and placements.");

/** Non-AI scope: seven former autonomous-agent promises become seven existing
 * people-operated workspaces. One-to-one legacy exception map:
 * Tutor Agent -> Learner, Assessment Agent -> Faculty, Coach Agent -> Mentor,
 * Career Agent -> Career/placement, Knowledge Agent -> Course/content admin,
 * Workforce Intelligence Agent -> Placement operations, Talent Development
 * Agent -> Project/team management. No automated tutoring, AI assessment,
 * prediction, generated advice or autonomous coaching is promised.
 */
const WORKSPACES = [
  { title: "Learner workspace", description: "Course material, assignments, assessments and your learning progress." },
  { title: "Faculty workspace", description: "Teach courses, prepare assessments and record outcomes with human review." },
  { title: "Mentor workspace", description: "Guide teams, review project tasks and help learners reach milestones." },
  { title: "Career and placement workspace", description: "Browse placement opportunities, eligibility and application progress." },
  { title: "Course and content administration", description: "Organize curriculum, lessons and academic resources for your college." },
  { title: "Placement operations", description: "Coordinate recruiter drives, screening rounds, interviews and offers." },
  { title: "Project and team management", description: "Track milestones, members, deliveries and feedback without automated coaching." },
] as const;

/** Owner-approved AI retirement, keeping the legacy Pillars section:
 * AI Assessments + Personalized Learning -> Learning (human-authored quizzes);
 * Skills Intelligence + AI Agents -> Projects (human mentor review);
 * Knowledge Intelligence -> Operations (administrative content and reports);
 * Analytics & Insights -> Placements (recorded applications and outcomes).
 * The old six AI promises are intentionally four real product pillars.
 * Integrations means the internal shared workflows below, not a claim of
 * shipped third-party connectors or predictive scoring.
 */
const PILLARS = [
  { title: "Learning", description: "Courses, lessons, faculty-authored assessments, assignments and academic progress." },
  { title: "Projects", description: "Teamwork, mentor feedback, milestones and portfolio evidence." },
  { title: "Placements", description: "Student eligibility, applications, interviews, offers and joining." },
  { title: "Operations", description: "Academic administration, cohort planning, verified reports and Integrations across internal workflows." },
] as const;

const CONNECTED_WORKFLOWS = [
  "Courses", "Assignments", "Assessments", "Projects",
  "Mentor reviews", "Placement drives", "Interviews", "Offers",
] as const;
const LIFECYCLE = ["Discover", "Learn", "Build", "Demonstrate", "Interview", "Grow"] as const;

export default function PlatformMarketingPage() {
  return <MarketingLayout path="/platform" pageTitle="Platform"
      pageDescription="One connected platform for learning, projects and placements.">
    <MarketingHero eyebrow="The platform"
      title="One connected platform for learning, projects and placements."
      description="Connect academic delivery, guided projects, assessments and recruitment in one place, with people responsible for teaching, feedback and decisions."
      showExploreLink={false} />

    <nav aria-label="Explore platform workflows"
     className="flex min-w-0 flex-col gap-3 border-b border-[var(--lms-canvas-border)] py-6 sm:flex-row sm:flex-wrap sm:items-center">
     <p className="text-sm font-semibold text-[var(--lms-heading)] sm:mr-2">Explore the platform</p>
     <ButtonLink variant="secondary" href="#platform-workspaces" className="min-h-11 w-full sm:w-auto">Role workspaces</ButtonLink>
     <ButtonLink variant="secondary" href="#platform-lifecycle" className="min-h-11 w-full sm:w-auto">Talent lifecycle</ButtonLink>
     <ButtonLink variant="primary" href="/request-demo" className="min-h-11 w-full sm:ml-auto sm:w-auto">Request a Demo</ButtonLink>
    </nav>

    <div id="platform-workspaces" className="min-w-0 scroll-mt-24">
     <MarketingFeatureGrid title="Every role has a purpose-built workspace" items={WORKSPACES} />
    </div>
    <MarketingFeatureGrid title="Everything you need to develop talent" items={PILLARS} />

    <section className="relative left-1/2 w-screen -translate-x-1/2 border-y border-[var(--lms-canvas-border)] bg-[color:var(--lms-primary-subtle)] py-14 md:py-20"
      aria-labelledby="platform-workflows-heading">
      <div className="mx-auto max-w-[1180px] space-y-4 px-5">
      <Heading level={2} size="xl" id="platform-workflows-heading" className="leading-7 text-[var(--lms-heading)]">
        Workflows connected across learning and hiring
      </Heading>
      <p className="text-sm leading-6 text-body">
        These are connected product workflows, not claims of third-party integrations.
      </p>
      <ul className="flex min-w-0 flex-wrap gap-2">
        {CONNECTED_WORKFLOWS.map(label=><li key={label}
          className="rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3 py-2 text-sm font-semibold text-[var(--lms-body-text)]">
          {label}
        </li>)}
      </ul>
      </div>
    </section>

    <section id="platform-lifecycle" className="min-w-0 scroll-mt-24 space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-[var(--lms-canvas-padding)]"
      aria-labelledby="platform-lifecycle-heading">
      <Heading level={2} size="xl" id="platform-lifecycle-heading" className="leading-7 text-[var(--lms-heading)]">
        A complete talent lifecycle
      </Heading>
      <ol className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LIFECYCLE.map((step,index)=><li key={step} className="flex min-w-0 items-center gap-3 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-primary-subtle)] p-4">
          <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface font-bold text-[var(--lms-primary-text)]">
            {index+1}
          </span>
          <span className="min-w-0 break-words text-sm font-semibold text-[var(--lms-heading)]">{step}</span>
        </li>)}
      </ol>
      <p className="text-sm leading-6 text-body">The steps are managed by learners, educators, mentors and placement teams.</p>
    </section>

    <MarketingCta title="Explore the platform with our team" />
  </MarketingLayout>;
}
