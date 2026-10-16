import Link from "next/link";
import type { getCollegeDashboardCards } from "@/modules/admin-ui/college-dashboard-cards-service";
import {
  COLLEGE_AT_A_GLANCE_HEADING,
  COLLEGE_AT_A_GLANCE_KEYS,
} from "@/modules/admin-ui/college-dashboard-cards-model";

type Cards = Awaited<ReturnType<typeof getCollegeDashboardCards>>["cards"];

export function CollegeDashboardCards({ cards }: { cards: Cards }) {
  const visible = COLLEGE_AT_A_GLANCE_KEYS
    .map(key => cards.find(card => card.key === key))
    .filter((card): card is Cards[number] => Boolean(card));
  return <section className="space-y-4" aria-label={COLLEGE_AT_A_GLANCE_HEADING}>
    <h2 className="text-xl font-semibold text-foreground">{COLLEGE_AT_A_GLANCE_HEADING}</h2>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {visible.map(card => <Link key={card.key} href={card.href}
        className="block rounded-xl border border-border bg-surface p-4 hover:border-primary hover:bg-primary-subtle">
        <p className="text-sm text-muted-foreground">{card.label}</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums text-primary-text">
          {card.count === null ? "—" : card.count.toLocaleString("en-IN")}
        </p>
      </Link>)}
    </div>
  </section>;
}
