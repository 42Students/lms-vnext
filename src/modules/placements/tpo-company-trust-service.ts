import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { activityEvents, placementCompanyRelationships } from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { PlacementsServiceError } from "./errors";
import { requirePlacementManageScope } from "./scope";
import { isTpoCompanyTrustCurrent, tpoCompanyTrustChangeSchema } from "./tpo-company-trust-model";
import { getTpoCompanyDetailReadOnly } from "./tpo-company-detail-read-service";

export class TpoCompanyTrustConflict extends Error {
  constructor() {
    super("TPO_COMPANY_TRUST_STALE");
    this.name = "TpoCompanyTrustConflict";
  }
}

/**
 * Legacy PUT {trusted:boolean} maps to nextTrusted only after explicit confirmation and CAS.
 * A missing boolean must never silently reset a live trusted relationship.
 * College relationship trust, not a recruiter email-domain allowlist or
 * permission grant. Only a TPO can change the active relationship.
 * Immutable canonical activity is inserted in the same transaction.
 */
export async function updateConfirmedTpoCompanyTrust(
  context: RequestContext,
  rawInput: unknown,
) {
  const membership = context.membership;
  if (!membership || !hasMembershipRole(context, "TPO")) {
    throw new AuthorizationError("placements.manage");
  }
  const collegeId = membership.collegeId;
  if (!can(context, "placements.manage", { collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", { collegeId });
  const input = tpoCompanyTrustChangeSchema.parse(rawInput);
  const college = await requirePlacementManageScope(context, collegeId);
  const actorUserId = context.user.id;
  const actorMembershipId = membership.id;

  const change=await getDb().transaction(async (tx) => {
    const [relationship] = await tx.select({
      id: placementCompanyRelationships.id,
      companyId: placementCompanyRelationships.companyId,
      isTrusted: placementCompanyRelationships.isTrusted,
    }).from(placementCompanyRelationships).where(and(
      eq(placementCompanyRelationships.id, input.relationshipId),
      eq(placementCompanyRelationships.collegeId, collegeId),
      eq(placementCompanyRelationships.status, "ACTIVE"),
      isNull(placementCompanyRelationships.archivedAt),
    )).for("update").limit(1);

    if (!relationship) {
      throw new PlacementsServiceError("PLACEMENT_COMPANY_RELATIONSHIP_NOT_FOUND");
    }
    if (!isTpoCompanyTrustCurrent(
      relationship.isTrusted, input.expectedTrusted, input.nextTrusted,
    )) {
      throw new TpoCompanyTrustConflict();
    }

    const now = new Date();
    await tx.update(placementCompanyRelationships)
      .set({ isTrusted: input.nextTrusted, updatedAt: now })
      .where(and(
        eq(placementCompanyRelationships.id, relationship.id),
        eq(placementCompanyRelationships.collegeId, collegeId),
        eq(placementCompanyRelationships.isTrusted, input.expectedTrusted),
      ));

    await tx.insert(activityEvents).values({
      organizationId: college.organizationId,
      collegeId,
      actorUserId,
      actorMembershipId,
      module: "PLACEMENTS",
      eventType: "PLACEMENTS_COMPANY_TRUST_CHANGED",
      subjectType: "placement_company_relationship",
      subjectId: relationship.id,
      subjectLabel: "Company relationship",
      summary: input.nextTrusted ? "Company marked trusted" : "Company trust removed",
      metadata: {
        fromTrusted: relationship.isTrusted,
        toTrusted: input.nextTrusted,
        reason: input.reason,
      },
      occurredAt: now,
    });

    return {
      relationshipId: relationship.id,
      companyId: relationship.companyId,
      isTrusted: input.nextTrusted,
      changedAt: now.toISOString(),
    };
  });
  const detail=await getTpoCompanyDetailReadOnly(context,change.companyId)
    .catch(()=>null);
  return {
    relationshipId:change.relationshipId,
    isTrusted:change.isTrusted,
    changedAt:change.changedAt,
    refreshed:detail?{
      company:detail.company,
      relationship:detail.relationship,
      hiringPulse:detail.hiringPulse,
    }:null,
  };
}

/** Trust alone is insufficient to publish directly. Every grant, company
 * verification and college opt-in must be persisted and rechecked in the
 * actual recruiter publish transaction. */
export function canTrustedRecruiterAutoPublish(input:{
 trusted:boolean;recruiterHasCurrentGrant:boolean;
 collegeAllowsDirectPublishing:boolean;verifiedCompany:boolean;
}):boolean{
 return input.trusted&&input.recruiterHasCurrentGrant&&
  input.collegeAllowsDirectPublishing&&input.verifiedCompany;
}


export function legacyCompanyTrustBooleanLabel(value:boolean|null|undefined){return value===true?"Trusted":"Not trusted";}
