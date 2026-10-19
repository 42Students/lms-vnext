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
import { PageHeader } from "@/components/ui/page-header";
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
    <div data-tpo-presentation-report className="space-y-6">
      <TpoReportPresentation />
      <Suspense fallback={<Skeleton variant="form" />}><TpoReportSavedFilters path="/tpo/reports/placed-branch" collegeId={context.membership.collegeId} userId={context.user.id}/></Suspense>
      <PageHeader eyebrow="TPO · Reports" title="Placed students by branch"
        description="Unique learners with accepted offers and confirmed joins by current branch and season."
        actions={report.season ? <a
          href={"/api/placements/reports/placed-branch?" + csvParams}
          className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-primary bg-primary px-4 text-sm font-[650] text-on-primary">
          Download CSV
        </a> : null}
      />
      <Link href="/tpo/reports" className="text-sm font-semibold text-link hover:underline">← Reports</Link>
      <form action="/tpo/reports/placed-branch" method="get"
        className="grid gap-3 border-b border-border pb-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-body">Season
          <Select name="seasonId" defaultValue={report.season?.id ?? ""}
            className="mt-2 min-h-11 sm:min-h-9 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground">
            {report.seasons.length === 0 ? <option value="">No season</option> : null}
            {report.seasons.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
          </Select>
        </label>
        <label className="text-sm font-semibold text-body">Drive
          <Select name="jobId" defaultValue={report.selectedJobId ?? ""}
            className="mt-2 min-h-11 sm:min-h-9 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground">
            <option value="">All drives</option>
            {report.jobs.map((item) => <option key={item.id} value={item.id}>{item.companyName} · {item.title}</option>)}
          </Select>
        </label>
        <Button type="submit" className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-primary bg-primary px-4 font-[650] text-on-primary sm:col-span-2"
          disabled={!report.season}>Apply filters</Button>
      </form>
      {!report.season ? <EmptyState title="No placement season" description="No results can be inferred without a recorded season." /> : (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            {([
              ["Placed learners", report.totals.placed],
              ["Confirmed joined learners", report.totals.joined],
              ["Accepted offer versions", report.totals.acceptedOfferVersions],
            ] as const).map(([label, count]) => (
              <div key={label} className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
                <h2 className="text-xs font-semibold text-body">{label}</h2>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{reportNumber(count)}</p>
              </div>
            ))}
          </section>
          <p className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface-subtle p-4 text-sm text-body">{report.branchScopeNote}</p>
          <ReportTable title="Branch outcomes" headings={["Current branch", "Placed learners", "Confirmed joined", "Accepted offer versions"]}
            rows={report.rows.map((row) => [row.departmentName, row.placed, row.joined, row.acceptedOfferVersions])}
            emptyDescription="No accepted offers have been recorded in this reporting scope." />
          <p className="text-xs text-body">CSV contains the full totals and up to 200 branch rows, with explicit truncation notice.</p>
        </>
      )}
    </div>
  );
}
