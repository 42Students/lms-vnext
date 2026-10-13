import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import {
  ReportCsvLink,
  ReportFilters,
  ReportNavigation,
  ReportScopeNote,
  ReportTable,
  reportNumber,
} from "@/components/placements/placement-report-ui";
import { hasMembershipRole } from "@/modules/identity/context";
import { getPlacementReportDetails } from "@/modules/placements/report-service";

type SearchParams = {
  seasonId?: string | string[];
  jobId?: string | string[];
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TpoUnplacedReportPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const context = await getCurrentRequestContext();

  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    redirect("/dashboard");
  }

  const query = await searchParams;
  const workspace = await getPlacementReportDetails(context, {
    collegeId: context.membership.collegeId,
    seasonId: first(query.seasonId) || undefined,
    jobId: first(query.jobId) || undefined,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="TPO · Reports"
        title="Unplaced students"
        description="Current registered placement-pool learners with no accepted offer in the selected reporting scope."
        actions={<ReportCsvLink workspace={workspace} kind="unplaced" />}
      />

      <ReportNavigation workspace={workspace} />
      <ReportFilters workspace={workspace} path="/tpo/reports/unplaced" />

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-semibold uppercase text-body">
            Unplaced in selected scope
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
            {reportNumber(workspace.details.unplaced.length)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-semibold uppercase text-body">
            Current placement-pool registrations
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
            {reportNumber(workspace.report.metrics.registered)}
          </p>
          <p className="mt-1 text-xs text-body">
            See Placement Summary for the overall registered denominator.
          </p>
        </div>
      </section>

      <ReportScopeNote note={workspace.detailScopeNote} />

      <ReportTable
        title="Registered learners without an accepted offer"
        headings={["Student", "Branch", "Membership ID"]}
        rows={workspace.details.unplaced.map((learner) => [
          learner.displayName,
          learner.departmentName,
          learner.membershipId,
        ])}
        emptyDescription="No unplaced learners match this reporting scope. This does not prove that all learners have been placed across all seasons."
      />
    </div>
  );
}
