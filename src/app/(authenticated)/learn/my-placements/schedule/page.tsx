import Link from "next/link";
import { Suspense } from "react";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { LearnerCareerCalendar } from "@/components/placements/learner-career-calendar";
import { initialCareerCalendarDay } from "@/modules/placements/learner-career-calendar-model";
import { getLearnerPlacementRequestWorkspace } from "@/modules/placements/request-service";
import { partitionLearnerPlacementSchedule } from "@/modules/placements/learner-placement-schedule-model";

/** Dev legacy combines all learner rounds on one authorized Schedule page. */
export default async function LearnerPlacementSchedulePage() {
  const context = await getCurrentRequestContext();
  const workspace = await getLearnerPlacementRequestWorkspace(context);
  const now = new Date();
  const { ahead, past, undated } = partitionLearnerPlacementSchedule(workspace.rounds, now);
  const today = initialCareerCalendarDay();
  const rounds = workspace.rounds.map(row => ({
    ...row,
    scheduledAt: row.scheduledAt?.toISOString() ?? null,
    exception: row.exception ? {
      scheduledAt: row.exception.scheduledAt.toISOString(),
      timezone: row.exception.timezone,
      mode: row.exception.mode,
      venue: row.exception.venue,
      meetingUrl: row.exception.meetingUrl,
    } : null,
  }));
  const fmt = (date: Date | null) => date
    ? new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }).format(date)
    : "Date to be told";
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="My Placements" title="Schedule"
        description="Your tests, talks and interviews. When the placement cell books you, it shows here and you get a notice; please confirm each one so they know you'll be there" />
      <section className="space-y-3" aria-label="Coming up">
        <h2 className="text-lg font-semibold text-foreground">Coming up ({ahead.length})</h2>
        {ahead.length === 0 ? <p className="text-body">Nothing coming up. When a company&apos;s round is planned and the placement cell books you, it shows here.</p> : null}
        {ahead.map(row => <article key={row.roundId+":"+row.applicationId} className="rounded-xl border border-border bg-surface p-4">
          <h3 className="font-semibold text-foreground">{row.roundName} · {row.companyName}</h3>
          <p className="text-sm text-body">{row.roleTitle} · {fmt(row.exception?.scheduledAt ?? row.scheduledAt)}</p>
          <Link className="text-sm font-semibold text-primary-text underline" href={"/learn/my-placements/applications/"+row.applicationId}>See where your applications stand</Link>
        </article>)}
        {ahead.length === 0 ? <Link className="text-sm font-semibold text-primary-text underline" href="/learn/my-placements/applications">See where your applications stand</Link> : null}
        {undated.map(row => <article key={row.roundId+":"+row.applicationId} className="rounded-xl border border-border bg-surface p-4">
          <h3 className="font-semibold text-foreground">{row.roundName} · {row.companyName}</h3>
          <p className="text-sm text-body">Date to be told</p>
        </article>)}
      </section>
      <section aria-label="Calendar" className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Calendar</h2>
        <Suspense fallback={<p role="status">Calendar</p>}>
          <LearnerCareerCalendar initialAnchor={today} todayAnchor={today} rounds={rounds} />
        </Suspense>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Past</h2>
        {past.length === 0 ? <p className="text-body">No past rounds yet.</p> : past.map(row =>
          <article key={row.roundId+":"+row.applicationId} className="rounded-xl border border-border bg-surface p-4">
            <h3 className="font-semibold text-foreground">{row.roundName} · {row.companyName}</h3>
            <p className="text-sm text-body">{fmt(row.exception?.scheduledAt ?? row.scheduledAt)}</p>
          </article>)}
      </section>
    </div>
  );
}
