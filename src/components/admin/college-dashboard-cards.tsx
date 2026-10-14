import Link from "next/link";
import type { getCollegeDashboardCards } from "@/modules/admin-ui/college-dashboard-cards-service";

type Cards = Awaited<ReturnType<typeof getCollegeDashboardCards>>["cards"];

export function CollegeDashboardCards({ cards }: { cards: Cards }) {
  return <section className="space-y-4" aria-label="College persisted-record overview">
    <div>
      <h2 className="text-xl font-semibold text-foreground">College at a glance</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Sourced counts, not utilization rates or a college-readiness score.
      </p>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(card => <Link key={card.key} href={card.href}
        className="group block rounded-xl border border-border bg-surface p-4 hover:border-primary hover:bg-primary-subtle">
        <p className="text-sm font-semibold text-foreground">{card.label}</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums text-primary-text">
          {card.count === null ? "Unavailable" : card.count.toLocaleString("en-IN")}
        </p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{card.description}</p>
        <p className="mt-3 text-xs font-semibold text-primary-text group-hover:underline">
          Open details →
        </p>
      </Link>)}
    </div>
    <p className="text-xs text-muted-foreground">
      A zero means no matching persisted records. Unavailable means no reliable
      count was returned. Counts reflect current records and never prove eligibility,
      completion, student attendance or readiness.
    </p>
  </section>;
}
