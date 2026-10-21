import "server-only";

import { and, eq, ilike, inArray, ne } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  placementCompanies, placementCompanyRelationships, placementJobs,
  placementRecruiterProfiles, placementRecruiterCollegeGrants,
  placementCompanyAliases, placementCompanyDomains, placementCompanyMergeHistory,
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

    // Do not silently discard private CRM notes or trust a global identity
    // merge with an unexpectedly shared company: preserve both histories in
    // this one college, and reject a combined note too large to persist.
    const sourceNotes = from.internalNotes?.trim();
    const combinedNotes = [to.internalNotes?.trim(),
      sourceNotes ? "[Merged from "+source.name+"]\n"+sourceNotes : null]
      .filter((value):value is string=>Boolean(value)).join("\n\n")||null;
    if (combinedNotes && combinedNotes.length > 2000)
      throw new Error("Combined private CRM notes exceed 2,000 characters. Review the notes before merging.");

    // Domain and alias child records are the canonical search and verification
    // facts. Moving only placement_companies.primaryDomain orphaned all other
    // domains from the active company; moving names without aliases made old
    // company searches disappear.
    // Stable lock order prevents overlapping company merges from deadlocking.
    const domains = await tx.select().from(placementCompanyDomains)
      .where(eq(placementCompanyDomains.companyId,source.id)).for("update");
    const aliases = await tx.select().from(placementCompanyAliases)
      .where(eq(placementCompanyAliases.companyId,source.id)).for("update");
    const [existingSourceNameAlias] = await tx.select({id:placementCompanyAliases.id,
      companyId:placementCompanyAliases.companyId}).from(placementCompanyAliases)
      .where(ilike(placementCompanyAliases.alias,source.name)).limit(1);
    if (existingSourceNameAlias && existingSourceNameAlias.companyId!==source.id &&
        existingSourceNameAlias.companyId!==target.id)
      throw new Error("The source company name is used as an alias by another company.");
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
      internalNotes: combinedNotes,
      contactPersonName: to.contactPersonName ?? from.contactPersonName,
      contactEmail: to.contactEmail ?? from.contactEmail,
      contactPhone: to.contactPhone ?? from.contactPhone,
    }).where(eq(placementCompanyRelationships.id, to.id));
    await tx.update(placementCompanyRelationships)
      .set({status:"ARCHIVED", archivedAt: now, updatedAt: now})
      .where(eq(placementCompanyRelationships.id, from.id));

    // Reassign all globally unique registered domains and alternate names
    // with their original verification and provenance, in one transaction.
    // The archived source identity remains linked in an immutable redirect.
    if (domains.length) await tx.update(placementCompanyDomains)
      .set({companyId:target.id})
      .where(eq(placementCompanyDomains.companyId,source.id));
    if (aliases.length) await tx.update(placementCompanyAliases)
      .set({companyId:target.id})
      .where(eq(placementCompanyAliases.companyId,source.id));
    const targetNameMatches=target.name.trim().toLocaleLowerCase("en-IN")===
      source.name.trim().toLocaleLowerCase("en-IN");
    if(!targetNameMatches&&!existingSourceNameAlias){
      await tx.insert(placementCompanyAliases).values({
        companyId:target.id,alias:source.name,addedByUserId:context.user.id,
      });
    }
    await tx.insert(placementCompanyMergeHistory).values({
      sourceCompanyId:source.id,targetCompanyId:target.id,
      reason:"Super Admin confirmed same-college company consolidation",
      mergedByUserId:context.user.id,
    });
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
        previousSourceDomain: source.primaryDomain, registeredDomainsMoved:domains.length,
        aliasesMoved:aliases.length, sourceNameRetainedAsAlias:!targetNameMatches,
        privateCrmNotesMerged:Boolean(sourceNotes), restrictedToActingCollege:true},
    });
    return {keepCompanyId: target.id, archivedCompanyId: source.id,
      jobsMoved: jobs.length, recruiterProfilesMoved: recruiters.length,
      duplicateGrantsRevoked: deduplicatedGrants,
      registeredDomainsMoved:domains.length,aliasesMoved:aliases.length};
  });
}
