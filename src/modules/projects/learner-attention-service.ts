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
