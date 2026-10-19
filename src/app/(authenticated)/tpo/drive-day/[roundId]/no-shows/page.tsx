import {StatTile} from "@/components/ui/stat-tile";
import {DataTable} from "@/components/ui/data-table";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
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
    <div className="space-y-6">
      <Link href={roundHref} className="text-sm font-semibold text-link hover:underline">
        ← Back to round overview
      </Link>
      <PageHeader
        eyebrow="TPO · Drive Day"
        title={data.companyName + " · No-show report"}
        description={data.job.title + " · " + data.round.name +
          " · Only explicitly marked ABSENT attendance is counted as no-show."}
        actions={
          <div className="flex flex-wrap gap-2">
            <a
              href={"/api/placements/drive-day/" + encodeURIComponent(data.round.id) + "/no-shows/export"}
              className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-[650] text-on-primary"
            >
              Export explicit no-shows CSV
            </a>
            <a
              href={"/api/placements/drive-day/" + encodeURIComponent(data.round.id) + "/attendance/export"}
              className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-primary-subtle"
            >
              Export complete attendance CSV
            </a>
          </div>
        }
      />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Attendance reconciliation">
        {[
          ["Current round roster", report.totalRoster],
          ["Explicit no-shows", report.explicitlyAbsentCount],
          ["Awaiting attendance mark", report.awaitingMarkCount],
          ["Unrecognized statuses", report.unknownCount],
        ].map(([name, value]) => (
          <StatTile key={String(name)} label={String(name)} value={value} />
        ))}
      </section>
      {data.round.status !== "COMPLETED" ? (
        <p role="status" className="rounded-[var(--lms-control-radius)] border border-border bg-surface p-4 text-sm text-body">
          This round is {data.round.status.replaceAll("_", " ")}. The report is a current
          snapshot, not a finalized attendance register.
        </p>
      ) : null}
      {report.awaitingMarkCount > 0 || report.unknownCount > 0 ? (
        <p role="status" className="rounded-[var(--lms-control-radius)] border border-border bg-surface p-4 text-sm text-body">
          {report.awaitingMarkCount} waiting/unmarked and {report.unknownCount} unknown
          attendance entries are excluded from no-show totals. No absence is inferred.
        </p>
      ) : null}
      <section className="overflow-hidden rounded-[var(--lms-canvas-radius)] border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold text-foreground">Explicitly absent learners</h2>
          <p className="mt-1 text-sm text-body">
            Based on persisted ABSENT marks among current, progression-eligible round applicants.
          </p>
        </div>
        <DataTable
          caption="Explicitly absent learners"
          rows={report.explicitAbsences}
          getRowKey={(item) => item.applicationId}
          empty={<p role="status" className="text-sm text-body">
            No learner is currently marked ABSENT in this round. This does not mean all
            learners attended; check the waiting/unmarked count above.
          </p>}
          columns={[
            {key:"learner",header:"Learner",mobileLabel:"Learner",mobilePriority:"primary",cell:(item)=>item.displayName},
            {key:"roll",header:"Roll number",mobileLabel:"Roll number",mobilePriority:"secondary",cell:(item)=>item.rollNumber??"Not recorded"},
            {key:"status",header:"Application status",mobileLabel:"Application status",mobilePriority:"secondary",cell:(item)=>item.applicationStatus},
          ]}
        />
      </section>
      <p className="text-xs text-muted-foreground">
        Round status: {data.round.status}. Scheduled: {" "}
        {data.round.scheduledAt ? formatTime.format(data.round.scheduledAt) + " IST" : "Not scheduled"}.
        This report does not infer absences from failed interviews, missing marks, or
        external attendance sources.
      </p>
    </div>
  );
}
