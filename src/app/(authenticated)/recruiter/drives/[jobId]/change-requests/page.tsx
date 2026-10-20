import {PageBackLink} from "@/components/ui/page-back-link";
import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {Alert} from "@/components/ui/alert";
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
 return <div className="min-w-0 max-w-full space-y-4">
  <PageHeader title={data.job.title+" · Change requests"}
   description="Recruiter · Drive. Suggest changes to the college, reply to their questions and review recorded decisions."
   actions={<PageBackLink href={"/recruiter/drives/"+encodeURIComponent(jobId)} label="Back to drive"/>}/>
  {!data.storageReady?<Alert tone="warning">
   {data.pendingMessage} The college cannot receive changes here until registration is complete.</Alert>:
   <TpoDriveChangeRequests jobId={jobId} party={data.party} userId={context.user.id} requests={data.requests}/>}
 </div>;
}
