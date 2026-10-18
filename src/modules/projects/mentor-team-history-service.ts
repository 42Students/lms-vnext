import "server-only";

import { and, asc, desc, count, eq, isNotNull, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { collegeMemberships, projectMembers, users } from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { can } from "@/modules/permissions/policy";
import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
import { requireProjectReadAccess } from "./access";
import { ProjectsServiceError } from "./errors";
import {
  classifyMentorTeamMember,
  mentorTeamHistoryPage,
  mentorTeamHistoryQuerySchema,
} from "./mentor-team-history-model";

/** Registered P4 membership start/end facts for an assigned Mentor's project. */
export async function getMentorTeamHistory(
  context: RequestContext,
  rawQuery: unknown,
) {
  const query = mentorTeamHistoryQuerySchema.parse(rawQuery);
  if (!hasMembershipRole(context, "MENTOR") || !context.membership ||
      context.user.platformStatus !== "ACTIVE") {
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  }
  const modules = await resolveOptionalModuleAccess(context);
  if (!modules.projects.enabled) {
    return {
      enabled: false as const,title:"",query,
      ...mentorTeamHistoryPage(0,1),items:[],
    };
  }
  const scope = await requireProjectReadAccess(context, query.projectId);
  if (scope.access !== "MENTOR" ||
      !can(context, "projects.read", {
        collegeId: scope.collegeId,
        organizationId: scope.organizationId,
      })) {
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  }

  const filters = and(
    eq(projectMembers.projectId, scope.project.id),
    eq(collegeMemberships.collegeId, scope.collegeId),
    query.role === "ALL" ? undefined : eq(projectMembers.role,query.role),
    query.primary === "PRIMARY" ? and(eq(projectMembers.role,"MENTOR"),eq(projectMembers.isPrimary,true)) : undefined,
    query.view === "OPEN" ? isNull(projectMembers.endedAt) :
      query.view === "ENDED" ? isNotNull(projectMembers.endedAt) : undefined,
  );
  const db = getDb();
  const [totalRows] = await db.select({ total: count() })
    .from(projectMembers)
    .innerJoin(collegeMemberships,
      eq(collegeMemberships.id, projectMembers.membershipId))
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .where(filters);
  const pagination = mentorTeamHistoryPage(Number(totalRows?.total ?? 0), query.page);
  const items = await db.select({
    id: projectMembers.id,
    role: projectMembers.role,
    roleLabel: projectMembers.roleLabel,
    isPrimary: projectMembers.isPrimary,
    startedAt: projectMembers.startedAt,
    endedAt: projectMembers.endedAt,
    membershipStatus: collegeMemberships.status,
    platformStatus: users.platformStatus,
    displayName: users.displayName,
  }).from(projectMembers)
    .innerJoin(collegeMemberships,
      eq(collegeMemberships.id, projectMembers.membershipId))
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .where(filters)
    .orderBy(...(query.order==="NEWEST"
      ? [desc(projectMembers.startedAt),desc(projectMembers.id)]
      : [asc(projectMembers.startedAt),asc(projectMembers.id)]))
    .limit(pagination.pageSize)
    .offset((pagination.page - 1) * pagination.pageSize);
  return {
    enabled: true as const,
    title: scope.project.title,
    query, ...pagination,
    items: items.map(row => {
      const state = classifyMentorTeamMember(row);
      return {
        id: row.id,
        role: row.role,
        roleLabel: row.roleLabel,
        isPrimary: row.isPrimary && state === "CURRENT",
        startedAt: row.startedAt,
        endedAt: row.endedAt,
        state,
        displayName: state === "CURRENT"
          ? row.displayName?.trim() || "Unnamed team member"
          : state === "ENDED" ? "Former team member" : "Inactive team member",
      };
    }),
  };
}
