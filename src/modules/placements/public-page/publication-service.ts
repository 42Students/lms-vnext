import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { activityEvents, placementPublicPageSettings } from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import { requirePlacementManageScope } from "@/modules/placements/scope";
import { publicPlacementTableReady } from "./readiness";
import { publicPlacementPublicationInput, publicPublicationDecision,
  publicPublicationTimestamp } from "./publication-policy";

export class PublicPlacementPublishError extends Error {
  constructor(readonly code: "NOT_CONFIGURED" | "SMALL_COHORT" | "NOT_REGISTERED") {
    super(code); this.name="PublicPlacementPublishError";
  }
}

/** T-S2-08. Owner-controlled, audited opt-in; public read still derives live aggregates. */
export async function setTpoPublicPlacementPublication(
  context: RequestContext, raw: unknown,
): Promise<{ enabled: boolean }> {
  const input = publicPlacementPublicationInput.parse(raw);
  const membership = context.membership;
  if (!membership || !hasMembershipRole(context, "TPO"))
    throw new AuthorizationError("placements.manage");
  const college = await requirePlacementManageScope(context, membership.collegeId);
  if (!await publicPlacementTableReady()) throw new PublicPlacementPublishError("NOT_REGISTERED");

  return getDb().transaction(async tx => {
    await assertPersistedPlatformPermission(tx, context, "placements.manage", {
      organizationId: college.organizationId, collegeId: college.id,
    });
    const [settings] = await tx.select().from(placementPublicPageSettings)
      .where(eq(placementPublicPageSettings.collegeId, college.id))
      .for("update").limit(1);
    const decision = publicPublicationDecision(input, settings ?? null);
    if (decision === "SMALL_COHORT" || decision === "NOT_CONFIGURED") {
      throw new PublicPlacementPublishError(decision);
    }
    if (!settings) return {enabled:false}; // no implicit publication or invented population
    if (settings.enabled === input.enabled && (!input.enabled || settings.publishedAt !== null)) {
      return {enabled:input.enabled};
    }
    const now = new Date();
    const [updated] = await tx.update(placementPublicPageSettings).set({
      enabled:input.enabled,
      publishedAt: publicPublicationTimestamp(input.enabled, now),
      updatedAt:now,
    }).where(and(eq(placementPublicPageSettings.collegeId,college.id),
      eq(placementPublicPageSettings.enabled,settings.enabled)))
      .returning({enabled:placementPublicPageSettings.enabled});
    if (!updated) throw new PublicPlacementPublishError("NOT_CONFIGURED");
    await tx.insert(activityEvents).values({
      organizationId:college.organizationId, collegeId:college.id,
      actorUserId:context.user.id, actorMembershipId:membership.id,
      module:"PLACEMENTS",eventType:"placements.public_stats.publication_changed",
      subjectType:"placement_public_page_settings",subjectId:college.id,
      summary:updated.enabled ? "Public placement statistics enabled" : "Public placement statistics disabled",
      metadata:{enabled:updated.enabled},
    });
    return {enabled:updated.enabled};
  });
}

/** TPO setting status. No raw learner rows, salaries or credentials are returned. */
export async function getTpoPublicPlacementPublication(context: RequestContext) {
  const membership=context.membership;
  if(!membership||!hasMembershipRole(context,"TPO"))
    throw new AuthorizationError("placements.manage");
  const college=await requirePlacementManageScope(context,membership.collegeId);
  if(!await publicPlacementTableReady()) return {ready:false as const};
  const [settings]=await getDb().select({
    enabled:placementPublicPageSettings.enabled,
    populationCount:placementPublicPageSettings.populationCount,
    publishedAt:placementPublicPageSettings.publishedAt,
  }).from(placementPublicPageSettings)
    .where(eq(placementPublicPageSettings.collegeId,college.id)).limit(1);
  return {ready:true as const,settings:settings??null};
}
