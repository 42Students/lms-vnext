import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {Alert} from "@/components/ui/alert";
import {TpoDriveEditForm} from "@/components/placements/tpo-drive-edit-form";
import {hasMembershipRole} from "@/modules/identity/context";
import {PlacementsServiceError} from "@/modules/placements/errors";
import {getTpoDriveEditState} from "@/modules/placements/tpo-drive-edit-service";
export default async function TpoDriveEditPage({params}:{params:Promise<{jobId:string}>}){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const {jobId}=await params;
 let job:Awaited<ReturnType<typeof getTpoDriveEditState>>;
 try{job=await getTpoDriveEditState(context,jobId);}catch(error){
  if(error instanceof PlacementsServiceError&&error.code==="PLACEMENT_JOB_NOT_FOUND")notFound();
  throw error;
 }
 return <div className="min-w-0 space-y-5">
  <Link href={"/tpo/placements/jobs/"+job.id} className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lms-link-text)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary)] md:min-h-9">← Drive workspace</Link>
  <PageHeader eyebrow="TPO · Drives" title="Edit drive" description={"Update "+job.title+" carefully. Save changes before returning to the drive."}/>
  {job.editable?<TpoDriveEditForm job={job}/>:<Alert tone="warning" aria-label="Drive edit unavailable">
   <p>{job.status==="CLOSED"||job.status==="CANCELLED"
    ?"This drive is closed: nothing here can be changed. To run it again, open Create drive and pick it under Clone a past drive."
    :"This drive is not editable. The saved details are preserved. Open the drive workspace to review them."}</p>
   <Link href="/tpo/placements/new" className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lms-teal-deep)] underline md:min-h-9">Create drive</Link>
  </Alert>}
 </div>;
}
