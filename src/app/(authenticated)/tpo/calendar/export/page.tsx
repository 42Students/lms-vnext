import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { hasMembershipRole } from "@/modules/identity/context";
import {requirePersistedTpoMembership} from "@/modules/placements/tpo-persisted-actor-service";
import {
  todayIstDate, tpoCalendarExportQuerySchema,
} from "@/modules/placements/tpo-calendar-export-model";
import { getTpoCalendarRoundExport } from "@/modules/placements/tpo-calendar-export-service";

type SearchParams = { from?: string | string[]; to?: string | string[] };
const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function TpoCalendarExportPage({
  searchParams,
}: { searchParams: Promise<SearchParams> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    redirect("/dashboard");
  }
  // Even malformed-filter feedback requires a currently authorized TPO actor.
  await requirePersistedTpoMembership(context,context.membership.collegeId);
  const query = await searchParams;
  const today = todayIstDate(new Date());
  const nextWeek = new Date(Date.parse(today + "T00:00:00.000Z") + 6 * 86400000)
    .toISOString().slice(0, 10);
  const parsed = tpoCalendarExportQuerySchema.safeParse({
    from: Array.isArray(query.from) ? query.from : (query.from ?? today),
    to: Array.isArray(query.to) ? query.to : (query.to ?? nextWeek),
  });
  const result = parsed.success
    ? await getTpoCalendarRoundExport(context, parsed.data)
    : null;
  const params = parsed.success ? new URLSearchParams(parsed.data) : null;
  return <div className="min-w-0 space-y-6">
    <PageHeader eyebrow="TPO · Calendar" title="Export upcoming placement rounds"
      description="Download a formula-safe CSV from migrated scheduled round records. Date filters use IST calendar days; no ICS or external calendar sync." />
    <Link href="/tpo/calendar" className="inline-flex min-h-11 items-center text-[13px] font-semibold text-[var(--lms-link-text)] underline hover:underline min-[768px]:min-h-9">
      ← TPO calendar
    </Link>
    <form method="get" className="flex min-w-0 flex-wrap items-end gap-3 border-b border-[var(--lms-canvas-border)] pb-4 max-[767px]:[&_label]:w-full>
      <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">From (IST)
        <Input type="date" name="from" required defaultValue={first(query.from) ?? today}
          className="mt-2 block min-h-11 min-[768px]:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3" />
      </label>
      <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Through (IST)
        <Input type="date" name="to" required defaultValue={first(query.to) ?? nextWeek}
          className="mt-2 block min-h-11 min-[768px]:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3" />
      </label>
      <Button type="submit" className="min-h-11 min-[768px]:min-h-9 rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-[650] text-white">
        Preview range
      </Button>
    </form>
    {!parsed.success ? <Alert tone="error">
      Invalid date range. Select real IST dates with a maximum inclusive span of 93 days.
    </Alert> : result ? <section className="space-y-4">
      <p className="text-sm text-body">
        {result.rows.length} upcoming scheduled rounds within {result.from} to {result.to} (IST).
        {result.truncated
          ? " More than 500 matched: this export is truncated, narrow the range."
          : ""}
      </p>
      {result.rows.length === 0 ? <EmptyState title="No future scheduled rounds were found in this college for the chosen dates." description="Unscheduled, cancelled, completed and non-published drives are not inferred."/> : null}
      <a href={"/api/placements/tpo/calendar/export?" + params?.toString()}
        className="inline-flex min-h-11 min-[768px]:min-h-9 items-center rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-[650] text-white">
        Download rounds CSV
      </a>
    </section> : null}
  </div>;
}
