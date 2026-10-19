import Link from "next/link";
import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {TpoDriveChangeRequests} from "@/components/placements/tpo-drive-change-requests";
import {getDriveChangeRequests} from "@/modules/placements/tpo-drive-change-request-service";
import {PlacementsServiceError} from "@/modules/placements/errors";
export const dynamic="force-dynamic";
export default async function RecruiterChangeRequestsPage({params}:{params:Promise<{jobId:string}>}){
 const context=await getCurrentRequestContext();
 const {jobId}=await params;
 let data:Awaited<ReturnType<typeof getDriveChangeRequests>>;
 try{data=await getDriveChangeRequests(context,jobId);}
 catch(e){if(e instanceof PlacementsServiceError&&e.code==="PLACEMENT_JOB_NOT_FOUND")notFound();throw e;}
 if(data.party!=="COMPANY")notFound();
 return <div className="space-y-5">
  <PageHeader eyebrow="Recruiter · Drive" title={data.job.title+" · Change requests"}
   description="Suggest changes to the college, reply to their questions and review recorded decisions."
   actions={<Link href={"/recruiter/drives/"+encodeURIComponent(jobId)}
    className="inline-flex min-h-9 items-center rounded-[9px] border border-border px-4 text-sm font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-focus-ring)]">Back to drive</Link>}/>
  {!data.storageReady?<p role="status" className="border-b border-border pb-5 text-sm text-body">
   {data.pendingMessage} The college cannot receive changes here until registration is complete.</p>:
   <TpoDriveChangeRequests jobId={jobId} party={data.party} userId={context.user.id} requests={data.requests}/>}
 </div>;
}
