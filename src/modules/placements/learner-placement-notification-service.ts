import "server-only";

import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { collegeMemberships, membershipRoles, placementCandidatePreferences, users } from "@/db/schema";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { type RequestContext, hasActiveMembership, hasMembershipRole } from "@/modules/identity/context";
import { AuthorizationError, can } from "@/modules/permissions/policy";
import { PlacementsServiceError } from "./errors";
import { requireLearnerPlacementAccess } from "./learner-participation-guard";
import { learnerPlacementNotificationInputSchema, placementNotificationChanges, placementNotificationIsStale } from "./learner-placement-notification-model";

/**
 * An independent, narrow write: never overwrite role, location, CTC or other
 * candidate choices with defaults from a stale browser form.
 */
export async function updateOwnPlacementNotificationPreferences(
  context: RequestContext,
  rawInput: unknown,
) {
  const input = learnerPlacementNotificationInputSchema.parse(rawInput);
  const membership = context.membership;
  if (!membership || !hasActiveMembership(context) ||
      !hasMembershipRole(context,"LEARNER") ||
      !can(context,"placements.read",{collegeId:membership.collegeId,
        organizationId:membership.organizationId})) {
    throw new AuthorizationError("placements.read");
  }
  const scopedMember = await requireLearnerPlacementAccess(context);
  const memberId = scopedMember.id;
  const collegeId = scopedMember.collegeId;
  const organizationId = scopedMember.organizationId;
  return getDb().transaction(async tx => {
    // Lock the live member and role during the write; forged/suspended
    // memberships must never create a preferences or activity row.
    const [principal] = await tx.select({id:collegeMemberships.id})
      .from(collegeMemberships)
      .innerJoin(users,eq(users.id,collegeMemberships.userId))
      .innerJoin(membershipRoles,and(
        eq(membershipRoles.membershipId,collegeMemberships.id),
        eq(membershipRoles.role,"LEARNER"),
      ))
      .where(and(
        eq(collegeMemberships.id,memberId),
        eq(collegeMemberships.collegeId,collegeId),
        eq(collegeMemberships.userId,context.user.id),
        eq(collegeMemberships.status,"ACTIVE"),
        eq(users.platformStatus,"ACTIVE"),
      )).for("update", {of: collegeMemberships}).limit(1);
    if (!principal) throw new AuthorizationError("placements.read");

    const [previous] = await tx.select({
      notifyMatchingJobs:placementCandidatePreferences.notifyMatchingJobs,
      notifyApplicationUpdates:placementCandidatePreferences.notifyApplicationUpdates,
    }).from(placementCandidatePreferences)
      .where(eq(placementCandidatePreferences.membershipId,memberId))
      .for("update").limit(1);
    const before = previous ?? {
      notifyMatchingJobs:true,
      notifyApplicationUpdates:true,
    };
    if (placementNotificationIsStale(before,input.expected)) {
      throw new PlacementsServiceError("PLACEMENT_NOTIFICATION_PREFERENCES_STALE");
    }
    const changed=placementNotificationChanges(before,input);
    if (!changed) {
      return {...before,changed:false};
    }

    const [saved] = await tx.insert(placementCandidatePreferences).values({
      membershipId:memberId,
      notifyMatchingJobs:input.notifyMatchingJobs,
      notifyApplicationUpdates:input.notifyApplicationUpdates,
    }).onConflictDoUpdate({
      target:placementCandidatePreferences.membershipId,
      set:{
        notifyMatchingJobs:input.notifyMatchingJobs,
        notifyApplicationUpdates:input.notifyApplicationUpdates,
        updatedAt:new Date(),
      },
    }).returning({
      notifyMatchingJobs:placementCandidatePreferences.notifyMatchingJobs,
      notifyApplicationUpdates:placementCandidatePreferences.notifyApplicationUpdates,
    });
    if (!saved) throw new Error("PLACEMENT_NOTIFICATION_SAVE_FAILED");
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.PLACEMENTS_NOTIFICATION_PREFERENCES_UPDATED,
      collegeId,organizationId,
      subjectType:"PLACEMENT_NOTIFICATION_PREFERENCES",
      subjectId:memberId,
      summary:"Learner updated own placement notification choices",
      metadata:{before,after:saved},
      groupKey:"placement-preferences:"+memberId,
    });
    return {...saved,changed:true};
  });
}
