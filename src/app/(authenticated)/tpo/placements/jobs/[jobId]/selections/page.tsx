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
import {getPlacementDriveDay} from "@/modules/placements/drive-day-service";

export const dynamic="force-dynamic";
export default async function TpoSelectionsPage({params}:{params:Promise<{jobId:string}>}){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const {jobId}=await params;
 let data:Awaited<ReturnType<typeof getTpoSelectionWorkspace>>;
 try{data=await getTpoSelectionWorkspace(context,jobId);}
 catch(e){if(e instanceof PlacementsServiceError&&e.code==="PLACEMENT_JOB_NOT_FOUND")notFound();throw e;}
 const root="/tpo/placements/jobs/"+encodeURIComponent(jobId);
 const roundsResult=await getPlacementDriveDay(context,jobId).then(value=>({ok:true as const,value}))
   .catch(()=>({ok:false as const}));
 const readyToApply=roundsResult.ok?roundsResult.value.rounds
   .map(round=>({id:round.id,name:round.name,
     count:round.participants.filter(participant=>participant.result?.status==="STAGED").length}))
   .find(round=>round.count>0):null;
 const toVerify=data.selections.filter(row=>row.status==="SELECTED").length;
 const toRelease=data.selections.filter(row=>row.status==="VERIFIED").length;
 const shareableApplicants=data.candidates.length;
 const eligibleActions=data.storageReady&&data.job.status==="PUBLISHED";
 return <div className="min-w-0 space-y-4">
  <PageHeader eyebrow="TPO · Drive workspace" title={data.job.title+" · Selections"}
   description="Record the company's selections, verify placement rules, and release the offers."
   actions={<Link href={root+"/offers"} className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-[var(--lms-link-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] sm:w-auto md:min-h-9">Offer register</Link>}/>
  {eligibleActions?<section aria-label="Next selection actions"
    className="space-y-3 border-b border-[var(--lms-canvas-border)] pb-4">
    <h2 className="text-base font-semibold text-[var(--lms-heading)]">Next action for this drive</h2>
    <div className="flex min-w-0 flex-wrap gap-2">
      {readyToApply?<Link href={root+"/rounds/"+encodeURIComponent(readyToApply.id)+"/results"}
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] bg-[var(--lms-primary)] px-4 text-sm font-semibold text-white md:min-h-9">
        Apply {readyToApply.name} results · {readyToApply.count}
      </Link>:null}
      {toVerify>0?<a href="#selections-release-actions"
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] px-3 text-sm font-semibold text-[var(--lms-link-text)] md:min-h-9">
        Verify {toVerify} selections
      </a>:null}
      {toRelease>0?<a href="#selections-release-actions"
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] px-3 text-sm font-semibold text-[var(--lms-link-text)] md:min-h-9">
        Release {toRelease} verified selections
      </a>:null}
      {shareableApplicants>0?<Link href={root+"/share-preview"}
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] px-3 text-sm font-semibold text-[var(--lms-link-text)] md:min-h-9">
        Share {shareableApplicants} eligible applicants with company
      </Link>:null}
    </div>
    {!roundsResult.ok?<p className="text-xs text-muted-foreground">
      Round-result counts could not be verified. Open Rounds to inspect outstanding results.
    </p>:null}
    {!readyToApply&&toVerify===0&&toRelease===0&&shareableApplicants===0?
      <p className="text-sm text-body">No recorded result, selection or applicant action is waiting here.</p>:null}
  </section>:null}
  <nav aria-label="Selection related pages" className="flex min-w-0 flex-wrap items-center gap-3 text-sm font-semibold leading-5">
   <Link className="inline-flex min-h-11 items-center text-[var(--lms-link-text)] underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9" href={root+"/rounds"}>Review completed rounds</Link>

  </nav>
  {!data.storageReady?<Alert tone="warning">
    <strong>Selections are not available yet.</strong> {data.pendingMessage}
    No selections can be recorded or released until the migration is registered.
  </Alert>:data.job.status!=="PUBLISHED"?<Alert tone="warning">
    Selections can be recorded and released only on a published drive.
  </Alert>:<div className="min-w-0 space-y-4">
    <section id="selections-release-actions" aria-label="Record, verify and release selections">
      <TpoDriveSelectionManager jobId={jobId} candidates={data.candidates} selections={data.selections} roleOptions={data.roleOptions}/>
    </section>
    <details className="group min-w-0 border-t border-border pt-3">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-[var(--lms-link-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] [&::-webkit-details-marker]:hidden">Import the company's selection list <span aria-hidden="true" className="text-muted-foreground group-open:rotate-180">⌄</span></summary>
      <div className="pt-3"><TpoSelectionImport jobId={jobId} candidates={data.candidates}/></div>
    </details>
  </div>}
 </div>;
}
