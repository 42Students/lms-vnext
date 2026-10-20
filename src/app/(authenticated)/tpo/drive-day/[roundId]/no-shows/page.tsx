import {DataTable} from "@/components/ui/data-table";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { hasMembershipRole } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { buildTpoNoShowReport } from "@/modules/placements/tpo-no-show-model";
import { getTpoRoundDriveDay } from "@/modules/placements/tpo-round-drive-day-service";
import { PlacementsServiceError } from "@/modules/placements/errors";
import { requirePlacementManageScope } from "@/modules/placements/scope";
import { placementRoundIdSchema } from "@/modules/placements/validation";

export default async function TpoNoShowReportPage({
  params,
}: {
  params: Promise<{ roundId: string }>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    redirect("/dashboard");
  }

  const collegeId = context.membership.collegeId;
  if (!can(context, "placements.manage", { collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", { collegeId });
  await requirePlacementManageScope(context, collegeId);

  const { roundId } = await params;
  const parsed = placementRoundIdSchema.safeParse(roundId);
  if (!parsed.success) notFound();

  let data: Awaited<ReturnType<typeof getTpoRoundDriveDay>>;
  try {
    data = await getTpoRoundDriveDay(context, parsed.data);
  } catch (error) {
    if (error instanceof PlacementsServiceError &&
        error.code === "PLACEMENT_ROUND_NOT_FOUND") notFound();
    throw error;
  }
  const report = buildTpoNoShowReport(data.rows);
  const roundHref = "/tpo/drive-day/" + encodeURIComponent(data.round.id);
  const formatTime = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });

  return (
    <div className="min-w-0 space-y-[var(--lms-space-6)]">
      <PageHeader
        eyebrow="TPO · Drive Day"
        title={data.companyName + " · No-show report"}
        description={data.job.title + " · " + data.round.name +
          " · Only explicitly marked ABSENT attendance is counted as no-show."}
        actions={
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <a
              href={"/api/placements/drive-day/" + encodeURIComponent(data.round.id) + "/no-shows/export"}
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-primary bg-primary px-4 text-sm font-[650] text-on-primary hover:border-primary-hover hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9"
            >
              Export explicit no-shows CSV
            </a>
            <details className="min-w-0 sm:relative">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-foreground marker:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9 [&::-webkit-details-marker]:hidden">
                Attendance export
              </summary>
              <div className="mt-2 bg-surface sm:absolute sm:right-0 sm:z-20 sm:w-64 sm:rounded-[var(--lms-control-radius)] sm:border sm:border-border sm:p-2 sm:shadow-sm">
                <a href={"/api/placements/drive-day/" + encodeURIComponent(data.round.id) + "/attendance/export"}
                  className="inline-flex min-h-11 w-full items-center rounded-[var(--lms-control-radius)] px-3 text-sm font-semibold text-link underline hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                  Export complete attendance CSV
                </a>
              </div>
            </details>
            <Link href={roundHref}
              className="lms-inline-link inline-flex min-h-11 items-center justify-center px-2 text-sm font-semibold text-link underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">
              ← Back to round overview
            </Link>
          </div>
        }
      />
      <section className="grid min-w-0 grid-cols-2 overflow-hidden rounded-[var(--lms-canvas-radius)] border border-border bg-surface lg:grid-cols-4" aria-label="Attendance reconciliation">
        {[
          ["Current round roster", report.totalRoster],
          ["Explicit no-shows", report.explicitlyAbsentCount],
          ["Awaiting attendance mark", report.awaitingMarkCount],
          ["Unrecognized statuses", report.unknownCount],
        ].map(([name, value], index) => (
          <div key={String(name)} className={"min-w-0 px-3 py-4 sm:px-4 " +
            (index < 2 ? "border-b border-border lg:border-b-0 " : "") +
            (index % 2 === 0 ? "border-r border-border " : "") +
            (index === 1 ? "lg:border-r " : "") +
            (index === 2 ? "lg:border-r " : "")}>
            <p className="text-xs font-medium leading-5 text-body">{name}</p>
            <p className="mt-1 text-2xl font-semibold leading-8 tabular-nums text-foreground">{value}</p>
          </div>
        ))}
      </section>
      {data.round.status !== "COMPLETED" ? (
        <Alert tone="warning">
          This round is {data.round.status.replaceAll("_", " ")}. The report is a current
          snapshot, not a finalized attendance register.
        </Alert>
      ) : null}
      {report.awaitingMarkCount > 0 || report.unknownCount > 0 ? (
        <Alert tone="warning">
          {report.awaitingMarkCount} waiting/unmarked and {report.unknownCount} unknown
          attendance entries are excluded from no-show totals. No absence is inferred.
        </Alert>
      ) : null}
      <section className="min-w-0">
        <div className="border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-4)]">
          <h2 className="font-semibold text-[18px] leading-[1.4] text-[var(--lms-heading)]">Explicitly absent learners</h2>
          <p className="mt-1 text-sm text-body">
            Based on persisted ABSENT marks among current, progression-eligible round applicants.
          </p>
        </div>
        <DataTable
          caption="Explicitly absent learners"
          rows={report.explicitAbsences}
          getRowKey={(item) => item.applicationId}
          empty={<EmptyState title="No learner is currently marked ABSENT in this round." description="This does not mean all learners attended; check the waiting/unmarked count above."
            action={<Link href={roundHref} className="lms-inline-link inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">← Back to round overview</Link>} />}
          columns={[
            {key:"learner",header:"Learner",mobileLabel:"Learner",mobilePriority:"primary",cell:(item)=>item.displayName},
            {key:"roll",header:"Roll number",mobileLabel:"Roll number",mobilePriority:"secondary",cell:(item)=>item.rollNumber??"Not recorded"},
            {key:"status",header:"Application status",mobileLabel:"Application status",mobilePriority:"secondary",cell:(item)=>item.applicationStatus},
          ]}
        />
      </section>
      <details className="min-w-0 border-t border-border pt-3 text-xs leading-5 text-muted-foreground">
        <summary className="min-h-11 cursor-pointer font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Round report notes</summary>
        <p className="max-w-3xl pb-2">
          Round status: {data.round.status}. Scheduled: {" "}
          {data.round.scheduledAt ? formatTime.format(data.round.scheduledAt) + " IST" : "Not scheduled"}.
          This report does not infer absences from failed interviews, missing marks, or
          external attendance sources.
        </p>
      </details>
    </div>
  );
}
