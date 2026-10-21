import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { collegeMemberships, membershipRoles, placementCandidatePreferences, users } from "@/db/schema";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import { AuthorizationError, can } from "@/modules/permissions/policy";
import { requireLearnerPlacementAccess } from "./learner-participation-guard";
import { getOwnLearnerProfileWithRuntime } from "@/modules/people/runtime";
import {
  candidatePreferencesInputSchema,
  type CandidatePreferencesInput,
} from "./validation";

const DEFAULT_PREFERENCES = {
  preferredRoleTitles: [] as string[],
  preferredLocations: [] as string[],
  preferredEmploymentTypes: [] as string[],
  preferredWorkMode: "NO_PREFERENCE",
  shiftPreference: "NO_PREFERENCE",
  minimumAnnualCtcInr: null as number | null,
  relocationPreference: "NO_PREFERENCE",
  notifyMatchingJobs: true,
  notifyApplicationUpdates: true,
} as const;

function requireLearnerMembership(
  context: RequestContext,
) {
  if (
    !context.membership ||
    !hasMembershipRole(context, "LEARNER")
  ) {
    throw new AuthorizationError("placements.read");
  }

  return context.membership;
}

export async function getCandidatePreferences(
  context: RequestContext,
) {
  const membership = requireLearnerMembership(context);
  await requireLearnerPlacementAccess(context);
  const [preferences] = await getDb()
    .select()
    .from(placementCandidatePreferences)
    .where(
      eq(
        placementCandidatePreferences.membershipId,
        membership.id,
      ),
    )
    .limit(1);

  // Missing rows are defaults for the editor, not saved user choices.
  // Keep the state explicit even when a saved record contains empty arrays.
  if(preferences)return {...preferences,sourceState:"SAVED" as const};
  return {
    membershipId:membership.id,
    ...DEFAULT_PREFERENCES,
    createdAt:null,updatedAt:null,
    sourceState:"DEFAULT_NOT_SAVED" as const,
  };
}

/** Legacy JobPreferencesDTO read, using the single existing owner for its
 * six fields (the learner profile document). Matching/eligibility preferences
 * below are separate placement-scoped choices and never overwrite this DTO.
 * This adapter does not expose another learner's profile or make a second
 * persisted copy of role/city/shift/notification preferences. */
export async function getLegacyJobPreferencesForSelf(context: RequestContext) {
  const member = requireLearnerMembership(context);
  await requireLearnerPlacementAccess(context);
  const own = await getOwnLearnerProfileWithRuntime(context);
  if (own.profile.membershipId !== member.id) throw new AuthorizationError("placements.read");
  const pref = own.profile.profileDocument.jobPreferences;
  return {
    rolePreference: pref.rolePreference || null,
    specificRolePreference: pref.specificRolePreference || null,
    workShiftPreference: pref.workShiftPreference || null,
    preferredEmploymentCity: pref.preferredEmploymentCity || null,
    examSlotPreference: pref.examSlotPreference || null,
    jobNotificationsEnabled: pref.jobNotificationsEnabled,
    // The legacy response uses null for unspecified profile preferences.
    // Empty arrays/NO_PREFERENCE are reserved for the distinct vNext model.
    missingProfileFields:[
      ...(["rolePreference","specificRolePreference","workShiftPreference",
         "preferredEmploymentCity","examSlotPreference"] as const)
         .filter(key=>!pref[key]),
    ],
  };
}

export async function upsertCandidatePreferences(
  context: RequestContext,
  rawInput: CandidatePreferencesInput,
) {
  const input = candidatePreferencesInputSchema.parse(rawInput);
  const membership = requireLearnerMembership(context);
  await requireLearnerPlacementAccess(context);
  if (!can(context, "placements.read", {
    collegeId: membership.collegeId,
    organizationId: membership.organizationId,
  })) throw new AuthorizationError("placements.read");

  return getDb().transaction(async (tx) => {
    const [owner] = await tx.select({
      userId: collegeMemberships.userId,
      collegeId: collegeMemberships.collegeId,
      status: collegeMemberships.status,
    }).from(collegeMemberships)
      .where(eq(collegeMemberships.id, membership.id)).for("share").limit(1);
    const [actor] = await tx.select({status: users.platformStatus})
      .from(users).where(eq(users.id, context.user.id)).for("share").limit(1);
    const [role] = await tx.select({id: membershipRoles.id})
      .from(membershipRoles)
      .where(and(eq(membershipRoles.membershipId, membership.id), eq(membershipRoles.role, "LEARNER")))
      .for("share").limit(1);
    if (!owner || owner.userId !== context.user.id ||
        owner.collegeId !== membership.collegeId || owner.status !== "ACTIVE" ||
        !actor || actor.status !== "ACTIVE" || !role) {
      throw new AuthorizationError("placements.read");
    }

    const [preferences] = await tx.insert(placementCandidatePreferences)
      .values({ membershipId: membership.id, ...input })
      .onConflictDoUpdate({
        target: placementCandidatePreferences.membershipId,
        set: { ...input, updatedAt: new Date() },
      }).returning();
    if (!preferences) throw new Error("Candidate preferences upsert returned no row");

    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.PLACEMENTS_CANDIDATE_PREFERENCES_UPDATED,
      collegeId: membership.collegeId,
      organizationId: membership.organizationId,
      subjectType: "placement_candidate_preferences",
      subjectId: membership.id,
      summary: "Learner updated placement preferences",
      metadata: { changedSections: ["preferredRoles", "preferredLocations", "minimumCtc", "otherPreferences"] },
    });
    return preferences;
  });
}
