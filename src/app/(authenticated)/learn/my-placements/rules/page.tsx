import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { redirect } from "next/navigation";
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
  // Historical bookmark compatibility: the legacy route moved to the placement tab.
  // Internal links carry from=cell and retain the detailed vNext rules view.
  if (query.from === undefined) redirect("/learn/my-placements/placement#rules");
  // Unsupported query values only change the back destination; they cannot
  // change authorization, learner identity or the data being read.
  const parsed = learnerPlacementRulesQuerySchema.safeParse(query);
  const context = await getCurrentRequestContext();
  const { evidence, preferences, preparation, back, ruleApplicability, policyView,
    effectivePolicySource, effectivePolicyUpdatedAt } =
    await getOwnLearnerPlacementRulesView(context, parsed.success ? parsed.data : {});
  return (
    <div className="min-w-0 space-y-6">
      <Link href={back.href}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
        ← {back.label}
      </Link>
      <PageHeader title="Placement rules"
        description="Your placement cell sets these rules. If they change, the new rules apply to applications made after the change." />
      <section className="min-w-0 border-b border-border py-4" aria-label="College-wide placement policy">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-semibold text-[var(--lms-heading)]">Your effective placement policy</h2>
          {policyView ? <Badge tone={effectivePolicySource==="BATCH_OVERRIDE"?"info":"neutral"}>
            {effectivePolicySource==="BATCH_OVERRIDE"?"Batch override applies":"College-wide rules"}
          </Badge> : null}
        </div>
        {effectivePolicySource==="BATCH_OVERRIDE" ? <p className="mt-2 text-xs text-muted-foreground">
          Your active cohort overrides the college baseline where the placement cell has saved a value.
          {effectivePolicyUpdatedAt ? " Override updated "+new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium"}).format(new Date(effectivePolicyUpdatedAt))+" IST." : ""}
        </p> : null}
        <p className="mt-2 text-xs text-muted-foreground">These are the effective saved rules for your active cohort where an override exists, otherwise the college-wide baseline. Drive-specific eligibility and your scoped application check remain authoritative.</p>
        {policyView?<div className="mt-3 space-y-2">
          <h3 className="text-sm font-semibold text-[var(--lms-heading)]">Where you stand:</h3>
          <p role="status" className="text-sm leading-6 text-body">{policyView.personal}</p>
          <ul className="max-w-3xl list-disc space-y-2 pl-6 text-sm leading-6 text-body">
            {policyView.points.map(point=><li key={point}>{point}</li>)}
          </ul>
          <p className="text-xs text-muted-foreground">Drive-level eligibility and the saved terms of each offer remain authoritative. Changes are not assumed to apply retroactively.</p>
        </div>:<p role="status" className="mt-2 text-sm text-body">
          The placement cell has not configured a college-wide policy record here yet. No rule amounts have been assumed.
        </p>}
      </section>
      <section aria-labelledby="placement-preparation-heading"
        className="min-w-0 border-b border-border pb-4">
        <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:justify-between sm:gap-3">
          <div>
            <h2 id="placement-preparation-heading" className="text-base font-semibold text-[var(--lms-heading)]">
              Where you stand
            </h2>
            <p className="mt-1 text-sm leading-6 text-body">
              A checklist of your recorded academic evidence and job preferences.
              This is not a placement eligibility decision or a college-issued clearance.
            </p>
          </div>
          <Badge  tone="neutral">
            {preparation.recordedCount} of {preparation.totalCount} signals recorded
          </Badge>
        </div>
        {!preparation.hasAcademicEvidence ? (
          <p role="status" className="mt-4 border-l-2 border-[var(--lms-info)] bg-[var(--lms-info-subtle)] px-4 py-3 text-sm text-body">
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
        <ul className="mt-3 divide-y divide-border">
          {preparation.criteria.map((criterion) => (
            <li key={criterion.key} className="min-w-0 py-3 first:pt-0 last:pb-0">
              <p className="text-sm font-semibold text-foreground">
                <span aria-hidden="true">{criterion.recorded ? "✓" : "○"} </span>
                {criterion.label}
              </p>
              <p className="mt-1 break-words text-sm text-body">{criterion.detail}</p>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
          <Link href="/learn/my-placements#placement-academic-evidence"
            className="inline-flex min-h-11 items-center break-words text-sm font-semibold text-link underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
            Review academic evidence →
          </Link>
          <Link href="/learn/my-placements/jobs"
            className="inline-flex min-h-11 items-center break-words text-sm font-semibold text-link underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
            Check published drive eligibility →
          </Link>
          <Link href="/learn/profile/verification"
            className="inline-flex min-h-11 items-center break-words text-sm font-semibold text-link underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
            View my college verification status →
          </Link>
        </div>
      </section>
      <section aria-labelledby="placement-eligibility-views" className="min-w-0 border-b border-border py-4">
        <h2 id="placement-eligibility-views" className="font-semibold text-[var(--lms-heading)]">Eligibility and preview views</h2>
        <p className="mt-2 text-sm text-body">Legacy eligibility, apply-check and bulk apply-check endpoints are now accessed through the authenticated learner drive list, drive detail and application flows. A missing preview or calendar extra is not an approval to apply.</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-body">
          <li><Link href="/learn/my-placements/jobs" className="text-primary-text underline">Drive list and eligibility checks</Link> — learner- and college-scoped checks before applying.</li>
          <li><Link href="/learn/my-placements/placement#rules" className="text-primary-text underline">Placement rules</Link> — recorded college rules and current registration.</li>
          <li><Link href="/learn/my-placements/calendar" className="text-primary-text underline">Placement calendar</Link> — published events; unavailable extras cannot be assumed.</li>
          <li>Single-drive eligibility and apply-check: the authenticated drive detail and application action enforce your current membership and college scope.</li>
          <li>Bulk apply-checks: each published drive is evaluated for the signed-in learner; the list is a preview, not permission to bypass a final application check.</li>
          <li>Placement rules: this page reads the selected college's effective rules and any saved active-cohort override.</li>
          <li>Company preview: use the published drive and associated company details; no private employer preview is implied.</li>
          <li>Calendar extras: use published placement events; unavailable extras are not inferred.</li>
        </ul>
      </section>
      <section aria-labelledby="placement-how-eligibility-works" className="min-w-0 border-b border-border py-4">
        <h2 id="placement-how-eligibility-works" className="m-0 text-base font-semibold text-[var(--lms-heading)]">How eligibility works</h2>
        <p className="mt-2 text-sm leading-6 text-body">Each published drive carries its own eligibility configuration. Your verified academic evidence is evaluated against that drive when you open or apply to it. A drive can therefore be available, eligible, or blocked with an explainable reason.</p>
        <Link href="/learn/my-placements/jobs" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">Check current drives →</Link>
      </section>
      <section aria-labelledby="rule-applicability-heading"
        className="min-w-0 border-b border-border py-4">
        <h2 id="rule-applicability-heading" className="text-base font-semibold text-[var(--lms-heading)]">
          {ruleApplicability.heading}
        </h2>
        <p className="mt-2 text-sm leading-6 text-body">{ruleApplicability.message}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          {policyView?"College placement rules are saved; the exact effective date of a change is not inferred.":"A college placement policy is not configured for your membership."}
          No retroactive eligibility decision is inferred.
        </p>
        <Link href="/learn/my-placements/applications"
          className="mt-3 inline-flex min-h-[var(--lms-control-height)] max-md:min-h-11 items-center text-sm font-semibold text-primary-text hover:underline">
          Review my saved applications →
        </Link>
      </section>
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <section className="min-w-0 border-b border-border py-4">
          <h2 className="m-0 text-base font-semibold text-[var(--lms-heading)]">Your academic evidence</h2>
          <dl className="mt-3 grid min-w-0 grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div><dt className="text-muted-foreground">CGPA</dt><dd className="mt-1 font-semibold text-foreground">{evidence?.cgpa ?? "Not recorded"}</dd></div>
            <div><dt className="text-muted-foreground">Active backlogs</dt><dd className="mt-1 font-semibold text-foreground">{evidence?.activeBacklogs ?? "Not recorded"}</dd></div>
            <div><dt className="text-muted-foreground">Gap years</dt><dd className="mt-1 font-semibold text-foreground">{evidence?.gapYears ?? "Not recorded"}</dd></div>
            <div><dt className="text-muted-foreground">Source</dt><dd className="mt-1 font-semibold text-foreground">{evidence?.source ?? "Not recorded"}</dd></div>
          </dl>
          <Link href="/learn/my-placements#placement-academic-evidence" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">Open academic record →</Link>
        </section>
        <section className="min-w-0 border-b border-border py-4">
          <h2 className="m-0 text-base font-semibold text-[var(--lms-heading)]">Your job preferences</h2>
          <p className="mt-3 text-sm leading-6 text-body">{preferences.preferredRoleTitles.length ? preferences.preferredRoleTitles.join(", ") : "No preferred roles recorded."}</p>
          <p className="mt-2 text-sm leading-6 text-body">{preferences.preferredLocations.length ? preferences.preferredLocations.join(", ") : "No preferred locations recorded."}</p>
          <Link href="/learn/my-placements#placement-job-preferences" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">Edit job preferences →</Link>
        </section>
      </div>

    </div>
  );
}