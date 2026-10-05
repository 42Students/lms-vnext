import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { getCandidatePreferences } from "@/modules/placements/candidate-preferences-service";
import { getOwnAcademicEvidence } from "@/modules/placements/eligibility-service";

export default async function LearnerPlacementRulesPage() {
  const context = await getCurrentRequestContext();
  const [evidence, preferences] = await Promise.all([getOwnAcademicEvidence(context), getCandidatePreferences(context)]);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="My Placements" title="Placement rules" description="The placement signals vNext can verify today, without inventing College policy that has not been configured." />
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="m-0 text-base font-semibold text-foreground">How eligibility works</h2>
        <p className="mt-2 text-sm leading-6 text-body">Each published drive carries its own eligibility configuration. Your verified academic evidence is evaluated against that drive when you open or apply to it. A drive can therefore be available, eligible, or blocked with an explainable reason.</p>
        <Link href="/learn/my-placements/jobs" className="mt-3 inline-flex text-sm font-semibold text-primary-text">Check current drives →</Link>
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
          <Link href="/learn/profile#academic-record" className="mt-4 inline-flex text-sm font-semibold text-primary-text">Open academic record →</Link>
        </section>
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="m-0 text-base font-semibold text-foreground">Your job preferences</h2>
          <p className="mt-3 text-sm leading-6 text-body">{preferences.preferredRoleTitles.length ? preferences.preferredRoleTitles.join(", ") : "No preferred roles recorded."}</p>
          <p className="mt-2 text-sm leading-6 text-body">{preferences.preferredLocations.length ? preferences.preferredLocations.join(", ") : "No preferred locations recorded."}</p>
          <Link href="/learn/profile#job-preferences" className="mt-4 inline-flex text-sm font-semibold text-primary-text">Edit job preferences →</Link>
        </section>
      </div>
      <section className="rounded-xl border border-warning/40 bg-surface p-5">
        <h2 className="m-0 text-sm font-semibold text-foreground">College-wide placement policy</h2>
        <p className="mt-2 text-sm leading-6 text-body">The old LMS exposes a College-authored rules summary. vNext does not yet have a canonical College placement-policy record, so this page deliberately does not fabricate one. Drive-level eligibility remains enforced and explainable.</p>
      </section>
    </div>
  );
}