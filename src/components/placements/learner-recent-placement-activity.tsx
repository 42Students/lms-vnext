import Link from "next/link";
import type {
  LearnerRecentPlacementEvent,
} from "@/modules/placements/learner-recent-placement-activity-model";

function formatIst(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(value) + " IST";
}

export function LearnerRecentPlacementActivity({
  events,
}: {
  events: readonly LearnerRecentPlacementEvent[];
}) {
  return (
    <section
      aria-labelledby="recent-placement-activity"
      className="rounded-xl border border-border bg-surface p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="recent-placement-activity" className="m-0 text-base font-semibold text-foreground">
          Recent placement activity
        </h2>
        <Link href="/learn/my-placements/applications"
          className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text hover:underline">
          My applications →
        </Link>
      </div>
      <p className="mt-2 text-sm text-body">
        Your recorded applications, final screening decisions and applied round outcomes.
        No unsent decisions or employer-only notes are displayed.
      </p>
      {events.length === 0 ? (
        <p role="status" className="mt-4 rounded-lg border border-border bg-surface-subtle p-4 text-sm text-body">
          No recorded placement activity yet. Apply to an eligible published
          drive to begin your placement journey.
        </p>
      ) : (
        <ol className="mt-4 divide-y divide-border">
          {events.map((event) => (
            <li key={event.id} className="py-3 first:pt-0 last:pb-0">
              <Link href={event.href}
                className="block rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)] hover:text-primary-text">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <span className="text-sm font-semibold text-foreground">{event.heading}</span>
                  <time dateTime={event.occurredAt.toISOString()}
                    className="text-xs text-muted-foreground">
                    {formatIst(event.occurredAt)}
                  </time>
                </div>
                <p className="mt-1 text-sm text-body">{event.detail}</p>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
