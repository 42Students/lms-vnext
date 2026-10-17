import { and, asc, count, eq, ilike, isNull, ne, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { collegeMemberships, projectInstances, projectMembers, users } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { loadProjectCollegeScope } from "./scope";

const mentorId = z.union([z.string().uuid(), z.literal("UNASSIGNED")]);
const inputSchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.enum(["PLANNED", "ACTIVE", "COMPLETED", "ARCHIVED"]).optional(),
  fromMentorId: mentorId.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(10).max(100).default(25),
});
export type MentorReassignmentQuery = z.input<typeof inputSchema>;

async function scopeCollege(context: RequestContext, collegeId: string) {
  const college = await loadProjectCollegeScope(collegeId);
  requirePermission(context, "projects.manage", {
    organizationId: college.organizationId, collegeId: college.id,
  });
  return college;
}

const activePrimaryMentor = and(
  eq(projectMembers.role, "MENTOR"),
  eq(projectMembers.isPrimary, true),
  isNull(projectMembers.endedAt),
);

function riskExpression() {
  const lastActivity = sql`greatest(
    ${projectInstances.updatedAt},
    coalesce((select max(updated_at) from project_tasks where project_id = ${projectInstances.id}), 'epoch'::timestamptz),
    coalesce((select max(updated_at) from project_sprints where project_id = ${projectInstances.id}), 'epoch'::timestamptz),
    coalesce((select max(updated_at) from project_releases where project_id = ${projectInstances.id}), 'epoch'::timestamptz),
    coalesce((select max(updated_at) from project_submissions where project_id = ${projectInstances.id}), 'epoch'::timestamptz),
    coalesce((select max(updated_at) from project_task_submissions where project_id = ${projectInstances.id}), 'epoch'::timestamptz),
    coalesce((select max(updated_at) from project_meetings where project_id = ${projectInstances.id}), 'epoch'::timestamptz),
    coalesce((select max(updated_at) from project_resources where project_id = ${projectInstances.id}), 'epoch'::timestamptz),
    coalesce((select max(updated_at) from project_members where project_id = ${projectInstances.id}), 'epoch'::timestamptz)
  )`;
  const cutoff = new Date(Date.now() - 7 * 86400000);
  return sql<boolean>`(
    nullif(trim(${projectInstances.blocker}), '') is not null
    or ${lastActivity} <= ${cutoff}
    or exists (select 1 from project_tasks t where t.project_id = ${projectInstances.id} and t.status = 'BLOCKED'
      and nullif(trim(t.blocker_reason), '') is not null)
    or coalesce((select s.status = 'SUBMITTED' from project_submissions s
      where s.project_id = ${projectInstances.id} order by s.version desc limit 1), false)
  )`;
}

/** COL-people-21: whole-college workload, never calculated from the current page. */
export async function listCollegeProjectMentorWorkload(context: RequestContext, collegeId: string) {
  const college = await scopeCollege(context, collegeId);
  const atRisk = riskExpression();
  const rows = await getDb().select({
    mentorMembershipId: projectMembers.membershipId,
    mentorName:users.displayName,
    activeWorkspaces: count(),
    atRisk: sql<number>`count(*) filter (where ${atRisk})`.mapWith(Number),
  }).from(projectInstances).leftJoin(projectMembers, and(
    eq(projectMembers.projectId, projectInstances.id), activePrimaryMentor,
  )).leftJoin(collegeMemberships,eq(collegeMemberships.id,projectMembers.membershipId))
    .leftJoin(users,eq(users.id,collegeMemberships.userId)).where(and(
    eq(projectInstances.collegeId, college.id),
    ne(projectInstances.status, "ARCHIVED"),
    ne(projectInstances.status, "COMPLETED"),
  )).groupBy(projectMembers.membershipId,users.displayName);
  return rows;
}

/** COL-people-22: filter on the database before pagination and preserve mentor ID. */
export async function listCollegeReassignmentWorkspaces(
  context: RequestContext, collegeId: string, raw: MentorReassignmentQuery,
) {
  const college = await scopeCollege(context, collegeId);
  const query = inputSchema.parse(raw);
  const where = and(
    eq(projectInstances.collegeId, college.id),
    ne(projectInstances.status, "ARCHIVED"),
    query.status ? eq(projectInstances.status, query.status) : undefined,
    query.q ? or(
      ilike(projectInstances.title, "%" + query.q + "%"),
      ilike(projectInstances.slug, "%" + query.q + "%"),
    ) : undefined,
    query.fromMentorId === "UNASSIGNED" ? isNull(projectMembers.membershipId)
      : query.fromMentorId ? eq(projectMembers.membershipId, query.fromMentorId) : undefined,
  );
  const db = getDb();
  const joined = () => db.select({
    id: projectInstances.id,
    title: projectInstances.title,
    status: projectInstances.status,
    mentorMembershipId: projectMembers.membershipId,
    mentorName: users.displayName,
  }).from(projectInstances).leftJoin(projectMembers, and(
    eq(projectMembers.projectId, projectInstances.id), activePrimaryMentor,
  )).leftJoin(collegeMemberships, eq(collegeMemberships.id, projectMembers.membershipId))
    .leftJoin(users, eq(users.id, collegeMemberships.userId));
  const countQuery = await db.select({ total: count() })
    .from(projectInstances).leftJoin(projectMembers, and(
      eq(projectMembers.projectId, projectInstances.id), activePrimaryMentor,
    )).where(where);
  const total = Number(countQuery[0]?.total ?? 0);
  const rows = await joined().where(where)
    .orderBy(asc(projectInstances.title), asc(projectInstances.id))
    .limit(query.pageSize).offset((query.page - 1) * query.pageSize);
  const matchingWorkspaces = await db.select({
    id: projectInstances.id,
    mentorMembershipId: projectMembers.membershipId,
  }).from(projectInstances).leftJoin(projectMembers, and(
    eq(projectMembers.projectId, projectInstances.id), activePrimaryMentor,
  )).where(where).orderBy(asc(projectInstances.id));
  return {
    items: rows,
    matchingWorkspaces,
    total, page: query.page, pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}
