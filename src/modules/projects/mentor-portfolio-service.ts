import "server-only";
import { and, asc, count, desc, eq, gte, lt, inArray, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { activityEvents } from "@/db/schema";
import {
  hasActiveMembership, hasMembershipRole, type RequestContext,
} from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
import { ProjectsServiceError } from "./errors";
import { listMyProjectInstances } from "./member-service";
import { listMyMentorProjectAttention } from "./mentor-attention-service";
import { mentorProjectActivityEventTypes } from "./mentor-project-activity-model";
import {
  mentorActivityQuerySchema, mentorReviewQuerySchema,
  pageMentorPortfolio, mentorActivityPagination, mentorActivityProjectTitleMatch, safeMentorProjectEventLabel, selectMentorReviewQueue,
} from "./mentor-portfolio-model";

async function requireMentorPortfolio(context: RequestContext) {
  const membership = context.membership;
  if (!membership || context.user.platformStatus !== "ACTIVE" ||
      !hasActiveMembership(context) || !hasMembershipRole(context, "MENTOR")) {
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  }
  requirePermission(context, "projects.read", {
    collegeId: membership.collegeId, organizationId: membership.organizationId,
  });
  const access = await resolveOptionalModuleAccess(context);
  if (!access.projects.enabled) return { enabled: false as const, projects: [] };
  const assigned = (await listMyProjectInstances(context))
    .filter(row => row.memberRole === "MENTOR");
  return {
    enabled: true as const,
    projects: assigned.map(row => ({
      id: row.project.id, title: row.project.title, status: row.project.status,
      isPrimaryMentor:row.isPrimaryMentor,
    })),
  };
}

/** All reviewed IDs originate from persisted active Mentor project assignments. */
export async function getMentorReviewQueue(context: RequestContext, rawQuery: unknown) {
  const query = mentorReviewQuerySchema.parse(rawQuery);
  const scope = await requireMentorPortfolio(context);
  if (!scope.enabled || !scope.projects.length) {
    return { enabled: scope.enabled, query, projects:scope.projects, ...pageMentorPortfolio([], query) };
  }
  if (query.projectId && !scope.projects.some(p=>p.id===query.projectId))
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const allowed = new Set(scope.projects
    .filter(p=>(query.projectStatus==="ALL"||p.status===query.projectStatus)&&
      (query.assignment==="ALL"||(query.assignment==="PRIMARY")===p.isPrimaryMentor)&&
      (!query.projectId||p.id===query.projectId)).map(p => p.id));
  const alerts = await listMyMentorProjectAttention(context);
  const items = selectMentorReviewQueue(
    alerts.filter(a => allowed.has(a.projectId)), query.search, query.order, query.age,
  );
  return { enabled: true, query, projects:scope.projects, ...pageMentorPortfolio(items, query) };
}

/** College-scoped, assigned-project timeline. No raw summaries, metadata or actor PII. */
export async function getMentorPortfolioActivity(
  context: RequestContext, rawQuery: unknown,
) {
  const query = mentorActivityQuerySchema.parse(rawQuery);
  const scope = await requireMentorPortfolio(context);
  if (query.projectId && !scope.projects.some(p=>p.id===query.projectId))
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const selectedProjects=scope.projects.filter(p=>(query.projectStatus==="ALL"||p.status===query.projectStatus)&&
    (query.assignment==="ALL"||(query.assignment==="PRIMARY")===p.isPrimaryMentor)&&
    (!query.projectId||p.id===query.projectId)&&
    mentorActivityProjectTitleMatch(p.title,query.search));
  if (!scope.enabled || !selectedProjects.length) {
    return {
      enabled: scope.enabled, query, projects:scope.projects, page: 1, pageSize: query.pageSize,
      total: 0, totalPages: 1,
      items: [] as { id: string; projectId: string; projectTitle: string; label: string; occurredAt: Date }[],
    };
  }
  const membership = context.membership!;
  const ids = selectedProjects.map(project => project.id);
  const byId = new Map(selectedProjects.map(project => [project.id, project]));
  const metadataProjectId = sql<string>`${activityEvents.metadata} ->> 'projectId'`;
  const types=mentorProjectActivityEventTypes(query.view);
  const cutoff = query.window==="ALL" ? null :
    new Date(new Date().getTime() - (query.window==="PAST_7_DAYS"?7:query.window==="PAST_90_DAYS"?90:30)*86400000);
  const filters = and(
    eq(activityEvents.module, "PROJECTS"),
    eq(activityEvents.collegeId, membership.collegeId),
    eq(activityEvents.organizationId, membership.organizationId),
    cutoff?(query.window==="OLDER_THAN_30_DAYS"
      ?lt(activityEvents.occurredAt,cutoff)
      :gte(activityEvents.occurredAt,cutoff)):undefined,
    query.importance === "ALL" ? undefined : eq(activityEvents.importance,query.importance),
    types?inArray(activityEvents.eventType,types):undefined,
    or(
      and(eq(activityEvents.subjectType, "project"), inArray(activityEvents.subjectId, ids)),
      inArray(metadataProjectId, ids),
    ),
  );
  const db = getDb();
  const [summary] = await db.select({total:count()}).from(activityEvents).where(filters);
  const paging=mentorActivityPagination(Number(summary?.total??0),query.page,query.pageSize);
  const rows=await db.select({
      id: activityEvents.id, eventType: activityEvents.eventType,
      subjectId: activityEvents.subjectId, subjectType: activityEvents.subjectType,
      metadataProjectId, occurredAt: activityEvents.occurredAt,
    }).from(activityEvents).where(filters)
      .orderBy(query.order==="OLDEST"?asc(activityEvents.occurredAt):desc(activityEvents.occurredAt),
        query.order==="OLDEST"?asc(activityEvents.id):desc(activityEvents.id))
      .limit(paging.pageSize).offset((paging.page - 1) * paging.pageSize);
  const items = rows.flatMap(row => {
    const id = row.subjectType === "project" && byId.has(row.subjectId)
      ? row.subjectId : row.metadataProjectId;
    const project = id ? byId.get(id) : null;
    return project ? [{
      id: row.id, projectId: project.id, projectTitle: project.title,
      label: safeMentorProjectEventLabel(row.eventType), occurredAt: row.occurredAt,
    }] : [];
  });
  return {
    enabled: true, query, projects:scope.projects, ...paging, items,
  };
}
