import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { TpoRoundCalendarControl } from "@/components/placements/tpo-round-calendar-control";
import { hasMembershipRole } from "@/modules/identity/context";
import { listTpoCalendarRoundChoices } from "@/modules/placements/tpo-round-calendar-service";
export default async function TpoRoundCalendarPage({searchParams}:{
 searchParams:Promise<{page?:string|string[];q?:string|string[]}>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) redirect("/dashboard");
  const raw=await searchParams;
  const first=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;
  const result = await listTpoCalendarRoundChoices(context,{
   page:first(raw.page)||1,q:first(raw.q)||"",
  });
  const link=(page:number)=>"/tpo/calendar/rounds?"+new URLSearchParams({
   ...(result.q?{q:result.q}:{}),page:String(page),
  }).toString();
  return <div className="space-y-5">
    <Link href="/tpo/calendar" className="text-sm font-semibold text-primary-text hover:underline">
      ← Calendar
    </Link>
    <PageHeader eyebrow="TPO · Calendar" title="Drive round scheduling"
      description="Schedule an existing pending drive round, reschedule an active one or cancel it. All times are IST." />
    <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-border p-4">
     <label className="grid min-w-56 flex-1 gap-1 text-sm font-semibold">Find rounds
      <input type="search" name="q" maxLength={100} defaultValue={result.q}
       placeholder="Company, drive or round name" className="min-h-11 rounded border border-border px-3"/>
     </label>
     <button type="submit" className="min-h-11 rounded bg-primary px-4 font-semibold text-on-primary">Find</button>
     <Link href="/tpo/calendar/rounds" className="inline-flex min-h-11 items-center text-primary-text underline">Clear</Link>
    </form>
    <p role="status" className="text-sm">Page {result.page}: {result.rows.length} rounds{result.limited?" · more available":""}</p>
    <TpoRoundCalendarControl choices={result.rows.map((row) => ({
      ...row, updatedAt: row.updatedAt.toISOString(),
      scheduledAt: row.scheduledAt?.toISOString() ?? null,
    }))} />
    <nav aria-label="Round pages" className="flex flex-wrap gap-3">
     {result.page>1?<Link href={link(result.page-1)} className="min-h-10 rounded border px-3 py-2 text-primary-text">Previous 200</Link>:null}
     {result.limited?<Link href={link(result.page+1)} className="min-h-10 rounded border px-3 py-2 text-primary-text">Next 200</Link>:null}
    </nav>
    <p className="text-sm text-body">Venue checks use persisted on-campus bookings.
      Unknown duration is a blocker, not an assumed clear venue.
      A pending round is created under its drive before being scheduled here.</p>
  </div>;
}
