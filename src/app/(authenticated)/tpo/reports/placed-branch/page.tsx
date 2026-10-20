import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {tpoReportHasAmbiguousFilters} from "@/modules/placements/tpo-report-url-guard";
import {TpoReportInvalidFilters} from "@/components/placements/tpo-report-invalid-filters";
import { Skeleton } from "@/components/ui/skeleton";
import {TpoReportPresentation} from "@/components/placements/tpo-report-presentation";
import {Suspense} from "react";
import {TpoReportSavedFilters} from "@/components/placements/tpo-report-saved-filters";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { Disclosure } from "@/components/ui/disclosure";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { ReportTable, reportNumber } from "@/components/placements/placement-report-ui";
import { hasMembershipRole } from "@/modules/identity/context";
import { getTpoPlacedStudentsByBranch } from "@/modules/placements/tpo-placed-branch-service";
type Search = { seasonId?: string | string[]; jobId?: string | string[] };
function first(input: string | string[] | undefined) { return Array.isArray(input) ? input[0] : input; }
export default async function TpoPlacedByBranchPage({ searchParams }: { searchParams: Promise<Search> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) redirect("/dashboard");
  const params = await searchParams;
  if(tpoReportHasAmbiguousFilters(params))return <TpoReportInvalidFilters path="/tpo/reports/placed-branch"/>;
  const report = await getTpoPlacedStudentsByBranch(context, {
    ...(first(params.seasonId) ? { seasonId: first(params.seasonId) } : {}),
    ...(first(params.jobId) ? { jobId: first(params.jobId) } : {}),
  });
  const csvParams = new URLSearchParams();
  if (report.season) csvParams.set("seasonId", report.season.id);
  if (report.selectedJobId) csvParams.set("jobId", report.selectedJobId);
  return (
    <div data-tpo-presentation-report className="min-w-0 space-y-4">
      <PageHeader eyebrow="TPO · Reports" title="Placed students by branch"
        description="Unique learners with accepted offers and confirmed joins by current branch and season."
        actions={<div className="flex w-full flex-wrap items-center gap-2 sm:w-auto"><Link href="/tpo/reports" className="inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold text-link underline sm:w-auto md:min-h-9">← Reports</Link>{report.season ? <a
          href={"/api/placements/reports/placed-branch?" + csvParams}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-button-primary)] bg-[var(--lms-button-primary)] px-4 text-sm font-[650] text-white hover:border-[var(--lms-button-primary-hover)] hover:bg-[var(--lms-button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] sm:w-auto md:min-h-9">
          Download CSV
        </a> : null}</div>}
      />
      <form action="/tpo/reports/placed-branch" method="get"
        className="grid min-w-0 gap-3 border-b border-border pb-4 sm:grid-cols-2">
        <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Season
          <Select name="seasonId" defaultValue={report.season?.id ?? ""}
            className="mt-2 min-h-11 min-[768px]:min-h-9 w-full">
            {report.seasons.length === 0 ? <option value="">No season</option> : null}
            {report.seasons.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
          </Select>
        </label>
        <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Drive
          <Select name="jobId" defaultValue={report.selectedJobId ?? ""}
            className="mt-2 min-h-11 min-[768px]:min-h-9 w-full">
            <option value="">All drives</option>
            {report.jobs.map((item) => <option key={item.id} value={item.id}>{item.companyName} · {item.title}</option>)}
          </Select>
        </label>
        <Button type="submit" className="min-h-11 w-full sm:col-span-2 sm:justify-self-start sm:w-auto md:min-h-9"
          disabled={!report.season}>Apply filters</Button>
      </form>
      <TpoReportPresentation />
      <Suspense fallback={<Skeleton variant="form" />}><TpoReportSavedFilters path="/tpo/reports/placed-branch" collegeId={context.membership.collegeId} userId={context.user.id}/></Suspense>
      {!report.season ? <EmptyState title="No placement season" description="No results can be inferred without a recorded season." /> : (
        <>
          <section className="grid min-w-0 gap-3 sm:grid-cols-3">
            {([
              ["Placed learners", report.totals.placed],
              ["Confirmed joined learners", report.totals.joined],
              ["Accepted offer versions", report.totals.acceptedOfferVersions],
            ] as const).map(([label, count]) => (
              <StatTile key={label} label={label} value={reportNumber(count)} className="min-h-[104px]" />
            ))}
          </section>
          <Disclosure title="Branch reporting methodology" className="border-y border-border py-3"><p className="pt-3 text-sm text-body">{report.branchScopeNote}</p></Disclosure>
          <ReportTable title="Branch outcomes" headings={["Current branch", "Placed learners", "Confirmed joined", "Accepted offer versions"]}
            rows={report.rows.map((row) => [row.departmentName, row.placed, row.joined, row.acceptedOfferVersions])}
            emptyDescription="No accepted offers have been recorded in this reporting scope." />
          <p className="text-xs text-body">CSV contains the full totals and up to 200 branch rows, with explicit truncation notice.</p>
        </>
      )}
    </div>
  );
}
