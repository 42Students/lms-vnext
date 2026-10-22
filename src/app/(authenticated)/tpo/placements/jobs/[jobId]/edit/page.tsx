import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {PageBackLink} from "@/components/ui/page-back-link";
import {Alert} from "@/components/ui/alert";
import {StatusBadge} from "@/components/ui/status-badge";
import {ErrorState} from "@/components/ui/error-state";
import {TpoDriveEditForm} from "@/components/placements/tpo-drive-edit-form";
import {PlacementRoleOptions} from "@/components/placements/placement-role-options";
import {listPlacementRoleOptions} from "@/modules/placements/role-option-service";
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
 // Named non-primary packages are editable through the existing authorized
 // DRAFT-only role-option service. Live drives retain read-only packages.
 const roles=job.status==="DRAFT"?await listPlacementRoleOptions(context,job.id):[];
 return <div className="min-w-0 space-y-4">
  <PageHeader title={"Edit drive · "+job.title}
    description={"Saved "+new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(job.updatedAt))+" IST"}
    actions={<div className="flex flex-wrap items-center gap-2">
      <StatusBadge tone={job.editable?"info":"neutral"}>{job.status==="DRAFT"?"Draft":job.status==="PUBLISHED"?"Live":job.status}</StatusBadge>
      <PageBackLink href={"/tpo/placements/jobs/"+encodeURIComponent(job.id)} label="Open drive page"/>
      {job.editable?<a href="#drive-save-actions" className="inline-flex min-h-11 items-center rounded border border-primary bg-primary px-3 text-sm font-semibold text-on-primary md:min-h-9">Save changes</a>:null}
      {job.status==="DRAFT"?<Link href={"/tpo/placements/jobs/"+encodeURIComponent(job.id)+"?publish=1#drive-lifecycle-publish"} className="inline-flex min-h-11 items-center rounded border border-border px-3 text-sm font-semibold text-link md:min-h-9">Review &amp; publish</Link>:null}
    </div>}/>
  {job.editable?<TpoDriveEditForm job={job}/>:<section aria-label="Read-only drive history" className="space-y-4">
    <Alert tone="warning" aria-label="Drive edit unavailable">This drive is {job.status.toLowerCase()} and cannot be edited. All saved details are shown below for reference.</Alert>
    <dl className="grid min-w-0 gap-4 rounded-[12px] border border-border bg-surface p-4 sm:grid-cols-2">
      {([
        ["Role",job.title],["Status",job.status],["Job type",job.jobTypeLabel??job.employmentType],
        ["Description",job.description],["Location",job.locations.join(", ")||"Not recorded"],
        ["Openings",job.openings===null?"Not recorded":String(job.openings)],
        ["Minimum CTC",job.minimumAnnualCtcInr===null?"Not recorded":"₹"+job.minimumAnnualCtcInr],
        ["Maximum CTC",job.maximumAnnualCtcInr===null?"Not recorded":"₹"+job.maximumAnnualCtcInr],
        ["Application deadline",job.applicationDeadline??"Not recorded"],
        ["Eligible batches",job.allowedCohortIds.length?job.allowedCohortIds.length+" selected":"All batches"],
      ] as const).map(([label,value])=><div key={label} className="min-w-0 border-b border-border pb-2">
         <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
         <dd className="mt-1 break-words text-sm text-body">{value}</dd>
        </div>)}
    </dl>
    <Link href="/tpo/placements/new" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Create drive</Link>
   </section>}
  {job.status==="DRAFT"?<section aria-label="Named pay packages" className="space-y-3 border-t border-border pt-4">
   <h2 className="text-base font-semibold text-foreground">Pay packages</h2>
   <p className="text-sm text-body">Add, edit or remove separately named role packages before publishing.
    The primary role remains linked to the job form above.</p>
   <PlacementRoleOptions jobId={job.id} jobStatus={job.status} roles={roles}/>
  </section>:null}
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
