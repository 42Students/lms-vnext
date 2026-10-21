import Link from "next/link";
import {PageBackLink} from "@/components/ui/page-back-link";
import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {Alert} from "@/components/ui/alert";
import {TpoDriveChangeRequests} from "@/components/placements/tpo-drive-change-requests";
import {getDriveChangeRequests} from "@/modules/placements/tpo-drive-change-request-service";
import {getRecruiterPlacementWorkspace} from "@/modules/placements/recruiter-workspace-service";
import {PlacementsServiceError} from "@/modules/placements/errors";
export const dynamic="force-dynamic";
export default async function RecruiterChangeRequestsPage({params}:{params:Promise<{jobId:string}>}){
 const context=await getCurrentRequestContext();
 const {jobId}=await params;
 let data:Awaited<ReturnType<typeof getDriveChangeRequests>>;
 try{data=await getDriveChangeRequests(context,jobId);}
 catch(e){if(e instanceof PlacementsServiceError&&e.code==="PLACEMENT_JOB_NOT_FOUND")notFound();throw e;}
 if(data.party!=="COMPANY")notFound();
 // The selected company x college grant scopes both the drive and its
 // unified Discussion, not merely a change-request record.
 const workspace=await getRecruiterPlacementWorkspace(context,jobId);
 return <div className="min-w-0 max-w-full space-y-4">
  <PageHeader title={data.job.title+" · Change requests"}
   description={"Recruiter Drives · "+workspace.college.name+". Suggest changes, discuss them with the placement cell and review recorded decisions."}
   actions={<PageBackLink href={"/recruiter/drives/"+encodeURIComponent(jobId)} label="Back to drive"/>}/>
  <nav aria-label="Drive communication" className="flex flex-wrap gap-4 border-b border-border pb-3 text-sm font-semibold">
   <Link href="/recruiter/drives" className="text-primary-text underline underline-offset-4">Drives</Link>
   <Link href={"/recruiter/drives/"+encodeURIComponent(jobId)} className="text-primary-text underline underline-offset-4">Drive details</Link>
   <Link href="/recruiter/messages" className="text-primary-text underline underline-offset-4">Discussion and messages</Link>
  </nav>
  {!data.storageReady?<Alert tone="warning">
   {data.pendingMessage} The college cannot receive changes here until registration is complete.</Alert>:
   <TpoDriveChangeRequests jobId={jobId} party={data.party} userId={context.user.id} requests={data.requests}/>}
 </div>;
}
