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
  reportNumber,
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

export default async function TpoPlacementSummaryPage({
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

  const { metrics, byDrive, byCompany } = workspace.report;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="TPO · Reports"
        title="Placement summary"
        description="Season placement outcomes, distinct learners, offer totals and the drive/application funnel."
        actions={
          <ReportCsvLink workspace={workspace} kind="placement-summary" />
        }
      />

      <ReportNavigation workspace={workspace} />
      <ReportFilters
        workspace={workspace}
        path="/tpo/reports/placement-summary"
      />
      <ReportMetrics metrics={metrics} />

      <section
        aria-label="Detailed placement metrics"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {[
          { label: "Registered", value: reportNumber(metrics.registered) },
          { label: "Unique applicants", value: reportNumber(metrics.applicants) },
          { label: "Applications", value: reportNumber(metrics.applications) },
          { label: "Accepted offers", value: reportNumber(metrics.acceptedOffers) },
          { label: "Shortlisted", value: reportNumber(metrics.shortlisted) },
          { label: "Rejected", value: reportNumber(metrics.rejected) },
          { label: "Average annual CTC", value: reportCurrency(metrics.averagePackageInr) },
          { label: "Highest annual CTC", value: reportCurrency(metrics.highestPackageInr) },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <p className="text-xs font-semibold uppercase text-body">
              {item.label}
            </p>
            <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">
              {item.value}
            </p>
          </div>
        ))}
      </section>

      <ReportScopeNote note={workspace.registrationScopeNote} />

      {workspace.noSeason ? (
        <EmptyState
          title="No placement season available"
          description="Placement summary data requires a placement season. These empty results do not represent zero historical placements."
        />
      ) : (
        <>
          <ReportTable
            title="Drive performance"
            headings={[
              "Drive",
              "Company",
              "Employment type",
              "Applicants",
              "Applications",
              "Shortlisted",
              "Rejected",
              "Offers",
              "Accepted offers",
              "Placed learners",
            ]}
            rows={byDrive.map((row) => [
              row.title,
              row.companyName,
              row.employmentType,
              row.applicants,
              row.applications,
              row.shortlisted,
              row.rejected,
              row.offers,
              row.acceptedOffers,
              row.placed,
            ])}
            emptyDescription="No reportable drives match the selected season and drive filters."
          />

          <ReportTable
            title="Company performance"
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
            rows={byCompany.map((row) => [
              row.companyName,
              row.drives,
              row.applicants,
              row.applications,
              row.offers,
              row.acceptedOffers,
              row.placed,
              reportCurrency(row.averagePackageInr),
              reportCurrency(row.highestPackageInr),
            ])}
            emptyDescription="No company placement results match the selected filters."
          />
        </>
      )}
    </div>
  );
}
