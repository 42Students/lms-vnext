import "server-only";

import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { attendancePolicies } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requireAttendanceCollege } from "./admin-service";
import {
  attendancePolicyUpdateSchema,
  DEFAULT_ATTENDANCE_POLICY,
} from "./policy-validation";

/**
 * Read the persisted policy for one authorized college.
 *
 * A college without an attendance_policies row uses
 * the same defaults already exposed by admin-service,
 * Faculty attendance and Learner attendance.
 */
export async function getCollegeAttendancePolicy(
  context: RequestContext,
  collegeIdInput: string,
) {
  const college = await requireAttendanceCollege(
    context,
    collegeIdInput,
  );

  const [stored] = await getDb()
    .select({
      eligibilityThresholdPercent:
        attendancePolicies.eligibilityThresholdPercent,
      correctionWindowHours:
        attendancePolicies.correctionWindowHours,
    })
    .from(attendancePolicies)
    .where(
      eq(
        attendancePolicies.collegeId,
        college.id,
      ),
    )
    .limit(1);

  return {
    college,
    policy: stored ?? DEFAULT_ATTENDANCE_POLICY,
  };
}

/**
 * Replace both policy numbers atomically.
 *
 * The existing attendance scope guard enforces:
 * - an active college;
 * - College Admin membership, or Super Admin
 *   explicitly acting in that selected college;
 * - centralized academics.manage permission.
 *
 * The database primary key allows one policy
 * row per college. This upsert also handles
 * colleges still using the default values.
 */
export async function updateCollegeAttendancePolicy(
  context: RequestContext,
  rawInput: unknown,
) {
  const input =
    attendancePolicyUpdateSchema.parse(rawInput);

  const college = await requireAttendanceCollege(
    context,
    input.collegeId,
  );

  const now = new Date();

  const [saved] = await getDb()
    .insert(attendancePolicies)
    .values({
      collegeId: college.id,
      eligibilityThresholdPercent:
        input.eligibilityThresholdPercent,
      correctionWindowHours:
        input.correctionWindowHours,
      updatedByUserId: context.user.id,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: attendancePolicies.collegeId,
      set: {
        eligibilityThresholdPercent:
          input.eligibilityThresholdPercent,
        correctionWindowHours:
          input.correctionWindowHours,
        updatedByUserId: context.user.id,
        updatedAt: now,
      },
    })
    .returning({
      collegeId: attendancePolicies.collegeId,
      eligibilityThresholdPercent:
        attendancePolicies.eligibilityThresholdPercent,
      correctionWindowHours:
        attendancePolicies.correctionWindowHours,
      updatedAt: attendancePolicies.updatedAt,
    });

  return saved;
}
