import { and, asc, count, eq, ilike, isNull, ne, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { collegeMemberships, projectInstances, projectMembers, users } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { loadProjectCollegeScope } from "./scope";
import {getProjectAdminCollegeId} from "./admin-college-scope";
import {ProjectsServiceError} from "./errors";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";

const mentorId = z.union([z.string().uuid(), z.literal("UNASSIGNED")]);
const MAX_REASSIGNMENT_SELECTION=1000;
const decimalPage=(min:number,max:number,fallback:number)=>z.union([
  z.number().int().min(min).max(max),
  z.string().regex(/^[0-9]+$/).transform(Number)
    .pipe(z.number().int().min(min).max(max)),
]).default(fallback);
const inputSchema = z.strictObject({
  q: z.string().trim().max(120).optional(),
  status: z.enum(["PLANNED", "ACTIVE", "COMPLETED", "ARCHIVED"]).optional(),
  fromMentorId: mentorId.optional(),
  page: decimalPage(1,10000,1),
  pageSize: decimalPage(10,100,25),
});
export type MentorReassignmentQuery = z.input<typeof inputSchema>;
/** Scope-bound text search treats LIKE metacharacters as literal user input. */
export function mentorReassignmentLiteralSearch(value:string){
  return value.replace(/[\\%_]/g,"\\$&");
}

async function scopeCollege(context: RequestContext, collegeId: string) {
  if(getProjectAdminCollegeId(context)!==collegeId)
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
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
  const outerProjectId=sql.raw('"project_instances"."id"');
  const lastActivity = sql`greatest(
    ${projectInstances.updatedAt},
    coalesce((select max(updated_at) from project_tasks where project_id = ${outerProjectId}), 'epoch'::timestamptz),
    coalesce((select max(updated_at) from project_sprints where project_id = ${outerProjectId}), 'epoch'::timestamptz),
    coalesce((select max(updated_at) from project_releases where project_id = ${outerProjectId}), 'epoch'::timestamptz),
    coalesce((select max(updated_at) from project_submissions where project_id = ${outerProjectId}), 'epoch'::timestamptz),
    coalesce((select max(updated_at) from project_task_submissions where project_id = ${outerProjectId}), 'epoch'::timestamptz),
    coalesce((select max(updated_at) from project_meetings where project_id = ${outerProjectId}), 'epoch'::timestamptz),
    coalesce((select max(updated_at) from project_resources where project_id = ${outerProjectId}), 'epoch'::timestamptz),
    coalesce((select max(updated_at) from project_members where project_id = ${outerProjectId}), 'epoch'::timestamptz)
  )`;
  const cutoff = new Date(Date.now() - 7 * 86400000);
  return sql<boolean>`(
    nullif(trim(${projectInstances.blocker}), '') is not null
    or ${lastActivity} <= ${cutoff}
    or exists (select 1 from project_tasks t where t.project_id = ${outerProjectId} and t.status = 'BLOCKED'
      and nullif(trim(t.blocker_reason), '') is not null)
    or coalesce((select s.status = 'SUBMITTED' from project_submissions s
      where s.project_id = ${outerProjectId} order by s.version desc limit 1), false)
  )`;
}

/** COL-people-21: whole-college workload, never calculated from the current page. */
export async function listCollegeProjectMentorWorkload(context: RequestContext, collegeId: string) {
  const college = await scopeCollege(context, collegeId);
  const atRisk = riskExpression();
  return getDb().transaction(async db=>{
  await assertPersistedPlatformPermission(db,context,"projects.manage",{
    organizationId:college.organizationId,collegeId:college.id,
  });
  const rows = await db.select({
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
    // Completed workspaces remain in legacy non-archived mentor workload.
  )).groupBy(projectMembers.membershipId,users.displayName);
  return rows;
  });
}

/** COL-people-22: filter on the database before pagination and preserve mentor ID. */
export async function listCollegeReassignmentWorkspaces(
  context: RequestContext, collegeId: string, raw: MentorReassignmentQuery,
) {
  const query = inputSchema.parse(raw);
  const college = await scopeCollege(context, collegeId);
  const literalSearch=query.q?mentorReassignmentLiteralSearch(query.q):undefined;
  const where = and(
    eq(projectInstances.collegeId, college.id),
    ne(projectInstances.status, "ARCHIVED"),
    query.status ? eq(projectInstances.status, query.status) : undefined,
    literalSearch ? or(
      ilike(projectInstances.title, "%" + literalSearch + "%"),
      ilike(projectInstances.slug, "%" + literalSearch + "%"),
    ) : undefined,
    query.fromMentorId === "UNASSIGNED" ? isNull(projectMembers.membershipId)
      : query.fromMentorId ? eq(projectMembers.membershipId, query.fromMentorId) : undefined,
  );
  return getDb().transaction(async db=>{
    await assertPersistedPlatformPermission(db,context,"projects.manage",{
      organizationId:college.organizationId,collegeId:college.id,
    });
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
    roleLabel:projectMembers.roleLabel,
  }).from(projectInstances).leftJoin(projectMembers, and(
    eq(projectMembers.projectId, projectInstances.id), activePrimaryMentor,
  )).where(where).orderBy(asc(projectInstances.id))
    .limit(MAX_REASSIGNMENT_SELECTION);
  return {
    items: rows,
    matchingWorkspaces,
    matchingCapped:total>MAX_REASSIGNMENT_SELECTION,
    total, page: query.page, pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
  });
}
