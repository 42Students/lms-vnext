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
      <Link href={roundHref} className="text-sm font-semibold text-[var(--lms-teal-deep)] hover:underline">
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
              className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-foreground"
            >
              Export explicit no-shows CSV
            </a>
            <a
              href={"/api/placements/drive-day/" + encodeURIComponent(data.round.id) + "/attendance/export"}
              className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-secondary"
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
          <div key={name} className="rounded-xl border border-border bg-surface p-5">
            <p className="text-sm font-medium text-body">{name}</p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">{value}</p>
          </div>
        ))}
      </section>
      {data.round.status !== "COMPLETED" ? (
        <p role="status" className="rounded-lg border border-border bg-surface p-4 text-sm text-body">
          This round is {data.round.status.replaceAll("_", " ")}. The report is a current
          snapshot, not a finalized attendance register.
        </p>
      ) : null}
      {report.awaitingMarkCount > 0 || report.unknownCount > 0 ? (
        <p role="status" className="rounded-lg border border-border bg-surface p-4 text-sm text-body">
          {report.awaitingMarkCount} waiting/unmarked and {report.unknownCount} unknown
          attendance entries are excluded from no-show totals. No absence is inferred.
        </p>
      ) : null}
      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold text-foreground">Explicitly absent learners</h2>
          <p className="mt-1 text-sm text-body">
            Based on persisted ABSENT marks among current, progression-eligible round applicants.
          </p>
        </div>
        {report.explicitAbsences.length === 0 ? (
          <p role="status" className="p-6 text-sm text-body">
            No learner is currently marked ABSENT in this round. This does not mean all
            learners attended; check the waiting/unmarked count above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="bg-surface-subtle text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3">Learner</th>
                  <th scope="col" className="px-4 py-3">Roll number</th>
                  <th scope="col" className="px-4 py-3">Application status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {report.explicitAbsences.map((item) => (
                  <tr key={item.applicationId}>
                    <td className="px-4 py-3 font-medium text-foreground">{item.displayName}</td>
                    <td className="px-4 py-3 text-body">{item.rollNumber ?? "Not recorded"}</td>
                    <td className="px-4 py-3 text-body">{item.applicationStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
