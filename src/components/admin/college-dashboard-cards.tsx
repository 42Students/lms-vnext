import { StatTile } from "@/components/ui/stat-tile";
import { EmptyState } from "@/components/ui/empty-state";
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
    {visible.length ? <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
      {visible.map(card => <StatTile key={card.key} variant="college" href={card.href}
        label={card.label} value={card.count === null ? "—" : card.count} />)}
    </div> : <div className="space-y-2">
      <EmptyState title="No college summary available" description="College summary metrics are not available in the selected scope."/>
      <p role="status" className="text-sm text-muted-foreground">Couldn't refresh college summary. Previous counts are not assumed to be zero.</p>
      <Link href="/college" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Retry</Link>
    </div>}
  </section>;
}
