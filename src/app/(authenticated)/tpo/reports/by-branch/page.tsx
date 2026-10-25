import {tpoReportHasAmbiguousFilters} from "@/modules/placements/tpo-report-url-guard";
import {TpoReportInvalidFilters} from "@/components/placements/tpo-report-invalid-filters";
import {TPO_LEGACY_REPORT_COPY} from "@/modules/placements/tpo-legacy-report-copy";
import {LEGACY_TPO_BRANCH_COLUMNS,legacyTpoBranchReportRow} from "@/modules/placements/tpo-branch-report-view-model";
import {TpoByBranchPrototypeChart} from "@/components/tpo/tpo-by-branch-prototype-chart";
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
  if(tpoReportHasAmbiguousFilters(query))return <TpoReportInvalidFilters path="/tpo/reports/by-branch"/>;
  const workspace = await getPlacementReportWorkspace(context, {
    collegeId: context.membership.collegeId,
    seasonId: first(query.seasonId) || undefined,
    jobId: first(query.jobId) || undefined,
  });

  return (
    <div data-tpo-presentation-report className="min-w-0 space-y-4">
      <PageHeader
        eyebrow="TPO · Reports"
        title="By branch"
        description={TPO_LEGACY_REPORT_COPY["/tpo/reports/by-branch"]?.description ?? "By branch"}
        actions={<div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Link href="/tpo/reports/branch-season" className="inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold text-link underline sm:w-auto md:min-h-9">View applicant and accepted-offer evidence by season →</Link>
          <ReportCsvLink workspace={workspace} kind="by-branch" />
        </div>}
      />

      <ReportNavigation workspace={workspace} />
      <ReportFilters
        workspace={workspace}
        userId={context.user.id}
        path="/tpo/reports/by-branch"
      />
      <ReportMetrics metrics={workspace.report.metrics} />
      <ReportScopeNote note={workspace.registrationScopeNote} />
      <TpoByBranchPrototypeChart rows={workspace.report.byBranch}/>

      {workspace.noSeason ? (
        <EmptyState
          title="No placement season available"
          description="Branch placement outcomes require a selected placement season."
        />
      ) : (
        <ReportTable
          title="Branch performance"
          headings={[...LEGACY_TPO_BRANCH_COLUMNS]}
          rows={workspace.report.byBranch.map(legacyTpoBranchReportRow)}
          emptyDescription="No registered, applying or placed learners match the selected filters."
        />
      )}
    </div>
  );
}
