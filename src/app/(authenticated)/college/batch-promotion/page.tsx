import Link from "next/link";
import { CollegePromotionConfirmation } from "@/components/academics/college-promotion-confirmation";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { collegePromotionQuerySchema, formatPromotionAcademicYear } from "@/modules/academics/college-batch-promotion-model";
import { BATCH_PROMOTION_COPY, promotionImpactMessage } from "@/modules/academics/college-batch-promotion-copy";
import { getPromotionFacultyReadiness } from "@/modules/academics/college-promotion-faculty-readiness";
import {
  listCollegePromotionOptions,
  previewCollegeBatchPromotion,
} from "@/modules/academics/college-batch-promotion-service";

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
    <PageHeader eyebrow="College Admin · Academic Setup" title="Batch Promotion" />
    <ErrorState title="Invalid promotion preview filters"
      description="Select a valid program, batch and optional academic-year start. No learner records were loaded."
      action={<Link href="/college/batch-promotion" className="font-semibold text-primary-text">Clear filters</Link>} />
  </div>;
  const options = await listCollegePromotionOptions(context, parsed.data);
  const preview = parsed.data.cohortId
    ? await previewCollegeBatchPromotion(context, parsed.data)
    : null;
  const facultySetup = preview?.plan.targetTermNumber && parsed.data.cohortId
    ? await getPromotionFacultyReadiness(context, preview.batch.programId,
      parsed.data.cohortId, preview.plan.targetTermNumber)
    : null;
  return <div className="min-w-0 space-y-6">
    <PageHeader eyebrow="College Admin · Academic Setup" title="Batch Promotion"
      description="Server-verified eligibility preview. Promotion rechecks blockers and closes prior-term-only teaching assignments."
      actions={<Link href="/college/batches"
        className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-primary-text">Batches</Link>} />
    <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <form method="get" action="/college/batch-promotion" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-1 text-sm font-semibold text-body">
          Program
          <select name="programId" defaultValue={parsed.data.programId ?? ""}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
            <option value="">All programs</option>
            {options.programs.map(program => <option key={program.id} value={program.id}>
              {program.name} ({program.code})
            </option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">
          Batch
          <select name="cohortId" defaultValue={parsed.data.cohortId ?? ""}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
            <option value="">Select a batch</option>
            {options.cohorts.map(cohort => <option key={cohort.id} value={cohort.id}>
              {cohort.programName} · {cohort.name} ({cohort.status})
            </option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">
          Academic year override (optional)
          <input name="yearStart" type="text" inputMode="numeric" pattern="[0-9]{4}-[0-9]{2}"
            defaultValue={parsed.data.yearStart === undefined ? "" : formatPromotionAcademicYear(parsed.data.yearStart)}
            placeholder="e.g., 2099-00"
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
        </label>
        <div className="flex items-end">
          <button type="submit" className="min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-on-primary">
            Preview
          </button>
        </div>
      </form>
    </section>
    {!preview ? (
      <section className="rounded-xl border border-border bg-surface p-6">
        <p className="text-sm text-body">
          Select a batch to calculate a preview from saved progression, semester and enrollment records.
        </p>
      </section>
    ) : (
      <>
        <section className="space-y-3 rounded-xl border border-border bg-surface p-5" aria-label="Promotion preview">
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
            <div role="alert" className="space-y-2">
              <h3 className="font-semibold text-foreground">Batch blockers</h3>
              <ul className="list-inside list-disc text-sm text-body">
                {preview.blockers.map(blocker => <li key={blocker}>
                  {blocker==="NEXT_TERM_NO_MAPPED_COURSES"?<>
                    Cannot promote: Semester {preview.plan.targetTermNumber} has no mapped courses.
                    Configure the semester curriculum first.{" "}
                    <Link href="/college/semester-courses" className="font-semibold text-primary-text underline">
                      Map semester courses
                    </Link>
                  </>:blocker.replaceAll("_"," ")}
                </li>)}
              </ul>
            </div>
          ) : <p className="text-sm text-body">
            No batch-level blockers were observed. This is not authorization to execute a promotion.
          </p>}
          <p className="text-sm font-semibold text-body">
            {preview.simulatedReadiness ? BATCH_PROMOTION_COPY.ready : BATCH_PROMOTION_COPY.notReady}
          </p>
          {facultySetup?.incomplete && <p role="status" className="text-sm font-semibold text-amber-700">
            Faculty setup is still incomplete
            {facultySetup.totalCourses > 0 ? ` — ${facultySetup.missingCourses} of ${facultySetup.totalCourses} mapped course(s) lack active teaching assignments.` : " — no target semester courses mapped."}
          </p>}
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
        <section aria-label="Learner-level preview" className="overflow-x-auto rounded-xl border border-border bg-surface">
          <h2 className="border-b border-border p-4 text-lg font-semibold text-foreground">Learner blockers</h2>
          {preview.learners.length === 0 ? (
            <p className="p-6 text-sm text-body">
              No persisted learner enrollments exist for this batch. No eligible count is inferred.
            </p>
          ) : (
            <table className="w-full min-w-[35rem] text-left text-sm">
              <thead className="bg-muted text-muted-foreground"><tr>
                <th scope="col" className="px-4 py-3">Learner</th>
                <th scope="col" className="px-4 py-3">Enrollment</th>
                <th scope="col" className="px-4 py-3">Blockers</th>
              </tr></thead>
              <tbody>{preview.learners.map(learner => <tr key={learner.membershipId}
                className="border-t border-border align-top">
                <td className="px-4 py-3 font-semibold text-foreground">{learner.name}</td>
                <td className="px-4 py-3 text-body">{learner.enrollmentStatus}</td>
                <td className="px-4 py-3 text-body">
                  {learner.blockers.length ? learner.blockers.join(", ").replaceAll("_", " ") : "No detected learner blocker"}
                </td>
              </tr>)}</tbody>
            </table>
          )}
        </section>
      </>
    )}
    <p className="text-xs leading-5 text-muted-foreground">
      Preview never writes. Confirming promotion requires an unchanged version and rechecks
      blockers in a transaction. Graduation is available for batches in their final registered semester.
    </p>
  </div>;
}
