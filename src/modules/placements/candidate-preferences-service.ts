import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { placementCandidatePreferences } from "@/db/schema";
import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
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

  return (
    preferences ?? {
      membershipId: membership.id,
      ...DEFAULT_PREFERENCES,
      createdAt: null,
      updatedAt: null,
    }
  );
}

export async function upsertCandidatePreferences(
  context: RequestContext,
  rawInput: CandidatePreferencesInput,
) {
  const membership = requireLearnerMembership(context);
  const input =
    candidatePreferencesInputSchema.parse(rawInput);
  const now = new Date();

  const [preferences] = await getDb()
    .insert(placementCandidatePreferences)
    .values({
      membershipId: membership.id,
      ...input,
    })
    .onConflictDoUpdate({
      target: placementCandidatePreferences.membershipId,
      set: {
        ...input,
        updatedAt: now,
      },
    })
    .returning();

  if (!preferences) {
    throw new Error(
      "Candidate preferences upsert returned no row",
    );
  }

  return preferences;
}
