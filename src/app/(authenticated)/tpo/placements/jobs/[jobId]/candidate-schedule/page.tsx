import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { getPlacementDriveDay } from "@/modules/placements/drive-day-service";
import { requirePlacementManageScope } from "@/modules/placements/scope";
import { getTpoScheduleConflicts } from "@/modules/placements/tpo-schedule-conflicts-service";
import { projectTpoDriveScheduleWarnings } from "@/modules/placements/tpo-drive-schedule-warnings-model";
import {
  candidateScheduleJobIdSchema, projectTpoCandidateScheduleReadiness,
} from "@/modules/placements/tpo-candidate-schedule-model";

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata",
});
export default async function TpoCandidateSchedulePage({
  params,
}: { params: Promise<{ jobId: string }> }) {
  const context = await getCurrentRequestContext();
  const membership = context.membership;
  if (!membership || !hasMembershipRole(context, "TPO")) redirect("/dashboard");
  const collegeId = membership.collegeId;
  if (!can(context, "placements.manage", { collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", { collegeId });
  await requirePlacementManageScope(context, collegeId);
  const { jobId } = await params;
  const parsed = candidateScheduleJobIdSchema.safeParse(jobId);
  if (!parsed.success) notFound();
  const drive = await getPlacementDriveDay(context, parsed.data);
  const readiness = projectTpoCandidateScheduleReadiness(drive.rounds);
  const collisions = await getTpoScheduleConflicts(context, { days: 90 }).catch(() => null);
  const warning = projectTpoDriveScheduleWarnings(
    collisions, drive.rounds.map(round => round.id),
  );
  return <div className="space-y-5">
    <Link href={"/tpo/placements/jobs/" + encodeURIComponent(drive.job.id)}
      className="text-sm font-semibold text-primary-text">← Back to drive</Link>
    <header>
      <h1 className="text-2xl font-bold text-foreground">{drive.job.title} · Candidate round schedule</h1>
      <p className="mt-2 text-sm text-body">
        These are shared round schedules for candidates who currently reached each
        round. They are NOT booked interview slots or panel assignments.
      </p>
    </header>
    <section role="status" className="rounded-xl border border-border bg-surface p-5 text-sm text-body">
      Candidate-specific start/end slots and interviewer panels have no registered
      persistence. This view cannot assign them or certify interviewer conflicts.
      <Link href="/tpo/calendar/rounds" className="ml-2 font-semibold text-primary-text">
        Edit existing shared round schedules →
      </Link>
    </section>
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="font-semibold text-foreground">Persisted venue collision assessment</h2>
      {warning.state === "UNAVAILABLE" ?
        <p className="mt-2 text-sm text-body">Assessment unavailable; no conflict-free claim is made.</p>
        : <p className="mt-2 text-sm text-body">
          {warning.collisions} overlap warning(s) and {warning.unknown} unassessable
          round(s). {warning.state === "LIMITED" ?
            "The 90-day scan was truncated, so this is incomplete." :
            "Only current persisted on-campus venue/time overlaps are assessed."}
        </p>}
      {warning.warnings.length > 0 ?
        <ul className="mt-3 list-disc space-y-1 pl-6 text-sm text-body">
          {warning.warnings.flatMap(entry => entry.messages.map((message, i) =>
            <li key={entry.roundId + "-" + i}>{message}</li>))}
        </ul> : null}
    </section>
    {drive.rounds.length === 0 ?
      <p role="status" className="rounded-xl border border-border p-5 text-sm text-body">
        No persisted rounds exist for this drive.
      </p> : readiness.total === 0 ?
      <p role="status" className="rounded-xl border border-border p-5 text-sm text-body">
        No progression-eligible round participants are currently recorded.
        This does not imply slots were assigned.
      </p> : <>
        <p className="text-sm text-body">
          {readiness.total} round-candidate combinations found.
          {readiness.limited ? " Only the first 1,000 are displayed; this is incomplete." : ""}
        </p>
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[50rem] text-left text-sm">
            <thead className="bg-surface-subtle">
              <tr>{["Candidate", "Round", "Shared start (IST)", "Round venue", "Candidate slot", "Panel"].map(label =>
                <th key={label} scope="col" className="px-4 py-3">{label}</th>)}</tr>
            </thead>
            <tbody>{readiness.displayed.map(item =>
              <tr key={item.roundId + ":" + item.applicationId} className="border-t border-border">
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3">{item.roundName}</td>
                <td className="px-4 py-3">{item.roundStartIso
                  ? dateFormat.format(new Date(item.roundStartIso)) + " IST"
                  : "Not scheduled"}</td>
                <td className="px-4 py-3">{item.roundVenue ?? "Not recorded"}</td>
                <td className="px-4 py-3">Unavailable</td>
                <td className="px-4 py-3">Unavailable</td>
              </tr>)}</tbody>
          </table>
        </div>
      </>}
    <p className="text-xs leading-5 text-muted-foreground">
      No panel IDs, candidate time slots or calendar invitations are invented.
      Date/time evidence comes from migrated round timestamps and is presented
      explicitly in the Asia/Kolkata timezone.
    </p>
  </div>;
}
