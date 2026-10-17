import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { CollegeHallBookingAction } from "@/components/academics/college-hall-booking-action";
import { CollegeHallCancellationAction } from "@/components/academics/college-hall-cancellation-action";
import { listRecurringPreviewOptions } from "@/modules/academics/college-recurring-preview-service";
import { collegeHallAvailabilitySchema } from "@/modules/academics/college-hall-availability-model";
import { getCollegeHallAvailability, CollegeHallAvailabilityNotFoundError }
  from "@/modules/academics/college-hall-availability-service";

type Query = Record<string, string | string[] | undefined>;

function when(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

export default async function CollegeHallAvailabilityPage({ params, searchParams }: {
  params: Promise<{ hallId: string }>; searchParams: Promise<Query>;
}) {
  const { hallId } = await params;
  const raw = await searchParams;
  const from = raw.from, to = raw.to;
  const hasRange = from !== undefined || to !== undefined;
  const parsed = collegeHallAvailabilitySchema.safeParse({hallId, from, to});
  let result: Awaited<ReturnType<typeof getCollegeHallAvailability>> | null = null;
  if (parsed.success) {
    try {
      result = await getCollegeHallAvailability(await getCurrentRequestContext(), parsed.data);
    } catch (error) {
      if (error instanceof CollegeHallAvailabilityNotFoundError) notFound();
      throw error;
    }
  }
  const bookingOptions = result?.hall.status === "ACTIVE"
    ? await listRecurringPreviewOptions(await getCurrentRequestContext()) : null;
  return <div className="min-w-0 space-y-6">
    <PageHeader eyebrow="College Admin · Lecture halls" title={result?.hall.name ?? "Room availability"}
      description="Persisted scheduled bookings, not a guarantee of open slots or live room occupancy."
      actions={<Link href="/college/lecture-halls"
        className="inline-flex min-h-11 items-center font-semibold text-primary-text">Back to lecture halls</Link>} />
    <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-5">
      <label className="grid min-w-40 flex-1 gap-2 text-sm font-semibold text-body">From (IST)
        <input name="from" type="date" required defaultValue={typeof from === "string" ? from : ""}
          className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
      </label>
      <label className="grid min-w-40 flex-1 gap-2 text-sm font-semibold text-body">To (IST)
        <input name="to" type="date" required defaultValue={typeof to === "string" ? to : ""}
          className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
      </label>
      <button type="submit" className="min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-on-primary">View schedule</button>
    </form>
    {!parsed.success && hasRange ? <ErrorState title="Invalid date range"
      description="Choose valid from/to dates in IST, up to 31 consecutive calendar days. No schedule was loaded." />
      : !result ? <p className="rounded-xl border border-border bg-surface p-6 text-sm text-body">
        Select an IST date range to inspect persisted sessions and configured capacity.
      </p> : <>
        <section className="grid gap-3 rounded-xl border border-border bg-surface p-5 sm:grid-cols-3">
          <p className="text-sm text-body"><span className="font-semibold">Capacity:</span> {result.hall.capacity} seats</p>
          <p className="text-sm text-body"><span className="font-semibold">Status:</span> {result.hall.status}</p>
          <p className="text-sm text-body"><span className="font-semibold">Scheduled:</span> {result.sessions.length}{result.truncated ? "+" : ""} sessions</p>
        </section>
        {bookingOptions ? <CollegeHallBookingAction hallId={result.hall.id}
          classes={bookingOptions.classes.map(row=>({...row,updatedAt:row.updatedAt.toISOString()}))}
          faculty={bookingOptions.faculty} /> : null}
        <section aria-label="Hall scheduled sessions" className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">{result.conflictCount} flagged booking{result.conflictCount === 1 ? "" : "s"} in selected range</h2>
          {result.truncated ? <p role="status" className="text-sm text-warning">More than 500 sessions match. This is a truncated read; conflict counts may be incomplete. Select a shorter range.</p> : null}
          {result.sessions.length === 0 ? <p className="rounded-xl border border-border bg-surface p-6 text-sm text-body">
            No persisted scheduled sessions overlap this date range. This is not confirmation that the hall is free for booking.
          </p> : <ul className="space-y-3">{result.sessions.map(item =>
            <li key={item.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                {item.hasConflict ? <strong className="text-sm text-error">Potential conflict</strong> :
                  <span className="text-sm text-muted-foreground">Scheduled</span>}
              </div>
              <p className="mt-2 text-sm text-body">{when(item.startsAt)} – {when(item.endsAt)} · {item.sectionName}</p>
              <p className="mt-1 text-xs text-muted-foreground">Class configured capacity: {item.sectionCapacity ?? "Unknown"}; hall capacity: {result.hall.capacity}</p>
              {item.overlapsAnother ? <p className="mt-2 text-sm text-error">Overlapping scheduled hall booking</p> : null}
              {item.overConfiguredCapacity ? <p className="mt-2 text-sm text-error">Configured class capacity exceeds the hall capacity</p> : null}
              {item.updatedAt ? <CollegeHallCancellationAction hallId={result.hall.id}
                sessionId={item.id} title={item.title} updatedAt={item.updatedAt} /> : null}
            </li>)}</ul>}
        </section>
      </>}
  </div>;
}
