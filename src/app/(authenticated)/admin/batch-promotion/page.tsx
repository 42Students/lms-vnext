import {Checkbox} from "@/components/ui/checkbox";
import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import Link from "next/link";
import { CollegePromotionConfirmation } from "@/components/academics/college-promotion-confirmation";
import { SuperAdminBatchGraduateAction } from "@/components/admin/super-admin-batch-graduate-action";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { Disclosure } from "@/components/ui/disclosure";
import { CollegePromotionPreviewError, listCollegePromotionOptions,
  previewCollegeBatchPromotion } from "@/modules/academics/college-batch-promotion-service";
import { readAdminPromotionParams, summarizeAdminPromotion } from "@/modules/academics/admin-batch-promotion-read-model";
import { formatPromotionAcademicYear } from "@/modules/academics/college-batch-promotion-model";

export default async function SuperAdminBatchPromotionPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const input = readAdminPromotionParams(raw);
  const showCompleted = raw.showCompleted==="1";
  if (!input.success) return <div className="min-w-0 space-y-5">
    <PageHeader  title="Batch Promotion" />
    <ErrorState title="Invalid batch promotion filters" description="Use consecutive years, e.g. 2026-27. Check the selected program and batch."
      action={<Link href="/admin/batch-promotion" className="inline-flex min-h-11 items-center font-[650] text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)] underline-offset-4 w-full md:w-auto justify-center rounded-[var(--lms-control-radius)] px-4">Clear filters</Link>} />
  </div>;
  const context = await getCurrentRequestContext();
  if (!context.adminScope?.collegeId) return <div className="min-w-0 space-y-5">
    <PageHeader  title="Batch Promotion" />
    <EmptyState title="Select a college to continue" description="Choose a college in the header above to see its batch promotion." />
  </div>;
  const pageSize=typeof raw.pageSize==="string"&&["10","25","50"].includes(raw.pageSize)?Number(raw.pageSize):10;
  const requestedPage=typeof raw.page==="string"&&/^[1-9][0-9]{0,3}$/.test(raw.page)?Number(raw.page):1;
  let options:Awaited<ReturnType<typeof listCollegePromotionOptions>>;
  try{options=await listCollegePromotionOptions(context,input.data,
    {page:requestedPage,pageSize,includeInactive:showCompleted});}
  catch{return <div className="min-w-0 space-y-5">
    <PageHeader title="Batch Promotion"/>
    <ErrorState title="Batches unavailable" description="Courses and batch choices could not be verified. No promotion has been prepared."
      action={<Link href="/admin/batch-promotion" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Retry batches</Link>}/>
  </div>;}
  const visibleCohorts = options.cohorts;
  const pageCount=Math.max(1,Math.ceil(options.totalCohorts/pageSize));
  const currentPage=Math.min(requestedPage,pageCount);
  const shownCohorts=visibleCohorts;
  function pageHref(page:number,size=pageSize){
    const query=new URLSearchParams();
    if(input.data.programId)query.set("programId",input.data.programId);
    if(input.data.cohortId)query.set("cohortId",input.data.cohortId);
    if(input.data.yearStart!==undefined)query.set("yearStart",formatPromotionAcademicYear(input.data.yearStart));
    if(showCompleted)query.set("showCompleted","1");
    if(size!==10)query.set("pageSize",String(size));
    if(page>1)query.set("page",String(page));
    return "/admin/batch-promotion"+(query.size?"?"+query.toString():"");
  }
  let preview: Awaited<ReturnType<typeof previewCollegeBatchPromotion>> | null = null;
  let invalidCohort = false;
  let invalidProgram = false;
  let previewFailed = false;
  if (input.data.cohortId) {
    try {
      preview = await previewCollegeBatchPromotion(context, input.data);
    } catch (error) {
      if(error instanceof CollegePromotionPreviewError){
        if(error.code==="BATCH_NOT_FOUND")invalidCohort=true;
        else invalidProgram=true;
      }else{
        previewFailed=true;
      }
    }
  }
  const summary = preview ? summarizeAdminPromotion(preview) : null;
  return <div className="min-w-0 space-y-5">
    <PageHeader  title="Batch Promotion"
      description="Review scoped promotion eligibility, then explicitly confirm with a locked version and a transactional blocker recheck. Class moves are managed separately in the batch roster." />
    <form method="get" role="search" aria-label="Batch promotion preview filters" className="grid min-w-0 items-end gap-[8px] border-b border-border pb-[var(--lms-space-4)] min-[768px]:grid-cols-2 min-[1200px]:grid-cols-3">
      <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Program
        <Select name="programId" defaultValue={input.data.programId ?? ""}
          className="min-h-11 min-[768px]:min-h-9">
          <option value="">All programs</option>
          {options.programs.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
        </Select>
      </label>
      <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Batch
        <Select name="cohortId" defaultValue={input.data.cohortId ?? ""}
          className="min-h-11 min-[768px]:min-h-9">
          <option value="">Select a batch</option>
          {visibleCohorts.map(b => <option key={b.id} value={b.id}>{b.programName} · {b.name} ({b.status})</option>)}
          {preview && !visibleCohorts.some(b => b.id === preview.batch.id) ?
            <option value={preview.batch.id}>{preview.batch.programName} · {preview.batch.name} ({preview.batch.status})</option> : null}
        </Select>
      </label>
      <Disclosure title="More filters" defaultOpen={Boolean(input.data.yearStart || showCompleted)} className="order-last min-w-0 min-[768px]:col-span-2 min-[1200px]:col-span-3"
        contentClassName="grid min-w-0 gap-[var(--lms-space-3)] pb-[var(--lms-space-4)] min-[768px]:grid-cols-2">
      <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Academic year start override
        <Input name="yearStart" type="text" inputMode="numeric" maxLength={7} pattern="[0-9]{4}-[0-9]{2}"
          placeholder="2026-27" title="Use consecutive years, e.g. 2026-27"
          defaultValue={input.data.yearStart!==undefined?formatPromotionAcademicYear(input.data.yearStart):""}
          className="min-h-11 min-[768px]:min-h-9" />
        <span className="text-xs font-normal text-muted-foreground">Use consecutive years, e.g. 2026-27.</span>
      </label>
      <label className="flex min-h-11 items-center gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
        <Checkbox name="showCompleted" value="1" defaultChecked={showCompleted}/> Show completed / inactive batches
      </label>
      </Disclosure>
      <Button type="submit" className="min-h-11 w-full min-[768px]:min-h-9 min-[768px]:w-auto self-end">Preview</Button>
    </form>
    <section aria-label="Batch promotion queue" className="min-w-0 space-y-[var(--lms-space-3)] pt-[var(--lms-space-2)]">
      <Disclosure title={<h2 className="m-0 font-semibold text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-[26px] min-[768px]:text-[var(--lms-font-xl)] min-[768px]:leading-[28px]">Batches</h2>} defaultOpen={!input.data.cohortId} contentClassName="pb-[var(--lms-space-4)]">
      <div className="flex flex-wrap items-center justify-between gap-3">

        <p role="status" className="text-sm text-muted-foreground">
          {options.totalCohorts?"Showing "+((currentPage-1)*pageSize+1)+"–"+Math.min(currentPage*pageSize,options.totalCohorts):"Showing 0"} of {options.totalCohorts} matching batches
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs" aria-label="Rows per page">
          <span>Rows per page:</span>
          {[10,25,50].map(size=><Link key={size} href={pageHref(1,size)}
            aria-current={size===pageSize?"page":undefined}
            className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-3 font-semibold text-primary-text hover:bg-[var(--lms-primary-subtle)]">{size}</Link>)}
        </div>
      </div>
      <DataTable<(typeof visibleCohorts)[number]>
        caption="Batches"
        rows={shownCohorts}
        getRowKey={batch=>batch.id}
        empty={<EmptyState title="No matching batches" description="No batches match the selected program and status."/>}
        columns={[
          {key:"batch",header:"Batch",mobilePriority:"primary",cell:batch=><strong>{batch.programName} · {batch.name}</strong>},
          {key:"semester",header:"Semester",mobilePriority:"secondary",cell:batch=>batch.currentTermNumber??"—"},
          {key:"year",header:"Academic Year",mobilePriority:"secondary",cell:batch=>batch.currentAcademicYearStart?`${batch.currentAcademicYearStart}–${batch.currentAcademicYearStart+1}`:"—"},
          {key:"students",header:"Active learners",mobilePriority:"secondary",cell:batch=><span className="tabular-nums">{batch.activeLearners}</span>},
          {key:"status",header:"Status",mobilePriority:"secondary",cell:batch=><StatusBadge tone={batch.status==="ACTIVE"?"success":"neutral"}>{batch.status}</StatusBadge>},
          {key:"action",header:"Action",mobilePriority:"action",cell:batch=><Link
            href={"/admin/batch-promotion?"+new URLSearchParams({
              ...(input.data.programId?{programId:input.data.programId}:{}),cohortId:batch.id,
              ...(showCompleted?{showCompleted:"1"}:{}),
            })}
            className="inline-flex min-h-11 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)] underline-offset-4">Preview →</Link>},
        ]}
      />
      <Pagination page={currentPage} pageCount={pageCount} hrefForPage={page=>pageHref(page)}
        label="Batch pages" showBoundaryLinks={false}/>
      </Disclosure>
    </section>
    {invalidProgram ? <ErrorState title="Program unavailable" description="The parent program could not be loaded. Refresh your selected batch and program before trying again."
      action={<Link href={pageHref(1)} className="font-semibold text-primary-text underline">Retry program details</Link>}/> :
    previewFailed ? <ErrorState title="Couldn't verify promotion" description="Promotion preview failed. No promotion can be confirmed until the batch is rechecked."
      action={<Link href={pageHref(1)} className="font-semibold text-primary-text underline">Retry preview</Link>}/> :
    invalidCohort ? <ErrorState title="Batch unavailable" description="The selected batch is not available within this college and program."
      action={<Link href="/admin/batch-promotion" className="inline-flex min-h-11 items-center font-[650] text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)] underline-offset-4 w-full md:w-auto justify-center rounded-[var(--lms-control-radius)] px-4">Reset selection</Link>} /> :
    !preview || !summary ? <EmptyState title="Choose a batch" description="No learner data is fetched until you select a college-owned batch." /> :
    <>
      <section className="min-w-0 space-y-3 border-b border-border pb-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="m-0 break-words font-semibold text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-[26px] min-[768px]:text-[var(--lms-font-xl)] min-[768px]:leading-[28px]">{preview.batch.name}</h2>
          <StatusBadge tone={preview.simulatedReadiness ? "success" : "warning"}>{preview.simulatedReadiness ? "No detected blockers" : "Blocked or incomplete"}</StatusBadge>
        </div>
        <p className="text-sm text-body">{preview.batch.programName} · {preview.batch.status}</p>
        <dl className="grid min-w-0 gap-0 divide-y divide-border border-y border-border min-[768px]:grid-cols-2 lg:grid-cols-4">
          {([
            ["Action", summary.action], ["Target term", summary.targetTerm ?? "Unavailable"],
            ["Learners checked", summary.learnersChecked], ["Learners with blockers", summary.blockedLearners],
          ] as const).map(([label, value]) => <div key={label} className="min-w-0 border-r border-border px-[var(--lms-space-3)] py-[var(--lms-space-3)] last:border-r-0">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-1 font-semibold text-foreground">{value}</dd>
          </div>)}
        </dl>
        {!summary.completePreview ? <p role="alert" className="text-sm text-error">Preview is truncated at 2,000 enrollments and cannot prove readiness.</p> : null}
        <p className="text-xs text-muted-foreground">This is a preview, not a committed promotion. Confirmation independently rechecks every learner and the recorded version. Graduation is available when the batch reaches its final term.</p>
        {preview.batch.status === "ACTIVE" && preview.batch.currentTermNumber !== null &&
         preview.batch.currentTermNumber >= preview.batch.durationTerms ?
          <SuperAdminBatchGraduateAction cohortId={preview.batch.id} name={preview.batch.name} /> : null}
        {preview.simulatedReadiness && preview.plan.action === "PROMOTE" &&
          preview.batch.version !== null && preview.plan.targetTermNumber !== null &&
          preview.plan.academicYearStart !== null ? (
            <CollegePromotionConfirmation
              cohortId={preview.batch.id}
              programId={preview.batch.programId}
              expectedVersion={preview.batch.version}
              yearStart={input.data.yearStart}
              targetTerm={preview.plan.targetTermNumber}
              learnerCount={preview.checkedLearners}
              academicYearStart={preview.plan.academicYearStart} />
          ) : null}
      </section>
      <section className="border-b border-border pb-5">
        <h2 className="font-semibold text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-[26px] min-[768px]:text-[var(--lms-font-xl)] min-[768px]:leading-[28px]">Known batch blockers ({summary.knownBlockers})</h2>
        {preview.blockers.length ? <ul className="mt-2 list-inside list-disc text-sm text-body">
          {preview.blockers.map(b => <li key={b}>{b.replaceAll("_", " ")}</li>)}
        </ul> : <p className="text-sm text-muted-foreground">No batch-level blocker was detected. Learner and runtime checks still apply.</p>}
      </section>
      <Disclosure title={<h2 className="font-semibold text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-[26px] min-[768px]:text-[var(--lms-font-xl)] min-[768px]:leading-[28px]">Learner-level preview</h2>} contentClassName="space-y-[var(--lms-space-3)] pb-[var(--lms-space-4)]">
        <p className="text-xs text-muted-foreground">Showing at most 100 of {preview.learners.length} examined enrollments; a shortened display is not a complete readiness decision.</p>
        {preview.learners.length ? <div className="grid gap-3 md:grid-cols-2">
          {preview.learners.slice(0, 100).map(learner => <article key={learner.membershipId} className="min-w-0 border-b border-border py-3">
            <h3 className="m-0 break-words font-semibold text-[var(--lms-heading)] text-[var(--lms-font-md)] leading-[24px] min-[768px]:text-[var(--lms-font-lg)] min-[768px]:leading-[26px]">{learner.name}</h3>
            <p className="mt-1 text-sm text-body">Enrollment: {learner.enrollmentStatus}</p>
            <p className="mt-2 text-sm text-body">{learner.blockers.length ? learner.blockers.join(", ").replaceAll("_", " ") : "No detected learner blocker"}</p>
          </article>)}
        </div> : <EmptyState title="No enrolled learners" description="No registered learner enrollments were present for this batch." />}
      </Disclosure>
    </>}
    <Link href="/admin/academics" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] min-[768px]:min-h-9 hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)] underline-offset-4">← Academics</Link>
  </div>;
}
