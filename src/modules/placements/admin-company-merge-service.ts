import "server-only";

import { and, eq, inArray, ne } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  placementCompanies, placementCompanyRelationships, placementJobs,
  placementRecruiterProfiles, placementRecruiterCollegeGrants,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { isSuperAdmin } from "@/modules/identity/context";
import { resolveActingCollege } from "@/modules/permissions/acting-college";
import { AuthorizationError } from "@/modules/permissions/policy";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {companyMergeInputSchema,CompanyMergeError} from "./admin-company-merge-model";
export {companyMergeInputSchema,CompanyMergeError} from "./admin-company-merge-model";

/**
 * A merge is permitted only when the source employer identity is exclusive to
 * the acting college. An archived identity and relationship remain as audit
 * records; no cross-college recruiter grant or job may be silently moved.
 */
export async function mergeSuperAdminCompanies(context: RequestContext, raw: unknown) {
  if (!isSuperAdmin(context)) throw new AuthorizationError("placements.manage");
  const acting = await resolveActingCollege(context, "placements.manage");
  const input = companyMergeInputSchema.parse(raw);
  const db = getDb();
  return db.transaction(async tx => {
    // The cookie/session may outlive the persisted platform role. Revalidate
    // the actor *inside* the write transaction before locking companies.
    await assertPersistedPlatformPermission(tx, context, "placements.manage", {
      collegeId: acting.collegeId, organizationId: acting.organizationId,
    });
    const rows = await tx.select().from(placementCompanies)
      .where(inArray(placementCompanies.id, [input.keepCompanyId, input.mergeCompanyId]))
      .orderBy(placementCompanies.id).for("update");
    const target = rows.find(c => c.id === input.keepCompanyId);
    const source = rows.find(c => c.id === input.mergeCompanyId);
    if (!target || !source) throw new CompanyMergeError("COMPANY_NOT_FOUND");
    if (target.status !== "ACTIVE" || source.status !== "ACTIVE")
      throw new CompanyMergeError("MERGE_COMPANY_INACTIVE");

    const relationships = await tx.select().from(placementCompanyRelationships)
      .where(inArray(placementCompanyRelationships.companyId,
        [source.id, target.id]))
      .orderBy(placementCompanyRelationships.id).for("update");
    const sourceRelationships = relationships.filter(r => r.companyId === source.id);
    if (!sourceRelationships.length) throw new CompanyMergeError("MERGE_SOURCE_UNLINKED");
    if (sourceRelationships.some(r => r.collegeId !== acting.collegeId))
      throw new CompanyMergeError("MERGE_SOURCE_SHARED_OUTSIDE_COLLEGE");
    const from = sourceRelationships[0]!;
    const to = relationships.find(r => r.companyId === target.id && r.collegeId === acting.collegeId);
    if (!to) throw new CompanyMergeError("MERGE_TARGET_UNLINKED");

    const now = new Date();
    // Re-home jobs before archiving the source relationship, preserving
    // college-safe composite foreign-key references.
    const jobs = await tx.update(placementJobs)
      .set({companyRelationshipId: to.id, updatedAt: now})
      .where(and(eq(placementJobs.companyRelationshipId, from.id),
        eq(placementJobs.collegeId, acting.collegeId))).returning({id: placementJobs.id});

    const grants = await tx.select().from(placementRecruiterCollegeGrants)
      .where(inArray(placementRecruiterCollegeGrants.companyRelationshipId,
        [from.id, to.id])).for("update");
    const targetActive = new Set(grants.filter(g => g.companyRelationshipId === to.id &&
      g.status === "ACTIVE").map(g => g.recruiterUserId));
    let deduplicatedGrants = 0;
    for (const grant of grants.filter(g => g.companyRelationshipId === from.id && g.status === "ACTIVE" &&
      targetActive.has(g.recruiterUserId))) {
      await tx.update(placementRecruiterCollegeGrants).set({
        status: "REVOKED", revokedByUserId: context.user.id, revokedAt: now,
        revokeReason: "Company merged with existing recruiter grant", updatedAt: now,
      }).where(eq(placementRecruiterCollegeGrants.id, grant.id));
      deduplicatedGrants++;
    }
    // All source grants, including revoked history, now reference the canonical relationship.
    await tx.update(placementRecruiterCollegeGrants)
      .set({ companyRelationshipId: to.id, updatedAt: now })
      .where(eq(placementRecruiterCollegeGrants.companyRelationshipId, from.id));
    const recruiters = await tx.update(placementRecruiterProfiles)
      .set({companyId: target.id, updatedAt: now})
      .where(eq(placementRecruiterProfiles.companyId, source.id))
      .returning({userId: placementRecruiterProfiles.userId});

    await tx.update(placementCompanyRelationships).set({
      status: "ACTIVE", archivedAt: null, updatedAt: now,
      isTrusted: to.isTrusted || from.isTrusted,
      ownerMembershipId: to.ownerMembershipId ?? from.ownerMembershipId,
      shareColumnDefaults: to.shareColumnDefaults ?? from.shareColumnDefaults,
    }).where(eq(placementCompanyRelationships.id, to.id));
    await tx.update(placementCompanyRelationships)
      .set({status:"ARCHIVED", archivedAt: now, updatedAt: now})
      .where(eq(placementCompanyRelationships.id, from.id));

    const movedDomain = !target.primaryDomain && Boolean(source.primaryDomain);
    if (movedDomain) {
      await tx.update(placementCompanies)
        .set({ primaryDomain: null, updatedAt: now })
        .where(eq(placementCompanies.id, source.id));
    }
    await tx.update(placementCompanies).set({
      websiteUrl: target.websiteUrl ?? source.websiteUrl,
      logoObjectPath: target.logoObjectPath ?? source.logoObjectPath,
      ...(movedDomain ? {primaryDomain: source.primaryDomain} : {}),
      updatedAt: now,
    }).where(eq(placementCompanies.id, target.id));
    await tx.update(placementCompanies).set({
      status:"ARCHIVED", archivedAt: now, updatedAt: now,
    }).where(eq(placementCompanies.id, source.id));

    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.PLACEMENTS_COMPANY_LINKED,
      collegeId: acting.collegeId, organizationId: acting.organizationId,
      subjectType: "placement_company", subjectId: target.id,
      subjectLabel: target.name, summary: "Duplicate company merged into canonical employer",
      metadata: {keepCompanyId: target.id, mergeCompanyId: source.id,
        jobsMoved: jobs.length, recruiterProfilesMoved: recruiters.length, duplicateGrantsRevoked: deduplicatedGrants,
        previousSourceDomain: source.primaryDomain},
    });
    return {keepCompanyId: target.id, archivedCompanyId: source.id,
      jobsMoved: jobs.length, recruiterProfilesMoved: recruiters.length,
      duplicateGrantsRevoked: deduplicatedGrants};
  });
}
