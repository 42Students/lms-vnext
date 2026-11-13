import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
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
import { ButtonLink } from "@/components/ui/button-link";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";

import { ROLE } from "@/modules/identity/roles";
import { first } from "@/lib/shared";
type SearchParams = { from?: string | string[]; to?: string | string[] };
export default async function TpoCalendarExportPage({
  searchParams,
}: { searchParams: Promise<SearchParams> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, ROLE.TPO)) {
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
  return <div className="min-w-0 space-y-4">
    <PageHeader eyebrow="TPO · Calendar" title="Export upcoming placement rounds"
      description="Download a formula-safe CSV from migrated scheduled round records. Date filters use IST calendar days; no ICS or external calendar sync." actions={<TextLink href="/tpo/calendar" className="inline-flex min-h-11 items-center justify-center md:min-h-9">← TPO calendar</TextLink>}/>
    <form method="get" className="grid min-w-0 grid-cols-1 items-end gap-3 border-b border-[var(--lms-canvas-border)] pb-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
      <Label className="block w-full min-w-0">From (IST)
        <span aria-hidden="true" className="ml-1 text-[var(--lms-error)]">*</span>
    <Input type="date" name="from" required defaultValue={first(query.from) ?? today}
          className="mt-[6px] block min-h-11 w-full md:min-h-9" />
      </Label>
      <Label className="block w-full min-w-0">Through (IST)
        <span aria-hidden="true" className="ml-1 text-[var(--lms-error)]">*</span>
    <Input type="date" name="to" required defaultValue={first(query.to) ?? nextWeek}
          className="mt-[6px] block min-h-11 w-full md:min-h-9" />
      </Label>
      <Button type="submit" className="min-h-11 w-full px-4 sm:w-auto md:min-h-9">
        Preview range
      </Button>
    </form>
    {!parsed.success ? <Alert tone="error">
      Invalid date range. Select real IST dates with a maximum inclusive span of 93 days.
    </Alert> : result ? <section className="space-y-4">
      <p className="text-sm text-body leading-[22px]">
        {result.rows.length} upcoming scheduled rounds within {result.from} to {result.to} (IST).
        {result.truncated
          ? " More than 500 matched: this export is truncated, narrow the range."
          : ""}
      </p>
      {result.rows.length === 0 ? <EmptyState title="No future scheduled rounds were found in this college for the chosen dates." description="Unscheduled, cancelled, completed and non-published drives are not inferred." action={<TextLink href="/tpo/calendar" className="md:min-h-9 inline-flex min-h-11 items-center">← TPO calendar</TextLink>}/> : null}
      {result.rows.length>0?<ButtonLink variant="primary" href={"/api/placements/tpo/calendar/export?" + params?.toString()}
        className="w-full sm:w-auto">
        Download rounds CSV
      </ButtonLink>:null}
    </section> : null}
  </div>;
}
