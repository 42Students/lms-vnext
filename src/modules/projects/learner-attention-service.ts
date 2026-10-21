import {
  desc,
  inArray,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  projectSubmissions,
} from "@/db/schema";
import {
  hasActiveMembership,
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import { ProjectsServiceError } from "./errors";
import { listMyProjectInstances } from "./member-service";

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
  progressPercent:Math.max(0,Math.min(100,input.progressPercent)),
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
