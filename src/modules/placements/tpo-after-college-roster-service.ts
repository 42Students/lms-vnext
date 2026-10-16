import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { placementTpoAfterCollege } from "@/db/schema/tpo-configuration";
import type { RequestContext } from "@/modules/identity/context";
import { requireTpoBatchActor } from "./tpo-batch-workspace-read-service";
import { placementTableExists } from "./staged-tables";
import { afterCollegeOutcomeSchema, type AfterCollegeOutcome } from "./tpo-after-college-model";

/** Only page-visible learner IDs supplied by the authenticated TPO roster. */
export async function getTpoAfterCollegeForRoster(
  context: RequestContext, visibleMembershipIds: readonly string[],
): Promise<{ available: boolean; entries: Record<string,{ outcome: AfterCollegeOutcome; expectedVersion: string }> }> {
  const collegeId = await requireTpoBatchActor(context);
  const available = await placementTableExists("placement_tpo_after_college");
  if (!available || !visibleMembershipIds.length) return { available, entries: {} };
  const ids = [...new Set(visibleMembershipIds)];
  const rows = await getDb().select({
    membershipId: placementTpoAfterCollege.learnerMembershipId,
    outcome: placementTpoAfterCollege.outcome,
    updatedAt: placementTpoAfterCollege.updatedAt,
  }).from(placementTpoAfterCollege)
    .where(and(
      eq(placementTpoAfterCollege.collegeId, collegeId),
      inArray(placementTpoAfterCollege.learnerMembershipId, ids),
    ));
  const map = new Map(rows.map(row => [row.membershipId, row]));
  return { available, entries: Object.fromEntries(ids.map(id => {
    const saved = map.get(id);
    const parsed = saved ? afterCollegeOutcomeSchema.safeParse(saved.outcome) : null;
    return [id, {
      outcome: parsed?.success ? parsed.data : "NOT_DECIDED",
      expectedVersion: saved?.updatedAt.toISOString() ?? "none",
    }];
  })) };
}
