import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasMembershipRole} from "@/modules/identity/context";
import {PageHeader} from "@/components/ui/page-header";
import {Alert} from "@/components/ui/alert";
import {TpoDriveChangeRequests} from "@/components/placements/tpo-drive-change-requests";
import {TpoDriveRecruiterReviewInvite} from "@/components/placements/tpo-drive-recruiter-review-invite";
import {getDriveChangeRequests} from "@/modules/placements/tpo-drive-change-request-service";
import {PlacementsServiceError} from "@/modules/placements/errors";
export const dynamic="force-dynamic";
export default async function TpoChangeRequestsPage({params}:{params:Promise<{jobId:string}>}){
 const context=await getCurrentRequestContext();
 if(!context.membership||!(hasMembershipRole(context,"TPO")||hasMembershipRole(context,"COLLEGE_ADMIN")))redirect("/dashboard");
 const {jobId}=await params;
 let data:Awaited<ReturnType<typeof getDriveChangeRequests>>|null=null;
 let loadFailed=false;
 try{data=await getDriveChangeRequests(context,jobId);}
 catch(e){if(e instanceof PlacementsServiceError&&e.code==="PLACEMENT_JOB_NOT_FOUND")notFound();loadFailed=true;}
 return <div className="min-w-0 space-y-6">
  <PageHeader eyebrow="TPO · Drive workspace" title={(data?.job.title??"Drive")+" · Change requests"}
   description="Track requested company changes, review replies and agree or decline with a permanent record."
   actions={<Link href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)}
    className="inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold text-[var(--lms-link-text)] underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] min-[768px]:min-h-9 min-[768px]:w-auto">Back to drive</Link>}/>
  <section aria-label="Change request actions" className="flex flex-wrap items-center gap-3 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-3">
   <p className="min-w-0 flex-1 text-sm text-body">Request a change without leaving this drive workspace. Discussion remains attached to this drive.</p>
   <Link href="#new" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-primary-text underline md:min-h-9">
    Request a change
   </Link>
  </section>
  {!loadFailed&&data?.storageReady&&data.party==="TPO"?<TpoDriveRecruiterReviewInvite jobId={jobId}/>:null}
  {loadFailed||!data?<Alert tone="error">Couldn\u0027t load the change requests. <Link href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/change-requests"} className="font-semibold underline">Retry</Link></Alert>:
   !data.storageReady?<Alert tone="warning">
   {data.pendingMessage} Changes cannot be recorded until the platform migration is registered.</Alert>
   :<section id="new" aria-label="Drive change requests" className="min-w-0 scroll-mt-24 space-y-3">
     {data.requests.length===0?<Alert tone="info">
      {data.party==="TPO"
       ?"No change requests from this drive yet. Ask the company to clarify role, pay, location or schedule, or suggest a correction below."
       :"No change requests from the placement cell yet. Send a request or respond to the placement cell below."}
     </Alert>:null}
     <TpoDriveChangeRequests jobId={jobId} party={data.party} userId={context.user.id} requests={data.requests}/>
    </section>}
 </div>;
}
