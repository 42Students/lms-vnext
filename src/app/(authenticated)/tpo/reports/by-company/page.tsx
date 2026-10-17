import {TPO_LEGACY_REPORT_COPY} from "@/modules/placements/tpo-legacy-report-copy";
import {TpoReportPresentation} from "@/components/placements/tpo-report-presentation";
import {Suspense} from "react";
import {TpoReportSavedFilters} from "@/components/placements/tpo-report-saved-filters";
import { redirect } from "next/navigation";
import Link from "next/link";
import { buildTpoCompanyReportLinks } from "@/modules/placements/tpo-company-report-links-model";
import {tpoCompanyPageCsvHref} from "@/modules/placements/tpo-company-page-csv-model";
import { companyReportViewSchema, paginateCompanyReport, companyReportViewHref,companyReportHasUserFilters } from "@/modules/placements/tpo-company-report-view-model";
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
  sort?: string | string[];
  outcome?:string|string[];
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
  const viewQuery=companyReportViewSchema.safeParse({...(first(query.q)?{q:first(query.q)}:{}),...(first(query.page)?{page:first(query.page)}:{}),...(first(query.sort)?{sort:first(query.sort)}:{}),...(first(query.outcome)?{outcome:first(query.outcome)}:{})});
  if(!viewQuery.success)return <section role="alert" className="rounded-xl border border-border bg-surface p-6"><h1 className="font-semibold text-foreground">Invalid company report filters</h1><p className="mt-2 text-sm text-body">Check search length and page number.</p></section>;
  const workspace = await getPlacementReportWorkspace(context, {
    collegeId: context.membership.collegeId,
    seasonId: first(query.seasonId) || undefined,
    jobId: first(query.jobId) || undefined,
  });

  const view=paginateCompanyReport(workspace.report.byCompany,viewQuery.data);
  const companyLinks=buildTpoCompanyReportLinks(view.rows);
  const href=(page:number)=>companyReportViewHref({seasonId:workspace.selectedSeasonId??undefined,jobId:workspace.selectedJobId??undefined,q:view.query.q,outcome:view.query.outcome,sort:view.query.sort,page});
  return (
    <div data-tpo-presentation-report className="space-y-6">
      <PageHeader
        eyebrow="TPO · Reports"
        title="By company"
        description={TPO_LEGACY_REPORT_COPY["/tpo/reports/by-company"].description}
        actions={<div className="flex flex-wrap items-center gap-2">
          <ReportCsvLink workspace={workspace} kind="by-company" />
          <a href={tpoCompanyPageCsvHref({seasonId:workspace.selectedSeasonId??undefined,
            jobId:workspace.selectedJobId??undefined,q:view.query.q,outcome:view.query.outcome,sort:view.query.sort,page:view.page})}
            className="inline-flex min-h-10 items-center rounded border border-border bg-surface px-4 text-sm font-semibold text-primary-text">
            Export visible companies CSV
          </a>
        </div>}
      />

      <TpoReportPresentation />
      <ReportNavigation workspace={workspace} />
      <ReportFilters workspace={workspace} userId={context.user.id} path="/tpo/reports/by-company" />
      <Suspense fallback={null}><TpoReportSavedFilters path="/tpo/reports/by-company" collegeId={context.membership.collegeId} userId={context.user.id}/></Suspense>
      <ReportMetrics metrics={workspace.report.metrics} />
      <form action="/tpo/reports/by-company" method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
        {workspace.selectedSeasonId?<input type="hidden" name="seasonId" value={workspace.selectedSeasonId}/>:null}
        {workspace.selectedJobId?<input type="hidden" name="jobId" value={workspace.selectedJobId}/>:null}
        <label className="grid min-w-0 flex-1 gap-1 text-sm font-semibold text-body">Search company name
          <input type="search" name="q" maxLength={100} defaultValue={view.query.q} className="min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground"/>
        </label><label className="grid gap-1 text-sm font-semibold text-body">Recorded placement outcome
          <select name="outcome" defaultValue={view.query.outcome}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
            <option value="ALL">All companies</option><option value="HAS_PLACED">At least one placed learner</option>
            <option value="NO_PLACED">No placed learners recorded</option>
          </select>
        </label><label className="grid gap-1 text-sm font-semibold text-body">Order companies
          <select name="sort" defaultValue={view.query.sort} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
            <option value="NAME">Company name</option><option value="PLACED_DESC">Placed learners (high first)</option>
            <option value="ACCEPTED_DESC">Accepted offers (high first)</option><option value="APPLICATIONS_DESC">Submitted applications (high first)</option><option value="DRIVES_DESC">Recorded drives (high first)</option><option value="AVG_CTC_DESC">Average accepted full-time CTC (high first)</option><option value="HIGHEST_CTC_DESC">Highest accepted full-time CTC (high first)</option>
          </select>
        </label><button type="submit" className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">Apply</button>
      </form>
      <p className="text-sm text-body">Showing {view.total===0?0:(view.page-1)*view.pageSize+1}–{Math.min(view.total,view.page*view.pageSize)} of {view.total} matching companies. Report metrics and the standard CSV retain the selected full season/drive scope; the visible-companies CSV matches this search, order and page.</p>
      <ReportScopeNote note={workspace.registrationScopeNote} />
      {view.total===0&&companyReportHasUserFilters(view.query)?<section role="status"
        className="rounded-xl border border-border bg-surface p-4">
        <p className="text-sm text-body">No company records match these filters within the selected reporting scope.</p>
        <Link href={companyReportViewHref({seasonId:workspace.selectedSeasonId??undefined,jobId:workspace.selectedJobId??undefined})}
          className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-primary-text underline">
          Clear company filters
        </Link>
      </section>:null}

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
        emptyDescription="No company records are available for the selected reporting scope and filters."
      />
      <nav aria-label="Company report pages" className="flex flex-wrap items-center justify-between gap-3 text-sm"><span className="text-body">Page {view.page} of {view.totalPages}</span><div className="flex gap-4">{view.page>1?<Link href={href(view.page-1)} className="font-semibold text-primary-text">← Previous</Link>:null}{view.page<view.totalPages?<Link href={href(view.page+1)} className="font-semibold text-primary-text">Next →</Link>:null}</div></nav>
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
