import "server-only";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  projectMeetingAuditHistoryStaged,
  publicProjectAuditSnapshot,
} from "@/db/schema/project-audit-staged";
import { hasActiveMembership, hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
import { requireProjectReadAccess } from "./access";
import { ProjectsServiceError } from "./errors";

const querySchema = z.strictObject({
  projectId: z.string().uuid(),
  meetingKey: z.string().trim().min(1).max(120).optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});

const forbiddenField = /(token|secret|password|credential|authorization|email|phone|object_?key|storage_?path|ip_?address)/i;

/** A narrow, current-mentor-only projection of the typed legacy meeting revision log.
 * History is never used to grant access to the meeting or its project.
 */
export async function getMentorMeetingChangeHistory(context: RequestContext, raw: unknown) {
  const query = querySchema.parse(raw);
  if (!hasActiveMembership(context) || !hasMembershipRole(context, "MENTOR")) {
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  }
  if (!(await resolveOptionalModuleAccess(context)).projects.enabled) {
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  }
  const scope = await requireProjectReadAccess(context, query.projectId);
  if (scope.access !== "MENTOR" || context.membership?.collegeId !== scope.collegeId) {
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  }
  const where = and(
    eq(projectMeetingAuditHistoryStaged.projectId, scope.project.id),
    isNull(projectMeetingAuditHistoryStaged.deletedAt),
    query.meetingKey ? eq(projectMeetingAuditHistoryStaged.meetingKey, query.meetingKey) : undefined,
  );
  const db = getDb();
  const [summary] = await db.select({ total: count() })
    .from(projectMeetingAuditHistoryStaged).where(where);
  const total = Number(summary?.total ?? 0);
  const pageCount = Math.max(1, Math.ceil(total / 20));
  const page = Math.min(query.page, pageCount);
  const rows = await db.select({
    id: projectMeetingAuditHistoryStaged.id,
    meetingId: projectMeetingAuditHistoryStaged.meetingId,
    meetingKey: projectMeetingAuditHistoryStaged.meetingKey,
    actionType: projectMeetingAuditHistoryStaged.actionType,
    actorName: projectMeetingAuditHistoryStaged.actorName,
    actorUserType: projectMeetingAuditHistoryStaged.actorUserType,
    notes: projectMeetingAuditHistoryStaged.notes,
    changedFields: projectMeetingAuditHistoryStaged.changedFields,
    beforeJson: projectMeetingAuditHistoryStaged.beforeJson,
    afterJson: projectMeetingAuditHistoryStaged.afterJson,
    createdAt: projectMeetingAuditHistoryStaged.createdAt,
  }).from(projectMeetingAuditHistoryStaged).where(where)
    .orderBy(desc(projectMeetingAuditHistoryStaged.createdAt), desc(projectMeetingAuditHistoryStaged.id))
    .limit(20).offset((page-1)*20);
  return {
    total, page, pageCount, projectId: scope.project.id,
    items: rows.map(row => ({
      id: row.id, meetingId: row.meetingId, meetingKey: row.meetingKey,
      actionType: row.actionType, actorName: row.actorName?.trim() || "Former team member",
      actorUserType: row.actorUserType, createdAt: row.createdAt.toISOString(),
      notes: row.notes?.slice(0, 2000) || null,
      changedFields: Array.isArray(row.changedFields)
        ? row.changedFields.filter((field):field is string => typeof field === "string" &&
            field.length <= 120 && !forbiddenField.test(field)).slice(0, 40) : [],
      before: publicProjectAuditSnapshot(row.beforeJson),
      after: publicProjectAuditSnapshot(row.afterJson),
    })),
  };
}
