import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { CollegePromotionPreviewError, listCollegePromotionOptions,
  previewCollegeBatchPromotion } from "@/modules/academics/college-batch-promotion-service";
import { readAdminPromotionParams, summarizeAdminPromotion } from "@/modules/academics/admin-batch-promotion-read-model";

export default async function SuperAdminBatchPromotionPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const input = readAdminPromotionParams(await searchParams);
  if (!input.success) return <div className="space-y-5">
    <PageHeader eyebrow="Super Admin · Academics" title="Batch Promotion Preview" />
    <ErrorState title="Invalid batch promotion filters" description="Use valid program, cohort and optional academic year values."
      action={<Link href="/admin/batch-promotion" className="font-semibold text-primary-text">Clear filters</Link>} />
  </div>;
  const context = await getCurrentRequestContext();
  if (!context.adminScope?.collegeId) return <div className="space-y-5">
    <PageHeader eyebrow="Super Admin · Academics" title="Batch Promotion Preview" />
    <EmptyState title="Select a college scope" description="Choose the exact college before inspecting promotion eligibility. No batch is selected automatically." />
  </div>;
  const options = await listCollegePromotionOptions(context, input.data);
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
  return <div className="space-y-5">
    <PageHeader eyebrow="Super Admin · Academics" title="Batch Promotion Preview"
      description="Read-only persisted cohort progression and blocker preview. This page cannot execute, graduate or move any learners." />
    <form method="get" className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="grid gap-1 text-sm font-semibold text-body">Program
        <select name="programId" defaultValue={input.data.programId ?? ""}
          className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
          <option value="">All programs</option>
          {options.programs.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Batch
        <select name="cohortId" defaultValue={input.data.cohortId ?? ""}
          className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
          <option value="">Select a batch</option>
          {options.cohorts.map(b => <option key={b.id} value={b.id}>{b.programName} · {b.name} ({b.status})</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Academic year start override
        <input name="yearStart" type="number" min={1900} max={9998} step={1}
          defaultValue={input.data.yearStart ?? ""} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
      </label>
      <button type="submit" className="min-h-11 self-end rounded-md bg-primary px-4 font-semibold text-on-primary">Preview</button>
    </form>
    {invalidCohort ? <ErrorState title="Batch unavailable" description="The selected batch is not available within this college and program."
      action={<Link href="/admin/batch-promotion" className="font-semibold text-primary-text">Reset selection</Link>} /> :
    !preview || !summary ? <EmptyState title="Choose a batch" description="No learner data is fetched until you select a college-owned batch." /> :
    <>
      <section className="space-y-3 rounded-xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="m-0 break-words font-semibold text-foreground">{preview.batch.name}</h2>
          <StatusBadge tone={preview.simulatedReadiness ? "success" : "warning"}>{preview.simulatedReadiness ? "No detected blockers" : "Blocked or incomplete"}</StatusBadge>
        </div>
        <p className="text-sm text-body">{preview.batch.programName} · {preview.batch.status}</p>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {([
            ["Action", summary.action], ["Target term", summary.targetTerm ?? "Unavailable"],
            ["Learners checked", summary.learnersChecked], ["Learners with blockers", summary.blockedLearners],
          ] as const).map(([label, value]) => <div key={label} className="rounded-lg border border-border bg-surface-subtle p-3">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-1 font-semibold text-foreground">{value}</dd>
          </div>)}
        </dl>
        {!summary.completePreview ? <p role="alert" className="text-sm text-error">Preview is truncated at 2,000 enrollments and cannot prove readiness.</p> : null}
        <p className="text-xs text-muted-foreground">This is a simulation, not approval to execute a promotion. Graduation is unavailable.</p>
      </section>
      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="font-semibold text-foreground">Known batch blockers ({summary.knownBlockers})</h2>
        {preview.blockers.length ? <ul className="mt-2 list-inside list-disc text-sm text-body">
          {preview.blockers.map(b => <li key={b}>{b.replaceAll("_", " ")}</li>)}
        </ul> : <p className="text-sm text-muted-foreground">No batch-level blocker was detected. Learner and runtime checks still apply.</p>}
      </section>
      <section className="space-y-3">
        <h2 className="font-semibold text-foreground">Learner-level preview</h2>
        <p className="text-xs text-muted-foreground">Showing at most 100 of {preview.learners.length} examined enrollments; a shortened display is not a complete readiness decision.</p>
        {preview.learners.length ? <div className="grid gap-3 md:grid-cols-2">
          {preview.learners.slice(0, 100).map(learner => <article key={learner.membershipId} className="min-w-0 rounded-xl border border-border bg-surface p-4">
            <h3 className="m-0 break-words font-semibold text-foreground">{learner.name}</h3>
            <p className="mt-1 text-sm text-body">Enrollment: {learner.enrollmentStatus}</p>
            <p className="mt-2 text-sm text-body">{learner.blockers.length ? learner.blockers.join(", ").replaceAll("_", " ") : "No detected learner blocker"}</p>
          </article>)}
        </div> : <EmptyState title="No enrolled learners" description="No registered learner enrollments were present for this batch." />}
      </section>
    </>}
    <Link href="/admin/academics" className="inline-flex min-h-10 items-center font-semibold text-primary-text">← Academics</Link>
  </div>;
}
