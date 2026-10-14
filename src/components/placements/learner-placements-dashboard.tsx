import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import type { learnerPlacementDashboard } from "@/modules/placements/learner-dashboard-model";

type Snapshot = ReturnType<typeof learnerPlacementDashboard>;

function formatWhen(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(value);
}

function Metric({
  label,
  value,
  href,
  detail,
}: {
  label: string;
  value: number;
  href: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-border bg-surface p-4 transition hover:border-primary hover:bg-primary-subtle focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
    >
      <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">{value}</p>
      <p className="mt-2 text-xs leading-5 text-body group-hover:text-primary-text">{detail} →</p>
    </Link>
  );
}

export function LearnerPlacementsDashboard({
  snapshot,
}: {
  snapshot: Snapshot;
}) {
  const next = snapshot.nextAction;
  return (
    <section className="space-y-5" aria-label="Placement dashboard">
      <div className="rounded-xl border border-primary bg-primary-subtle p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-3xl">
            <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-primary-text">
              {snapshot.firstRun ? "Welcome to placements" : next.label}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">
              {next.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-body">
              {next.detail}
              {next.when ? ` · ${formatWhen(next.when)}` : ""}
            </p>
            {snapshot.firstRun ? (
              <p className="mt-2 text-sm text-body">
                Explore your college’s published opportunities and check eligibility before applying.
              </p>
            ) : null}
          </div>
          <Link
            href={next.href}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
          >
            {snapshot.firstRun ? "Browse drives" : "View next step"} →
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Placement snapshot">
        <Metric
          label="Open drives"
          value={snapshot.openJobCount}
          href="/learn/my-placements/jobs"
          detail={`${snapshot.eligibleToApplyCount} currently eligible to apply`}
        />
        <Metric
          label="Applications"
          value={snapshot.applicationCount}
          href="/learn/my-placements/applications"
          detail={`${snapshot.activeApplicationCount} under consideration`}
        />
        <Metric
          label="Upcoming assessments"
          value={snapshot.upcomingAssessmentCount}
          href="/learn/my-placements/assessments"
          detail="View scheduled employer assessments"
        />
        <Metric
          label="Upcoming interviews"
          value={snapshot.upcomingInterviewCount}
          href="/learn/my-placements/interviews"
          detail="View scheduled interview rounds"
        />
      </div>

      {snapshot.activeOfferCount > 0 ? (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning bg-surface px-5 py-4">
          <div>
            <p className="m-0 font-semibold text-foreground">
              {snapshot.activeOfferCount} offer{snapshot.activeOfferCount === 1 ? "" : "s"} awaiting a response
            </p>
            <p className="mt-1 text-sm text-body">
              Review the issued offer terms and expiration before responding.
            </p>
          </div>
          <Link href="/learn/my-placements/offers?status=pending" className="text-sm font-semibold text-primary-text hover:underline">
            Review offers →
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-3 rounded-xl border border-border bg-surface p-5" aria-labelledby="placement-attention-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 id="placement-attention-heading" className="m-0 text-base font-semibold text-foreground">
              Needs attention
            </h3>
            <StatusBadge tone={snapshot.needsAttention.length ? "warning" : "neutral"}>
              {snapshot.needsAttention.length ? `${snapshot.needsAttention.length} soon` : "All clear"}
            </StatusBadge>
          </div>
          {snapshot.needsAttention.length ? (
            <ul className="divide-y divide-border">
              {snapshot.needsAttention.map((event) => (
                <li key={event.applicationId + ":" + event.roundId} className="py-3 first:pt-0 last:pb-0">
                  <Link href={event.href} className="block rounded-md hover:text-primary-text focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]">
                    <p className="text-sm font-semibold text-foreground">{event.roundName}</p>
                    <p className="mt-1 text-xs text-body">{event.companyName} · {formatWhen(event.when)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {event.kind === "ASSESSMENT" ? "Assessment" : "Interview"}
                      {event.rescheduled ? " · Rescheduled" : ""}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm leading-6 text-body">
              No assessment or interview rounds are scheduled within the next seven days.
            </p>
          )}
          <Link href="/learn/my-placements/calendar" className="inline-block min-h-10 pt-3 text-sm font-semibold text-primary-text hover:underline">
            Open career calendar →
          </Link>
        </section>

        <section className="space-y-3 rounded-xl border border-border bg-surface p-5" aria-labelledby="placement-week-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 id="placement-week-heading" className="m-0 text-base font-semibold text-foreground">
              Your next seven days
            </h3>
            <StatusBadge>{snapshot.fullWeekEventCount} event{snapshot.fullWeekEventCount === 1 ? "" : "s"}</StatusBadge>
          </div>
          {snapshot.weekEvents.length ? (
            <ul className="divide-y divide-border">
              {snapshot.weekEvents.map((event) => (
                <li key={event.applicationId + ":" + event.roundId} className="py-3 first:pt-0 last:pb-0">
                  <Link href={event.href} className="block rounded-md hover:text-primary-text focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]">
                    <p className="text-sm font-semibold text-foreground">{event.companyName} · {event.roundName}</p>
                    <p className="mt-1 text-xs text-body">{formatWhen(event.when)} · {event.roleTitle}</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm leading-6 text-body">
              No scheduled placement events in the coming week.
            </p>
          )}
          {snapshot.fullWeekEventCount > snapshot.weekEvents.length ? (
            <p className="text-xs text-muted-foreground">
              And {snapshot.fullWeekEventCount - snapshot.weekEvents.length} more scheduled events.
            </p>
          ) : null}
          <Link href="/learn/my-placements/calendar" className="inline-block min-h-10 pt-3 text-sm font-semibold text-primary-text hover:underline">
            View full schedule →
          </Link>
        </section>
      </div>
    </section>
  );
}
