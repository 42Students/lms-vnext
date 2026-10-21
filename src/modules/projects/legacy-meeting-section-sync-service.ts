import "server-only";

import { createHash } from "node:crypto";
import { and, asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { projectInstances, projectMeetings } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
import { requireProjectLifecycleMutationAccess, requireProjectReadAccess } from "./access";
import { assertPersistedProjectMutationActor } from "./persisted-mentor-mutation";
import { ProjectsServiceError } from "./errors";

const meetingSchema = z.strictObject({
  meetingKey: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(500),
  agenda: z.string().trim().max(4000).nullable().optional(),
  startsAt: z.iso.datetime({ offset: true }),
  endsAt: z.iso.datetime({ offset: true }),
  timeZone: z.string().trim().min(1).max(80).default("Asia/Kolkata"),
  meetingUrl: z.string().trim().url().max(2000).nullable().optional(),
  meetingType: z.enum(["GENERAL", "PLANNING", "STANDUP", "REVIEW", "RETRO"]).default("GENERAL"),
  status: z.enum(["DRAFT", "REQUESTED", "SCHEDULED", "RESCHEDULED", "COMPLETED", "CANCELLED"]).default("DRAFT"),
}).refine(row => Date.parse(row.startsAt) < Date.parse(row.endsAt), {
  path: ["endsAt"], message: "End time must be after start time",
});

const sectionSchema = z.strictObject({
  expectedMeetingsToken: z.string().regex(/^[a-f0-9]{64}$/, "Refresh the meeting section before saving"),
  meetings: z.array(meetingSchema).max(500),
}).superRefine((value, ctx) => {
  const keys = new Set<string>();
  for (const [index, row] of value.meetings.entries()) {
    const folded = row.meetingKey.toLocaleLowerCase("en");
    if (keys.has(folded)) ctx.addIssue({
      code: "custom", path: ["meetings", index, "meetingKey"],
      message: "Meeting keys must be unique inside this project",
    });
    keys.add(folded);
  }
});

type MeetingRow = typeof projectMeetings.$inferSelect;

function sectionToken(rows: readonly MeetingRow[]) {
  const snapshot = [...rows].sort((left, right) => left.id.localeCompare(right.id))
    .map(row => [
      row.id, row.meetingKey, row.status, row.meetingType, row.title,
      row.agenda, row.startsAt.toISOString(), row.endsAt.toISOString(),
      row.timeZone, row.meetingUrl, row.deletedAt?.toISOString() ?? null,
      row.updatedAt.toISOString(), row.version,
    ]);
  return createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
}

async function requireMeetingModule(context: RequestContext) {
  if (!(await resolveOptionalModuleAccess(context)).projects.enabled)
    throw new ProjectsServiceError("PROJECT_MEETING_ACCESS_DENIED");
}

/** Returns the *complete* section revision, including tombstones. Only users
 * allowed to edit project meetings can read this legacy synchronization surface.
 * Native vNext meetings without a legacy key remain separately owned. */
export async function readLegacyProjectMeetingSection(context: RequestContext, projectId: string) {
  await requireMeetingModule(context);
  const scope = await requireProjectReadAccess(context, projectId);
  if (scope.access !== "MENTOR" && scope.access !== "ADMIN")
    throw new ProjectsServiceError("PROJECT_MEETING_ACCESS_DENIED");
  const rows = await getDb().select().from(projectMeetings)
    .where(eq(projectMeetings.projectId, scope.project.id))
    .orderBy(asc(projectMeetings.id)).limit(501);
  if (rows.length > 500) throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
  return {
    expectedMeetingsToken: sectionToken(rows),
    meetings: rows.filter(row => row.meetingKey && !row.deletedAt).map(row => ({
      meetingKey: row.meetingKey!, title: row.title, agenda: row.agenda,
      startsAt: row.startsAt.toISOString(), endsAt: row.endsAt.toISOString(),
      timeZone: row.timeZone, meetingUrl: row.meetingUrl, meetingType: row.meetingType,
      status: row.status,
    })),
  };
}

/** Legacy workspace PUT compatibility: atomic replacement of the keyed rows.
 * A previously deleted meeting key is revived in place, not reinserted under
 * a second UUID. The entire section is guarded by a single CAS token. Native
 * vNext (unkeyed) meetings are never deleted by this compatibility operation.
 */
export async function synchronizeLegacyProjectMeetingSection(
  context: RequestContext, projectId: string, rawInput: unknown,
) {
  await requireMeetingModule(context);
  const input = sectionSchema.parse(rawInput);
  const scope = await requireProjectLifecycleMutationAccess(context, projectId);
  if (scope.access !== "MENTOR" && scope.access !== "ADMIN")
    throw new ProjectsServiceError("PROJECT_MEETING_ACCESS_DENIED");
  const db = getDb();
  return db.transaction(async tx => {
    const [project] = await tx.select({status: projectInstances.status})
      .from(projectInstances).where(and(
        eq(projectInstances.id, scope.project.id),
        eq(projectInstances.collegeId, scope.collegeId),
      )).for("update").limit(1);
    if (!project || project.status === "ARCHIVED" || project.status === "COMPLETED")
      throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
    await assertPersistedProjectMutationActor(tx, context, scope);
    const current = await tx.select().from(projectMeetings)
      .where(eq(projectMeetings.projectId, scope.project.id))
      .orderBy(asc(projectMeetings.id)).for("update").limit(501);
    if (current.length > 500) throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
    if (sectionToken(current) !== input.expectedMeetingsToken)
      throw new ProjectsServiceError("PROJECT_MEETING_STALE_VERSION");

    const existingByKey = new Map(current.filter(row => row.meetingKey)
      .map(row => [row.meetingKey!.toLocaleLowerCase("en"), row]));
    const requested = new Set(input.meetings.map(row => row.meetingKey.toLocaleLowerCase("en")));
    const counts = {created: 0, updated: 0, revived: 0, removed: 0};
    const now = new Date();
    for (const row of input.meetings) {
      const old = existingByKey.get(row.meetingKey.toLocaleLowerCase("en"));
      const startsAt = new Date(row.startsAt), endsAt = new Date(row.endsAt);
      const agenda = row.agenda === undefined ? old?.agenda ?? null : row.agenda;
      const meetingUrl = row.meetingUrl === undefined ? old?.meetingUrl ?? null : row.meetingUrl;
      // This compatibility write must respect the native DB meeting shape.
      // Historical authors cannot be invented from the current signed-in admin.
      // A migrated REQUESTED or scheduled row may be revived only when its
      // original requester/organiser was already persisted by the importer.
      if (row.status === "REQUESTED" && !old?.requestedByMembershipId)
        throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
      if (["SCHEDULED", "RESCHEDULED", "COMPLETED"].includes(row.status) &&
          (!old?.scheduledByUserId || !meetingUrl))
        throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
      const payload = {
        meetingKey: row.meetingKey, title: row.title, agenda,
        startsAt, endsAt, timeZone: row.timeZone,
        meetingType: row.meetingType, meetingUrl,
        status: row.status, deletedAt: null, deletedByWorkspace: false,
      };
      if (!old) {
        await tx.insert(projectMeetings).values({
          projectId: scope.project.id, createdByUserId: context.user.id,
          ...payload, legacyNeedsScheduleReview: row.status !== "DRAFT",
        });
        counts.created++;
        continue;
      }
      const changed = old.deletedAt !== null ||
        old.meetingKey !== row.meetingKey || old.title !== row.title ||
        old.agenda !== payload.agenda || old.status !== row.status ||
        old.meetingType !== row.meetingType || old.meetingUrl !== payload.meetingUrl ||
        old.timeZone !== row.timeZone ||
        old.startsAt.getTime() !== startsAt.getTime() ||
        old.endsAt.getTime() !== endsAt.getTime();
      if (!changed) continue;
      await tx.update(projectMeetings).set({
        ...payload, updatedAt: new Date(Math.max(now.getTime(), old.updatedAt.getTime() + 1)),
        version: sql`${projectMeetings.version} + 1`,
        legacyNeedsScheduleReview: row.status !== "DRAFT",
      }).where(and(eq(projectMeetings.id, old.id), eq(projectMeetings.projectId, scope.project.id)));
      if (old.deletedAt) counts.revived++; else counts.updated++;
    }
    for (const old of current) {
      if (!old.meetingKey || old.deletedAt ||
          requested.has(old.meetingKey.toLocaleLowerCase("en"))) continue;
      await tx.update(projectMeetings).set({
        deletedAt: now, deletedByWorkspace: true,
        updatedAt: new Date(Math.max(now.getTime(), old.updatedAt.getTime() + 1)),
        version: sql`${projectMeetings.version} + 1`,
      }).where(and(eq(projectMeetings.id, old.id), eq(projectMeetings.projectId, scope.project.id)));
      counts.removed++;
    }
    const changed = Object.values(counts).some(value => value > 0);
    if (changed) await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.PROJECTS_MEETING_DECIDED,
      collegeId: scope.collegeId, organizationId: scope.organizationId,
      subjectType: "project", subjectId: scope.project.id,
      subjectLabel: scope.project.title,
      summary: "Legacy project meeting section saved",
      metadata: {projectId: scope.project.id, ...counts, total: input.meetings.length},
      groupKey: "project:" + scope.project.id + ":meetings",
    });
    const latest = await tx.select().from(projectMeetings)
      .where(eq(projectMeetings.projectId, scope.project.id))
      .orderBy(asc(projectMeetings.id)).limit(501);
    if (latest.length > 500) throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
    return {...counts, changed, expectedMeetingsToken: sectionToken(latest)};
  });
}
