import { StatTile } from "@/components/ui/stat-tile";
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
    <div className="grid min-w-0 grid-cols-1 gap-3 min-[375px]:grid-cols-2 lg:grid-cols-4">
      {visible.map(card => <StatTile key={card.key} variant="college" href={card.href}
        label={card.label} value={card.count === null ? "—" : card.count} />)}
    </div>
  </section>;
}
