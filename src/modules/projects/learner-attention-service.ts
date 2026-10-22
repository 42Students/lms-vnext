import {
  and,
  desc,
  eq,
  inArray,
  isNull,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  projectSubmissions,
  projectInstances,
  projectMembers,
  collegeMemberships,
  membershipRoles,
  users,
} from "@/db/schema";
import {
  hasActiveMembership,
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import { ProjectsServiceError } from "./errors";
import { listMyProjectInstances } from "./member-service";

export const LEGACY_LEARNER_WORKSPACE_FIELD_MAP={
 id:"projectId",status:"status",progress:"progressPercent",
 mentor:"mentor",mentorAssignedAt:"mentorSince",
 submittedAt:"deliveredAt",reviewedAt:"reviewedAt",
 dueDate:"dueDate",reviewStatus:"reviewStatus",
} as const;
/** Relational replacement for old ProjectWorkspaceDTO display fragments.
 * This never fabricates review or mentor dates: only persisted submission
 * reviewedAt and active project-member periods may populate those fields.
 * The caller must load the tenant-authorized project and mentor row first.
 */
export function learnerLegacyProjectProgressProjection(input:{
 projectId:string;status:string;progressPercent:number;
 mentorName:string|null;mentorStartedAt:Date|null;
 submittedAt:Date|null;reviewedAt:Date|null;
 dueDate:string|null;reviewStatus:string|null;
}){
 return {projectId:input.projectId,status:input.status,
  progressPercent:Number.isFinite(input.progressPercent)?Math.max(0,Math.min(100,input.progressPercent)):0,
  mentor:input.mentorName,mentorSince:input.mentorStartedAt,
  deliveredAt:input.submittedAt,reviewedAt:input.reviewedAt,
  dueDate:input.dueDate,reviewStatus:input.reviewStatus};
}
export type LearnerProjectAttention = {
  projectId: string;
  kind:
    | "CHANGES_REQUESTED"
    | "DRAFT";
};

export async function listMyLearnerProjectAttention(
  context: RequestContext,
): Promise<LearnerProjectAttention[]> {
  if (
    !hasActiveMembership(context) ||
    !hasMembershipRole(
      context,
      "LEARNER",
    )
  ) {
    throw new ProjectsServiceError(
      "PROJECT_ACCESS_DENIED",
    );
  }

  const rows = (
    await listMyProjectInstances(
      context,
    )
  ).filter(
    (row) =>
      row.memberRole === "LEARNER" &&
      row.project.status !==
        "ARCHIVED",
  );
  if (!rows.length) {
    return [];
  }

  const ids = rows.map(
    (row) => row.project.id,
  );
  const submissions =
    await getDb()
      .select({
        projectId:
          projectSubmissions.projectId,
        version:
          projectSubmissions.version,
        status:
          projectSubmissions.status,
      })
      .from(projectSubmissions)
      .where(
        inArray(
          projectSubmissions.projectId,
          ids,
        ),
      )
      .orderBy(
        desc(
          projectSubmissions.version,
        ),
      );

  const latest = new Map<
    string,
    (typeof submissions)[number]
  >();
  for (const submission of submissions) {
    if (
      !latest.has(
        submission.projectId,
      )
    ) {
      latest.set(
        submission.projectId,
        submission,
      );
    }
  }

  const result:
    LearnerProjectAttention[] = [];
  for (const row of rows) {
    const submission =
      latest.get(row.project.id);
    if (
      submission?.status ===
        "CHANGES_REQUESTED" ||
      submission?.status === "DRAFT"
    ) {
      result.push({
        projectId: row.project.id,
        kind: submission.status,
      });
    }
  }

  return result;
}


/** Read-only sample crosswalk for historical learner workspace state. */
export const LEGACY_LEARNER_PROJECT_DTO_EXAMPLE={
 projectId:"00000000-0000-4000-8000-000000000001",
 status:"ACTIVE",progressPercent:50,mentorName:"Mentor",
 mentorStartedAt:null,submittedAt:null,reviewedAt:null,
 dueDate:null,reviewStatus:"PENDING",
} as const;

/** Page-scoped learner attention badges. The listing has already authorized
 * these IDs, but the query independently enforces college, membership,
 * active learner role and current project membership. Never fetch every
 * submission in the tenant just to render a 10/25/50-row directory page. */
export async function listMyLearnerProjectPageAttention(
  context: RequestContext, projectIds: readonly string[],
): Promise<LearnerProjectAttention[]> {
  if (!hasActiveMembership(context) || !hasMembershipRole(context, "LEARNER") ||
      context.user.platformStatus !== "ACTIVE" || !context.membership) {
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  }
  if (projectIds.length === 0) return [];
  const membership = context.membership;
  const scopedIds = [...new Set(projectIds)];
  if (scopedIds.length > 50) throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");

  // DISTINCT ON returns the newest persisted version per project, including
  // SUBMITTED/APPROVED states. Older drafts cannot reappear as action badges.
  const latest = await getDb().selectDistinctOn([projectSubmissions.projectId], {
    projectId: projectSubmissions.projectId,
    status: projectSubmissions.status,
  }).from(projectSubmissions)
    .innerJoin(projectInstances, eq(projectInstances.id, projectSubmissions.projectId))
    .innerJoin(projectMembers, and(
      eq(projectMembers.projectId, projectInstances.id),
      eq(projectMembers.membershipId, membership.id),
      eq(projectMembers.role, "LEARNER"),
      isNull(projectMembers.endedAt),
      isNull(projectMembers.deletedAt),
    ))
    .innerJoin(collegeMemberships, eq(collegeMemberships.id, projectMembers.membershipId))
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .innerJoin(membershipRoles, and(
      eq(membershipRoles.membershipId, collegeMemberships.id),
      eq(membershipRoles.role, "LEARNER"),
    ))
    .where(and(
      inArray(projectSubmissions.projectId, scopedIds),
      eq(projectInstances.collegeId, membership.collegeId),
      isNull(projectInstances.deletedAt),
      eq(collegeMemberships.collegeId, membership.collegeId),
      eq(collegeMemberships.userId, context.user.id),
      eq(collegeMemberships.status, "ACTIVE"),
      eq(users.platformStatus, "ACTIVE"),
    ))
    .orderBy(projectSubmissions.projectId, desc(projectSubmissions.version));
  return latest.flatMap(row =>
    row.status === "CHANGES_REQUESTED" || row.status === "DRAFT"
      ? [{ projectId: row.projectId, kind: row.status }]
      : [],
  );
}
