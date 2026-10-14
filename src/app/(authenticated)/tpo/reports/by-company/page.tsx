import { redirect } from "next/navigation";
import Link from "next/link";
import { buildTpoCompanyReportLinks } from "@/modules/placements/tpo-company-report-links-model";
import { companyReportViewSchema, paginateCompanyReport, companyReportViewHref } from "@/modules/placements/tpo-company-report-view-model";
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
  q?: string | string[];
  page?: string | string[];
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
  const viewQuery=companyReportViewSchema.safeParse({...(first(query.q)?{q:first(query.q)}:{}),...(first(query.page)?{page:first(query.page)}:{})});
  if(!viewQuery.success)return <section role="alert" className="rounded-xl border border-border bg-surface p-6"><h1 className="font-semibold text-foreground">Invalid company report filters</h1><p className="mt-2 text-sm text-body">Check search length and page number.</p></section>;
  const workspace = await getPlacementReportWorkspace(context, {
    collegeId: context.membership.collegeId,
    seasonId: first(query.seasonId) || undefined,
    jobId: first(query.jobId) || undefined,
  });

  const view=paginateCompanyReport(workspace.report.byCompany,viewQuery.data);
  const companyLinks=buildTpoCompanyReportLinks(view.rows);
  const href=(page:number)=>companyReportViewHref({seasonId:workspace.selectedSeasonId??undefined,jobId:workspace.selectedJobId??undefined,q:view.query.q,page});
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
      <form action="/tpo/reports/by-company" method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
        {workspace.selectedSeasonId?<input type="hidden" name="seasonId" value={workspace.selectedSeasonId}/>:null}
        {workspace.selectedJobId?<input type="hidden" name="jobId" value={workspace.selectedJobId}/>:null}
        <label className="grid min-w-0 flex-1 gap-1 text-sm font-semibold text-body">Search company name
          <input type="search" name="q" maxLength={100} defaultValue={view.query.q} className="min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground"/>
        </label><button type="submit" className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">Search</button>
      </form>
      <p className="text-sm text-body">Showing {view.total===0?0:(view.page-1)*view.pageSize+1}–{Math.min(view.total,view.page*view.pageSize)} of {view.total} matching companies. Report metrics and CSV retain the selected full season/drive scope.</p>
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
        rows={view.rows.map((company) => [
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
      <nav aria-label="Company report pages" className="flex flex-wrap items-center justify-between gap-3 text-sm"><span className="text-body">Page {view.page} of {view.totalPages}</span><div className="flex gap-4">{view.page>1?<a href={href(view.page-1)} className="font-semibold text-primary-text">← Previous</a>:null}{view.page<view.totalPages?<a href={href(view.page+1)} className="font-semibold text-primary-text">Next →</a>:null}</div></nav>
      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5" aria-label="Company report drill-down">
        <h2 className="font-semibold text-foreground">Open company records</h2>
        <p className="mt-1 text-sm text-body">These company pages show your college relationship and full persisted history, not just this report season.</p>
        {companyLinks.rows.length===0?<p className="mt-3 text-sm text-body">No company records in this report scope.</p>:
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">{companyLinks.rows.map(row=><li key={row.id}>
          <Link href={row.href} className="inline-flex min-h-10 max-w-full items-center break-words text-sm font-semibold text-primary-text hover:underline">{row.name} →</Link>
        </li>)}</ul>}
        {companyLinks.truncated?<p role="status" className="mt-3 text-xs text-muted-foreground">Only the first {companyLinks.rows.length} of {companyLinks.total} company links on this report page are shown; refine your search to narrow the result.</p>:null}
      </section>
    </div>
  );
}
