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
    <div data-tpo-presentation-report className="space-y-6">
      <TpoReportPresentation />
      <Suspense fallback={<Skeleton variant="form" />}><TpoReportSavedFilters path="/tpo/reports/season-pipeline" collegeId={context.membership.collegeId} userId={context.user.id}/></Suspense>
      <PageHeader eyebrow="TPO · Reports" title="Season pipeline"
        description="Recorded application, screening, offer and joining evidence for one placement season."
        actions={report.season ? (
          <a href={"/api/placements/reports/season-pipeline?" + csvQuery.toString()}
            className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-primary bg-primary px-4 text-sm font-[650] text-on-primary">
            Export funnel CSV
          </a>
        ) : null} />
      <Link href="/tpo/reports" className="inline-flex min-h-11 sm:min-h-9 items-center text-sm font-semibold text-link hover:underline">
        ← All reports
      </Link>
      <form action="/tpo/reports/season-pipeline" method="get"
        className="grid gap-3 border-b border-border pb-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-body">
          Placement season
          <Select name="seasonId" defaultValue={report.season?.id ?? ""}
            disabled={!report.seasons.length}
            className="mt-2 min-h-11 sm:min-h-9 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground">
            {report.seasons.length === 0 ? <option value="">No season</option> : null}
            {report.seasons.map((s) => (
              <option key={s.id} value={s.id}>{s.name} · {s.code}</option>
            ))}
          </Select>
        </label>
        <label className="block text-sm font-semibold text-body">
          Drive
          <Select name="jobId" defaultValue={report.selectedJobId ?? ""}
            disabled={!report.season}
            className="mt-2 min-h-11 sm:min-h-9 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground">
            <option value="">All drives</option>
            {report.jobs.map((job) => (
              <option key={job.id} value={job.id}>{job.companyName} · {job.title}</option>
            ))}
          </Select>
        </label>
        <Button type="submit" disabled={!report.season}
          className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-primary bg-primary px-4 font-[650] text-on-primary disabled:opacity-50">
          Apply filters
        </Button>
      </form>
      {!report.season ? (
        <EmptyState title="No placement season"
          description="Create a placement season to see a funnel. An absent season is not evidence of zero results." />
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Season pipeline counts">
            {cards.map(([label, value]) => (
              <div key={label} className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
                <p className="text-xs font-semibold uppercase text-body">{label}</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
                  {value === null ? "Unavailable" : reportNumber(value)}
                </p>
              </div>
            ))}
          </section>
          <p className="rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle p-4 text-sm leading-6 text-body">
            Applied counts all recorded application IDs, including withdrawn; shortlisted counts
            current submitted applications with a SHORTLISTED screening. Offered and accepted
            count offer versions, not distinct learners. Joined requires a currently ACCEPTED offer
            and a recorded JOINED outcome. Final employer selection is unavailable in registered
            storage and is not inferred from round PASS or an offer. These are recorded lifecycle
            counts, not a cohort of people guaranteed to move monotonically through a funnel.
          </p>
          <ReportTable title="Per-drive pipeline"
            headings={["Drive", "Company", "Applied", "Submitted", "Shortlisted",
              "Selected", "Offered", "Accepted", "Joined"]}
            rows={report.rows.map((row) => [
              row.title, row.companyName, row.applied, row.currentlySubmitted,
              row.shortlisted, "Unavailable", row.offered, row.accepted, row.joined,
            ])}
            emptyDescription="No persisted drives match this season and filter." />
          <p className="text-xs text-body">
            CSV includes the full scoped season total and at most 200 drive rows,
            followed by an explicit truncation notice when applicable.
          </p>
        </>
      )}
    </div>
  );
}
