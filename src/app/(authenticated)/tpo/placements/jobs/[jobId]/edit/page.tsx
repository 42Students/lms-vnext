import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
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
 return <div className="space-y-5">
  <Link href={"/tpo/placements/jobs/"+job.id} className="text-sm font-semibold text-primary-text hover:underline">← Drive workspace</Link>
  <PageHeader eyebrow="TPO · Drives" title="Edit drive" description={"Update "+job.title+" carefully. Save changes before returning to the drive."}/>
  {job.editable?<TpoDriveEditForm job={job}/>:<p role="status" className="rounded-xl border border-border bg-surface p-5 text-sm text-body">This drive is read-only. Only drafts in an active placement season are editable.</p>}
 </div>;
}
