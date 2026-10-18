import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
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
  return <div className="space-y-6">
    <Link href="/tpo/calendar" className="font-semibold text-[var(--lms-teal-deep)] hover:underline">
      ← TPO calendar
    </Link>
    <PageHeader eyebrow="TPO · Calendar" title="Export upcoming placement rounds"
      description="Download a formula-safe CSV from migrated scheduled round records. Date filters use IST calendar days; no ICS or external calendar sync." />
    <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-5">
      <label className="text-sm font-semibold text-foreground">From (IST)
        <Input type="date" name="from" required defaultValue={first(query.from) ?? today}
          className="mt-2 block min-h-11 rounded-md border border-border bg-surface px-3" />
      </label>
      <label className="text-sm font-semibold text-foreground">Through (IST)
        <Input type="date" name="to" required defaultValue={first(query.to) ?? nextWeek}
          className="mt-2 block min-h-11 rounded-md border border-border bg-surface px-3" />
      </label>
      <Button type="submit" className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-foreground">
        Preview range
      </Button>
    </form>
    {!parsed.success ? <p role="alert" className="rounded-md border border-border bg-surface p-5 text-sm text-body">
      Invalid date range. Select real IST dates with a maximum inclusive span of 93 days.
    </p> : result ? <section className="space-y-4">
      <p className="text-sm text-body">
        {result.rows.length} upcoming scheduled rounds within {result.from} to {result.to} (IST).
        {result.truncated
          ? " More than 500 matched: this export is truncated, narrow the range."
          : ""}
      </p>
      {result.rows.length === 0 ? <p role="status" className="rounded-xl border border-border bg-surface p-5 text-sm text-body">
        No future scheduled rounds were found in this college for the chosen dates.
        Unscheduled, cancelled, completed and non-published drives are not inferred.
      </p> : null}
      <a href={"/api/placements/tpo/calendar/export?" + params?.toString()}
        className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-foreground">
        Download rounds CSV
      </a>
    </section> : null}
  </div>;
}
