import "server-only";

import { and, asc, count, eq, ilike, inArray, ne, or } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  projectInstances, projectReleases, projectSprints, projectTasks,
} from "@/db/schema";
import {
  hasActiveMembership, hasMembershipRole, type RequestContext,
} from "@/modules/identity/context";
import { can } from "@/modules/permissions/policy";
import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
import { ProjectsServiceError } from "./errors";
import { listMyProjectInstances } from "./member-service";
import {
  mentorSprintProgressPage, mentorSprintProgressQuerySchema,
  summarizeSprintTasks,
} from "./mentor-sprint-progress-model";

export async function getMentorSprintProgress(
  context: RequestContext, rawQuery: unknown,
) {
  const query = mentorSprintProgressQuerySchema.parse(rawQuery);
  const membership = context.membership;
  if (!membership || !hasActiveMembership(context) ||
      !hasMembershipRole(context, "MENTOR") ||
      !can(context, "projects.read", {
        collegeId: membership.collegeId,
        organizationId: membership.organizationId,
      })) {
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  }
  const modules = await resolveOptionalModuleAccess(context);
  const empty = (enabled: boolean) => ({
    enabled, query, ...mentorSprintProgressPage(0, 1),
    items: [] as {
      id: string; title: string; status: string;
      projectId: string; projectTitle: string;
      releaseTitle: string; releaseStatus: string;
      tasks: ReturnType<typeof summarizeSprintTasks>;
    }[],
  });
  if (!modules.projects.enabled) return empty(false);

  const projects = (await listMyProjectInstances(context))
    .filter(row => row.memberRole === "MENTOR" && row.project.status !== "ARCHIVED");
  const ids = projects.map(row => row.project.id);
  if (ids.length === 0) return empty(true);

  // Escape pattern metacharacters so the search is literal user text.
  const escaped = query.search.replace(/[\\%_]/g, "\\$&");
  const filters = and(
    inArray(projectSprints.projectId, ids),
    eq(projectInstances.collegeId, membership.collegeId),
    ne(projectInstances.status, "ARCHIVED"),
    eq(projectReleases.projectId, projectInstances.id),
    query.state === "ALL" ? undefined : eq(projectSprints.status, query.state),
    query.release === "ALL" ? undefined : eq(projectReleases.status,query.release),
    escaped ? or(
      ilike(projectInstances.title, "%" + escaped + "%"),
      ilike(projectSprints.title, "%" + escaped + "%"),
      ilike(projectReleases.title, "%" + escaped + "%"),
    ) : undefined,
  );
  const db = getDb();
  const [summary] = await db.select({ total: count() })
    .from(projectSprints)
    .innerJoin(projectInstances, eq(projectInstances.id, projectSprints.projectId))
    .innerJoin(projectReleases, eq(projectReleases.id, projectSprints.releaseId))
    .where(filters);
  const pagination = mentorSprintProgressPage(Number(summary?.total ?? 0), query.page);

  const sprints = await db.select({
    id: projectSprints.id,
    title: projectSprints.title,
    status: projectSprints.status,
    projectId: projectInstances.id,
    projectTitle: projectInstances.title,
    releaseTitle: projectReleases.title,
    releaseStatus: projectReleases.status,
    sequence: projectSprints.sequence,
  }).from(projectSprints)
    .innerJoin(projectInstances, eq(projectInstances.id, projectSprints.projectId))
    .innerJoin(projectReleases, eq(projectReleases.id, projectSprints.releaseId))
    .where(filters)
    .orderBy(asc(projectInstances.title), asc(projectSprints.sequence), asc(projectSprints.id))
    .limit(pagination.pageSize)
    .offset((pagination.page - 1) * pagination.pageSize);

  const sprintIds = sprints.map(sprint => sprint.id);
  const counts = sprintIds.length === 0 ? [] :
    await db.select({
      sprintId: projectTasks.sprintId,
      status: projectTasks.status,
      total: count(),
    }).from(projectTasks)
      .where(and(
        inArray(projectTasks.sprintId, sprintIds),
        inArray(projectTasks.projectId, ids),
      ))
      .groupBy(projectTasks.sprintId, projectTasks.status);
  const bySprint = new Map<string, {status: string; total: number}[]>();
  for (const row of counts) {
    const list = bySprint.get(row.sprintId) ?? [];
    list.push({ status: row.status, total: Number(row.total) });
    bySprint.set(row.sprintId, list);
  }
  return {
    enabled: true,
    query, ...pagination,
    items: sprints.map(sprint => ({
      ...sprint,
      tasks: summarizeSprintTasks(bySprint.get(sprint.id) ?? []),
    })),
  };
}
