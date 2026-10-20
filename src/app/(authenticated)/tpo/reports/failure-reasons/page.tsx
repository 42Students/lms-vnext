import {tpoReportHasAmbiguousFilters} from "@/modules/placements/tpo-report-url-guard";
import {TpoReportInvalidFilters} from "@/components/placements/tpo-report-invalid-filters";
import { Skeleton } from "@/components/ui/skeleton";
import {TpoReportPresentation} from "@/components/placements/tpo-report-presentation";
import {Suspense} from "react";
import {TpoReportSavedFilters} from "@/components/placements/tpo-report-saved-filters";
import {ReportBarChart} from "@/components/placements/report-bar-chart";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import {
  ReportCsvLink,
  ReportFilters,
  ReportNavigation,
  ReportTable,
  reportNumber,
} from "@/components/placements/placement-report-ui";
import { hasMembershipRole } from "@/modules/identity/context";
import {
  FAILURE_KIND_LABELS,
  getPlacementFailureReasonsReport,
} from "@/modules/placements/report-extra-service";

type SearchParams = {
  seasonId?: string | string[];
  jobId?: string | string[];
};

function first(
  value: string | string[] | undefined,
) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TpoFailureReasonsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const context = await getCurrentRequestContext();

  if (
    !context.membership ||
    !hasMembershipRole(context, "TPO")
  ) {
    redirect("/dashboard");
  }

  const query = await searchParams;
  if(tpoReportHasAmbiguousFilters(query))return <TpoReportInvalidFilters path="/tpo/reports/failure-reasons"/>;
  const workspace =
    await getPlacementFailureReasonsReport(
      context,
      {
        collegeId: context.membership.collegeId,
        seasonId: first(query.seasonId) || undefined,
        jobId: first(query.jobId) || undefined,
      },
    );

  const { failures } = workspace;

  const methodology =
    "failureScopeNote" in workspace &&
    typeof workspace.failureScopeNote === "string"
      ? workspace.failureScopeNote
      : "No placement season or matching drive data is available. No adverse outcome is inferred from missing data.";

  return (
    <div data-tpo-presentation-report className="min-w-0 space-y-5">
      <PageHeader
        
        title="Failure reasons"
        description="Recorded screening rejections, applied round failures, application withdrawals and offer declines or withdrawals, grouped by reason and drive."
        actions={
          <ReportCsvLink
            workspace={workspace}
            kind="failure-reasons"
          />
        }
      />

      <Suspense fallback={<Skeleton variant="form" />}><TpoReportSavedFilters path="/tpo/reports/failure-reasons" collegeId={context.membership.collegeId} userId={context.user.id}/></Suspense>
      <TpoReportPresentation />
      <ReportNavigation workspace={workspace} />
      <ReportFilters
        workspace={workspace}
        userId={context.user.id}
        path="/tpo/reports/failure-reasons"
      />

      <section
        aria-label="Recorded adverse outcomes"
        className="border-b border-border py-4"
      >
        <p className="text-sm font-semibold text-body">
          Recorded adverse events and current decisions
        </p>
        <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
          {reportNumber(failures.total)}
        </p>
      </section>

      <section
        aria-label="Report methodology"
        className="border-t border-border py-4 text-sm leading-6 text-body"
      >
        <p className="font-semibold text-foreground">
          Reporting methodology
        </p>
        <p className="mt-1">{methodology}</p>
      </section>

      <ReportBarChart title="Recorded adverse outcomes by type" units="events"
       rows={failures.byKind.map(row=>({label:FAILURE_KIND_LABELS[row.kind],value:row.count}))}/>
      <ReportBarChart title="Round failures by recorded round" units="failed decisions"
       rows={workspace.roundFailureShares.map(row=>({
        label:row.roundName,value:row.failed,
       }))}/>
      <ReportTable title="Round failures and share of the round"
       headings={["Round","Failed decisions","Applied decisions","Share of the round"]}
       rows={workspace.roundFailureShares.map(row=>[
        row.roundName,row.failed,row.decisions,
        row.shareOfRoundPercent===null?"Not recorded":row.shareOfRoundPercent+"%",
       ])}
       emptyDescription="No applied round decisions were recorded for the selected placement scope."/>
      <p className="text-xs text-muted-foreground">Share of the round = applied FAIL decisions divided by all applied round decisions. It does not count candidates who have no recorded round result, and is not a share of registered students.</p>

      <a href={"/api/placements/tpo/reports/round-failures?"+new URLSearchParams({
        ...(workspace.selectedSeasonId?{seasonId:workspace.selectedSeasonId}:{}),
        ...(workspace.selectedJobId?{jobId:workspace.selectedJobId}:{})
       }).toString()} className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link">
       Download round-and-branch failures CSV
      </a>
      <ReportTable
       title="Round failures by current branch"
       headings={["Round","Branch","Failed decisions","Applied decisions","Share of branch's recorded round decisions"]}
       rows={workspace.roundBranchFailureShares.map(row=>[
        row.roundName,row.branchName,row.failed,row.decisions,
        row.shareOfRoundPercent===null?"Unavailable":row.shareOfRoundPercent+"%",
       ])}
       emptyDescription="No applied round decisions are available by current academic branch."/>
      <p className="text-xs text-muted-foreground">Branch uses the learner&apos;s current active academic enrollment; past branch membership is not reconstructed. A missing branch is labelled Not recorded. Percentages use only applied round decisions for that round and branch.</p>
      
      <ReportTable
        title="Outcomes by type"
        headings={["Outcome", "Recorded count"]}
        rows={failures.byKind.map((row) => [
          FAILURE_KIND_LABELS[row.kind],
          row.count,
        ])}
        emptyDescription="No recorded adverse outcomes match the selected season and drive."
      />

      <ReportTable
        title="Reasons across selected drives"
        headings={[
          "Outcome",
          "Recorded reason",
          "Count",
        ]}
        rows={failures.byReason.map((row) => [
          FAILURE_KIND_LABELS[row.kind],
          row.reason,
          row.count,
        ])}
        emptyDescription="No persisted rejection, failure, decline or withdrawal reasons are available for this scope."
      />

      <ReportTable
        title="Reasons by drive"
        headings={[
          "Drive",
          "Company",
          "Outcome",
          "Recorded reason",
          "Count",
        ]}
        rows={failures.byDrive.map((row) => [
          row.jobTitle,
          row.companyName,
          FAILURE_KIND_LABELS[row.kind],
          row.reason,
          row.count,
        ])}
        emptyDescription="No drive-specific adverse outcomes are available for these filters."
      />
    </div>
  );
}
