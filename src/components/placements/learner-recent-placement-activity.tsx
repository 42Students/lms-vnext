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
      className="min-w-0 border-b border-border pb-5 pt-4 md:pb-6 md:pt-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="recent-placement-activity" className="m-0 text-base font-semibold text-foreground">
          Recent placement activity
        </h2>
        <Link href="/learn/my-placements/applications"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline md:min-h-9">
          My applications →
        </Link>
      </div>
      <p className="mt-2 text-sm text-body">
        Your recorded applications, final screening decisions and applied round outcomes.
        No unsent decisions or employer-only notes are displayed.
      </p>
      {events.length === 0 ? (
        <p role="status" className="mt-4 flex min-h-[180px] items-center justify-center rounded-xl border border-border bg-[var(--lms-neutral-50)] px-6 py-12 text-center text-sm leading-[1.5] text-body">
          No recorded placement activity yet. Apply to an eligible published
          drive to begin your placement journey.
        </p>
      ) : (
        <ol className="mt-4 divide-y divide-border">
          {events.map((event) => (
            <li key={event.id} className="py-3 first:pt-0 last:pb-0">
              <Link href={event.href}
                className="block min-h-11 min-w-0 rounded-md py-2 hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                <div className="flex min-w-0 flex-col gap-1 md:flex-row md:items-center md:justify-between md:gap-4">
                  <span className="break-words text-sm font-semibold text-foreground">{event.heading}</span>
                  <time dateTime={event.occurredAt.toISOString()}
                    className="text-xs text-muted-foreground">
                    {formatIst(event.occurredAt)}
                  </time>
                </div>
                <p className="mt-1 break-words text-sm text-body">{event.detail}</p>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
