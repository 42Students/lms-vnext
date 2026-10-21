import { FilterBar } from "@/components/ui/filter-bar";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { CollegePromotionConfirmation } from "@/components/academics/college-promotion-confirmation";
import {AuthorizationError} from "@/modules/permissions/policy";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable } from "@/components/ui/data-table";
import { collegePromotionQuerySchema, formatPromotionAcademicYear } from "@/modules/academics/college-batch-promotion-model";
import { BATCH_PROMOTION_COPY, promotionImpactMessage } from "@/modules/academics/college-batch-promotion-copy";
import { getPromotionFacultyReadiness } from "@/modules/academics/college-promotion-faculty-readiness";
import {
  listCollegePromotionOptions,
  previewCollegeBatchPromotion,
} from "@/modules/academics/college-batch-promotion-service";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Search = Record<string, string | string[] | undefined>;
function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value.length === 1 ? value[0] : "INVALID_DUPLICATE_QUERY"
    : typeof value === "string" ? value : undefined;
}

export default async function CollegeBatchPromotionPage({
  searchParams,
}: { searchParams: Promise<Search> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership) return <div className="min-w-0 space-y-4">
    <PageHeader title="Batch Promotion"/>
    <ErrorState title="Admin not assigned to a college"
      description="Contact your administrator to assign a college before promoting batches."
      action={<Link href="/dashboard" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Back to dashboard</Link>}/>
  </div>;
  const incoming = await searchParams;
  const showCompleted = first(incoming.showCompleted) === "1";
  const batchPageRaw=first(incoming.batchPage)??"1";
  const batchSizeRaw=first(incoming.batchPageSize)??"10";
  const batchPage=/^[1-9][0-9]{0,3}$/.test(batchPageRaw)?Number(batchPageRaw):null;
  const batchSize=["10","20","50"].includes(batchSizeRaw)?Number(batchSizeRaw):null;
  const raw = {
    programId: first(incoming.programId),
    cohortId: first(incoming.cohortId),
    yearStart: first(incoming.yearStart),
  };
  const parsed = collegePromotionQuerySchema.safeParse(
    Object.fromEntries(Object.entries(raw).filter(([, value]) =>
      value !== undefined && value !== "",
    )),
  );
  if (!parsed.success||batchPage===null||batchSize===null||
      (first(incoming.showCompleted) !== undefined && !["1",""].includes(first(incoming.showCompleted)!))) return <div className="min-w-0 space-y-4 md:space-y-6">
    <PageHeader title="Batch Promotion" actions={<PageBackLink href="/college/batches" label="Batches" />} />
    <ErrorState title="Invalid promotion preview filters"
      description="Select a valid program, batch and optional academic-year start. No learner records were loaded."
      action={<Link href="/college/batch-promotion" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Clear filters</Link>} />
  </div>;
  const [optionsResult,previewResult]=await Promise.allSettled([
    listCollegePromotionOptions(context,parsed.data,
      {page:batchPage!,pageSize:batchSize!,includeInactive:showCompleted}),
    parsed.data.cohortId?previewCollegeBatchPromotion(context,parsed.data):Promise.resolve(null),
  ]);
  if(optionsResult.status==="rejected"){
    if(optionsResult.reason instanceof AuthorizationError)throw optionsResult.reason;
    return <div className="min-w-0 space-y-4 md:space-y-6">
      <PageHeader title="Batch Promotion" actions={<PageBackLink href="/college/batches" label="Batches" />}/>
      <ErrorState title="Could not load batches"
        description="Batch and program choices could not be verified. No promotion was applied."
        action={<Link href="/college/batch-promotion" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Retry</Link>}/>
    </div>;
  }
  if(previewResult.status==="rejected" && previewResult.reason instanceof AuthorizationError)
    throw previewResult.reason;
  const options=optionsResult.value;
  const preview=previewResult.status==="fulfilled"?previewResult.value:null;
  const previewError=previewResult.status==="rejected";
  const facultySetup=preview?.plan.targetTermNumber&&parsed.data.cohortId
    ?await getPromotionFacultyReadiness(context,preview.batch.programId,
      parsed.data.cohortId,preview.plan.targetTermNumber).catch(()=>null):null;
  const totalBatches=options.totalCohorts;
  const totalBatchPages=Math.max(1,Math.ceil(totalBatches/batchSize!));
  const currentBatchPage=Math.min(batchPage!,totalBatchPages);
  const directoryRows=options.cohorts;
  const currentUrl=(page:number,size=batchSize!)=>{
    const params=new URLSearchParams();
    if(parsed.data.programId)params.set("programId",parsed.data.programId);
    if(showCompleted)params.set("showCompleted","1");
    if(parsed.data.cohortId)params.set("cohortId",parsed.data.cohortId);
    if(parsed.data.yearStart!==undefined)params.set("yearStart",formatPromotionAcademicYear(parsed.data.yearStart));
    params.set("batchPage",String(page));params.set("batchPageSize",String(size));
    return "/college/batch-promotion?"+params.toString();
  };
  const batchPreviewHref=(row:(typeof options.cohorts)[number])=>{
    const params=new URLSearchParams({programId:row.programId,cohortId:row.id,
      ...(showCompleted?{showCompleted:"1"}:{})});
    return "/college/batch-promotion?"+params.toString();
  };
  return <div className="min-w-0 space-y-4 md:space-y-6">
    <PageHeader title="Batch Promotion"
      description="Server-verified eligibility preview. Promotion rechecks blockers and closes prior-term-only teaching assignments."
      actions={<PageBackLink href="/college/batches" label="Batches" />} />
    {previewError?<Alert tone="warning">
      Could not verify this promotion. Please retry. Existing batch records remain available below.
      <Link href="/college/batch-promotion" className="ml-2 font-semibold text-link underline">Retry</Link>
    </Alert>:null}
    <section aria-label="College batch directory" className="min-w-0 space-y-3">
      <h2 className="text-[18px] font-semibold text-[var(--lms-heading)]">Batch directory</h2>
      <p className="text-xs text-muted-foreground">Graduation is recorded only after a guarded
        final-term action is available; no completion is inferred from semester number alone.</p>
      <DataTable caption="All college batches" rows={directoryRows} getRowKey={row=>row.id}
        columns={[
          {key:"batch",header:"Batch Name",mobilePriority:"primary",cell:row=>row.name},
          {key:"program",header:"Program",cell:row=>row.programName},
          {key:"semester",header:"Semester",cell:row=>row.currentTermNumber??"Not set"},
          {key:"year",header:"Academic Year",cell:row=>
            row.currentAcademicYearStart===null?"Not set":formatPromotionAcademicYear(row.currentAcademicYearStart)},
          {key:"students",header:"Students",cell:row=>row.activeLearners},
          {key:"status",header:"Status",cell:row=>
            <StatusBadge tone={row.status==="ACTIVE"?"success":"neutral"}>{row.status}</StatusBadge>},
          {key:"action",header:"Action",mobilePriority:"action",cell:row=>row.status==="ACTIVE"?
            <Link href={batchPreviewHref(row)} className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Preview promotion</Link>:
            <span className="text-xs text-muted-foreground">No action available</span>},
        ]}
        empty={<EmptyState title="No batches" description="No batches match the selected program."/>}/>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span>Showing {totalBatches?((currentBatchPage-1)*batchSize!+1):0}–
          {Math.min(totalBatches,currentBatchPage*batchSize!)} of {totalBatches} · Page {currentBatchPage} of {totalBatchPages}</span>
        <div className="flex flex-wrap items-center gap-3">
          <form method="get">
            {parsed.data.programId?<input type="hidden" name="programId" value={parsed.data.programId}/>:null}
            {parsed.data.cohortId?<input type="hidden" name="cohortId" value={parsed.data.cohortId}/>:null}
            <label className="flex items-center gap-2">Rows per page
              <Select name="batchPageSize" defaultValue={batchSize!} className="min-w-20">
                {[10,20,50].map(size=><option key={size} value={size}>{size}</option>)}
              </Select>
            </label>
            <Button type="submit" variant="secondary" className="min-h-11 md:min-h-9">Apply</Button>
          </form>
          {currentBatchPage>1?<Link href={currentUrl(currentBatchPage-1)} className="font-semibold text-link underline">Previous</Link>:null}
          {currentBatchPage<totalBatchPages?<Link href={currentUrl(currentBatchPage+1)} className="font-semibold text-link underline">Next</Link>:null}
        </div>
      </div>
    </section>
    <section className="min-w-0 pt-[var(--lms-space-2)]">
      <FilterBar title="Filters"><form method="get" action="/college/batch-promotion" className="grid min-w-0 items-end gap-[var(--lms-space-3)] max-[767px]:[&_label]:w-full md:grid-cols-2 min-[992px]:grid-cols-4">
        <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Program
          <Select name="programId" defaultValue={parsed.data.programId ?? ""}
            >
            <option value="">All programs</option>
            {options.programs.map(program => <option key={program.id} value={program.id}>
              {program.name} ({program.code})
            </option>)}
          </Select>
        </label>
        <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Batch
          <Select name="cohortId" defaultValue={parsed.data.cohortId ?? ""}
            >
            <option value="">Select a batch</option>
            {options.cohorts.map(cohort => <option key={cohort.id} value={cohort.id}>
              {cohort.programName} · {cohort.name} ({cohort.status})
            </option>)}
            {preview && !options.cohorts.some(cohort => cohort.id === preview.batch.id) ?
              <option value={preview.batch.id}>{preview.batch.programName} · {preview.batch.name} ({preview.batch.status})</option> : null}
          </Select>
        </label>
        <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Academic year override (optional)
          <Input name="yearStart" type="text" inputMode="numeric" pattern="[0-9]{4}-[0-9]{2}"
            defaultValue={parsed.data.yearStart === undefined ? "" : formatPromotionAcademicYear(parsed.data.yearStart)}
            placeholder="e.g., 2099-00"
            />
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Checkbox name="showCompleted" value="1" defaultChecked={showCompleted} />
          Show completed / inactive batches
        </label>
        <div className="flex min-w-0 items-end">
          <Button type="submit" className="min-h-11 w-full md:min-h-9">Preview</Button>
        </div>
      </form></FilterBar>
    </section>
    {!preview ? (
      <section className="min-w-0 border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-4)]">
        <EmptyState title="No promotion preview" description="Select a batch to calculate a preview from saved progression, semester and enrollment records."/>
      </section>
    ) : (
      <>
        <section className="min-w-0 space-y-[var(--lms-space-3)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-4)]" aria-label="Promotion preview">
          <h2 className="m-0 min-w-0 break-words text-[var(--lms-font-xl)] font-semibold leading-7 text-[var(--lms-heading)]">{preview.batch.name}</h2>
          <p className="min-w-0 break-words text-sm leading-5 text-body">Program: {preview.batch.programName} · Batch status: {preview.batch.status}</p>
          <p className="text-sm text-body">
            Recorded term: {preview.batch.currentTermNumber ?? "Not recorded"} of {preview.batch.durationTerms}.
            Target term: {preview.plan.targetTermNumber ?? "No next term (graduation or unavailable)"}.
          </p>
          <p className="text-sm text-body">
            Recorded academic year: {preview.batch.currentAcademicYearStart ?? "Not recorded"}.
            Preview year: {preview.plan.academicYearStart ?? "Not configured"}
            {parsed.data.yearStart !== undefined ? " (override entered; not saved)" : ""}.
          </p>
          <p className="text-sm text-body">
            {promotionImpactMessage(preview.checkedLearners)}
            {preview.completePreview ? "" : " (preview truncated at 2,000; NOT a complete batch check)"}.
            {preview.blockedLearners} have learner-specific blockers in the examined set.
          </p>
          {preview.blockers.length ? (
            <Alert tone="error" className="space-y-2">
              <h3 className="m-0 text-[var(--lms-font-md)] font-semibold leading-6 text-[var(--lms-heading)]">Batch blockers</h3>
              <ul className="list-inside list-disc space-y-[var(--lms-space-2)] text-sm leading-5 text-body">
                {preview.blockers.map(blocker => <li key={blocker}>
                  {blocker==="NEXT_TERM_NO_MAPPED_COURSES"?<>
                    Cannot promote: Semester {preview.plan.targetTermNumber} has no mapped courses.
                    Configure the semester curriculum first.{" "}
                    <Link href="/college/semester-courses" className="font-semibold text-link underline hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] underline-offset-4">
                      Map semester courses
                    </Link>
                  </>:blocker.replaceAll("_"," ")}
                </li>)}
              </ul>
            </Alert>
          ) : <Alert tone="info">No batch-level blockers were observed. This is not authorization to execute a promotion.</Alert>}
          <p className="text-sm font-semibold text-body">
            {preview.simulatedReadiness ? BATCH_PROMOTION_COPY.ready : BATCH_PROMOTION_COPY.notReady}
          </p>
          {facultySetup?.incomplete && <Alert tone="warning">
            Faculty setup is still incomplete
            {facultySetup.totalCourses > 0 ? ` — ${facultySetup.missingCourses} of ${facultySetup.totalCourses} mapped course(s) lack active teaching assignments.` : " — no target semester courses mapped."}
          </Alert>}
          {preview.simulatedReadiness && preview.plan.action === "PROMOTE" &&
            preview.batch.version !== null ? (
              <CollegePromotionConfirmation cohortId={preview.batch.id}
                programId={preview.batch.programId}
                expectedVersion={preview.batch.version}
                yearStart={parsed.data.yearStart}
                targetTerm={preview.plan.targetTermNumber!}
                learnerCount={preview.checkedLearners}
                academicYearStart={preview.plan.academicYearStart!} />
            ) : null}
        </section>
        <section aria-label="Learner-level preview" className="min-w-0 border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-4)]">
          <h2 className="m-0 pb-[var(--lms-space-3)] text-[var(--lms-font-lg)] font-semibold leading-7 text-[var(--lms-heading)]">Learner blockers</h2>
          <DataTable rows={preview.learners} getRowKey={learner=>learner.membershipId} caption="Learner blockers"
            columns={[
              {key:"name",header:"Learner",mobilePriority:"primary",cell:learner=>learner.name},
              {key:"status",header:"Enrollment",mobilePriority:"secondary",cell:learner=><StatusBadge tone={learner.enrollmentStatus==="ACTIVE"?"success":"neutral"}>{learner.enrollmentStatus}</StatusBadge>},
              {key:"blockers",header:"Blockers",mobilePriority:"secondary",cell:learner=>
                learner.blockers.length?learner.blockers.join(", ").replaceAll("_"," "):"No detected learner blocker"},
            ]}
            empty={<EmptyState title="No learner enrollments" description="No persisted learner enrollments exist for this batch. No eligible count is inferred."/>}/>
        </section>
      </>
    )}
    <p className="max-w-[75ch] text-xs leading-5 text-muted-foreground">
      Preview never writes. Graduation is not an enabled server operation yet;
      final-semester rows are not marked Completed or graduated by this view.
      Confirming promotion requires an unchanged version and rechecks
      blockers in a transaction. Graduation is available for batches in their final registered semester.
    </p>
  </div>;
}
