import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {ZodError} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasMembershipRole} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {PlacementsServiceError} from "@/modules/placements/errors";
import {listTpoRecruiterProposedSlots} from "@/modules/placements/tpo-recruiter-slot-review-service";

export default async function TpoRecruiterSlotReviewPage({params}:{
 params:Promise<{jobId:string}>;
}){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const {jobId}=await params;
 let data:Awaited<ReturnType<typeof listTpoRecruiterProposedSlots>>;
 try{data=await listTpoRecruiterProposedSlots(context,jobId);}
 catch(error){
  if(error instanceof ZodError||error instanceof AuthorizationError||
    error instanceof PlacementsServiceError&&error.code==="PLACEMENT_JOB_NOT_FOUND")notFound();
  throw error;
 }
 const when=(date:Date)=>new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short",
 }).format(date)+" IST";
 return <div className="min-w-0 space-y-5">
  <PageHeader title="Interview slot proposals"
    description={data.job.title+" · Employer-proposed time blocks for your college."}
    actions={<Link href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)}
      className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-primary-text md:min-h-9">← Back to drive</Link>} />
  <Alert tone="info">
   Proposals and employer-internal reservations are not confirmed student interviews. The placement cell must arrange its own rooms, candidates and confirmed schedule separately.
  </Alert>
  {data.slots.length?<ol className="divide-y divide-border">{data.slots.map(slot=><li key={slot.id}
    className="py-4">
    <h2 className="font-semibold text-foreground">{slot.roundName}</h2>
    <p className="mt-1 text-sm text-body">{when(slot.startAt)} – {when(slot.endAt)}</p>
    <p className="mt-1 text-sm text-body">{slot.status==="PROPOSED"?"Not sent yet":
      slot.status==="OFFERED"?"Waiting for the placement cell":
      slot.status==="BOOKED"?"Reserved internally; confirm with placement cell":
      slot.status==="CANCELLED"?"Cancelled":"Status unavailable"}</p>
    <dl className="mt-3 grid min-w-0 gap-[var(--lms-space-2)] text-sm min-[768px]:grid-cols-2">
      <div><dt className="text-muted-foreground">Capacity</dt><dd>{slot.capacity}</dd></div>
      <div><dt className="text-muted-foreground">Mode</dt><dd>{slot.mode==="ON_CAMPUS"?"On campus":"Virtual"}</dd></div>
      <div><dt className="text-muted-foreground">Panel</dt><dd>{slot.panelLabel??"Not recorded"}</dd></div>
      <div><dt className="text-muted-foreground">Venue</dt><dd>{slot.meetingLocation??"Room not confirmed"}</dd></div>
    </dl>
  </li>)}</ol>:<EmptyState title="No recruiter interview slot proposals were recorded for this drive."/>}
  {data.capReached?<Alert tone="warning">Showing the first 200 proposals. Contact the placement cell administrator for older records.</Alert>:null}
 </div>;
}
