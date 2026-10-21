import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {tpoReportHasAmbiguousFilters} from "@/modules/placements/tpo-report-url-guard";
import {TpoReportInvalidFilters} from "@/components/placements/tpo-report-invalid-filters";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import {TPO_LEGACY_REPORT_COPY} from "@/modules/placements/tpo-legacy-report-copy";
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
  if(tpoReportHasAmbiguousFilters(query))return <TpoReportInvalidFilters path="/tpo/reports/by-company"/>;
  const viewQuery=companyReportViewSchema.safeParse({...(first(query.q)?{q:first(query.q)}:{}),...(first(query.page)?{page:first(query.page)}:{}),...(first(query.sort)?{sort:first(query.sort)}:{}),...(first(query.outcome)?{outcome:first(query.outcome)}:{})});
  if(!viewQuery.success)return <section className="min-w-0 space-y-3"><PageHeader title="Invalid company report filters" /><Alert tone="error"><p className="mt-2 text-sm text-body">Check search length and page number.</p><Link href="/tpo/reports/by-company" className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline md:min-h-9">Clear filters</Link></Alert></section>;
  const workspace = await getPlacementReportWorkspace(context, {
    collegeId: context.membership.collegeId,
    seasonId: first(query.seasonId) || undefined,
    jobId: first(query.jobId) || undefined,
  });

  const view=paginateCompanyReport(workspace.report.byCompany,viewQuery.data);
  const companyLinks=buildTpoCompanyReportLinks(view.rows);
  const href=(page:number)=>companyReportViewHref({seasonId:workspace.selectedSeasonId??undefined,jobId:workspace.selectedJobId??undefined,q:view.query.q,outcome:view.query.outcome,sort:view.query.sort,page});
  return (
    <div data-tpo-presentation-report className="min-w-0 space-y-4">
      <PageHeader
        eyebrow="TPO · Reports"
        title="By company"
        description={TPO_LEGACY_REPORT_COPY["/tpo/reports/by-company"].description}
        actions={<div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <ReportCsvLink workspace={workspace} kind="by-company" />
          <a href={tpoCompanyPageCsvHref({seasonId:workspace.selectedSeasonId??undefined,
            jobId:workspace.selectedJobId??undefined,q:view.query.q,outcome:view.query.outcome,sort:view.query.sort,page:view.page})+"&all=1"}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] sm:w-auto md:min-h-[var(--lms-control-height)]">
            Export all {view.total} filtered companies CSV
          </a>
          <a href={tpoCompanyPageCsvHref({seasonId:workspace.selectedSeasonId??undefined,
            jobId:workspace.selectedJobId??undefined,q:view.query.q,outcome:view.query.outcome,sort:view.query.sort,page:view.page})}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] sm:w-auto md:min-h-[var(--lms-control-height)]">
            Export visible companies CSV
          </a>
        </div>}
      />

      <ReportNavigation workspace={workspace} />
      <ReportFilters workspace={workspace} userId={context.user.id} path="/tpo/reports/by-company" />
      <form action="/tpo/reports/by-company" method="get" className="grid min-w-0 gap-3 border-b border-border pb-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end" aria-label="Filter by company">
        {workspace.selectedSeasonId?<input type="hidden" name="seasonId" value={workspace.selectedSeasonId}/>:null}
        {workspace.selectedJobId?<input type="hidden" name="jobId" value={workspace.selectedJobId}/>:null}
        <label className="grid min-w-0 w-full flex-1 gap-2 min-[768px]:w-auto text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search company name
          <Input type="search" name="q" maxLength={100} defaultValue={view.query.q} className="w-full"/>
        </label><label className="grid min-w-0 w-full gap-2 min-[768px]:w-auto text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Recorded placement outcome
          <Select name="outcome" defaultValue={view.query.outcome}
            className="w-full">
            <option value="ALL">All companies</option><option value="HAS_PLACED">At least one placed learner</option>
            <option value="NO_PLACED">No placed learners recorded</option>
          </Select>
        </label><label className="grid min-w-0 w-full gap-2 min-[768px]:w-auto text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Order companies
          <Select name="sort" defaultValue={view.query.sort} className="w-full">
            <option value="NAME">Company name</option><option value="PLACED_DESC">Placed learners (high first)</option>
            <option value="ACCEPTED_DESC">Accepted offers (high first)</option><option value="APPLICATIONS_DESC">Submitted applications (high first)</option><option value="DRIVES_DESC">Recorded drives (high first)</option><option value="AVG_CTC_DESC">Average accepted full-time CTC (high first)</option><option value="HIGHEST_CTC_DESC">Highest accepted full-time CTC (high first)</option>
          </Select>
        </label><Button type="submit" className="min-h-11 w-full rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-[650] text-on-primary sm:w-auto md:min-h-[var(--lms-control-height)]">Apply</Button>
      </form>

      <ReportMetrics metrics={workspace.report.metrics} />
      <p className="text-sm text-body">Showing {view.total===0?0:(view.page-1)*view.pageSize+1}–{Math.min(view.total,view.page*view.pageSize)} of {view.total} matching companies. Report metrics and the standard CSV retain the selected full season/drive scope. Export all filtered companies for every matching row, or export only this visible page.</p>
      <ReportScopeNote note={workspace.registrationScopeNote} />
      {view.total===0&&companyReportHasUserFilters(view.query)?<EmptyState title="No company records match these filters within the selected reporting scope." action={
        <Link href={companyReportViewHref({seasonId:workspace.selectedSeasonId??undefined,jobId:workspace.selectedJobId??undefined})}
          className="mt-3 inline-flex min-h-11 min-[768px]:min-h-[var(--lms-control-height)] items-center text-sm font-semibold text-link underline">
          Clear company filters
        </Link>}/>:null}

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
      <nav aria-label="Company report pages" className="flex flex-wrap items-center justify-between gap-3 text-sm"><span className="text-body">Page {view.page} of {view.totalPages}</span><div className="flex flex-wrap items-center gap-4">{view.page>1?<Link href={href(view.page-1)} className="inline-flex min-h-11 items-center font-semibold text-link lms-inline-link md:min-h-9">← Previous</Link>:null}{view.page<view.totalPages?<Link href={href(view.page+1)} className="inline-flex min-h-11 items-center font-semibold text-link lms-inline-link md:min-h-9">Next →</Link>:null}</div></nav>
      <section className="border-t border-border pt-4 sm:pt-6" aria-label="Company report drill-down">
        <h2 className="font-semibold text-foreground">Open company records</h2>
        <p className="mt-1 text-sm text-body">These company pages show your college relationship and full persisted history, not just this report season.</p>
        {companyLinks.rows.length===0?<p className="mt-3 text-sm text-body">No company records in this report scope.</p>:
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">{companyLinks.rows.map(row=><li key={row.id}>
          <Link href={row.href} className="inline-flex min-h-11 min-[768px]:min-h-[var(--lms-control-height)] max-w-full items-center break-words text-sm font-semibold text-link hover:underline lms-inline-link">{row.name} →</Link>
        </li>)}</ul>}
        {companyLinks.truncated?<p role="status" className="mt-3 text-xs text-muted-foreground">Only the first {companyLinks.rows.length} of {companyLinks.total} company links on this report page are shown; refine your search to narrow the result.</p>:null}
      </section>
    </div>
  );
}
