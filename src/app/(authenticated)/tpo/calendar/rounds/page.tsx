import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { TpoRoundCalendarControl } from "@/components/placements/tpo-round-calendar-control";
import { hasMembershipRole } from "@/modules/identity/context";
import { listTpoCalendarRoundChoices } from "@/modules/placements/tpo-round-calendar-service";
export default async function TpoRoundCalendarPage() {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) redirect("/dashboard");
  const result = await listTpoCalendarRoundChoices(context);
  return <div className="space-y-5">
    <Link href="/tpo/calendar" className="text-sm font-semibold text-primary-text hover:underline">
      ← Calendar
    </Link>
    <PageHeader eyebrow="TPO · Calendar" title="Drive round scheduling"
      description="Schedule an existing pending drive round, reschedule an active one or cancel it. All times are IST." />
    {result.limited ? <p role="status" className="rounded-md border border-border bg-surface p-3 text-sm">
      Only the first 200 rounds were loaded. This is not a complete list.
    </p> : null}
    <TpoRoundCalendarControl choices={result.rows.map((row) => ({
      ...row, updatedAt: row.updatedAt.toISOString(),
      scheduledAt: row.scheduledAt?.toISOString() ?? null,
    }))} />
    <p className="text-sm text-body">Venue checks use persisted on-campus bookings.
      Unknown duration is a blocker, not an assumed clear venue.
      A pending round is created under its drive before being scheduled here.</p>
  </div>;
}
