import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import tpoTileStyles from "@/components/placements/legacy-tpo-report-stats.module.css";
import { hasMembershipRole } from "@/modules/identity/context";
import { getTpoScheduleConflicts } from "@/modules/placements/tpo-schedule-conflicts-service";
import { tpoScheduleConflictsQuerySchema } from "@/modules/placements/tpo-schedule-conflicts-model";

type SearchParams = { days?: string | string[] };
const dateTime = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});
function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TpoScheduleConflictsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) redirect("/dashboard");
  const params = await searchParams;
  const validated = tpoScheduleConflictsQuerySchema.safeParse({
    ...(first(params.days) ? { days: first(params.days) } : {}),
  });

  if (!validated.success) {
    return (
      <div className="min-w-0 space-y-4">
        <PageHeader eyebrow="TPO · Drive scheduling"
          title="Invalid scheduling window"
          description="Only a window of 1–90 days is supported." />
        <Link href="/tpo/placements/schedule-conflicts"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Reset window</Link>
      </div>
    );
  }

  const data = await getTpoScheduleConflicts(context, validated.data);
  const summaryTiles: [string, number][] = [
    ["Recorded rounds", data.totalScheduled],
    ["Venue overlaps", data.conflicts.length],
    ["Assessable rounds", data.assessedCount],
    ["Incomplete scheduling", data.unassessable.length],
  ];
  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="TPO · Drive scheduling"
        title="Round venue conflicts"
        description="Potential same-venue overlaps in scheduled rounds of published drives. This is not a student timetable conflict detector."
        actions={<Link href="/tpo/placements" className="inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] sm:w-auto md:min-h-9">← Placement operations</Link>}
      />
      <form method="get" className="grid min-w-0 gap-3 border-b border-[var(--lms-canvas-border)] pb-4 sm:grid-cols-[minmax(0,14rem)_auto] sm:items-end">
        <label className="text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">
          Upcoming window
          <Select name="days" defaultValue={String(data.days)}
            className="mt-[6px] block min-h-11 md:min-h-9 border border-border px-3 text-sm font-normal">
            {[7, 14, 30, 60, 90].map((days) => (
              <option key={days} value={days}>{days} days</option>
            ))}
          </Select>
        </label>
        <Button variant="primary" type="submit"
          className="w-full min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-[650] text-on-primary sm:w-auto">
          Apply
        </Button>
      </form>
      <section aria-label="Schedule assessment" className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
        {summaryTiles.map(([name, value]) => (
          <StatTile key={name} label={String(name)} value={value} {...(tpoTileStyles["tile"]===undefined?{}:{className:tpoTileStyles["tile"]})} />
        ))}
      </section>
      {data.limited ? (
        <Alert tone="warning">
          More than 1,000 scheduled rounds match. Only the first 1,000 were assessed;
          this is not a complete conflict audit. Narrow the window.
        </Alert>
      ) : null}
      <p className="text-sm text-body">
        {data.virtualExcluded} virtual round(s) excluded from room checking.
        Only non-cancelled and non-completed upcoming rounds on published drives
        count here. Missing venue, mode or duration cannot be considered conflict-free.
      </p>
      <section className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-4">
        <div className="border-b border-[var(--lms-canvas-border)] pb-3">
          <h2 className="text-lg font-semibold text-foreground">Confirmed venue/time overlaps</h2>
        </div>
        {data.conflicts.length === 0 ? (
          <EmptyState title="No overlapping on-campus venue bookings could be proven among the assessed rounds. This does not certify the whole schedule as conflict-free."/>
        ) : (
          <div className="divide-y divide-border">
            {data.conflicts.map(({ left, right, overlapMinutes }) => (
              <article key={left.id + ":" + right.id} className="min-w-0 space-y-2 py-4">
                <p className="text-sm font-semibold text-foreground">
                  {left.venue} · {overlapMinutes} minute(s) overlap
                </p>
                {[left, right].map((round) => (
                  <p key={round.id} className="text-sm text-body">
                    <Link href={"/tpo/drive-day/" + encodeURIComponent(round.id)}
                      className="font-semibold text-[var(--lms-teal-deep)] hover:underline">
                      {round.companyName} · {round.jobTitle} · {round.name}
                    </Link>
                    {" — "}{dateTime.format(round.scheduledAt)} IST
                  </p>
                ))}
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-4">
        <div className="border-b border-[var(--lms-canvas-border)] pb-3">
          <h2 className="text-lg font-semibold text-foreground">Cannot fully assess</h2>
        </div>
        {data.unassessable.length === 0 ? (
          <p className="py-4 text-sm text-body">
            All on-campus candidate rounds in the selected window have a recorded venue and duration.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {data.unassessable.map((round) => (
              <li key={round.id} className="grid min-w-0 gap-2 py-4 text-sm sm:grid-cols-[minmax(0,1fr)_minmax(10rem,auto)] sm:items-start">
                <Link href={"/tpo/drive-day/" + encodeURIComponent(round.id)}
                  className="font-semibold text-[var(--lms-teal-deep)] hover:underline">
                  {round.jobTitle} · {round.name}
                </Link>
                <span className="text-body">{round.reason}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
