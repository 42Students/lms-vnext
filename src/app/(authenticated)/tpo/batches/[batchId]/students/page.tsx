import {batchStudentViewExportHref} from "@/modules/placements/tpo-batch-student-filtered-export-model";
import {selectTpoBatchStudentView} from "@/modules/placements/tpo-batch-student-selection-model";
import {summarizeBatchStudentEvidence} from "@/modules/placements/tpo-batch-student-evidence-summary-model";
import Link from "next/link";
import { TpoBatchWorkspaceTabs } from "@/components/tpo/tpo-batch-workspace-tabs";
import {tpoEligibilityImportScaffoldHref} from "@/modules/placements/tpo-eligibility-import-scaffold-model";
import {TpoAcademicImportPreview} from "@/components/tpo/tpo-academic-import-preview";
import {TpoBatchEligibilityImport} from "@/components/tpo/tpo-batch-eligibility-import";
import {TpoBatchInlineDecision} from "@/components/tpo/tpo-batch-inline-decision";
import {TpoBulkActionPanel} from "@/components/tpo/tpo-bulk-action-panel";
import { getCurrentRequestContext } from "@/auth/request-context";
import {getTpoBatchStudentRegistrations} from "@/modules/placements/tpo-batch-student-registration-service";
import {getTpoBatch} from "@/modules/placements/tpo-batch-workspace-read-service";
import { z } from "zod";
import {parseBatchStudentSearchParams,batchStudentPageHref} from "@/modules/placements/tpo-batch-student-view-model";
export const dynamic="force-dynamic";
const pageSchema=z.coerce.number().int().min(1).max(100000).default(1);
export default async function BatchStudents({params,searchParams}:{params:Promise<{batchId:string}>;searchParams:Promise<{page?:string|string[];q?:string|string[];decision?:string|string[];source?:string|string[];registration?:string|string[];order?:string|string[]}>}){
 const {batchId}=await params,raw=await searchParams;
 const parsed=pageSchema.safeParse(Array.isArray(raw.page)?raw.page[0]:raw.page??1);
 if(!parsed.success)return <p role="alert">Invalid page number. <Link href={"/tpo/batches/"+batchId+"/students"}>Start again</Link></p>;
 const view=parseBatchStudentSearchParams(raw);
 if(!view.success)return <p role="alert">Invalid student search. <Link href={"/tpo/batches/"+batchId+"/students"}>Reset filters</Link></p>;
 const ctx=await getCurrentRequestContext();
 const [result,batchScope]=await Promise.all([getTpoBatchStudentRegistrations(ctx,batchId,parsed.data),getTpoBatch(ctx,batchId)]);
 const finished=Boolean(batchScope.lifecycle?.finishedAt);
 const visible=selectTpoBatchStudentView(result.students,view.data,result.registrationAvailable);
 const pageSummary=summarizeBatchStudentEvidence(result.students);
 const href=(page:number)=>batchStudentPageHref(batchId,page,view.data);
 return <main className="min-w-0 space-y-4"><h1 className="text-xl font-semibold">{result.batch.name} — Students</h1>
 <TpoBatchWorkspaceTabs batchId={batchId} active="students" />
 <div className="flex flex-wrap items-center justify-between gap-2">
  <p className="text-xs text-muted-foreground">CSV includes only this page (up to 25 students), with decision source and review flags.</p>
  <a href={"/api/placements/tpo/batches/"+batchId+"/students/export?page="+result.page}
   className="inline-flex min-h-11 items-center rounded border border-border px-3 text-sm">Export current page CSV</a>
 </div>
 <a href={tpoEligibilityImportScaffoldHref(batchId,result.page)} className="inline-flex min-h-11 items-center rounded border border-border px-4 text-sm text-primary-text">Download blank eligibility import CSV (this page)</a>
 {finished?<p role="status" className="rounded border border-border bg-muted p-3 text-sm">This batch is finished. Eligibility decisions and import actions are read-only.</p>:<TpoBatchEligibilityImport batchId={batchId}/>}
 {!finished?<TpoBulkActionPanel key={batchId+":"+result.page+":"+view.data.q+":"+view.data.decision}
   target="STUDENTS" rows={visible.map(student=>({
    id:student.membershipId,label:student.name+" · "+(student.rollNumber??student.membershipId),
   }))} />:null}
 <p className="text-xs text-muted-foreground">Bulk changes apply only to selected learners on this page.
  Clearing a direct override restores the recorded class or batch decision; it does not guarantee eligibility.
  Every change is confirmed and audited. Review skipped learners before retrying.</p>
 <TpoAcademicImportPreview activeIds={result.students.map(s=>s.membershipId)}/>
 <Link href={"/tpo/batches/"+batchId+"/nudge-prep"} className="inline-flex min-h-11 items-center rounded border border-border px-4 text-primary-text">Prepare follow-up for unrecorded choices</Link>
 <p className="text-sm text-muted-foreground">Registration choices are separate from eligibility; missing choices do not imply consent.</p>
 {!result.registrationAvailable?<p role="status" className="text-sm">Registration records unavailable.</p>:null}
 <form action={"/tpo/batches/"+batchId+"/students"} method="get" className="flex flex-wrap items-end gap-2 rounded border border-border bg-surface p-3"><label className="min-w-0 flex-1 text-sm">Search names on this page<input type="search" name="q" defaultValue={view.data.q} maxLength={100} className="mt-1 min-h-11 w-full rounded border border-border bg-surface px-3"/></label><label className="text-sm">Eligibility decision<select name="decision" defaultValue={view.data.decision} className="mt-1 block min-h-11 rounded border border-border bg-surface px-3"><option value="ALL">All decisions</option><option value="ELIGIBLE">Eligible</option><option value="INELIGIBLE">Ineligible</option><option value="NOT_DECIDED">Not decided</option><option value="NEEDS_REVIEW">Ambiguous / needs review</option></select></label><label className="text-sm">Decision source<select name="source" defaultValue={view.data.source} className="mt-1 block min-h-11 rounded border border-border bg-surface px-3"><option value="ALL">Any source</option><option value="LEARNER">Learner override</option><option value="CLASS">Class</option><option value="BATCH">Batch</option><option value="NONE">No recorded decision</option></select></label><label className="text-sm">Registration choice<select name="registration" defaultValue={view.data.registration} className="mt-1 block min-h-11 rounded border border-border bg-surface px-3"><option value="ALL">Any evidence</option><option value="RECORDED">Choice recorded</option><option value="UNRECORDED">No choice recorded</option></select></label><label className="text-sm">Sort this page<select name="order" defaultValue={view.data.order} className="mt-1 block min-h-11 rounded border border-border bg-surface px-3"><option value="NAME_ASC">Name A–Z</option><option value="NAME_DESC">Name Z–A</option><option value="REVIEW_FIRST">Needs review first</option></select></label><button type="submit" className="min-h-11 rounded bg-primary px-4 text-on-primary">Filter</button></form>
 {!result.registrationAvailable&&view.data.registration!=="ALL"?<p role="status">Registration filtering unavailable; no learners are classified without records.</p>:null}
 <a href={batchStudentViewExportHref(batchId,result.page,view.data)} className="inline-flex min-h-11 items-center rounded border border-border px-4 text-sm text-primary-text">Export filtered current page CSV</a>
 <p className="text-xs text-muted-foreground">Search applies to the currently loaded 25 active learners, not every member of this batch. {visible.length} of {result.students.length} on this page match.</p>
 <dl aria-label="Loaded-page eligibility evidence" className="grid grid-cols-2 gap-2 sm:grid-cols-3">{[["Loaded",pageSummary.assessed],["Eligible",pageSummary.eligible],["Ineligible",pageSummary.ineligible],["Not decided",pageSummary.undecided],["Needs review",pageSummary.needsReview],["Direct overrides",pageSummary.directOverrides]].map(([name,count])=><div key={name} className="rounded border border-border bg-surface p-3"><dt className="text-xs text-muted-foreground">{name}</dt><dd className="font-semibold tabular-nums">{count}</dd></div>)}</dl>
 <p className="text-xs text-muted-foreground">These metrics cover the currently loaded 25-person slice before the filters above, not the full cohort.</p>
 <p className="text-sm text-muted-foreground">Active learners only. Eligibility decisions inherit from learner, class, then batch; ambiguous class enrollment requires review.</p>
 {visible.length===0?<p role="status">{result.students.length===0?"No active learners found on this page.":"No learners match the selected page filters."}</p>:<ul className="space-y-2">
 {visible.map(s=><li className="min-w-0 rounded-lg border border-border bg-surface p-3 text-sm" key={s.membershipId}>
  <div className="flex flex-wrap justify-between gap-2"><strong className="break-words">{s.name}</strong><span>{s.ambiguous?"Needs review":s.decision.replaceAll("_"," ")}</span></div>
  <p className="text-xs text-muted-foreground">Roll number: {s.rollNumber??"Not recorded"}</p>
  <p className="text-xs text-muted-foreground">Registration: {s.registration?s.registration.choice?.replaceAll("_"," ")??"Not recorded":"Unavailable"}{s.registration?.source?" · via "+s.registration.source.toLowerCase():""}</p>
  <p className="text-xs text-muted-foreground">Source: {s.source.toLowerCase()}{s.reason?" · "+s.reason:""}</p>
  {!finished&&!s.ambiguous?<TpoBatchInlineDecision key={s.membershipId+":"+(s.direct.updatedAt??"none")} membershipId={s.membershipId} expected={s.direct}/>:null}
  <Link className="mt-2 inline-flex min-h-10 items-center text-primary-text underline" href={"/tpo/students/"+s.membershipId+"/participation"}>Open learner participation</Link>
 </li>)}</ul>}
 <nav className="flex flex-wrap gap-2" aria-label="Student pages">{result.page>1?<Link href={href(result.page-1)} className="rounded border px-3 py-2">Previous</Link>:null}
 {result.hasMore?<Link href={href(result.page+1)} className="rounded border px-3 py-2">Next</Link>:null}</nav>
 </main>;
}
