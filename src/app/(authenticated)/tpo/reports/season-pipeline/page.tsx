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
import { SummaryStrip } from "@/components/ui/summary-strip";
import { Disclosure } from "@/components/ui/disclosure";
import { ReportTable, reportNumber } from "@/components/placements/placement-report-ui";
import { hasMembershipRole } from "@/modules/identity/context";
import { getTpoSeasonPipeline } from "@/modules/placements/tpo-season-pipeline-service";

type Search = { seasonId?: string | string[]; jobId?: string | string[] };
function first(input: string | string[] | undefined) {
  return Array.isArray(input) ? input[0] : input;
}
export default async function TpoSeasonPipelinePage({
  searchParams,
}: { searchParams: Promise<Search> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) redirect("/dashboard");
  const raw = await searchParams;
  if(tpoReportHasAmbiguousFilters(raw))return <TpoReportInvalidFilters path="/tpo/reports/season-pipeline"/>;
  const report = await getTpoSeasonPipeline(context, {
    ...(first(raw.seasonId) ? { seasonId: first(raw.seasonId) } : {}),
    ...(first(raw.jobId) ? { jobId: first(raw.jobId) } : {}),
  });
  const csvQuery = new URLSearchParams();
  if (report.season) csvQuery.set("seasonId", report.season.id);
  if (report.selectedJobId) csvQuery.set("jobId", report.selectedJobId);
  const cards = [
    ["Applied", report.totals.applied],
    ["Currently submitted", report.totals.currentlySubmitted],
    ["Shortlisted", report.totals.shortlisted],
    ["Selected", report.totals.selected],
    ["Offered versions", report.totals.offered],
    ["Accepted versions", report.totals.accepted],
    ["Joined versions", report.totals.joined],
  ] as const;
  return (
    <div data-tpo-presentation-report className="min-w-0 space-y-6">
      <PageHeader eyebrow="TPO · Reports" title="Season pipeline"
        description="Recorded application, screening, offer and joining evidence for one placement season."
        actions={<div className="flex w-full min-w-0 flex-col-reverse items-stretch gap-[var(--lms-space-2)] min-[768px]:w-auto min-[768px]:flex-row min-[768px]:items-center">
          <Link href="/tpo/reports" className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-link underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] min-[768px]:min-h-9">
            ← All reports
          </Link>
          {report.season ? <a href={"/api/placements/reports/season-pipeline?" + csvQuery.toString()}
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-button-primary)] bg-[var(--lms-button-primary)] px-4 text-sm font-[650] text-[var(--lms-on-primary)] hover:border-[var(--lms-button-primary-hover)] hover:bg-[var(--lms-button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] min-[768px]:min-h-9">
            Export funnel CSV
          </a> : null}
        </div>} />
      <form action="/tpo/reports/season-pipeline" method="get"
        aria-label="Season pipeline filters"
        className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] min-[768px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Placement season
          <Select name="seasonId" defaultValue={report.season?.id ?? ""}
            disabled={!report.seasons.length}
            className="min-h-11 w-full min-[768px]:min-h-9">
            {report.seasons.length === 0 ? <option value="">No season</option> : null}
            {report.seasons.map((s) => (
              <option key={s.id} value={s.id}>{s.name} · {s.code}</option>
            ))}
          </Select>
        </label>
        <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Drive
          <Select name="jobId" defaultValue={report.selectedJobId ?? ""}
            disabled={!report.season}
            className="min-h-11 w-full min-[768px]:min-h-9">
            <option value="">All drives</option>
            {report.jobs.map((job) => (
              <option key={job.id} value={job.id}>{job.companyName} · {job.title}</option>
            ))}
          </Select>
        </label>
        <Button type="submit" disabled={!report.season}
          className="min-h-11 w-full min-[768px]:min-h-9 min-[768px]:w-auto">
          Apply filters
        </Button>
      </form>
      <Disclosure title="Report options" className="min-w-0 print:hidden" contentClassName="min-w-0 space-y-[var(--lms-space-3)]">
        <div className="flex min-w-0 justify-start pt-[var(--lms-space-2)]">
          <TpoReportPresentation />
        </div>
        <Suspense fallback={<Skeleton variant="form" />}>
          <TpoReportSavedFilters path="/tpo/reports/season-pipeline" collegeId={context.membership.collegeId} userId={context.user.id}/>
        </Suspense>
      </Disclosure>
      {!report.season ? (
        <EmptyState title="No placement season"
          description="Create a placement season to see a funnel. An absent season is not evidence of zero results." />
      ) : (
        <>
          <SummaryStrip label="Season pipeline counts"
            steps={cards.map(([label, value]) => ({
              label, value: value === null ? "Unavailable" : reportNumber(value),
            }))} />
          <ReportTable title="Per-drive pipeline"
            headings={["Drive", "Company", "Applied", "Submitted", "Shortlisted",
              "Selected", "Offered", "Accepted", "Joined"]}
            rows={report.rows.map((row) => [
              row.title, row.companyName, row.applied, row.currentlySubmitted,
              row.shortlisted, "Unavailable", row.offered, row.accepted, row.joined,
            ])}
            emptyDescription="No persisted drives match this season and filter." compactControls />
          <Disclosure title="Reporting methodology" className="min-w-0" contentClassName="min-w-0 space-y-[var(--lms-space-3)]">
            <p className="max-w-4xl pt-[var(--lms-space-2)] text-sm leading-6 text-body">
              Applied counts all recorded application IDs, including withdrawn; shortlisted counts
              current submitted applications with a SHORTLISTED screening. Offered and accepted
              count offer versions, not distinct learners. Joined requires a currently ACCEPTED offer
              and a recorded JOINED outcome. Final employer selection is unavailable in registered
              storage and is not inferred from round PASS or an offer. These are recorded lifecycle
              counts, not a cohort of people guaranteed to move monotonically through a funnel.
            </p>
            <p className="max-w-4xl text-xs leading-5 text-body">
              CSV includes the full scoped season total and at most 200 drive rows,
              followed by an explicit truncation notice when applicable.
            </p>
          </Disclosure>
        </>
      )}
    </div>
  );
}
