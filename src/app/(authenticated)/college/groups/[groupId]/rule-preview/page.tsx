import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { SummaryStrip } from "@/components/ui/summary-strip";
import { Alert } from "@/components/ui/alert";
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
      if(error.code==="RULE_NOT_CONFIGURED")return <div className="min-w-0 space-y-4">
        <PageHeader title="Rule preview" actions={<PageBackLink href={"/college/groups/"+encodeURIComponent(groupId)} label="Back to group"/>}/>
        <Alert tone="info" title="No rule configured">This group has no automatic membership rule. Preview only; no learners were evaluated or changed.</Alert>
      </div>;
      return <ErrorState
        title="Rule preview unavailable"
        description="This group does not have a supported, configured rule. No learners were evaluated or changed."
        action={<Link href={"/college/groups/" + encodeURIComponent(groupId)}
          className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] w-full md:w-auto">Back to group</Link>}
      />;
    }
    throw error;
  }
  const { group, criteria, projection } = result;
  return <div className="min-w-0 max-w-full space-y-4">
    <PageHeader
      title={"Rule preview · " + group.name}
      description="Read-only eligibility preview. No membership changes, refresh or rule edits are performed."
      actions={<PageBackLink href={"/college/groups/" + encodeURIComponent(group.id)} label="Back to group"/>}
    />
    <Alert tone="info" title="Preview only">This preview evaluates eligibility without changing group membership. Applying a rule is a separate, authorized action.</Alert>
    {projection.incomplete ? (
      <Alert tone="warning" title="Preview candidate cap reached">
        More than 1,000 active learners were eligible for evaluation. Counts below describe only the first 1,000 records; they are not college-wide totals.
      </Alert>
    ) : null}
    <SummaryStrip label="Rule eligibility summary" steps={[
      {label:"Candidates examined",value:projection.examined},
      {label:"Rule matches",value:projection.matched},
      {label:"Matches already active",value:projection.alreadyActive},
      {label:"Matches not currently active",value:projection.potentiallyNew},
    ]}/>
    <section aria-label="Configured criteria" className="min-w-0 border-t border-border pt-3">
      <details className="min-w-0">
        <summary className="min-h-11 cursor-pointer py-2 font-semibold text-[var(--lms-heading)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Persisted rule criteria</summary>
        <div className="min-w-0 space-y-3 pt-3">
      <dl className="grid min-w-0 gap-3 md:grid-cols-2">
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
          ? "Last persisted rule run: " + new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(result.lastRunAt)+" IST" + " · " + (result.lastRunMatched ?? "unknown") + " matches"
          : "No completed rule refresh is recorded."}
      </p>
        </div>
      </details>
    </section>
    <p className="max-w-3xl text-sm text-muted-foreground">
      Matching learners are not automatically members. Capacity, waitlist order, manual overrides,
      locked membership, current group lifecycle and promotion of existing waitlisted members
      are enforced by the actual refresh workflow, not simulated by this eligibility-only preview.
    </p>
    {projection.examined === 0 ? (
      <p className="border-t border-border pt-4 text-sm text-body">
        No active learner program enrollments with valid college memberships were found.
        This does not mean that the college has no learners.
      </p>
    ) : null}
  </div>;
}
