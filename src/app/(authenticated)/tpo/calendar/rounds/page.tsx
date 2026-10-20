import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {PageBackLink} from "@/components/ui/page-back-link";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { TpoRoundCalendarControl } from "@/components/placements/tpo-round-calendar-control";
import { hasMembershipRole } from "@/modules/identity/context";
import { listTpoCalendarRoundChoices } from "@/modules/placements/tpo-round-calendar-service";
import {getTpoBlockedDates} from "@/modules/placements/tpo-configuration-read-service";
export default async function TpoRoundCalendarPage({searchParams}:{
 searchParams:Promise<{page?:string|string[];q?:string|string[]}>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) redirect("/dashboard");
  const raw=await searchParams;
  const first=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;
  const [result,blockedDates] = await Promise.all([listTpoCalendarRoundChoices(context,{
   page:first(raw.page)||1,q:first(raw.q)||"",
  }),getTpoBlockedDates(context)]);
  const link=(page:number)=>"/tpo/calendar/rounds?"+new URLSearchParams({
   ...(result.q?{q:result.q}:{}),page:String(page),
  }).toString();
  return <div className="min-w-0 space-y-5">
    <PageBackLink href="/tpo/calendar" label="Calendar"/>
    <PageHeader title="Drive round scheduling"
      description="Schedule an existing pending drive round, reschedule an active one or cancel it. All times are IST." />
    <form method="get" className="flex min-w-0 flex-wrap items-end gap-3 border-b border-border pb-4 max-[767px]:flex-col max-[767px]:items-stretch">
     <label className="grid w-full min-w-0 flex-1 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] min-[768px]:min-w-56">Find rounds
      <Input type="search" name="q" maxLength={100} defaultValue={result.q}
       placeholder="Company, drive or round name" />
     </label>
     <Button type="submit" variant="primary" className="min-h-11 w-full px-4 min-[768px]:w-auto min-[768px]:min-h-9">Find</Button>
     <Link href="/tpo/calendar/rounds" className="lms-inline-link inline-flex min-h-11 items-center text-[14px] font-semibold text-[var(--lms-link-text)] underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] min-[768px]:min-h-9">Clear</Link>
    </form>
    <p role="status" className="text-[13px] text-[var(--lms-muted-text)]">Page {result.page}: {result.rows.length} rounds{result.limited?" · more available":""}</p>
    <TpoRoundCalendarControl blockedDates={blockedDates.ready?blockedDates.rows.map(row=>row.day):[]} blockedDatesAvailable={blockedDates.ready}
     choices={result.rows.map((row) => ({
      ...row, updatedAt: row.updatedAt.toISOString(),
      scheduledAt: row.scheduledAt?.toISOString() ?? null,
    }))} />
    <nav aria-label="Round pages" className="flex min-w-0 flex-wrap items-center gap-3">
     {result.page>1?<Link href={link(result.page-1)} className="lms-inline-link inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-3 py-2 text-[14px] font-semibold text-[var(--lms-link-text)] hover:border-[var(--lms-primary)] hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] min-[768px]:min-h-9">Previous 200</Link>:null}
     {result.limited?<Link href={link(result.page+1)} className="lms-inline-link inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-3 py-2 text-[14px] font-semibold text-[var(--lms-link-text)] hover:border-[var(--lms-primary)] hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] min-[768px]:min-h-9">Next 200</Link>:null}
    </nav>
    <p className="text-sm text-body">Venue checks use persisted on-campus bookings.
      Unknown duration is a blocker, not an assumed clear venue.
      A pending round is created under its drive before being scheduled here.</p>
  </div>;
}
