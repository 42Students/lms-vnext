import Link from "next/link";
import {Alert} from "@/components/ui/alert";
import {EmptyState} from "@/components/ui/empty-state";
import {PageBackLink} from "@/components/ui/page-back-link";
import {notFound,redirect} from "next/navigation";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {PageHeader} from "@/components/ui/page-header";
import {RecruiterInterviewSlotForm,RecruiterInterviewSlotActions} from "@/components/placements/recruiter-interview-slot-form";
import {PlacementsServiceError} from "@/modules/placements/errors";
import {listHrInterviewSlots} from "@/modules/placements/hr-interview-slot-service";
import {getRecruiterPlacementWorkspace} from "@/modules/placements/recruiter-workspace-service";
export default async function RecruiterInterviewSlots({params}:{params:Promise<{jobId:string}>}){
 const context=await getCurrentRequestContext();
 if(!hasActiveRecruiter(context) || context.recruiter?.userId !== context.user.id)redirect("/dashboard");
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
 const when=(d:Date)=>new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",
  dateStyle:"medium",timeStyle:"short"}).format(d)+" IST";
 return <div className="min-w-0 max-w-full space-y-6">
  <PageHeader eyebrow="Recruiter · Interview coordination" title="Interview slots"
   description={workspace.job.title+" · This schedules employer time blocks only. No learner invitation or candidate booking is created here."}/>
  <Alert tone="info">
    Time blocks proposed here are visible to the placement cell. They are not confirmed interview appointments until the placement cell coordinates the schedule.
  </Alert>
  <nav className="flex flex-wrap gap-3">
   <PageBackLink href={"/recruiter/drives/"+jobId+"?tab=rounds"} label="Drive rounds"/>
   <Link href="/hr/calendar" className="inline-flex min-h-11 items-center text-sm font-medium text-primary-text md:min-h-9 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Recruiter calendar</Link>
  </nav>
  <>
   <section className="space-y-3 border-b border-border pb-4">
    <h2 className="font-semibold text-foreground">Propose an interviewer time block</h2>
    {rounds.length===0?<Alert tone="warning">
     No pending or scheduled interview round is available for this drive.{" "}
     <Link href={"/recruiter/drives/"+jobId+"/rounds/editor"}
      className="font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Review hiring rounds</Link>
     {" "}before proposing a slot.
    </Alert>:null}
    <RecruiterInterviewSlotForm action={action} rounds={rounds.map(row=>({
      id:row.id,name:row.name,sequence:row.sequence,
    }))}/>
   </section>
   <section className="space-y-3">
    <h2 className="font-semibold text-foreground">Time blocks ({slots.items.length})</h2>
    {slots.items.map(slot=><article key={slot.id} className="min-w-0 space-y-3 border-b border-border pb-5 last:border-b-0">
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
     {slot.canEdit?<RecruiterInterviewSlotActions action={action}
      slot={{id:slot.id,version:slot.version,status:slot.status,
        bookedCount:slot.bookedCount,capacity:slot.capacity}}/>:<p className="text-sm text-muted-foreground">
      {slot.isOwn?"This time block has started or passed; further changes are disabled.":
       "This time block was created by another recruiter and is read-only for your account."}
     </p>}
    </article>)}
    {!slots.items.length?<EmptyState title="No persisted employer time blocks for this drive."/>:null}
   </section>
  </>
 </div>;
}
