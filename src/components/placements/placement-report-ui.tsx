import { Input } from "@/components/ui/input";
import {TpoReportPresentation} from "./tpo-report-presentation";
import {TpoReportSavedFilters} from "./tpo-report-saved-filters";
import {ReportInteractiveTable} from "./report-interactive-table";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SummaryStrip } from "@/components/ui/summary-strip";
import type { PlacementReportMetrics } from "@/modules/placements/report-model";
import type { getPlacementReportWorkspace } from "@/modules/placements/report-service";

export type PlacementReportWorkspace = Awaited<
  ReturnType<typeof getPlacementReportWorkspace>
>;

const integerFormat = new Intl.NumberFormat("en-IN");

export function reportNumber(value: number) {
  return integerFormat.format(value);
}

export function reportPercent(value: number | null) {
  return value === null ? "—" : `${value}%`;
}

export function reportCurrency(value: number | null) {
  return value === null ? "—" : `₹${integerFormat.format(value)}`;
}

export function reportHref(
  path: string,
  workspace: PlacementReportWorkspace,
) {
  const params = new URLSearchParams();

  if (workspace.selectedSeasonId) {
    params.set("seasonId", workspace.selectedSeasonId);
  }

  if (workspace.selectedJobId) {
    params.set("jobId", workspace.selectedJobId);
  }

  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function ReportFilters({
  workspace,
  path,
  userId,
}: {
  workspace: PlacementReportWorkspace;
  path: string;
  userId: string;
}) {
  return (
    <section
      aria-label="Report filters"
      className="grid min-w-0 grid-cols-1 gap-4 border-b border-[var(--lms-canvas-border)] pb-6 min-[992px]:grid-cols-2 print:hidden"
    >
      <form action={path} method="get" className="flex flex-wrap items-end gap-3">
        <label className="min-w-0 flex-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Placement season
          <Select
            name="seasonId"
            className="mt-1.5 min-h-11 md:min-h-9"
            defaultValue={workspace.selectedSeasonId ?? ""}
            disabled={workspace.seasons.length === 0}
          >
            {workspace.seasons.length === 0 ? (
              <option value="">No seasons available</option>
            ) : null}
            {workspace.seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name} · {season.code}
                {season.status === "ACTIVE" ? " (active)" : ""}
              </option>
            ))}
          </Select>
        </label>
        <Button variant="secondary" className="min-h-11 md:min-h-9"
          type="submit"
          disabled={workspace.seasons.length === 0}
          
        >
          Apply season
        </Button>
      </form>

      <form action={path} method="get" className="flex flex-wrap items-end gap-3">
        {workspace.selectedSeasonId ? (
          <Input
            type="hidden"
            name="seasonId"
            value={workspace.selectedSeasonId}
          />
        ) : null}
        <label className="min-w-0 flex-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Drive
          <Select
            name="jobId"
            className="mt-1.5 min-h-11 md:min-h-9"
            defaultValue={workspace.selectedJobId ?? ""}
            disabled={workspace.noSeason}
          >
            <option value="">All drives in selected season</option>
            {workspace.jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.companyName} · {job.title}
              </option>
            ))}
          </Select>
        </label>
        <Button variant="secondary" className="min-h-11 md:min-h-9"
          type="submit"
          disabled={workspace.noSeason}
          
        >
          Apply drive
        </Button>
      </form>
      <div className="min-[992px]:col-span-2"><TpoReportSavedFilters path={path} collegeId={workspace.collegeId} userId={userId}/></div>
      <p className="text-xs leading-5 text-muted-foreground min-[992px]:col-span-2">
        Changing the season clears the drive filter. Changing the drive
        preserves the selected season. Reports are read-only and restricted
        to your college.
      </p>
    </section>
  );
}

export function ReportScopeNote({
  note,
}: {
  note: string;
}) {
  return (
    <section
      aria-label="Reporting methodology"
      className="border-l-2 border-border bg-surface-subtle px-4 py-3 text-sm leading-6 text-body"
    >
      <p className="font-semibold text-foreground">Reporting methodology</p>
      <p className="mt-1">{note}</p>
      <p className="mt-2">
        A placed student is counted at most once using the college&apos;s active
        placement rule (selected, released or accepted). The exact rule is
        stated above when a season is available. Offer totals count individual
        offers, not unique students. Package statistics use the highest known
        accepted full-time annual CTC per learner; internships and unknown CTC
        values are excluded.
      </p>
    </section>
  );
}

