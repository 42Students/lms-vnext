import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {PageHeader} from "@/components/ui/page-header";
import {PlacementsServiceError} from "@/modules/placements/errors";
import {listHrInterviewSlots} from "@/modules/placements/hr-interview-slot-service";
import {getRecruiterPlacementWorkspace} from "@/modules/placements/recruiter-workspace-service";
export default async function RecruiterInterviewSlots({params}:{params:Promise<{jobId:string}>}){
 const context=await getCurrentRequestContext();
 if(!hasActiveRecruiter(context))redirect("/dashboard");
 const {jobId}=await params;
 if(!z.string().uuid().safeParse(jobId).success)notFound();
 let slots:Awaited<ReturnType<typeof listHrInterviewSlots>>;
 let workspace:Awaited<ReturnType<typeof getRecruiterPlacementWorkspace>>;
 try{
  [slots,workspace]=await Promise.all([
   listHrInterviewSlots(context,jobId),getRecruiterPlacementWorkspace(context,jobId),
  ]);
 }catch(error){
  if(error instanceof PlacementsServiceError&&error.code==="PLACEMENT_JOB_NOT_FOUND")notFound();
  throw error;
 }
 const rounds=workspace.rounds.filter(row=>row.kind==="INTERVIEW"&&
  (row.status==="PENDING"||row.status==="SCHEDULED"));
 const action="/api/placements/recruiter/drives/"+jobId+"/interview-slots";
 const minStart=new Intl.DateTimeFormat("sv-SE",{
    timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
    hour:"2-digit",minute:"2-digit",hourCycle:"h23",
  }).format(new Date()).replace(" ","T");
 const when=(d:Date)=>new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",
  dateStyle:"medium",timeStyle:"short"}).format(d)+" IST";
 return <main className="space-y-6">
  <PageHeader eyebrow="Recruiter · Interview coordination" title="Interview slots"
   description={workspace.job.title+" · This schedules employer time blocks only. No learner invitation or candidate booking is created here."}/>
  <nav className="flex flex-wrap gap-3">
   <Link href={"/recruiter/drives/"+jobId+"?tab=rounds"} className="inline-flex min-h-11 items-center text-primary-text">Drive rounds</Link>
   <Link href="/hr/calendar" className="inline-flex min-h-11 items-center text-primary-text">Recruiter calendar</Link>
  </nav>
  <>
   <section className="space-y-3 rounded-xl border border-border bg-surface p-4">
    <h2 className="font-semibold text-foreground">Propose an interviewer time block</h2>
    {rounds.length===0?<p role="status" className="text-sm text-body">
     No pending or scheduled interview round is available for this drive.{" "}
     <Link href={"/recruiter/drives/"+jobId+"/rounds/editor"}
      className="font-semibold text-primary-text">Review hiring rounds</Link>
     {" "}before proposing a slot.
    </p>:null}
    <form method="post" action={action} className="grid gap-3 sm:grid-cols-2">
     <input type="hidden" name="action" value="CREATE"/>
     <label className="grid gap-1 text-sm text-body">Interview round
      <select name="roundId" required defaultValue="" className="min-h-11 rounded-md border border-border bg-surface px-3">
       <option value="" disabled>Select an interview round</option>
       {rounds.map(row=><option key={row.id} value={row.id}>{row.sequence}. {row.name}</option>)}
      </select>
     </label>
     <label className="grid gap-1 text-sm text-body">Mode
      <select name="mode" required defaultValue="VIRTUAL" className="min-h-11 rounded-md border border-border bg-surface px-3">
       <option value="VIRTUAL">Virtual</option><option value="ON_CAMPUS">On campus</option>
      </select>
     </label>
     <label className="grid gap-1 text-sm text-body">Start (IST)
      <input name="startAt" type="datetime-local" min={minStart} required className="min-h-11 rounded-md border border-border bg-surface px-3"/>
     </label>
     <label className="grid gap-1 text-sm text-body">End (IST)
      <input name="endAt" type="datetime-local" min={minStart} required className="min-h-11 rounded-md border border-border bg-surface px-3"/>
     </label>
     <label className="grid gap-1 text-sm text-body">Capacity
      <input name="capacity" type="number" min={1} max={100} defaultValue={1}
       required className="min-h-11 rounded-md border border-border bg-surface px-3"/>
     </label>
     <label className="grid gap-1 text-sm text-body">Panel label (not a learner name)
      <input name="panelLabel" maxLength={160} className="min-h-11 rounded-md border border-border bg-surface px-3"/>
     </label>
     <label className="grid gap-1 text-sm text-body sm:col-span-2">Meeting location
      <input name="meetingLocation" maxLength={500} className="min-h-11 rounded-md border border-border bg-surface px-3"/>
     </label>
     <button type="submit" disabled={!rounds.length} className="min-h-11 rounded-md bg-primary px-4 font-semibold text-on-primary sm:col-span-2 disabled:opacity-50">Propose slot</button>
    </form>
   </section>
   <section className="space-y-3">
    <h2 className="font-semibold text-foreground">Time blocks ({slots.items.length})</h2>
    {slots.items.map(slot=><article key={slot.id} className="space-y-3 rounded-xl border border-border bg-surface p-4">
     <p className="font-semibold text-foreground">{when(slot.startAt)} – {when(slot.endAt)}</p>
     <p className="text-sm text-body">
      {slot.status==="OFFERED"?"Waiting for the placement cell":
        slot.status==="BOOKED"?"Reserved internally; confirm with placement cell":
        slot.status==="CANCELLED"?"Cancelled":slot.status==="PROPOSED"?"Not sent yet":slot.status}
      {" · "}{slot.mode} · Internal reservations: {slot.bookedCount}/{slot.capacity}
     </p>
     {slot.panelLabel?<p className="text-sm text-body">Panel: {slot.panelLabel}</p>:null}
     {slot.meetingLocation?<p className="text-sm text-body">Venue: {slot.meetingLocation}</p>:
       <p className="text-xs text-muted-foreground">Room or joining details not recorded yet.</p>}
     {slot.canEdit?<form action={action} method="post" className="flex flex-wrap gap-2">
      <input type="hidden" name="slotId" value={slot.id}/>
      <input type="hidden" name="expectedVersion" value={slot.version}/>
      {slot.status==="PROPOSED"?<button type="submit" name="action" value="OFFER"
        className="min-h-11 rounded-md border border-border px-4 text-primary-text">Offer time to college</button>:null}
      {(slot.status==="OFFERED"||slot.status==="BOOKED")&&slot.bookedCount<slot.capacity?<button type="submit" name="action" value="BOOK"
        className="min-h-11 rounded-md border border-border px-4 text-primary-text">Reserve one internal slot</button>:null}
      {(slot.status==="PROPOSED"||slot.status==="OFFERED")?<button type="submit" name="action" value="CANCEL"
        className="min-h-11 rounded-md border border-border px-4 text-primary-text">Cancel time block</button>:null}
     </form>:<p className="text-sm text-muted-foreground">
      {slot.isOwn?"This time block has started or passed; further changes are disabled.":
       "This time block was created by another recruiter and is read-only for your account."}
     </p>}
    </article>)}
    {!slots.items.length?<p role="status" className="text-sm text-body">No persisted employer time blocks for this drive.</p>:null}
   </section>
  </>
 </main>;
}
