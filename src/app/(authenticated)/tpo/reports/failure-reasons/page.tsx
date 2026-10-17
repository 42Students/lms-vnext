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
    <div className="space-y-6">
      <PageHeader
        eyebrow="TPO · Reports"
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
        path="/tpo/reports/failure-reasons"
      />

      <section
        aria-label="Recorded adverse outcomes"
        className="rounded-xl border border-border bg-surface p-4"
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
        className="rounded-xl border border-border bg-surface-subtle p-4 text-sm leading-6 text-body"
      >
        <p className="font-semibold text-foreground">
          Reporting methodology
        </p>
        <p className="mt-1">{methodology}</p>
      </section>

      <ReportBarChart title="Recorded adverse outcomes by type" units="events"
       rows={failures.byKind.map(row=>({label:FAILURE_KIND_LABELS[row.kind],value:row.count}))}/>
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
