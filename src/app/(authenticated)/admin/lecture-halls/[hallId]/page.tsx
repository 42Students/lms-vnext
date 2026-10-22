import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { requireSuperAdminSelectedCollege } from "@/modules/admin-ui/super-admin-selected-college";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { DateInput } from "@/components/ui/date-input";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { collegeHallAvailabilitySchema } from "@/modules/academics/college-hall-availability-model";
import {
  CollegeHallAvailabilityNotFoundError,
  getCollegeHallAvailability,
} from "@/modules/academics/college-hall-availability-service";

export const dynamic = "force-dynamic";

function inIst(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

/** SA-academics-people-26: scoped room schedule view, never College Admin booking actions. */
export default async function SuperAdminLectureHallAvailability({
  params, searchParams,
}: {
  params: Promise<{ hallId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.adminScope?.collegeId) return <div className="min-w-0 space-y-4">
    <PageHeader title="Room availability" />
    <EmptyState title="Select a college to continue"
      description="Choose a college in the Super Admin scope selector before viewing private room schedules." />
  </div>;
  requireSuperAdminSelectedCollege(context, "academics.manage");
  const { hallId } = await params;
  const raw = await searchParams;
  const parsed = collegeHallAvailabilitySchema.safeParse({
    hallId, from: raw["from"], to: raw["to"],
  });
  let result: Awaited<ReturnType<typeof getCollegeHallAvailability>> | null = null;
  if (parsed.success) {
    try {
      result = await getCollegeHallAvailability(context, parsed.data);
    } catch (error) {
      if (error instanceof CollegeHallAvailabilityNotFoundError) notFound();
      throw error;
    }
  }

  return <div className="min-w-0 space-y-4 md:space-y-6">
    <PageHeader title={result?.hall.name ?? "Room availability"}
      description="Read-only scheduled bookings. An empty schedule is not proof of a free room."
      actions={<Link href="/admin/lecture-halls" className="inline-flex min-h-11 w-full items-center justify-center font-semibold text-primary-text underline underline-offset-4 hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)] md:min-h-9 md:w-auto">Back to Lecture Halls</Link>} />

    <form method="get" className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] sm:grid-cols-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:gap-[var(--lms-space-4)]">
      <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">From (IST)
        <DateInput mode="date" name="from" required defaultValue={typeof raw["from"] === "string" ? raw["from"] : ""} className="w-full" />
      </label>
      <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">To (IST)
        <DateInput mode="date" name="to" required defaultValue={typeof raw["to"] === "string" ? raw["to"] : ""} className="w-full" />
      </label>
      <Button type="submit" className="min-h-11 w-full sm:col-span-2 md:col-span-1 md:min-h-9 md:w-auto">View schedule</Button>
    </form>

    {!parsed.success
      ? raw["from"] !== undefined || raw["to"] !== undefined
        ? <ErrorState title="Invalid date range" description="Select valid IST dates (up to 31 consecutive days)." />
        : <p role="status" className="text-sm text-[var(--lms-muted-text)]">Choose an IST date range to view scheduled classes.</p>
      : <section aria-label="Hall scheduled sessions" className="min-w-0 space-y-[var(--lms-space-4)]">
        <div className="flex min-w-0 flex-col gap-[var(--lms-space-2)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-3)] md:flex-row md:items-baseline md:justify-between md:gap-[var(--lms-space-4)]">
          <h2 className="min-w-0 text-lg font-semibold text-[var(--lms-heading)]">
            {result?.sessions.length ?? 0}{result?.truncated ? "+" : ""} scheduled classes · {result?.conflictCount ?? 0} potential conflicts
          </h2>
          <p className="shrink-0 text-sm text-body">Capacity: {result?.hall.capacity ?? "Unknown"} seats · Status: {result?.hall.status ?? "Unknown"}</p>
        </div>
        {result?.truncated ? <p role="status" className="text-sm text-warning">
          More than 500 sessions match. Choose a shorter date range.
        </p> : null}
        {result?.sessions.length === 0
          ? <EmptyState title="No scheduled bookings" description="No persisted bookings were found. Availability is not guaranteed." />
          : <ul className="min-w-0 divide-y divide-border border-b border-border">
            {result?.sessions.map(row => <li key={row.id} className="min-w-0 py-[var(--lms-space-4)] first:pt-0">
              <div className="flex min-w-0 flex-col gap-[var(--lms-space-1)] md:flex-row md:items-start md:justify-between md:gap-[var(--lms-space-4)]">
                <h3 className="min-w-0 break-words font-semibold text-[var(--lms-heading)]">{row.title}{row.hasConflict ? " · Potential conflict" : ""}</h3>
                <p className="shrink-0 text-sm text-[var(--lms-muted-text)]">{inIst(row.startsAt)} – {inIst(row.endsAt)}</p>
              </div>
              <p className="mt-[var(--lms-space-1)] text-sm text-body">{row.sectionName} · Class capacity: {row.sectionCapacity ?? "Unknown"}; hall capacity: {result?.hall.capacity ?? "Unknown"}</p>
              {row.overlapsAnother ? <p className="mt-[var(--lms-space-2)] text-sm text-error">Overlapping scheduled booking</p> : null}
              {row.overConfiguredCapacity ? <p className="mt-[var(--lms-space-1)] text-sm text-error">Class capacity exceeds hall capacity</p> : null}
            </li>)}
          </ul>}
      </section>}
  </div>;
}
