import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { getOwnLearnerPlacementRulesView } from "@/modules/placements/learner-placement-rules-service";
import { learnerPlacementRulesQuerySchema } from "@/modules/placements/learner-placement-rules-model";

export default async function LearnerPlacementRulesPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string | string[] }>;
}) {
  const query = await searchParams;
  // Unsupported query values only change the back destination; they cannot
  // change authorization, learner identity or the data being read.
  const parsed = learnerPlacementRulesQuerySchema.safeParse(query);
  const context = await getCurrentRequestContext();
  const { evidence, preferences, preparation, back, ruleApplicability } =
    await getOwnLearnerPlacementRulesView(context, parsed.success ? parsed.data : {});
  return (
    <div className="space-y-6">
      <Link href={back.href}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline">
        ← {back.label}
      </Link>
      <PageHeader eyebrow="My Placements" title="Placement rules"
        description="The placement signals vNext can verify today, without inventing College policy that has not been configured." />
      <section aria-labelledby="placement-preparation-heading"
        className="rounded-xl border border-border bg-surface p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="placement-preparation-heading" className="text-base font-semibold text-foreground">
              Where you stand
            </h2>
            <p className="mt-1 text-sm leading-6 text-body">
              A checklist of your recorded academic evidence and job preferences.
              This is not a placement eligibility decision or a college-issued clearance.
            </p>
          </div>
          <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-body">
            {preparation.recordedCount} of {preparation.totalCount} signals recorded
          </span>
        </div>
        {!preparation.hasAcademicEvidence ? (
          <p role="status" className="mt-4 rounded-lg border border-border bg-surface-subtle p-4 text-sm text-body">
            No academic evidence record is stored for your membership yet.
            Your eligibility for a particular published drive remains unknown until
            that drive checks its own criteria.
          </p>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">
            Academic evidence source: {preparation.academicSource}.
            A self-entered value must not be described as verified by your college.
          </p>
        )}
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {preparation.criteria.map((criterion) => (
            <li key={criterion.key} className="rounded-lg border border-border p-3">
              <p className="text-sm font-semibold text-foreground">
                <span aria-hidden="true">{criterion.recorded ? "✓" : "○"} </span>
                {criterion.label}
              </p>
              <p className="mt-1 break-words text-sm text-body">{criterion.detail}</p>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/learn/my-placements#placement-academic-evidence"
            className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle">
            Review academic evidence →
          </Link>
          <Link href="/learn/my-placements/jobs"
            className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle">
            Check published drive eligibility →
          </Link>
          <Link href="/learn/profile/verification"
            className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle">
            View my college verification status →
          </Link>
        </div>
      </section>
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="m-0 text-base font-semibold text-foreground">How eligibility works</h2>
        <p className="mt-2 text-sm leading-6 text-body">Each published drive carries its own eligibility configuration. Your verified academic evidence is evaluated against that drive when you open or apply to it. A drive can therefore be available, eligible, or blocked with an explainable reason.</p>
        <Link href="/learn/my-placements/jobs" className="mt-3 inline-flex text-sm font-semibold text-primary-text">Check current drives →</Link>
      </section>
      <section aria-labelledby="rule-applicability-heading"
        className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <h2 id="rule-applicability-heading" className="text-base font-semibold text-foreground">
          {ruleApplicability.heading}
        </h2>
        <p className="mt-2 text-sm leading-6 text-body">{ruleApplicability.message}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          We do not have a versioned College placement-policy record here.
          No change-effective date or retroactive eligibility decision is inferred.
        </p>
        <Link href="/learn/my-placements/applications"
          className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline">
          Review my saved applications →
        </Link>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="m-0 text-base font-semibold text-foreground">Your academic evidence</h2>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-muted-foreground">CGPA</dt><dd className="mt-1 font-semibold text-foreground">{evidence?.cgpa ?? "Not recorded"}</dd></div>
            <div><dt className="text-muted-foreground">Active backlogs</dt><dd className="mt-1 font-semibold text-foreground">{evidence?.activeBacklogs ?? "Not recorded"}</dd></div>
            <div><dt className="text-muted-foreground">Gap years</dt><dd className="mt-1 font-semibold text-foreground">{evidence?.gapYears ?? "Not recorded"}</dd></div>
            <div><dt className="text-muted-foreground">Source</dt><dd className="mt-1 font-semibold text-foreground">{evidence?.source ?? "Not recorded"}</dd></div>
          </dl>
          <Link href="/learn/my-placements#placement-academic-evidence" className="mt-4 inline-flex text-sm font-semibold text-primary-text">Open academic record →</Link>
        </section>
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="m-0 text-base font-semibold text-foreground">Your job preferences</h2>
          <p className="mt-3 text-sm leading-6 text-body">{preferences.preferredRoleTitles.length ? preferences.preferredRoleTitles.join(", ") : "No preferred roles recorded."}</p>
          <p className="mt-2 text-sm leading-6 text-body">{preferences.preferredLocations.length ? preferences.preferredLocations.join(", ") : "No preferred locations recorded."}</p>
          <Link href="/learn/my-placements#placement-job-preferences" className="mt-4 inline-flex text-sm font-semibold text-primary-text">Edit job preferences →</Link>
        </section>
      </div>
      <section className="rounded-xl border border-warning/40 bg-surface p-5">
        <h2 className="m-0 text-sm font-semibold text-foreground">College-wide placement policy</h2>
        <p className="mt-2 text-sm leading-6 text-body">The old LMS exposes a College-authored rules summary. vNext does not yet have a canonical College placement-policy record, so this page deliberately does not fabricate one. Drive-level eligibility remains enforced and explainable.</p>
      </section>
    </div>
  );
}