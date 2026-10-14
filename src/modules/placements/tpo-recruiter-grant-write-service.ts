import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  activityEvents, placementCompanies, placementCompanyRelationships,
  placementRecruiterCollegeGrants, placementRecruiterProfiles, users,
} from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "./scope";
import { tpoRecruiterGrantChangeSchema, isRecruiterGrantStale } from "./tpo-recruiter-grant-write-model";

export class TpoRecruiterGrantConflict extends Error {
  constructor() { super("TPO_RECRUITER_GRANT_STALE_OR_INVALID"); this.name = "TpoRecruiterGrantConflict"; }
}

export async function changeTpoRecruiterGrant(context: RequestContext, raw: unknown) {
  const member = context.membership;
  if (!member || !hasMembershipRole(context, "TPO") || context.user.platformStatus !== "ACTIVE") {
    throw new AuthorizationError("placements.manage");
  }
  const collegeId = member.collegeId;
  if (!can(context, "placements.manage", { collegeId })) throw new AuthorizationError("placements.manage");
  requirePermission(context, "placements.manage", { collegeId });
  const input = tpoRecruiterGrantChangeSchema.parse(raw);
  const college = await requirePlacementManageScope(context, collegeId);
  const actorUserId = context.user.id;
  const actorMembershipId = member.id;

  return getDb().transaction(async (tx) => {
    if (input.action === "GRANT") {
      const [relationship] = await tx.select({
        id: placementCompanyRelationships.id,
        companyId: placementCompanyRelationships.companyId,
        companyStatus: placementCompanies.status,
        relationshipStatus: placementCompanyRelationships.status,
      }).from(placementCompanyRelationships).innerJoin(placementCompanies,
        eq(placementCompanies.id, placementCompanyRelationships.companyId))
        .where(and(
          eq(placementCompanyRelationships.id, input.companyRelationshipId),
          eq(placementCompanyRelationships.collegeId, collegeId),
        )).limit(1);
      if (!relationship || relationship.companyStatus !== "ACTIVE" ||
          relationship.relationshipStatus !== "ACTIVE") throw new TpoRecruiterGrantConflict();
      const [recruiter] = await tx.select({ id: users.id, platformStatus: users.platformStatus })
        .from(users).where(eq(users.email, input.email)).limit(1);
      if (!recruiter || recruiter.platformStatus !== "ACTIVE") throw new TpoRecruiterGrantConflict();
      await tx.insert(placementRecruiterProfiles).values({
        userId: recruiter.id, companyId: relationship.companyId,
        title: input.title ?? null, createdByUserId: actorUserId,
      }).onConflictDoNothing();
      const [profile] = await tx.select().from(placementRecruiterProfiles)
        .where(eq(placementRecruiterProfiles.userId, recruiter.id)).for("update").limit(1);
      if (!profile || profile.companyId !== relationship.companyId ||
          profile.status !== "ACTIVE") throw new TpoRecruiterGrantConflict();
      const [existing] = await tx.select().from(placementRecruiterCollegeGrants)
        .where(and(
          eq(placementRecruiterCollegeGrants.recruiterUserId, recruiter.id),
          eq(placementRecruiterCollegeGrants.companyRelationshipId, relationship.id),
          eq(placementRecruiterCollegeGrants.status, "ACTIVE"),
        )).limit(1);
      if (existing) return { outcome: "already-active" as const, grantId: existing.id };
      const [grant] = await tx.insert(placementRecruiterCollegeGrants).values({
        recruiterUserId: recruiter.id, companyRelationshipId: relationship.id,
        grantedByUserId: actorUserId,
      }).returning();
      if (!grant) throw new TpoRecruiterGrantConflict();
      await tx.insert(activityEvents).values({
        organizationId: college.organizationId, collegeId, actorUserId, actorMembershipId,
        module: "PLACEMENTS", eventType: "PLACEMENTS_RECRUITER_ACCESS_GRANTED",
        subjectType: "placement_recruiter_college_grant", subjectId: grant.id,
        subjectLabel: "Recruiter access grant", summary: "TPO granted recruiter college access",
        metadata: { companyRelationshipId: relationship.id, recruiterUserId: recruiter.id },
      });
      return { outcome: "granted" as const, grantId: grant.id };
    }

    const [record] = await tx.select({
      grant: placementRecruiterCollegeGrants,
      collegeId: placementCompanyRelationships.collegeId,
    }).from(placementRecruiterCollegeGrants).innerJoin(placementCompanyRelationships,
      eq(placementCompanyRelationships.id, placementRecruiterCollegeGrants.companyRelationshipId))
      .where(and(
        eq(placementRecruiterCollegeGrants.id, input.grantId),
        eq(placementCompanyRelationships.collegeId, collegeId),
      )).for("update").limit(1);
    if (!record || record.collegeId !== collegeId) throw new TpoRecruiterGrantConflict();
    if (record.grant.status !== "ACTIVE" ||
      isRecruiterGrantStale(record.grant.updatedAt, input.expectedUpdatedAt)) {
      throw new TpoRecruiterGrantConflict();
    }
    const now = new Date();
    const [revoked] = await tx.update(placementRecruiterCollegeGrants).set({
      status: "REVOKED", revokedByUserId: actorUserId,
      revokedAt: now, updatedAt: now,
    }).where(and(eq(placementRecruiterCollegeGrants.id, input.grantId),
      eq(placementRecruiterCollegeGrants.status, "ACTIVE"))).returning();
    if (!revoked) throw new TpoRecruiterGrantConflict();
    await tx.insert(activityEvents).values({
      organizationId: college.organizationId, collegeId, actorUserId, actorMembershipId,
      module: "PLACEMENTS", eventType: "PLACEMENTS_RECRUITER_ACCESS_REVOKED",
      subjectType: "placement_recruiter_college_grant", subjectId: revoked.id,
      subjectLabel: "Recruiter access grant", summary: "TPO revoked recruiter college access",
      metadata: { companyRelationshipId: revoked.companyRelationshipId,
        recruiterUserId: revoked.recruiterUserId },
      occurredAt: now,
    });
    return { outcome: "revoked" as const, grantId: revoked.id };
  });
}
