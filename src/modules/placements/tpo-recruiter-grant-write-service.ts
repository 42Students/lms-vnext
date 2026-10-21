import { recruiterAccessMonthsOrDefault } from "@/modules/placements/recruiter-access-defaults";
import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { equalsIgnoreCase } from "@/lib/sql-match";
import { getDb } from "@/db/client";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {
  activityEvents, placementCompanies, placementCompanyRelationships,
  placementRecruiterCollegeGrants, placementRecruiterProfiles,
  placementTpoCollegeSettings, users,
} from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "./scope";
import { tpoRecruiterGrantChangeSchema, isRecruiterGrantStale } from "./tpo-recruiter-grant-write-model";
import { recruiterGrantValidUntil } from "./recruiter-grant-expiry-policy";

export class TpoRecruiterGrantConflict extends Error {
  constructor(readonly detail:"STALE_OR_INVALID"|"REVOKED"="STALE_OR_INVALID") {
    super(detail==="REVOKED"?"This recruiter's access was revoked; invite them again instead":
      "TPO_RECRUITER_GRANT_STALE_OR_INVALID");
    this.name = "TpoRecruiterGrantConflict";
  }
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
    // The TPO role may have been revoked since the request was authorized.
    // All grant, extension, revocation and already-active paths must use the
    // persisted account/role inside the same transaction as their writes.
    const persisted = await assertPersistedPlatformPermission(
      tx, context, "placements.manage", {
        collegeId, organizationId: college.organizationId,
      },
    );
    if (!hasMembershipRole(persisted, "TPO")) {
      throw new AuthorizationError("placements.manage");
    }
    if (input.action === "GRANT") {
      await tx.insert(placementTpoCollegeSettings)
        .values({collegeId})
        .onConflictDoNothing();
      const [duration] = await tx.select({
        months: placementTpoCollegeSettings.recruiterAccessMonths,
      }).from(placementTpoCollegeSettings)
        .where(eq(placementTpoCollegeSettings.collegeId, collegeId))
        .for("share").limit(1);
      const accessMonths = recruiterAccessMonthsOrDefault(duration?.months);
      if (accessMonths < 1 || accessMonths > 60) {
        throw new TpoRecruiterGrantConflict();
      }
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
        .from(users).where(equalsIgnoreCase(users.email, input.email)).limit(1);
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
      if (existing) {
        // An old ACTIVE row without an expiry or verification is NOT usable.
        const [valid] = await tx.select({
          ok: sql<boolean>`${placementRecruiterCollegeGrants.validUntil} > clock_timestamp()
            and ${placementRecruiterCollegeGrants.verificationStatus} = 'VERIFIED'
            and ${placementRecruiterCollegeGrants.capabilities} @> ARRAY['DRIVES']::text[]`,
        }).from(placementRecruiterCollegeGrants)
          .where(eq(placementRecruiterCollegeGrants.id, existing.id)).limit(1);
        if (!valid?.ok) throw new TpoRecruiterGrantConflict();
        return { outcome: "already-active" as const, grantId: existing.id };
      }
      const expiry = recruiterGrantValidUntil(new Date(), accessMonths);
      const [grant] = await tx.insert(placementRecruiterCollegeGrants).values({
        recruiterUserId: recruiter.id, companyRelationshipId: relationship.id,
        grantedByUserId: actorUserId, grantedByType:"TPO", validUntil: expiry,
        capabilities: ["DRIVES"], verificationStatus: "VERIFIED",
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
    if(record.grant.status==="REVOKED")throw new TpoRecruiterGrantConflict("REVOKED");
    if (record.grant.status !== "ACTIVE" ||
      isRecruiterGrantStale(record.grant.updatedAt, input.expectedUpdatedAt)) {
      throw new TpoRecruiterGrantConflict();
    }
    if(input.action==="EXTEND"){
      const now=new Date();
      const base=record.grant.validUntil&&record.grant.validUntil>now
        ?record.grant.validUntil:now;
      const validUntil=recruiterGrantValidUntil(base,input.months);
      // Advance the browser revision even for two changes in one millisecond.
      // Otherwise the same stale tab can extend a grant twice.
      // Compare truncated revisions because PostgreSQL stores microseconds,
      // while the browser and JS Date expose only milliseconds.
      const [extended]=await tx.update(placementRecruiterCollegeGrants).set({
        validUntil,updatedAt: sql`greatest(date_trunc('milliseconds',clock_timestamp()),date_trunc('milliseconds',${placementRecruiterCollegeGrants.updatedAt}) + interval '1 millisecond')`,
      }).where(and(eq(placementRecruiterCollegeGrants.id,input.grantId),
        eq(placementRecruiterCollegeGrants.status,"ACTIVE"),
        sql`date_trunc('milliseconds',${placementRecruiterCollegeGrants.updatedAt}) = ${record.grant.updatedAt.toISOString()}::timestamptz`)).returning();
      if(!extended)throw new TpoRecruiterGrantConflict();
      await tx.insert(activityEvents).values({
        organizationId:college.organizationId,collegeId,actorUserId,actorMembershipId,
        module:"PLACEMENTS",eventType:"PLACEMENTS_RECRUITER_ACCESS_EXTENDED",
        subjectType:"placement_recruiter_college_grant",subjectId:extended.id,
        subjectLabel:"Recruiter access grant",summary:"TPO extended recruiter access",
        metadata:{companyRelationshipId:extended.companyRelationshipId,
          recruiterUserId:extended.recruiterUserId,months:input.months,
          validUntil:validUntil.toISOString(),
          expiryLabel:"Until "+new Intl.DateTimeFormat("en-IN",{day:"2-digit",month:"short",year:"numeric",timeZone:"Asia/Kolkata"}).format(validUntil)},
      });
      return {outcome:"extended" as const,grantId:extended.id,validUntil:validUntil.toISOString(),
        expiryLabel:"Until "+new Intl.DateTimeFormat("en-IN",{day:"2-digit",month:"short",year:"numeric",timeZone:"Asia/Kolkata"}).format(validUntil)};
    }
    const now = new Date();
    const [revoked] = await tx.update(placementRecruiterCollegeGrants).set({
      status: "REVOKED", revokedByUserId: actorUserId, revokedByType:"TPO",
      revokeReason: input.reason?.trim() || null,
      revokedAt: now, updatedAt: sql`greatest(date_trunc('milliseconds',clock_timestamp()),date_trunc('milliseconds',${placementRecruiterCollegeGrants.updatedAt}) + interval '1 millisecond')`,
    }).where(and(eq(placementRecruiterCollegeGrants.id, input.grantId),
      eq(placementRecruiterCollegeGrants.status, "ACTIVE"))).returning();
    if (!revoked) throw new TpoRecruiterGrantConflict();
    await tx.insert(activityEvents).values({
      organizationId: college.organizationId, collegeId, actorUserId, actorMembershipId,
      module: "PLACEMENTS", eventType: "PLACEMENTS_RECRUITER_ACCESS_REVOKED",
      subjectType: "placement_recruiter_college_grant", subjectId: revoked.id,
      subjectLabel: "Recruiter access grant", summary: "TPO revoked recruiter college access",
      metadata: { companyRelationshipId: revoked.companyRelationshipId,
        recruiterUserId: revoked.recruiterUserId, actorRole:"TPO",
        ...(input.reason?.trim() ? {revokeReason:input.reason.trim()} : {}) },
      occurredAt: now,
    });
    return { outcome: "revoked" as const, grantId: revoked.id };
  });
}
