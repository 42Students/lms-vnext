import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  placementCollegeRules,
  placementCompanyVisibilitySettings,
  activityEvents,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePlacementManageScope } from "./scope";
import {
  placementPolicyCollegeIdSchema,
  placementCollegeRulesPatchSchema,
  placementCompanyVisibilityPatchSchema,
  type PlacementCollegeRulesPatch,
  type PlacementCompanyVisibilityPatch,
} from "./tpo-policy-validation";

export const DEFAULT_RULES = {
  countsAsPlacedAt: "OFFER_RELEASED" as const,
  maxHeldOffers: 1,
  upliftPct: 40,
  minResponseHours: 48,
};

export const DEFAULT_VISIBILITY = {
  showCgpaExact: false,
  showTenthTwelfth: true,
  showProjectLinks: true,
  showAssessmentScores: false,
  showAttendance: false,
};

/** Read without creating rows: legacy V162's row-is-optional defaults. */
export async function getCollegePlacementRules(
  context: RequestContext,
  rawCollegeId: string,
) {
  const collegeId =
    placementPolicyCollegeIdSchema.parse(rawCollegeId);
  await requirePlacementManageScope(context, collegeId);
  const [row] = await getDb()
    .select()
    .from(placementCollegeRules)
    .where(eq(placementCollegeRules.collegeId, collegeId))
    .limit(1);

  return row ?? {
    collegeId,
    ...DEFAULT_RULES,
    version: 0,
    updatedAt: null,
  };
}

/**
 * Atomic optimistic update; a zero-version write creates the default
 * row if needed, then compares expectedVersion under the database lock.
 * Concurrent saves cannot silently overwrite settings changed by
 * another TPO admin.
 */
export async function saveCollegePlacementRules(
  context: RequestContext,
  raw: PlacementCollegeRulesPatch,
) {
  const input = placementCollegeRulesPatchSchema.parse(raw);
  const college = await requirePlacementManageScope(context, input.collegeId);

  return getDb().transaction(async (tx) => {
    if (input.expectedVersion === 0) {
      await tx
        .insert(placementCollegeRules)
        .values({ collegeId: input.collegeId })
        .onConflictDoNothing({
          target: placementCollegeRules.collegeId,
        });
    }

    const [rules] = await tx
      .update(placementCollegeRules)
      .set({
        countsAsPlacedAt: input.countsAsPlacedAt,
        maxHeldOffers: input.maxHeldOffers,
        upliftPct: input.upliftPct,
        minResponseHours: input.minResponseHours,
        version: sql`${placementCollegeRules.version} + 1`,
        updatedAt: new Date(),
      })
      .where(and(
        eq(placementCollegeRules.collegeId, input.collegeId),
        eq(placementCollegeRules.version, input.expectedVersion),
      ))
      .returning();

    if(rules) await tx.insert(activityEvents).values({
      organizationId:college.organizationId,collegeId:input.collegeId,
      actorUserId:context.user.id,actorMembershipId:context.membership?.id??null,
      module:"PLACEMENTS",eventType:"placements.tpo_college_rules.changed",
      subjectType:"COLLEGE_PLACEMENT_RULES",subjectId:input.collegeId,
      summary:"Placement cell changed college placement rules",
      metadata:{countsAsPlacedAt:input.countsAsPlacedAt,maxHeldOffers:input.maxHeldOffers,
        upliftPct:input.upliftPct,minResponseHours:input.minResponseHours},
    });
    return rules
      ? { ok: true as const, rules }
      : {
          ok: false as const,
          error: "PLACEMENT_COLLEGE_RULES_VERSION_CONFLICT",
        };
  });
}

export async function getCompanyVisibilitySettings(
  context: RequestContext,
  rawCollegeId: string,
) {
  const collegeId =
    placementPolicyCollegeIdSchema.parse(rawCollegeId);
  await requirePlacementManageScope(context, collegeId);
  const [row] = await getDb()
    .select()
    .from(placementCompanyVisibilitySettings)
    .where(eq(placementCompanyVisibilitySettings.collegeId, collegeId))
    .limit(1);

  return row ?? {
    collegeId,
    ...DEFAULT_VISIBILITY,
    version: 0,
    updatedAt: null,
  };
}

/**
 * Privacy flags are never accepted from a recruiter or an external
 * applicant-share caller; only TPO/college admins may update them.
 */
export async function saveCompanyVisibilitySettings(
  context: RequestContext,
  raw: PlacementCompanyVisibilityPatch,
) {
  const input = placementCompanyVisibilityPatchSchema.parse(raw);
  const college = await requirePlacementManageScope(context, input.collegeId);

  return getDb().transaction(async (tx) => {
    if (input.expectedVersion === 0) {
      await tx
        .insert(placementCompanyVisibilitySettings)
        .values({ collegeId: input.collegeId })
        .onConflictDoNothing({
          target: placementCompanyVisibilitySettings.collegeId,
        });
    }

    const [visibility] = await tx
      .update(placementCompanyVisibilitySettings)
      .set({
        showCgpaExact: input.showCgpaExact,
        showTenthTwelfth: input.showTenthTwelfth,
        showProjectLinks: input.showProjectLinks,
        showAssessmentScores: input.showAssessmentScores,
        showAttendance: input.showAttendance,
        version: sql`${placementCompanyVisibilitySettings.version} + 1`,
        updatedAt: new Date(),
      })
      .where(and(
        eq(
          placementCompanyVisibilitySettings.collegeId,
          input.collegeId,
        ),
        eq(
          placementCompanyVisibilitySettings.version,
          input.expectedVersion,
        ),
      ))
      .returning();

    if(visibility) await tx.insert(activityEvents).values({
      organizationId:college.organizationId,collegeId:input.collegeId,
      actorUserId:context.user.id,actorMembershipId:context.membership?.id??null,
      module:"PLACEMENTS",eventType:"placements.tpo_company_visibility.changed",
      subjectType:"COLLEGE_VISIBILITY_POLICY",subjectId:input.collegeId,
      summary:"Placement cell changed recruiter visibility settings",
      metadata:{showCgpaExact:input.showCgpaExact,showTenthTwelfth:input.showTenthTwelfth,
        showProjectLinks:input.showProjectLinks,showAssessmentScores:input.showAssessmentScores,
        showAttendance:input.showAttendance},
    });
    return visibility
      ? { ok: true as const, visibility }
      : {
          ok: false as const,
          error: "PLACEMENT_COMPANY_VISIBILITY_VERSION_CONFLICT",
        };
  });
}
