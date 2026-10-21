import {tpoReportHasAmbiguousFilters} from "@/modules/placements/tpo-report-url-guard";
import {TpoReportInvalidFilters} from "@/components/placements/tpo-report-invalid-filters";
import {ReportBarChart} from "@/components/placements/report-bar-chart";
import {Disclosure} from "@/components/ui/disclosure";
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
    <div data-tpo-presentation-report className="min-w-0 space-y-4">
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

      <ReportNavigation workspace={workspace} />
      <ReportFilters
        workspace={workspace}
        userId={context.user.id}
        path="/tpo/reports/failure-reasons"
      />

      <section
        aria-label="Recorded adverse outcomes"
        className="border-b border-[var(--lms-canvas-border)] py-4"
      >
        <p className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Recorded adverse events and current decisions
        </p>
        <p className="mt-2 text-[24px] font-semibold leading-8 tabular-nums text-[var(--lms-heading)]">
          {reportNumber(failures.total)}
        </p>
      </section>

      <Disclosure title="Reporting methodology" ariaLabel="Report methodology" className="border-y border-border py-3">
        <div className="min-w-0 pt-3 text-[14px] leading-6 text-[var(--lms-body-text)]">
        
        <p className="mt-1">{methodology}</p>
      </div>
      </Disclosure>

      <ReportBarChart title="Recorded adverse outcomes by type" units="events"
       rows={failures.byKind.map(row=>({label:FAILURE_KIND_LABELS[row.kind],value:row.count}))}/>
      <Disclosure title="Round and branch details" className="border-b border-border pb-3">
        <div className="min-w-0 space-y-4 pt-3">
      <ReportBarChart title="Round failures as share of applied decisions" units="percent"
       rows={workspace.roundFailureShares
        .filter(row=>row.shareOfRoundPercent!==null)
        .map(row=>({label:row.roundName,value:row.shareOfRoundPercent!}))}/>
      {workspace.roundFailureShares.some(row=>row.shareOfRoundPercent===null)
        ? <p className="text-xs text-muted-foreground">
            No applied round result denominator was recorded for some rounds; those percentages are omitted, not shown as zero.
          </p>:null}
      <ReportTable title="Round failures and share of the round"
       headings={["Round","Failed decisions","Applied decisions","Share of the round"]}
       rows={workspace.roundFailureShares.map(row=>[
        row.roundName,row.failed,row.decisions,
        row.shareOfRoundPercent===null?"Not recorded":row.shareOfRoundPercent+"%",
       ])}
       emptyDescription="No applied round decisions were recorded for the selected placement scope."/>
      <p className="text-xs text-muted-foreground leading-5">Share of the round = applied FAIL decisions divided by all applied round decisions. It does not count candidates who have no recorded round result, and is not a share of registered students.</p>

      <a href={"/api/placements/tpo/reports/round-failures?"+new URLSearchParams({
        ...(workspace.selectedSeasonId?{seasonId:workspace.selectedSeasonId}:{}),
        ...(workspace.selectedJobId?{jobId:workspace.selectedJobId}:{})
       }).toString()} className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] sm:w-auto md:min-h-9 border border-[var(--lms-canvas-border)] bg-white px-4 text-[14px] font-[650] text-[var(--lms-link-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
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
      <p className="text-xs text-muted-foreground leading-5">Branch uses the learner&apos;s current active academic enrollment; past branch membership is not reconstructed. A missing branch is labelled Not recorded. Percentages use only applied round decisions for that round and branch.</p>
      

        </div>
      </Disclosure>
      <Disclosure title="Reason breakdowns" className="border-b border-border pb-3">
        <div className="min-w-0 space-y-4 pt-3">
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
          row.reason?.trim() || "Not recorded",
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
      </Disclosure>
    </div>
  );
}
