import type { Metadata } from "next";
import {
  MarketingLayout, MarketingHero, MarketingFeatureGrid, MarketingCta,
} from "@/components/marketing/marketing-layout";

export const metadata: Metadata = {
  title: "Platform | 42 LMS",
  description: "One connected platform for learning, projects and placements.",
};

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

    <MarketingFeatureGrid title="Every role has a purpose-built workspace" items={WORKSPACES} />
    <MarketingFeatureGrid title="Everything you need to develop talent" items={PILLARS} />

    <section className="relative left-1/2 w-screen -translate-x-1/2 border-y border-[var(--lms-canvas-border)] bg-[#eaf6f6] py-14 min-[768px]:py-20"
      aria-labelledby="platform-workflows-heading">
      <div className="mx-auto max-w-[1180px] space-y-4 px-5">
      <h2 id="platform-workflows-heading" className="text-[20px] font-semibold leading-7 text-[var(--lms-heading)]">
        Workflows connected across learning and hiring
      </h2>
      <p className="text-sm leading-6 text-body">
        These are connected product workflows, not claims of third-party integrations.
      </p>
      <ul className="flex min-w-0 flex-wrap gap-2">
        {CONNECTED_WORKFLOWS.map(label=><li key={label}
          className="rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--lms-body-text)]">
          {label}
        </li>)}
      </ul>
      </div>
    </section>

    <section className="min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-white p-[var(--lms-canvas-padding)]"
      aria-labelledby="platform-lifecycle-heading">
      <h2 id="platform-lifecycle-heading" className="text-[20px] font-semibold leading-7 text-[var(--lms-heading)]">
        A complete talent lifecycle
      </h2>
      <ol className="flex min-w-0 flex-wrap items-center gap-2">
        {LIFECYCLE.map((step,index)=><li key={step} className="inline-flex items-center gap-2">
          <span className="rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] px-3 py-2 text-sm font-semibold">
            {step}
          </span>
          {index<LIFECYCLE.length-1?<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--lms-primary-text)]"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>:null}
        </li>)}
      </ol>
      <p className="text-sm leading-6 text-body">The steps are managed by learners, educators, mentors and placement teams.</p>
    </section>

    <MarketingCta title="Explore the platform with our team" />
  </MarketingLayout>;
}
