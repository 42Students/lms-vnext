import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import {
  ReportCsvLink,
  ReportFilters,
  ReportMetrics,
  ReportNavigation,
  ReportScopeNote,
  ReportTable,
  reportCurrency,
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

export default async function TpoByCompanyReportPage({
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
        title="Placement by company"
        description="Compare companies by drives, applicants, accepted offers, unique placed learners and accepted full-time packages."
        actions={<ReportCsvLink workspace={workspace} kind="by-company" />}
      />

      <ReportNavigation workspace={workspace} />
      <ReportFilters workspace={workspace} path="/tpo/reports/by-company" />
      <ReportMetrics metrics={workspace.report.metrics} />
      <ReportScopeNote note={workspace.registrationScopeNote} />

      <ReportTable
        title="Company placement performance"
        headings={[
          "Company",
          "Drives",
          "Unique applicants",
          "Applications",
          "Offers",
          "Accepted offers",
          "Placed learners",
          "Average annual CTC",
          "Highest annual CTC",
        ]}
        rows={workspace.report.byCompany.map((company) => [
          company.companyName,
          company.drives,
          company.applicants,
          company.applications,
          company.offers,
          company.acceptedOffers,
          company.placed,
          reportCurrency(company.averagePackageInr),
          reportCurrency(company.highestPackageInr),
        ])}
        emptyDescription="No company placements are available for the selected season and drive."
      />
    </div>
  );
}
