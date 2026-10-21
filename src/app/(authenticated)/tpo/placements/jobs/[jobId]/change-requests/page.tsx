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
  {!loadFailed&&data?.storageReady&&data.party==="TPO"?<TpoDriveRecruiterReviewInvite jobId={jobId}/>:null}
  {loadFailed||!data?<Alert tone="error">Couldn\u0027t load the change requests. <Link href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/change-requests"} className="font-semibold underline">Retry</Link></Alert>:
   !data.storageReady?<Alert tone="warning">
   {data.pendingMessage} Changes cannot be recorded until the platform migration is registered.</Alert>
   :<TpoDriveChangeRequests jobId={jobId} party={data.party} userId={context.user.id} requests={data.requests}/>}
 </div>;
}
