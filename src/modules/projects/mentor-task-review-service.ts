import "server-only";

import { and, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
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
  mentorTaskReviewQuerySchema, mentorTaskReviewSummary,
} from "./mentor-task-review-model";

type PendingTaskReview = {
  id: string; projectId: string; projectTitle: string;
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

  const conditions = and(
    inArray(projectTaskSubmissions.projectId, ids),
    eq(projectTaskSubmissions.status, "SUBMITTED"),
    eq(projectTasks.status, "IN_REVIEW"),
    eq(projectInstances.collegeId, membership.collegeId),
    eq(projectInstances.status, "ACTIVE"),
    query.search ? or(
      ilike(projectInstances.title, "%" + query.search + "%"),
      ilike(projectTasks.title, "%" + query.search + "%"),
    ) : undefined,
  );
  const db = getDb();
  const base = db.select({
    id: projectTaskSubmissions.id,
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

  const [counts, items] = await Promise.all([
    db.select({ total: count() }).from(projectTaskSubmissions)
      .innerJoin(projectTasks, and(
        eq(projectTasks.id, projectTaskSubmissions.taskId),
        eq(projectTasks.projectId, projectTaskSubmissions.projectId),
      ))
      .innerJoin(projectInstances,
        eq(projectInstances.id, projectTaskSubmissions.projectId))
      .where(conditions),
    base.orderBy(desc(projectTaskSubmissions.submittedAt), desc(projectTaskSubmissions.id))
      .limit(query.pageSize).offset((query.page - 1) * query.pageSize),
  ]);
  return {
    enabled: true as const, query,
    ...mentorTaskReviewSummary({ total: Number(counts[0]?.total ?? 0), ...query }),
    items,
  };
}
