import "server-only";
import { createHash } from "node:crypto";

/** Project-meeting-only CAS; task, resource and release changes do not invalidate this plan. */
export function projectMeetingPlanToken(meetings: readonly {
  id: string; status: string; title: string; agenda: string | null;
  startsAt: Date; endsAt: Date; updatedAt: Date; deletedAt: Date | null;
  meetingType: string; linkedSprintId: string | null; linkedTaskId: string | null;
  meetingUrl: string | null; version: number;
}[]) {
  const hash = createHash("sha256");
  for (const row of [...meetings].sort((a, b) => a.id.localeCompare(b.id))) {
    hash.update(JSON.stringify([
      row.id, row.status, row.title, row.agenda,
      row.startsAt.toISOString(), row.endsAt.toISOString(),
      row.updatedAt.toISOString(), row.deletedAt?.toISOString() ?? null,
      row.meetingType, row.linkedSprintId, row.linkedTaskId,
      row.meetingUrl, row.version,
    ]) + "\n");
  }
  return hash.digest("hex");
}
