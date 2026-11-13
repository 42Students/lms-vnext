import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {tpoReportHasAmbiguousFilters} from "@/modules/placements/tpo-report-url-guard";
import {TpoReportInvalidFilters} from "@/components/placements/tpo-report-invalid-filters";
import { Skeleton } from "@/components/ui/skeleton";
import {TpoReportPresentation} from "@/components/placements/tpo-report-presentation";
import {Suspense} from "react";
import {TpoReportSavedFilters} from "@/components/placements/tpo-report-saved-filters";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SummaryStrip } from "@/components/ui/summary-strip";
import { Disclosure } from "@/components/ui/disclosure";
import { ReportTable, reportNumber } from "@/components/placements/placement-report-ui";
import { hasMembershipRole } from "@/modules/identity/context";
import { getTpoSeasonPipeline } from "@/modules/placements/tpo-season-pipeline-service";
import { ButtonLink } from "@/components/ui/button-link";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";

import { ROLE } from "@/modules/identity/roles";
import { first } from "@/lib/shared";
type Search = { seasonId?: string | string[]; jobId?: string | string[] };
export default async function TpoSeasonPipelinePage({
  searchParams,
}: { searchParams: Promise<Search> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, ROLE.TPO)) redirect("/dashboard");
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
        actions={<div className="flex w-full min-w-0 flex-col-reverse items-stretch gap-[var(--lms-space-2)] md:w-auto md:flex-row md:items-center">
          <TextLink href="/tpo/reports" className="inline-flex min-h-11 items-center justify-center text-sm md:min-h-9">
            ← All reports
          </TextLink>
          {report.season ? <ButtonLink variant="primary" href={"/api/placements/reports/season-pipeline?" + csvQuery.toString()}>
            Export funnel CSV
          </ButtonLink> : null}
        </div>} />
      <form action="/tpo/reports/season-pipeline" method="get"
        aria-label="Season pipeline filters"
        className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <Label stack className="min-w-0">
          Placement season
          <Select name="seasonId" defaultValue={report.season?.id ?? ""}
            disabled={!report.seasons.length}
            className="min-h-11 w-full md:min-h-9">
            {report.seasons.length === 0 ? <option value="">No season</option> : null}
            {report.seasons.map((s) => (
              <option key={s.id} value={s.id}>{s.name} · {s.code}</option>
            ))}
          </Select>
        </Label>
        <Label stack className="min-w-0">
          Drive
          <Select name="jobId" defaultValue={report.selectedJobId ?? ""}
            disabled={!report.season}
            className="min-h-11 w-full md:min-h-9">
            <option value="">All drives</option>
            {report.jobs.map((job) => (
              <option key={job.id} value={job.id}>{job.companyName} · {job.title}</option>
            ))}
          </Select>
        </Label>
        <Button type="submit" disabled={!report.season}
          className="min-h-11 w-full md:min-h-9 md:w-auto">
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
            <p className="max-w-4xl pt-[var(--lms-space-2)] text-sm leading-[22px] text-body">
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