export function ReportMetrics({
  metrics,
}: {
  metrics: PlacementReportMetrics;
}) {
  const cards = [
    {
      label: "Placement rate",
      value: reportPercent(metrics.placementRatePercent),
    },
    {
      label: "Students placed",
      value: reportNumber(metrics.studentsPlaced),
    },
    {
      label: "Offers",
      value: reportNumber(metrics.offers),
    },
    {
      label: "Students accepted",
      value: reportNumber(metrics.studentsAccepted),
    },
  ];

  return <SummaryStrip label="Placement headline metrics" steps={cards} />;
}

export function ReportNavigation({
  workspace,
}: {
  workspace: PlacementReportWorkspace;
}) {
  const links = [
    { href: "/tpo/reports", label: "All reports" },
    {
      href: "/tpo/reports/placement-summary",
      label: "Placement summary",
    },
    {
      href: "/tpo/reports/by-branch",
      label: "By branch",
    },
    { href: "/tpo/reports/by-company", label: "By company" },
    { href: "/tpo/reports/placed-branch", label: "Placed by branch" },
    { href: "/tpo/reports/season-pipeline", label: "Season pipeline" },
    { href: "/tpo/reports/offers-expiry", label: "Offer expiry" },
    { href: "/tpo/reports/joining-followups", label: "Joining follow-ups" },
    { href: "/tpo/reports/ctc", label: "CTC" },
    { href: "/tpo/reports/unplaced", label: "Unplaced students" },
    {
      href: "/tpo/reports/offers-acceptance",
      label: "Offers & acceptance",
    },
    { href: "/tpo/reports/joining-status", label: "Joining outcomes" },
    { href: "/tpo/reports/failure-reasons", label: "Failure reasons" },
    { href: "/tpo/reports/leads", label: "Leads report" },
    { href: "/tpo/reports/accreditation", label: "Accreditation export" },
  ];

  const m=workspace.report.metrics;
  return (<>
    <p role="status" className="border-y border-border py-3 text-sm font-semibold text-body">
     For the filters below: {reportNumber(m.studentsPlaced)} students placed · {reportNumber(m.offers)} offers ·
     {" "}{reportPercent(m.placementRatePercent)} placement rate · {reportNumber(m.acceptedOffers)} accepted offers
    </p>
    <div className="flex flex-wrap justify-end print:hidden"><TpoReportPresentation/></div>
    <nav aria-label="Reports navigation" className="flex flex-wrap gap-2 print:hidden">
      {links.map((link) => (
        <Link
          key={link.href}
          href={reportHref(link.href, workspace)}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] md:min-h-9"
        >
          {link.label}
        </Link>
      ))}
    </nav>
   </>);
}

export function ReportCsvLink({
  workspace,
  kind,
}: {
  workspace: PlacementReportWorkspace;
  kind:
    | "placement-summary"
    | "by-branch"
    | "by-company"
    | "ctc"
    | "unplaced"
    | "offers-acceptance"
    | "joining-status"
    | "failure-reasons"
    | "leads";
}) {
  const params = new URLSearchParams({ kind });

  if (workspace.selectedSeasonId) {
    params.set("seasonId", workspace.selectedSeasonId);
  }

  if (workspace.selectedJobId) {
    params.set("jobId", workspace.selectedJobId);
  }

  return (
    <a
      href={`/api/placements/reports?${params.toString()}`}
      aria-label={`Export ${kind.replaceAll("-", " ")} CSV`}
      className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-button-primary)] bg-[var(--lms-button-primary)] px-4 text-sm font-[650] text-white hover:border-[var(--lms-button-primary-hover)] hover:bg-[var(--lms-button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 print:hidden"
    >
      Export CSV
    </a>
  );
}

export function ReportTable({
 title,headings,rows,emptyDescription,
}:{
 title:string;headings:readonly string[];
 rows:readonly (readonly (string|number|null)[])[];
 emptyDescription:string;
}){
 return <ReportInteractiveTable title={title} headings={headings} rows={rows} emptyDescription={emptyDescription}/>;
}
