import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
import {EmptyState} from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { collegeHallAvailabilitySchema } from "@/modules/academics/college-hall-availability-model";
import {
  CollegeHallAvailabilityNotFoundError, getCollegeHallAvailability,
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
  const context=await getCurrentRequestContext();
  if(!context.adminScope?.collegeId)return <div className="min-w-0 space-y-4 md:space-y-6">
    <PageHeader eyebrow="Super Admin · Lecture halls" title="Room availability"/>
    <EmptyState title="Select a college to continue"
      description="Choose a college in the Super Admin scope selector before viewing private room schedules."/>
  </div>;
  requireSuperAdminSelectedCollege(context,"academics.manage");
  const { hallId } = await params;
  const raw = await searchParams;
  const parsed = collegeHallAvailabilitySchema.safeParse({
    hallId, from: raw.from, to: raw.to,
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
    <PageHeader eyebrow="Super Admin · Lecture halls" title={result?.hall.name ?? "Room availability"}
      description="Read-only scheduled bookings. An empty schedule is not proof of a free room."
      actions={<Link href="/admin/lecture-halls" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Back to Lecture Halls</Link>} />
    <form method="get" className="flex flex-wrap items-end gap-3 border-b border-border pb-4">
      <label className="grid min-w-0 flex-1 gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] min-[768px]:flex-none">From (IST)
        <Input name="from" type="date" required defaultValue={typeof raw.from === "string" ? raw.from : ""}
          className="w-full" />
      </label>
      <label className="grid min-w-0 flex-1 gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] min-[768px]:flex-none">To (IST)
        <Input name="to" type="date" required defaultValue={typeof raw.to === "string" ? raw.to : ""}
          className="w-full" />
      </label>
      <Button type="submit">View schedule</Button>
    </form>
    {!parsed.success
      ? raw.from !== undefined || raw.to !== undefined
        ? <ErrorState title="Invalid date range" description="Select valid IST dates (up to 31 consecutive days)." />
        : <p role="status" className="text-sm">Choose an IST date range to view scheduled classes.</p>
      : <section aria-label="Hall scheduled sessions" className="space-y-3">
        <p className="text-sm text-body">Capacity: {result?.hall.capacity ?? "Unknown"} seats · Status: {result?.hall.status ?? "Unknown"}</p>
        <h2 className="text-lg font-semibold">{result?.sessions.length ?? 0}
          {result?.truncated ? "+" : ""} scheduled classes · {result?.conflictCount ?? 0} potential conflicts
        </h2>
        {result?.truncated ? <p role="status" className="text-warning">
          More than 500 sessions match. Choose a shorter date range.
        </p> : null}
        {result?.sessions.length === 0 ? <p>No persisted bookings; availability is not guaranteed.</p> : null}
        <ul className="divide-y divide-border border-y border-border">{result?.sessions.map(row => <li key={row.id}
          className="py-4">
          <h3 className="font-semibold">{row.title}{row.hasConflict ? " · Potential conflict" : ""}</h3>
          <p className="text-sm">{inIst(row.startsAt)} – {inIst(row.endsAt)} · {row.sectionName}</p>
          <p className="text-xs text-muted-foreground">Class capacity: {row.sectionCapacity ?? "Unknown"};
            hall capacity: {result?.hall.capacity ?? "Unknown"}</p>
          {row.overlapsAnother ? <p className="text-sm text-error">Overlapping scheduled booking</p> : null}
          {row.overConfiguredCapacity ? <p className="text-sm text-error">Class capacity exceeds hall capacity</p> : null}
        </li>)}</ul>
      </section>}
  </div>;
}
