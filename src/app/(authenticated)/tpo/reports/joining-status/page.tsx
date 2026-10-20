import {tpoReportHasAmbiguousFilters} from "@/modules/placements/tpo-report-url-guard";
import {TpoReportInvalidFilters} from "@/components/placements/tpo-report-invalid-filters";
import { Skeleton } from "@/components/ui/skeleton";
import {TpoReportPresentation} from "@/components/placements/tpo-report-presentation";
import {Suspense} from "react";
import {TpoReportSavedFilters} from "@/components/placements/tpo-report-saved-filters";
import {ReportBarChart} from "@/components/placements/report-bar-chart";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { TpoReportRecordLinks } from "@/components/placements/tpo-report-record-links";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import {
  ReportCsvLink,
  ReportFilters,
  ReportNavigation,
  ReportScopeNote,
  ReportTable,
  reportNumber,
} from "@/components/placements/placement-report-ui";
import { hasMembershipRole } from "@/modules/identity/context";
import { getPlacementReportDetails } from "@/modules/placements/report-service";

type SearchParams = {
  seasonId?: string | string[];
  jobId?: string | string[];
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TpoJoiningStatusReportPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const context = await getCurrentRequestContext();

  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    redirect("/dashboard");
  }

  const query = await searchParams;
  if(tpoReportHasAmbiguousFilters(query))return <TpoReportInvalidFilters path="/tpo/reports/joining-status"/>;
  const workspace = await getPlacementReportDetails(context, {
    collegeId: context.membership.collegeId,
    seasonId: first(query.seasonId) || undefined,
    jobId: first(query.jobId) || undefined,
  });

  const { totals, byDrive, byCompany } = workspace.details.joining;

  return (
    <div data-tpo-presentation-report className="min-w-0 space-y-4">
      <PageHeader
        eyebrow="TPO · Reports"
        title="Joining outcomes"
        description="Recorded joining results for currently accepted offers, grouped by drive and company."
        actions={<ReportCsvLink workspace={workspace} kind="joining-status" />}
      />

      <Link href="/tpo/reports/joining-followups"
        className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link">
        Review joining follow-ups →
      </Link>
      <Suspense fallback={<Skeleton variant="form" />}><TpoReportSavedFilters path="/tpo/reports/joining-status" collegeId={context.membership.collegeId} userId={context.user.id}/></Suspense>
      <TpoReportPresentation />
      <ReportNavigation workspace={workspace} />
      <ReportFilters
        workspace={workspace}
        userId={context.user.id}
        path="/tpo/reports/joining-status"
      />

      <section
        aria-label="Joining outcome totals"
        className="grid min-w-0 gap-2 md:grid-cols-2 xl:grid-cols-5"
      >
        {[
          ["Accepted offers", totals.accepted],
          ["Joined", totals.joined],
          ["Deferred", totals.deferred],
          ["Did not join", totals.didNotJoin],
          ["Pending / unrecorded", totals.pending],
        ].map(([label, value]) => (
          <StatTile key={label} label={String(label)} value={reportNumber(Number(value))} className="min-h-[104px]" />
        ))}
      </section>

      <ReportScopeNote note={workspace.detailScopeNote} />
      <ReportBarChart title="Joined by company" units="joined offers"
       rows={byCompany.map(row=>({label:row.label,value:row.joined}))}/>

      <ReportTable
        title="Joining outcomes by drive"
        headings={[
          "Drive",
          "Company",
          "Accepted offers",
          "Joined",
          "Deferred",
          "Did not join",
          "Pending / unrecorded",
        ]}
        rows={byDrive.map((row) => [
          row.label,
          row.companyName,
          row.accepted,
          row.joined,
          row.deferred,
          row.didNotJoin,
          row.pending,
        ])}
        emptyDescription="No currently accepted offers have joining outcomes in this reporting scope."
      />

      <ReportTable
        title="Joining outcomes by company"
        headings={[
          "Company",
          "Accepted offers",
          "Joined",
          "Deferred",
          "Did not join",
          "Pending / unrecorded",
        ]}
        rows={byCompany.map((row) => [
          row.label,
          row.accepted,
          row.joined,
          row.deferred,
          row.didNotJoin,
          row.pending,
        ])}
        emptyDescription="No company joining outcomes match these filters."
      />
      <TpoReportRecordLinks kind="JOINING" drives={byDrive} companies={byCompany} />
    </div>
  );
}
