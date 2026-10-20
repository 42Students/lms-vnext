import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {Alert} from "@/components/ui/alert";
import {TpoDriveSelectionManager} from "@/components/placements/tpo-drive-selection-manager";
import {TpoSelectionImport} from "@/components/placements/tpo-selection-import";
import {hasMembershipRole} from "@/modules/identity/context";
import {PlacementsServiceError} from "@/modules/placements/errors";
import {getTpoSelectionWorkspace} from "@/modules/placements/tpo-drive-selection-service";

export const dynamic="force-dynamic";
export default async function TpoSelectionsPage({params}:{params:Promise<{jobId:string}>}){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const {jobId}=await params;
 let data:Awaited<ReturnType<typeof getTpoSelectionWorkspace>>;
 try{data=await getTpoSelectionWorkspace(context,jobId);}
 catch(e){if(e instanceof PlacementsServiceError&&e.code==="PLACEMENT_JOB_NOT_FOUND")notFound();throw e;}
 const root="/tpo/placements/jobs/"+encodeURIComponent(jobId);
 return <div className="min-w-0 space-y-4">
  <PageHeader eyebrow="TPO · Drive workspace" title={data.job.title+" · Selections"}
   description="Record the company's selections, verify placement rules, and release the offers."/>
  <nav aria-label="Selection related pages" className="flex min-w-0 flex-wrap items-center gap-3 text-sm font-semibold leading-5">
   <Link className="inline-flex min-h-11 items-center text-[var(--lms-link-text)] underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9" href={root+"/rounds"}>Review completed rounds</Link>

  </nav>
  {!data.storageReady?<Alert tone="warning">
    <strong>Selections are not available yet.</strong> {data.pendingMessage}
    No selections can be recorded or released until the migration is registered.
  </Alert>:data.job.status!=="PUBLISHED"?<Alert tone="warning">
    Selections can be recorded and released only on a published drive.
  </Alert>:<div className="min-w-0 space-y-4">
    <TpoDriveSelectionManager jobId={jobId} candidates={data.candidates} selections={data.selections} roleOptions={data.roleOptions}/>
    <details className="group min-w-0 border-t border-border pt-3">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-[var(--lms-link-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">Import the company's selection list <span aria-hidden="true" className="text-muted-foreground group-open:rotate-180">⌄</span></summary>
      <div className="pt-3"><TpoSelectionImport jobId={jobId} candidates={data.candidates}/></div>
    </details>
  </div>}
 </div>;
}
