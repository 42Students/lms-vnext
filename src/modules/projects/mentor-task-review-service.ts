import "server-only";

import { and, asc, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { projectInstances, projectTasks, projectTaskSubmissions } from "@/db/schema";
import { can } from "@/modules/permissions/policy";
import {
  hasActiveMembership, hasMembershipRole, type RequestContext,
} from "@/modules/identity/context";
import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
import { ProjectsServiceError } from "./errors";
import { listMyProjectInstances } from "./member-service";
import {
  mentorTaskReviewQuerySchema, mentorTaskReviewSummary, mentorTaskReviewLiteralSearch,
} from "./mentor-task-review-model";

type PendingTaskReview = {
  id: string; taskId: string; projectId: string; projectTitle: string;
  taskTitle: string; priority: string; version: number; submittedAt: Date;
};

/** Active Mentor college/assignment scope; only migrated task submissions are selected. */
export async function getMentorTaskReviews(
  context: RequestContext, rawQuery: unknown,
) {
  const query = mentorTaskReviewQuerySchema.parse(rawQuery);
  const membership = context.membership;
  if (!membership || context.user.platformStatus !== "ACTIVE" ||
      !hasActiveMembership(context) || !hasMembershipRole(context, "MENTOR") ||
      !can(context, "projects.read", {
        collegeId: membership.collegeId,
        organizationId: membership.organizationId,
      })) {
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  }
  const modules = await resolveOptionalModuleAccess(context);
  if (!modules.projects.enabled) {
    return {
      enabled: false as const, query,
      ...mentorTaskReviewSummary({ total: 0, ...query }),
      items: [] as PendingTaskReview[],
    };
  }
  const assigned = (await listMyProjectInstances(context))
    .filter(row => row.memberRole === "MENTOR");
  const ids = assigned.map(row => row.project.id);
  if (!ids.length) {
    return {
      enabled: true as const, query,
      ...mentorTaskReviewSummary({ total: 0, ...query }),
      items: [] as PendingTaskReview[],
    };
  }

  const escaped=mentorTaskReviewLiteralSearch(query.search);
  const conditions = and(
    inArray(projectTaskSubmissions.projectId, ids),
    eq(projectTaskSubmissions.status, "SUBMITTED"),
    eq(projectTasks.status, "IN_REVIEW"),
    query.priority==="ALL"?undefined:eq(projectTasks.priority,query.priority),
    sql`not exists (select 1 from project_task_submissions newer
      where newer.task_id=${projectTaskSubmissions.taskId}
        and newer.version>${projectTaskSubmissions.version})`,
    eq(projectInstances.collegeId, membership.collegeId),
    eq(projectInstances.status, "ACTIVE"),
    escaped ? or(
      ilike(projectInstances.title, "%" + escaped + "%"),
      ilike(projectTasks.title, "%" + escaped + "%"),
    ) : undefined,
  );
  const db = getDb();
  const base = db.select({
    id: projectTaskSubmissions.id,
    taskId: projectTaskSubmissions.taskId,
    projectId: projectInstances.id,
    projectTitle: projectInstances.title,
    taskTitle: projectTasks.title,
    priority: projectTasks.priority,
    version: projectTaskSubmissions.version,
    submittedAt: projectTaskSubmissions.submittedAt,
  }).from(projectTaskSubmissions)
    .innerJoin(projectTasks, and(
      eq(projectTasks.id, projectTaskSubmissions.taskId),
      eq(projectTasks.projectId, projectTaskSubmissions.projectId),
    ))
    .innerJoin(projectInstances,
      eq(projectInstances.id, projectTaskSubmissions.projectId))
    .where(conditions);

  const [counts]=await db.select({total:count()}).from(projectTaskSubmissions)
    .innerJoin(projectTasks,and(
      eq(projectTasks.id,projectTaskSubmissions.taskId),
      eq(projectTasks.projectId,projectTaskSubmissions.projectId),
    )).innerJoin(projectInstances,eq(projectInstances.id,projectTaskSubmissions.projectId))
    .where(conditions);
  const page=mentorTaskReviewSummary({
    total:Number(counts?.total??0),page:query.page,pageSize:query.pageSize,
  });
  const ordering=query.order==="OLDEST"?asc:desc;
  const priorityRank=sql<number>`CASE ${projectTasks.priority}
    WHEN 'CRITICAL' THEN 4 WHEN 'HIGH' THEN 3 WHEN 'MEDIUM' THEN 2
    WHEN 'LOW' THEN 1 ELSE 0 END`;
  const items=await base.orderBy(
    ...(query.order==="PRIORITY"
      ? [desc(priorityRank),desc(projectTaskSubmissions.submittedAt),desc(projectTaskSubmissions.id)]
      : [ordering(projectTaskSubmissions.submittedAt),ordering(projectTaskSubmissions.id)])
  ).limit(page.pageSize).offset((page.page-1)*page.pageSize);
  return {enabled:true as const,query:{...query,page:page.page},...page,items};
}
