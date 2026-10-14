import "server-only";
import type { RequestContext } from "@/modules/identity/context";
import { hasMembershipRole } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { listActivityEvents } from "./service";
import {
  buildCollegeActivityCsv, COLLEGE_ACTIVITY_EXPORT_CAP,
  collegeActivityExportQuerySchema,
} from "./college-activity-export-model";

export async function exportCollegeActivity(context: RequestContext, raw: unknown) {
  const query = collegeActivityExportQuerySchema.parse(raw);
  const member = context.membership;
  if (!member || !hasMembershipRole(context, "COLLEGE_ADMIN") ||
    !can(context, "activity.read", {
      collegeId: member.collegeId, organizationId: member.organizationId,
    })) throw new AuthorizationError("activity.read");
  requirePermission(context, "activity.read", {
    collegeId: member.collegeId, organizationId: member.organizationId,
  });
  const rows: Array<{
    id: string; occurredAt: Date; module: string; importance: string; eventType: string;
    subjectType: string; subjectId: string; subjectLabel: string | null; summary: string;
    actorName: string | null; actorEmail: string | null;
  }> = [];
  let cursor: { beforeOccurredAt: Date; beforeId: string } | null = null;
  let truncated = false;
  do {
    const next = await listActivityEvents(context, {
      ...query, collegeId: member.collegeId, organizationId: member.organizationId,
      limit: 100, ...(cursor ?? {}),
    });
    rows.push(...next.items.map(item => ({
      id: item.event.id,
      occurredAt: item.event.occurredAt, module: item.event.module,
      importance: item.event.importance, eventType: item.event.eventType,
      subjectType: item.event.subjectType, subjectId: item.event.subjectId,
      subjectLabel: item.event.subjectLabel, summary: item.event.summary,
      actorName: item.actor?.displayName ?? null, actorEmail: item.actor?.email ?? null,
    })));
    if (!next.nextCursor) break;
    if (rows.length >= COLLEGE_ACTIVITY_EXPORT_CAP) {
      truncated = true;
      break;
    }
    cursor = next.nextCursor;
  } while (rows.length < COLLEGE_ACTIVITY_EXPORT_CAP);
  return {
    csv: buildCollegeActivityCsv(rows.slice(0, COLLEGE_ACTIVITY_EXPORT_CAP), truncated),
    truncated, exported: Math.min(rows.length, COLLEGE_ACTIVITY_EXPORT_CAP),
    cap: COLLEGE_ACTIVITY_EXPORT_CAP,
  };
}
