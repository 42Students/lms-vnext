import {Button} from "@/components/ui/button";
import {Disclosure} from "@/components/ui/disclosure";
import {Badge} from "@/components/ui/badge";
import {DataTable} from "@/components/ui/data-table";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import {PageHeader} from "@/components/ui/page-header";
import {Alert} from "@/components/ui/alert";
import {SummaryStrip} from "@/components/ui/summary-strip";
import {ErrorState} from "@/components/ui/error-state";
import {EmptyState} from "@/components/ui/empty-state";
import {batchDecisionLabel,batchSourceLabel,batchRegistrationLabel} from "@/modules/placements/tpo-batch-labels-model";
import {studentJourneyForBatch} from "@/modules/placements/tpo-batch-student-journey-model";
import {getTpoBatchEligibilitySummary} from "@/modules/placements/tpo-batch-eligibility-summary-service";
import {getTpoBatchRegistrationSummary} from "@/modules/placements/tpo-batch-registration-summary-service";
import {batchStudentViewExportHref} from "@/modules/placements/tpo-batch-student-filtered-export-model";
import {selectTpoBatchStudentView} from "@/modules/placements/tpo-batch-student-selection-model";
import {summarizeBatchStudentEvidence} from "@/modules/placements/tpo-batch-student-evidence-summary-model";
import Link from "next/link";
import { TpoBatchWorkspaceTabs } from "@/components/tpo/tpo-batch-workspace-tabs";
import {tpoEligibilityImportScaffoldHref} from "@/modules/placements/tpo-eligibility-import-scaffold-model";
import {TpoBatchEligibilityImport} from "@/components/tpo/tpo-batch-eligibility-import";
import {TpoBatchInlineDecision} from "@/components/tpo/tpo-batch-inline-decision";
import {TpoBulkActionPanel} from "@/components/tpo/tpo-bulk-action-panel";
import {TpoStudentNudgePanel} from "@/components/tpo/tpo-student-nudge-panel";
import {TpoBatchStudentBulkNotes} from "@/components/tpo/tpo-batch-student-bulk-notes";
import {TpoBatchStudentSavedViews} from "@/components/tpo/tpo-batch-student-saved-views";
import {TpoBatchStudentKeyboardActions} from "@/components/tpo/tpo-batch-student-keyboard-actions";
import { getCurrentRequestContext } from "@/auth/request-context";
import {getTpoBatchStudentRegistrations} from "@/modules/placements/tpo-batch-student-registration-service";
import {getTpoBatch} from "@/modules/placements/tpo-batch-workspace-read-service";
import { z } from "zod";
import {parseBatchStudentSearchParams,batchStudentPageHref} from "@/modules/placements/tpo-batch-student-view-model";
export const dynamic="force-dynamic";
const pageSchema=z.coerce.number().int().min(1).max(100000).default(1);
export default async function BatchStudents({params,searchParams}:{params:Promise<{batchId:string}>;searchParams:Promise<{page?:string|string[];q?:string|string[];classId?:string|string[];decision?:string|string[];source?:string|string[];registration?:string|string[];order?:string|string[]}>}){
 const {batchId}=await params,raw=await searchParams;
 const parsed=pageSchema.safeParse(Array.isArray(raw.page)?raw.page[0]:raw.page??1);
 if(!parsed.success)return <div className="min-w-0 space-y-4"><PageHeader title="Batch students"/><ErrorState title="Invalid page number" description="Choose a valid roster page." action={<Link className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9" href={"/tpo/batches/"+batchId+"/students"}>Start again</Link>}/></div>;
 const view=parseBatchStudentSearchParams(raw);
 if(!view.success)return <div className="min-w-0 space-y-4"><PageHeader title="Batch students"/><ErrorState title="Invalid student search" description="Check the roster filters and search values." action={<Link className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9" href={"/tpo/batches/"+batchId+"/students"}>Reset filters</Link>}/></div>;
 const ctx=await getCurrentRequestContext();
 const [result,batchScope,eligibility,registrationCounts]=await Promise.all([
  getTpoBatchStudentRegistrations(ctx,batchId,parsed.data,view.data.q,view.data.source==="LEARNER"),getTpoBatch(ctx,batchId),
  getTpoBatchEligibilitySummary(ctx,batchId),getTpoBatchRegistrationSummary(ctx,batchId),
 ]);
 const finished=Boolean(batchScope.lifecycle?.finishedAt);
 const journey=studentJourneyForBatch({total:registrationCounts.activeLearners,eligible:eligibility.summary.eligible,
  undecided:eligibility.summary.undecided,assessed:eligibility.summary.assessed,
  complete:eligibility.summary.complete,registered:registrationCounts.registered,
  registrationAvailable:registrationCounts.available});
 const visible=selectTpoBatchStudentView(result.students,view.data,result.registrationAvailable);
 const pageSummary=summarizeBatchStudentEvidence(result.students);
 const href=(page:number)=>batchStudentPageHref(batchId,page,view.data);
 return <div className="min-w-0 space-y-4"><PageHeader title={result.batch.name+" — Students"} description="Eligibility, registration and student evidence."/>
 <TpoBatchWorkspaceTabs batchId={batchId} active="students" students={registrationCounts.activeLearners}/>
 <form role="search" aria-label="students filters" action={"/tpo/batches/"+encodeURIComponent(batchId)+"/students"} method="get"
  className="grid min-w-0 grid-cols-1 items-end gap-[8px] border-b border-[var(--lms-canvas-border)] py-4 sm:grid-cols-2 xl:grid-cols-3">
  <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Class (on this page)
   <Select name="classId" defaultValue={view.data.classId??""}
    className="block min-h-11 md:min-h-9 w-full mt-[6px]">
    <option value="">All classes</option>
    {[...new Map(result.students.filter(student=>student.classId)
      .map(student=>[student.classId!,student.className??"Unnamed class"])).entries()]
     .map(([id,name])=><option key={id} value={id}>{name}</option>)}
   </Select>
  </label>
  <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search names or roll numbers across the batch
   <Input type="search" name="q" defaultValue={view.data.q} maxLength={100}
    className="min-h-11 md:min-h-9 w-full mt-[6px] block"/>
  </label>
  <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Eligibility decision
   <Select name="decision" defaultValue={view.data.decision} className="min-h-11 md:min-h-9 w-full mt-[6px] block">
    <option value="ALL">All decisions</option>
    <option value="ELIGIBLE">Eligible</option>
    <option value="INELIGIBLE">Ineligible</option>
    <option value="NOT_DECIDED">Not decided</option>
    <option value="NEEDS_REVIEW">Ambiguous / needs review</option>
   </Select>
  </label>
  <Disclosure title="Decision source · Registration choice · Sort this page" defaultOpen={Boolean(view.data.source!=="ALL"||view.data.registration!=="ALL"||view.data.order!=="NAME_ASC")} className="min-w-0 border-0 sm:col-span-2 xl:col-span-3" contentClassName="pt-3"><div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
  <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Decision source
   <Select name="source" defaultValue={view.data.source} className="min-h-11 md:min-h-9 w-full mt-[6px] block">
    <option value="ALL">Any source</option>
    <option value="LEARNER">Learner override</option>
    <option value="CLASS">Class</option>
    <option value="BATCH">Batch</option>
    <option value="NONE">No recorded decision</option>
   </Select>
  </label>
  <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Registration choice
   <Select name="registration" defaultValue={view.data.registration} className="min-h-11 md:min-h-9 w-full mt-[6px] block">
    <option value="ALL">Any evidence</option>
    <option value="RECORDED">Choice recorded</option>
    <option value="UNRECORDED">No choice recorded</option>
   </Select>
  </label>
  <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Sort this page
   <Select name="order" defaultValue={view.data.order} className="min-h-11 md:min-h-9 w-full mt-[6px] block">
    <option value="NAME_ASC">Name A–Z</option>
    <option value="NAME_DESC">Name Z–A</option>
    <option value="REVIEW_FIRST">Needs review first</option>
   </Select>
  </label>
  </div></Disclosure>
  <Button type="submit" variant="primary" className="min-h-11 md:min-h-9 w-full md:w-auto">Filter</Button>
 </form>
 <TpoBatchStudentSavedViews batchId={batchId}/>
 <TpoBatchStudentKeyboardActions
  rows={visible.map(student=>({id:student.membershipId,name:student.name,rollNumber:student.rollNumber}))}
 />
 {!finished&&journey.undecided!==null&&journey.undecided>0?
 <Alert tone="warning" title="Suggested placement action">
   <strong>Suggested: make them eligible</strong>
   <p className="mt-1 text-body">{journey.undecided} learners still need a placement eligibility decision. Review each learner before changing their status.</p>
   <Link href={batchStudentPageHref(batchId,1,{...view.data,decision:"NOT_DECIDED"})+"#batch-student-decisions"}
     className="lms-inline-link mt-2 inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Show me</Link>
 </Alert>:null}
 <p className="text-xs text-muted-foreground leading-5">Search covers the full active batch roster; bulk changes apply only to selected learners on this page.
  Clearing a direct override restores the recorded class or batch decision; it does not guarantee eligibility.
  Every change is confirmed and audited. Review skipped learners before retrying.</p>
 <p className="text-sm text-muted-foreground leading-[22px]">Registration choices are separate from eligibility; missing choices do not imply consent.</p>
 {!result.registrationAvailable?<Alert tone="warning">Registration records unavailable.</Alert>:null}

 {!result.registrationAvailable&&view.data.registration!=="ALL"?<Alert tone="warning">Registration filtering unavailable; no learners are classified without records.</Alert>:null}
 <Disclosure title="Export" ariaLabel="Batch student exports"
   className="border-b border-border py-3 [&>summary]:min-h-11 md:[&>summary]:min-h-9 [&>summary]:text-link">
  <div className="flex flex-wrap items-center gap-2 py-2">
   <a href={batchStudentViewExportHref(batchId,result.page,view.data)}
    className="lms-inline-link inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Export filtered current page CSV</a>
   <a href={"/api/placements/tpo/batches/"+encodeURIComponent(batchId)+"/students/export?page="+result.page}
    className="lms-inline-link inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Export current page CSV (unfiltered)</a>
  </div>
 </Disclosure>
 <p className="text-xs text-muted-foreground leading-5">Name/roll-number search runs against the full active batch roster before pagination. Other evidence filters apply to this loaded page. {visible.length} of {result.students.length} loaded learners match.</p>
 <SummaryStrip label="Loaded-page eligibility evidence" steps={[{label:"Loaded",value:pageSummary.assessed},{label:"Eligible",value:pageSummary.eligible},{label:"Ineligible",value:pageSummary.ineligible},{label:"Not decided",value:pageSummary.undecided},{label:"Needs review",value:pageSummary.needsReview},{label:"Direct overrides",value:pageSummary.directOverrides}]} />
 <p className="text-xs text-muted-foreground leading-5">These metrics cover the currently loaded 25-person slice before the filters above, not the full cohort.</p>
 <p className="text-sm text-muted-foreground leading-[22px]">Active learners only. Eligibility decisions inherit from learner, class, then batch; ambiguous class enrollment requires review.</p>
 <Disclosure title="Bulk changes · Import eligibility · Send a message · Add a note" className="border-b border-[var(--lms-canvas-border)]" contentClassName="pt-3">
 <p className="text-xs text-muted-foreground leading-5">CSV includes only this page (up to 25 students), with decision source and review flags.</p>
 <a href={tpoEligibilityImportScaffoldHref(batchId,result.page)} className="lms-inline-link inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Download blank eligibility import CSV (this page)</a>
 {finished?<Alert tone="info">This batch is finished. Eligibility decisions and import actions are read-only.</Alert>:<TpoBatchEligibilityImport batchId={batchId}/>}

 <section aria-label="Batch student follow-up actions" className="grid gap-2 lg:grid-cols-2">
  <TpoStudentNudgePanel rows={visible.map(student=>({
   id:student.membershipId,label:student.name+" · "+(student.rollNumber??"No roll number"),
   registered:student.registration?.choice==="PLACEMENTS",
  }))}/>
  <TpoBatchStudentBulkNotes rows={visible.map(student=>({
   id:student.membershipId,label:student.name+" · "+(student.rollNumber??"No roll number"),
  }))}/>
 </section>
 </Disclosure>
<div id="batch-student-bulk-actions" data-testid="batch.act" className="min-w-0 border-b border-border py-3">
 {!finished?<TpoBulkActionPanel key={batchId+":"+result.page+":"+view.data.q+":"+view.data.decision}
   target="STUDENTS" rows={visible.map(student=>({
    id:student.membershipId,label:student.name+" · "+(student.rollNumber??student.membershipId),rollNumber:student.rollNumber,
   }))} />:null}
 </div>
 <div id="batch-student-decisions" className="min-w-0">
  <DataTable rows={visible} getRowKey={student=>student.membershipId}
   caption={"Batch students · page "+result.page}
   empty={<EmptyState title={result.students.length===0?"No active learners found on this page.":"No students match these filters. Clear the filters or change the page."} action={<Link href={href(1)} className="md:min-h-9 inline-flex min-h-11 items-center font-semibold text-link underline">Filter</Link>}/>}
   columns={[
    {key:"student",header:"Student",mobilePriority:"primary" as const,cell:student=>
     <div className="min-w-0 space-y-1">
      <strong className="block break-words text-foreground">{student.name}</strong>
      <p className="text-xs text-muted-foreground leading-5">Roll no.: {student.rollNumber??"Not recorded"}</p>
      <p className="text-xs text-muted-foreground leading-5">Class: {student.ambiguous?"Multiple active classes":student.className??"Not assigned"}</p>
      <p className="text-xs text-muted-foreground leading-5">Branch: {student.branch} · Program: {student.program}</p>
     </div>},
    {key:"decision",header:"Eligibility",mobilePriority:"secondary" as const,cell:student=>
     <Badge tone={student.ambiguous?"warning":
      student.decision==="ELIGIBLE"?"success":
      student.decision==="INELIGIBLE"?"error":"neutral"}>
      {student.ambiguous?"Needs review":batchDecisionLabel(student.decision)}
     </Badge>},
    {key:"registration",header:"Registration",mobilePriority:"secondary" as const,cell:student=>
     <span className="text-sm text-body">
      {student.registration?batchRegistrationLabel(student.registration.choice):"Unavailable"}
      {student.registration?.source?" · via "+batchSourceLabel(student.registration.source):""}
     </span>},
    {key:"source",header:"Decision source",mobilePriority:"secondary" as const,cell:student=>
     <div className="text-sm text-body">
      {batchSourceLabel(student.source)}
      {student.reason?<p className="mt-1 break-words text-xs text-muted-foreground leading-5">{student.reason}</p>:null}
     </div>},
    {key:"actions",header:"Actions",mobilePriority:"action" as const,cell:student=>
     <div className="min-w-0 space-y-2">
      {!finished&&!student.ambiguous?
       <TpoBatchInlineDecision membershipId={student.membershipId}
        batchId={batchId} expected={student.direct}/>:null}
      <Link href={"/tpo/students/"+encodeURIComponent(student.membershipId)+"/participation"}
       className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
       Open learner participation
      </Link>
     </div>},
   ]}/>
 </div>
 <Disclosure title="Placement journey" className="border-b border-[var(--lms-canvas-border)]" contentClassName="pt-3">
 <section aria-label="Placement journey" className="space-y-3 border-b border-border pb-4">
  <h2 className="font-semibold text-[18px] leading-[1.4] text-[var(--lms-heading)]">Placement journey</h2>
  <dl className="grid min-w-0 grid-cols-2 gap-0 overflow-hidden border-y border-[var(--lms-canvas-border)] md:grid-cols-4">
   {([["Students",journey.total],["Eligible",journey.eligible],
      ["Invitation sent",batchScope.lifecycle?.invitedAt?"Yes":"Not yet"],
      ["Registered",journey.registered]] as const).map(([label,value])=>
      <div key={label} className="min-w-0 border-b border-r border-[var(--lms-canvas-border)] px-3 py-3 last:border-r-0">
       <dt className="text-xs text-muted-foreground">{label}</dt>
       <dd className="text-xl font-semibold tabular-nums">{value===null?"—":value}</dd>
      </div>)}
  </dl>
  <div className="flex flex-wrap gap-2 text-xs">
   {journey.undecided!==null?<Badge tone="warning">Not decided: {journey.undecided}</Badge>:null}
   {journey.registrationGap!==null?<Badge tone="neutral">No choice recorded: {journey.registrationGap}</Badge>:null}
  </div>
  {journey.sampled?<p className="text-xs text-muted-foreground leading-5">Eligibility covers a sample of {journey.sampleCount} learners; full-cohort eligibility and invited counts are not inferred.</p>:null}
  {!registrationCounts.available?<p className="text-xs text-muted-foreground leading-5">Registration choice totals are unavailable.</p>:null}
  <p className="text-xs text-muted-foreground leading-5">Invited is a lifecycle event, not a trustworthy per-student delivery count. Registered means a student recorded a placement registration choice, not merely that they were eligible or invited.</p>
 </section>
 </Disclosure>

 {(result.page>1||result.hasMore)?<nav className="flex flex-wrap gap-2" aria-label="Student pages">{result.page>1?<Link href={href(result.page-1)} className="lms-inline-link inline-flex min-h-11 items-center rounded-[8px] md:rounded-[var(--lms-control-radius)] border border-border px-3 text-sm text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:bg-[rgba(38,186,199,0.07)]">Previous</Link>:null}
 {result.hasMore?<Link href={href(result.page+1)} className="lms-inline-link inline-flex min-h-11 items-center rounded-[8px] md:rounded-[var(--lms-control-radius)] border border-border px-3 text-sm text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:bg-[rgba(38,186,199,0.07)]">Next</Link>:null}</nav>:null}
 </div>;
}
