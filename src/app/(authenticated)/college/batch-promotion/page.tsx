import Link from "next/link";
import { CollegePromotionConfirmation } from "@/components/academics/college-promotion-confirmation";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
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
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";

type Search = Record<string, string | string[] | undefined>;
function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value.length === 1 ? value[0] : "INVALID_DUPLICATE_QUERY"
    : typeof value === "string" ? value : undefined;
}

export default async function CollegeBatchPromotionPage({
  searchParams,
}: { searchParams: Promise<Search> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership) redirect("/dashboard");
  const incoming = await searchParams;
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
  if (!parsed.success) return <div className="space-y-4">
    <PageHeader title="Batch Promotion" />
    <ErrorState title="Invalid promotion preview filters"
      description="Select a valid program, batch and optional academic-year start. No learner records were loaded."
      action={<Link href="/college/batch-promotion" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9">Clear filters</Link>} />
  </div>;
  const options = await listCollegePromotionOptions(context, parsed.data);
  const preview = parsed.data.cohortId
    ? await previewCollegeBatchPromotion(context, parsed.data)
    : null;
  const facultySetup = preview?.plan.targetTermNumber && parsed.data.cohortId
    ? await getPromotionFacultyReadiness(context, preview.batch.programId,
      parsed.data.cohortId, preview.plan.targetTermNumber)
    : null;
  return <div className="min-w-0 overflow-x-clip space-y-6">
    <PageHeader title="Batch Promotion"
      description="Server-verified eligibility preview. Promotion rechecks blockers and closes prior-term-only teaching assignments."
      actions={<Link href="/college/batches"
        className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Batches</Link>} />
    <section className="border-t border-border pt-4">
      <form method="get" action="/college/batch-promotion" className="grid min-w-0 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-1 text-sm font-semibold text-body">
          Program
          <Select name="programId" defaultValue={parsed.data.programId ?? ""}
            >
            <option value="">All programs</option>
            {options.programs.map(program => <option key={program.id} value={program.id}>
              {program.name} ({program.code})
            </option>)}
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">
          Batch
          <Select name="cohortId" defaultValue={parsed.data.cohortId ?? ""}
            >
            <option value="">Select a batch</option>
            {options.cohorts.map(cohort => <option key={cohort.id} value={cohort.id}>
              {cohort.programName} · {cohort.name} ({cohort.status})
            </option>)}
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">
          Academic year override (optional)
          <Input name="yearStart" type="text" inputMode="numeric" pattern="[0-9]{4}-[0-9]{2}"
            defaultValue={parsed.data.yearStart === undefined ? "" : formatPromotionAcademicYear(parsed.data.yearStart)}
            placeholder="e.g., 2099-00"
            />
        </label>
        <div className="flex items-end">
          <Button type="submit" className="min-h-11 md:min-h-9">Preview</Button>
        </div>
      </form>
    </section>
    {!preview ? (
      <section className="border-t border-border pt-6">
        <EmptyState title="No promotion preview" description="Select a batch to calculate a preview from saved progression, semester and enrollment records."/>
      </section>
    ) : (
      <>
        <section className="space-y-3 border-t border-border pt-5" aria-label="Promotion preview">
          <h2 className="text-lg font-semibold text-foreground">{preview.batch.name}</h2>
          <p className="text-sm text-body">Program: {preview.batch.programName} · Batch status: {preview.batch.status}</p>
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
              <h3 className="font-semibold text-foreground">Batch blockers</h3>
              <ul className="list-inside list-disc text-sm text-body">
                {preview.blockers.map(blocker => <li key={blocker}>
                  {blocker==="NEXT_TERM_NO_MAPPED_COURSES"?<>
                    Cannot promote: Semester {preview.plan.targetTermNumber} has no mapped courses.
                    Configure the semester curriculum first.{" "}
                    <Link href="/college/semester-courses" className="font-semibold text-link underline">
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
        <section aria-label="Learner-level preview" className="min-w-0 border-t border-border pt-4">
          <h2 className="border-b border-border pb-3 text-lg font-semibold text-foreground">Learner blockers</h2>
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
    <p className="text-xs leading-5 text-muted-foreground">
      Preview never writes. Confirming promotion requires an unchanged version and rechecks
      blockers in a transaction. Graduation is available for batches in their final registered semester.
    </p>
  </div>;
}
