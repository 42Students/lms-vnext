import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {PageBackLink} from "@/components/ui/page-back-link";
import {Alert} from "@/components/ui/alert";
import {TpoDriveDeadlineForm} from "@/components/placements/tpo-drive-deadline-form";
import {hasMembershipRole} from "@/modules/identity/context";
import {PlacementsServiceError} from "@/modules/placements/errors";
import {getTpoDriveDeadlineState} from "@/modules/placements/tpo-drive-deadline-service";
export default async function TpoExtendDeadlinePage({params}:{params:Promise<{jobId:string}>}){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const {jobId}=await params;
 let job:Awaited<ReturnType<typeof getTpoDriveDeadlineState>>;
 try{job=await getTpoDriveDeadlineState(context,jobId);}catch(error){
  if(error instanceof PlacementsServiceError&&error.code==="PLACEMENT_JOB_NOT_FOUND")notFound();
  throw error;
 }
 return <div className="min-w-0 max-w-full space-y-4">
  <PageHeader title={job.title}
   description={job.applicationDeadline?"Extend a published application deadline with a validated IST date and immutable audit.":"Set the first application deadline on this published drive, with a validated IST date and immutable audit."}
   actions={<PageBackLink href={"/tpo/placements/jobs/"+job.id} label="Drive workspace"/>}/>
  {job.extendable?<TpoDriveDeadlineForm job={job}/>:<Alert tone="warning">
   Only published active-season drives can set or extend their application deadline.</Alert>}
 </div>;
}
