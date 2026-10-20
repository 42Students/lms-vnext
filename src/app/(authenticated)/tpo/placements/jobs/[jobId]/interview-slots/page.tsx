import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Interview slot proposals"
    description={data.job.title+" · Employer-proposed time blocks for your college."}
    actions={<Link href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)}
      className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-link md:w-auto hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">← Back to drive</Link>} />
  <Alert tone="info">
   Proposals and employer-internal reservations are not confirmed student interviews. The placement cell must arrange its own rooms, candidates and confirmed schedule separately.
  </Alert>
  {data.slots.length?<ol className="min-w-0 divide-y divide-border border-y border-border">{data.slots.map(slot=><li key={slot.id}
    className="min-w-0 py-4">
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
      <h2 className="min-w-0 flex-1 break-words text-base font-semibold text-foreground">{slot.roundName}</h2>
      <Badge tone={slot.status==="BOOKED"?"success":slot.status==="OFFERED"?"warning":slot.status==="CANCELLED"?"neutral":"info"}>{slot.status==="PROPOSED"?"Not sent yet":
        slot.status==="OFFERED"?"Waiting for the placement cell":
        slot.status==="BOOKED"?"Reserved internally; confirm with placement cell":
        slot.status==="CANCELLED"?"Cancelled":"Status unavailable"}</Badge>
    </div>
    <p className="mt-2 break-words text-sm leading-5 text-body">{when(slot.startAt)} – {when(slot.endAt)}</p>
    <dl className="mt-3 grid min-w-0 gap-3 border-t border-border pt-3 text-sm sm:grid-cols-2">
      <div className="min-w-0"><dt className="text-xs text-muted-foreground">Capacity</dt><dd className="mt-1 break-words font-semibold text-body">{slot.capacity}</dd></div>
      <div className="min-w-0"><dt className="text-xs text-muted-foreground">Mode</dt><dd className="mt-1 break-words font-semibold text-body">{slot.mode==="ON_CAMPUS"?"On campus":"Virtual"}</dd></div>
      <div className="min-w-0"><dt className="text-xs text-muted-foreground">Panel</dt><dd className="mt-1 break-words font-semibold text-body">{slot.panelLabel??"Not recorded"}</dd></div>
      <div className="min-w-0"><dt className="text-xs text-muted-foreground">Venue</dt><dd className="mt-1 break-words font-semibold text-body">{slot.meetingLocation??"Room not confirmed"}</dd></div>
    </dl>
  </li>)}</ol>:<EmptyState title="No recruiter interview slot proposals were recorded for this drive."/>}
  {data.capReached?<Alert tone="warning">Showing the first 200 proposals. Contact the placement cell administrator for older records.</Alert>:null}
 </div>;
}
