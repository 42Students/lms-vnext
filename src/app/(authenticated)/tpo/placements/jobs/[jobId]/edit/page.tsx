import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {PageBackLink} from "@/components/ui/page-back-link";
import {Alert} from "@/components/ui/alert";
import {ErrorState} from "@/components/ui/error-state";
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
  return <div className="min-w-0 space-y-4">
   <PageHeader title="Some drive setup data could not be loaded"
     actions={<PageBackLink href="/tpo/placements" label="Back to drives"/>}/>
   <ErrorState title="Could not load this drive"
     description="Loading the existing drive or its setup data failed. No unsaved changes were applied."
     action={<Link href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/edit"}
       className="inline-flex min-h-11 items-center text-link underline md:min-h-9">Retry setup data</Link>}/>
  </div>;
 }
 return <div className="min-w-0 space-y-4">
  <PageHeader eyebrow="TPO · Drives" title="Edit drive" description={"Update "+job.title+" carefully. Save changes before returning to the drive."}
    actions={<PageBackLink href={"/tpo/placements/jobs/"+encodeURIComponent(job.id)} label="Drive workspace" />}/>
  {job.editable?<TpoDriveEditForm job={job}/>:<Alert tone="warning" aria-label="Drive edit unavailable">
   <p>{job.status==="CLOSED"||job.status==="CANCELLED"
    ?"This drive is closed: nothing here can be changed. To run it again, open Create drive and pick it under Clone a past drive."
    :"This drive is not editable. The saved details are preserved. Open the drive workspace to review them."}</p>
   <Link href="/tpo/placements/new" className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lms-teal-deep)] underline md:min-h-9">Create drive</Link>
  </Alert>}
  <section aria-label="Other drive settings" className="space-y-2 border-t border-border pt-4">
   <h2 className="text-base font-semibold text-foreground">Company, eligibility and rounds</h2>
   <p className="text-sm text-muted-foreground">
     Core job details are edited above. Additional settings remain in the audited drive workspace; changing them does not silently amend submitted applications.
   </p>
   <nav className="flex flex-wrap gap-3 text-sm font-semibold">
    <Link href={"/tpo/placements/jobs/"+encodeURIComponent(job.id)+"/about"} className="inline-flex min-h-11 items-center text-link underline md:min-h-9">Company and role</Link>
    <Link href={"/tpo/placements/jobs/"+encodeURIComponent(job.id)+"/rounds"} className="inline-flex min-h-11 items-center text-link underline md:min-h-9">Selection rounds</Link>
    <Link href={"/tpo/placements/jobs/"+encodeURIComponent(job.id)+"/change-requests"} className="inline-flex min-h-11 items-center text-link underline md:min-h-9">Changes and approvals</Link>
   </nav>
  </section>
 </div>;
}
