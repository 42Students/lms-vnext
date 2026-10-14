import { redirect } from "next/navigation";
import Link from "next/link";
import { buildTpoCompanyReportLinks } from "@/modules/placements/tpo-company-report-links-model";
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

  const companyLinks=buildTpoCompanyReportLinks(workspace.report.byCompany);
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
      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5" aria-label="Company report drill-down">
        <h2 className="font-semibold text-foreground">Open company records</h2>
        <p className="mt-1 text-sm text-body">These company pages show your college relationship and full persisted history, not just this report season.</p>
        {companyLinks.rows.length===0?<p className="mt-3 text-sm text-body">No company records in this report scope.</p>:
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">{companyLinks.rows.map(row=><li key={row.id}>
          <Link href={row.href} className="inline-flex min-h-10 max-w-full items-center break-words text-sm font-semibold text-primary-text hover:underline">{row.name} →</Link>
        </li>)}</ul>}
        {companyLinks.truncated?<p role="status" className="mt-3 text-xs text-muted-foreground">Only the first {companyLinks.rows.length} of {companyLinks.total} company links are shown; use report drive filters to narrow the result.</p>:null}
      </section>
    </div>
  );
}
