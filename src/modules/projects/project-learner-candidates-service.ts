import "server-only";

import { and, asc, eq, exists, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { collegeMemberships, learnerProfiles, learnerProgramEnrollments,
  membershipRoles, users } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import { requirePermission } from "@/modules/permissions/policy";
import { getProjectAdminCollegeId } from "./admin-college-scope";
import { loadProjectCollegeScope } from "./scope";
import { ProjectsServiceError } from "./errors";

const querySchema = z.strictObject({
  q: z.string().trim().max(120).default(""),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(100000).default(0),
});

/** Same-college active enrolled learner search; no phone or email is returned. */
export async function listCollegeProjectLearnerCandidates(
  context: RequestContext, collegeId: string, rawQuery: unknown,
) {
  const query = querySchema.parse(rawQuery);
  if (getProjectAdminCollegeId(context) !== collegeId) {
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  }
  const college = await loadProjectCollegeScope(collegeId);
  requirePermission(context, "projects.manage", {
    collegeId: college.id, organizationId: college.organizationId,
  });
  const needle = query.q.replace(/[\\%_]/g, value => "\\" + value);
  const pattern = "%" + needle + "%";
  return getDb().transaction(async tx => {
    await assertPersistedPlatformPermission(tx, context, "projects.manage", {
      collegeId: college.id, organizationId: college.organizationId,
    });
    const rows = await tx.select({
      membershipId: collegeMemberships.id,
      displayName: users.displayName,
      rollNumber: learnerProfiles.rollNumber,
      registrationNumber: learnerProfiles.registrationNumber,
    }).from(collegeMemberships)
      .innerJoin(users, eq(users.id, collegeMemberships.userId))
      .innerJoin(membershipRoles, and(
        eq(membershipRoles.membershipId, collegeMemberships.id),
        eq(membershipRoles.role, "LEARNER"),
      ))
      .leftJoin(learnerProfiles,
        eq(learnerProfiles.membershipId, collegeMemberships.id))
      .where(and(
        eq(collegeMemberships.collegeId, college.id),
        eq(collegeMemberships.status, "ACTIVE"),
        eq(users.platformStatus, "ACTIVE"),
        exists(tx.select({ id: learnerProgramEnrollments.id })
          .from(learnerProgramEnrollments).where(and(
            eq(learnerProgramEnrollments.membershipId, collegeMemberships.id),
            eq(learnerProgramEnrollments.status, "ACTIVE"),
          ))),
        query.q ? or(
          ilike(users.displayName, pattern),
          ilike(learnerProfiles.rollNumber, pattern),
          ilike(learnerProfiles.registrationNumber, pattern),
        ) : undefined,
      ))
      .orderBy(asc(users.displayName), asc(collegeMemberships.id))
      .limit(query.limit + 1).offset(query.offset);
    return {
      learners: rows.slice(0, query.limit).map(row => ({
        membershipId: row.membershipId,
        displayName: row.displayName,
        rollNumber: row.rollNumber || row.registrationNumber || "",
      })),
      hasMore: rows.length > query.limit,
      nextOffset: rows.length > query.limit ? query.offset + query.limit : null,
    };
  });
}
