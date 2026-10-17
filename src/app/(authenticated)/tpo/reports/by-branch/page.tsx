import {ReportBarChart} from "@/components/placements/report-bar-chart";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  ReportCsvLink,
  ReportFilters,
  ReportMetrics,
  ReportNavigation,
  ReportScopeNote,
  ReportTable,
  reportCurrency,
  reportPercent,
} from "@/components/placements/placement-report-ui";
import { hasMembershipRole } from "@/modules/identity/context";
import { getPlacementReportWorkspace } from "@/modules/placements/report-service";

type SearchParams = {
  seasonId?: string | string[];
  jobId?: string | string[];
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TpoByBranchReportPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const context = await getCurrentRequestContext();

  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    redirect("/dashboard");
  }

  const query = await searchParams;
  const workspace = await getPlacementReportWorkspace(context, {
    collegeId: context.membership.collegeId,
    seasonId: first(query.seasonId) || undefined,
    jobId: first(query.jobId) || undefined,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="TPO · Reports"
        title="Placement by branch"
        description="Department-wise registered pool, applicants, offers, placed learners and accepted full-time packages."
        actions={
          <ReportCsvLink workspace={workspace} kind="by-branch" />
        }
      />

      <Link
        href="/tpo/reports/branch-season"
        className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text"
      >
        View applicant and accepted-offer evidence by season →
      </Link>
      <ReportNavigation workspace={workspace} />
      <ReportFilters
        workspace={workspace}
        path="/tpo/reports/by-branch"
      />
      <ReportMetrics metrics={workspace.report.metrics} />
      <ReportScopeNote note={workspace.registrationScopeNote} />
      <ReportBarChart title="Placement rate by branch" units="percent"
       rows={workspace.report.byBranch.flatMap(row=>row.placementRatePercent===null?[]:[{
        label:row.departmentName,value:row.placementRatePercent,
        detail:row.placed+" placed of "+row.registered+" registered",
       }])}/>

      {workspace.noSeason ? (
        <EmptyState
          title="No placement season available"
          description="Branch placement outcomes require a selected placement season."
        />
      ) : (
        <ReportTable
          title="Branch performance"
          headings={[
            "Branch",
            "Registered",
            "Unique applicants",
            "Applications",
            "Offers",
            "Accepted offers",
            "Placed learners",
            "Placement rate",
            "Average annual CTC",
            "Highest annual CTC",
          ]}
          rows={workspace.report.byBranch.map((row) => [
            row.departmentName,
            row.registered,
            row.applicants,
            row.applications,
            row.offers,
            row.acceptedOffers,
            row.placed,
            reportPercent(row.placementRatePercent),
            reportCurrency(row.averagePackageInr),
            reportCurrency(row.highestPackageInr),
          ])}
          emptyDescription="No registered, applying or placed learners match the selected filters."
        />
      )}
    </div>
  );
}
