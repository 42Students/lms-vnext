import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  CollegeRulePreviewError,
  previewCollegeGroupRule,
} from "@/modules/groups/college-rule-preview-service";

export default async function CollegeGroupRulePreviewPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const context = await getCurrentRequestContext();
  const { groupId } = await params;
  let result: Awaited<ReturnType<typeof previewCollegeGroupRule>>;
  try {
    result = await previewCollegeGroupRule(context, { groupId });
  } catch (error) {
    if (error instanceof CollegeRulePreviewError) {
      if (error.code === "GROUP_NOT_FOUND") notFound();
      return <ErrorState
        title="Rule preview unavailable"
        description="This group does not have a supported, configured rule. No learners were evaluated or changed."
        action={<Link href={"/college/groups/" + encodeURIComponent(groupId)}
          className="font-semibold text-link">Back to group</Link>}
      />;
    }
    throw error;
  }
  const { group, criteria, projection } = result;
  return <div className="min-w-0 overflow-x-clip space-y-6">
    <PageHeader
      eyebrow="College Admin · Student Groups"
      title={"Rule preview · " + group.name}
      description="Read-only eligibility preview. No membership changes, refresh or rule edits are performed."
      actions={<Link href={"/college/groups/" + encodeURIComponent(group.id)}
        className="inline-flex min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link">
        Back to group
      </Link>}
    />
    {projection.incomplete ? (
      <ErrorState title="Preview candidate cap reached"
        description="More than 1,000 active learners were eligible for evaluation. Counts below describe only the first 1,000 records; they are not college-wide totals." />
    ) : null}
    <section aria-label="Rule eligibility summary" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[
        ["Candidates examined", projection.examined],
        ["Rule matches", projection.matched],
        ["Matches already active", projection.alreadyActive],
        ["Matches not currently active", projection.potentiallyNew],
      ].map(([title, value]) => (
        <div key={title} className="rounded-[8px] border border-border bg-surface p-5">
          <p className="text-xs font-semibold text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
        </div>
      ))}
    </section>
    <section aria-label="Configured criteria" className="space-y-3 border-t border-border pt-5">
      <h2 className="text-lg font-semibold text-foreground">Persisted rule criteria</h2>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div><dt className="text-xs text-muted-foreground">Programs allowed</dt>
          <dd className="font-semibold text-foreground">{criteria.allowedProgramIds.length || "Not restricted"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Cohorts allowed</dt>
          <dd className="font-semibold text-foreground">{criteria.allowedCohortIds.length || "Not restricted"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Minimum CGPA</dt>
          <dd className="font-semibold text-foreground">{criteria.minCgpa ?? "Not restricted"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Maximum active backlogs</dt>
          <dd className="font-semibold text-foreground">{criteria.maxActiveBacklogs ?? "Not restricted"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Passing years</dt>
          <dd className="font-semibold text-foreground">{criteria.allowedPassingYears.length || "Not restricted"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Auto-refresh configured</dt>
          <dd className="font-semibold text-foreground">{result.autoRefresh ? "Yes" : "No"}</dd></div>
      </dl>
      <p className="text-sm text-muted-foreground">
        {result.lastRunAt
          ? "Last persisted rule run: " + result.lastRunAt.toISOString() + " · " + (result.lastRunMatched ?? "unknown") + " matches"
          : "No completed rule refresh is recorded."}
      </p>
    </section>
    <p className="text-sm text-muted-foreground">
      Matching learners are not automatically members. Capacity, waitlist order, manual overrides,
      locked membership, current group lifecycle and promotion of existing waitlisted members
      are enforced by the actual refresh workflow, not simulated by this eligibility-only preview.
    </p>
    {projection.examined === 0 ? (
      <p className="rounded-[8px] border border-border p-5 text-sm text-body">
        No active learner program enrollments with valid college memberships were found.
        This does not mean that the college has no learners.
      </p>
    ) : null}
  </div>;
}
