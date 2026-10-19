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
import { CollegePromotionPreviewError, listCollegePromotionOptions,
  previewCollegeBatchPromotion } from "@/modules/academics/college-batch-promotion-service";
import { readAdminPromotionParams, summarizeAdminPromotion } from "@/modules/academics/admin-batch-promotion-read-model";

export default async function SuperAdminBatchPromotionPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const input = readAdminPromotionParams(raw);
  const showCompleted = raw.showCompleted==="1";
  if (!input.success) return <div className="min-w-0 space-y-5">
    <PageHeader  title="Batch Promotion" />
    <ErrorState title="Invalid batch promotion filters" description="Use valid program, cohort and optional academic year values."
      action={<Link href="/admin/batch-promotion" className="font-semibold text-primary-text">Clear filters</Link>} />
  </div>;
  const context = await getCurrentRequestContext();
  if (!context.adminScope?.collegeId) return <div className="min-w-0 space-y-5">
    <PageHeader  title="Batch Promotion" />
    <EmptyState title="Select a college to continue" description="Choose a college in the header above to see its batch promotion." />
  </div>;
  const options = await listCollegePromotionOptions(context, input.data);
  const visibleCohorts = showCompleted ? options.cohorts : options.cohorts.filter(item=>!["COMPLETED","ARCHIVED"].includes(item.status));
  let preview: Awaited<ReturnType<typeof previewCollegeBatchPromotion>> | null = null;
  let invalidCohort = false;
  if (input.data.cohortId) {
    try {
      preview = await previewCollegeBatchPromotion(context, input.data);
    } catch (error) {
      if (error instanceof CollegePromotionPreviewError && error.code === "BATCH_NOT_FOUND") {
        invalidCohort = true;
      } else {
        throw error;
      }
    }
  }
  const summary = preview ? summarizeAdminPromotion(preview) : null;
  return <div className="min-w-0 space-y-5">
    <PageHeader  title="Batch Promotion"
      description="Review scoped promotion eligibility, then explicitly confirm with a locked version and a transactional blocker recheck. Class moves are managed separately in the batch roster." />
    <form method="get" className="grid gap-3 border-b border-border pb-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="grid gap-1 text-sm font-semibold text-body">Program
        <Select name="programId" defaultValue={input.data.programId ?? ""}
          className="min-h-11 sm:min-h-9">
          <option value="">All programs</option>
          {options.programs.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
        </Select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Batch
        <Select name="cohortId" defaultValue={input.data.cohortId ?? ""}
          className="min-h-11 sm:min-h-9">
          <option value="">Select a batch</option>
          {visibleCohorts.map(b => <option key={b.id} value={b.id}>{b.programName} · {b.name} ({b.status})</option>)}
        </Select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Academic year start override
        <Input name="yearStart" type="number" min={1900} max={9998} step={1}
          defaultValue={input.data.yearStart ?? ""} className="min-h-11 sm:min-h-9" />
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-body">
        <Checkbox name="showCompleted" value="1" defaultChecked={showCompleted}/> Show completed / inactive batches
      </label>
      <Button type="submit" className="min-h-11 sm:min-h-9 self-end">Preview</Button>
    </form>
    <section aria-label="Batch promotion queue" className="min-w-0 space-y-3 pt-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Batches</h2>
        <p role="status" className="text-sm text-muted-foreground">{visibleCohorts.length} shown of {options.cohorts.length} batches</p>
      </div>
      <DataTable<(typeof visibleCohorts)[number]>
        caption="Batches"
        rows={visibleCohorts}
        getRowKey={batch=>batch.id}
        empty={<p role="status" className="text-sm text-muted-foreground">No batches match the selected program and status.</p>}
        columns={[
          {key:"batch",header:"Batch",mobilePriority:"primary",cell:batch=><strong>{batch.programName} · {batch.name}</strong>},
          {key:"semester",header:"Semester",mobilePriority:"secondary",cell:batch=>batch.currentTermNumber??"—"},
          {key:"year",header:"Academic Year",mobilePriority:"secondary",cell:batch=>batch.currentAcademicYearStart?`${batch.currentAcademicYearStart}–${batch.currentAcademicYearStart+1}`:"—"},
          {key:"students",header:"Students",mobilePriority:"secondary",cell:batch=><span className="tabular-nums">{batch.activeLearners}</span>},
          {key:"status",header:"Status",mobilePriority:"secondary",cell:batch=>batch.status},
          {key:"action",header:"Action",mobilePriority:"action",cell:batch=><Link
            href={"/admin/batch-promotion?"+new URLSearchParams({
              ...(input.data.programId?{programId:input.data.programId}:{}),cohortId:batch.id,
              ...(showCompleted?{showCompleted:"1"}:{}),
            })}
            className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Preview →</Link>},
        ]}
      />
    </section>
    {invalidCohort ? <ErrorState title="Batch unavailable" description="The selected batch is not available within this college and program."
      action={<Link href="/admin/batch-promotion" className="font-semibold text-primary-text">Reset selection</Link>} /> :
    !preview || !summary ? <EmptyState title="Choose a batch" description="No learner data is fetched until you select a college-owned batch." /> :
    <>
      <section className="min-w-0 space-y-3 border-b border-border pb-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="m-0 break-words font-semibold text-foreground">{preview.batch.name}</h2>
          <StatusBadge tone={preview.simulatedReadiness ? "success" : "warning"}>{preview.simulatedReadiness ? "No detected blockers" : "Blocked or incomplete"}</StatusBadge>
        </div>
        <p className="text-sm text-body">{preview.batch.programName} · {preview.batch.status}</p>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {([
            ["Action", summary.action], ["Target term", summary.targetTerm ?? "Unavailable"],
            ["Learners checked", summary.learnersChecked], ["Learners with blockers", summary.blockedLearners],
          ] as const).map(([label, value]) => <div key={label} className="border-r border-border py-2 pr-3 last:border-r-0">
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
        <h2 className="font-semibold text-foreground">Known batch blockers ({summary.knownBlockers})</h2>
        {preview.blockers.length ? <ul className="mt-2 list-inside list-disc text-sm text-body">
          {preview.blockers.map(b => <li key={b}>{b.replaceAll("_", " ")}</li>)}
        </ul> : <p className="text-sm text-muted-foreground">No batch-level blocker was detected. Learner and runtime checks still apply.</p>}
      </section>
      <section className="min-w-0 space-y-3">
        <h2 className="font-semibold text-foreground">Learner-level preview</h2>
        <p className="text-xs text-muted-foreground">Showing at most 100 of {preview.learners.length} examined enrollments; a shortened display is not a complete readiness decision.</p>
        {preview.learners.length ? <div className="grid gap-3 md:grid-cols-2">
          {preview.learners.slice(0, 100).map(learner => <article key={learner.membershipId} className="min-w-0 border-b border-border py-3">
            <h3 className="m-0 break-words font-semibold text-foreground">{learner.name}</h3>
            <p className="mt-1 text-sm text-body">Enrollment: {learner.enrollmentStatus}</p>
            <p className="mt-2 text-sm text-body">{learner.blockers.length ? learner.blockers.join(", ").replaceAll("_", " ") : "No detected learner blocker"}</p>
          </article>)}
        </div> : <EmptyState title="No enrolled learners" description="No registered learner enrollments were present for this batch." />}
      </section>
    </>}
    <Link href="/admin/academics" className="inline-flex min-h-11 items-center font-semibold text-primary-text hover:underline sm:min-h-9">← Academics</Link>
  </div>;
}
