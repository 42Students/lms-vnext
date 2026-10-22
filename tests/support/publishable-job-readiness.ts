import { getDb } from "@/db/client";
import { placementJobEligibilityPolicies, placementJobRounds } from "@/db/schema";

/** Publishing now requires both an evaluative round and an explicit scoped
 * eligibility policy. Fixtures must not bypass that production guard. */
export async function seedPublishableJobReadiness(jobId: string, actorUserId: string) {
  const db = getDb();
  await db.insert(placementJobEligibilityPolicies)
    .values({ jobId, updatedByUserId: actorUserId })
    .onConflictDoNothing();
  await db.insert(placementJobRounds)
    .values({
      jobId, sequence: 1, kind: "TEST", name: "Fixture assessment",
      createdByUserId: actorUserId,
    });
}
