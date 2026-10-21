import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  placementApplications,
  placementCompanyRelationships,
  placementJobs,
  placementJoiningOutcomes,
  placementOffers,
} from "@/db/schema";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "./scope";
import { deriveCompanyDriveFacts } from "./company-drive-facts-policy";

/** One scoped aggregate for an entire visible page of company relationships.
 * Avoids joining every candidate/offer in memory, and preserves the old
 * "No drives yet" vs recorded-last-posting distinction. No name fuzzy joins. */
export async function getManagedCompanyDriveUsageBatch(context:RequestContext,
 collegeIdInput:unknown,relationshipIdsInput:unknown){
 const collegeId=z.string().uuid().parse(collegeIdInput);
 const relationshipIds=[...new Set(z.array(z.string().uuid()).max(200).parse(relationshipIdsInput))];
 await requirePlacementManageScope(context,collegeId);
 if(relationshipIds.length===0)return new Map<string,{driveCount:number;lastPostedAt:Date|null}>();
 const rows=await getDb().select({
  relationshipId:placementCompanyRelationships.id,
  driveCount:sql<number>`count(distinct ${placementJobs.id})::int`,
  lastPostedAt:sql<Date|null>`max(coalesce(${placementJobs.publishedAt},${placementJobs.legacyPostedAt},${placementJobs.createdAt}))`,
 }).from(placementCompanyRelationships)
 .leftJoin(placementJobs,and(
  eq(placementJobs.companyRelationshipId,placementCompanyRelationships.id),
  eq(placementJobs.collegeId,placementCompanyRelationships.collegeId),
 ))
 .where(and(eq(placementCompanyRelationships.collegeId,collegeId),
  inArray(placementCompanyRelationships.id,relationshipIds)))
 .groupBy(placementCompanyRelationships.id);
 return new Map(rows.map(row=>[row.relationshipId,{
  driveCount:row.driveCount,lastPostedAt:row.lastPostedAt,
 }]));
}

/**
 * W04 source of truth for W05 derived CRM Drive facts.
 *
 * relationshipId is a college-scoped company relationship ID, not the
 * global company ID and not a recruiter login ID. The caller can only query
 * a college they manage. No candidate names or salary values escape.
 *
 * Uses only existing journaled tables (placements P3/P5/P8/P8-joining).
 * No unregistered DB08/DB09 tables and no manually assigned CRM stage.
 */
export async function getManagedCompanyDriveFacts(
  context: RequestContext,
  collegeIdInput: unknown,
  relationshipIdInput: unknown,
) {
  const collegeId = z.string().uuid().parse(collegeIdInput);
  const relationshipId = z.string().uuid().parse(relationshipIdInput);
  await requirePlacementManageScope(context, collegeId);

  const db = getDb();
  const [relationship] = await db.select({
    id: placementCompanyRelationships.id,
    companyId: placementCompanyRelationships.companyId,
  }).from(placementCompanyRelationships).where(and(
    eq(placementCompanyRelationships.id, relationshipId),
    eq(placementCompanyRelationships.collegeId, collegeId),
  )).limit(1);
  if (!relationship) {
    // The absence response does not disclose another college's relationship.
    return {
      collegeId, companyRelationshipId: relationshipId, relationshipExists: false,
      ...deriveCompanyDriveFacts([]),
    };
  }

  const rows = await db.select({
    jobId: placementJobs.id,
    jobStatus: placementJobs.status,
    archivedAt: placementJobs.archivedAt,
    offerStatus: placementOffers.status,
    joiningStatus: placementJoiningOutcomes.status,
  }).from(placementJobs)
    .leftJoin(placementApplications,
      eq(placementApplications.jobId, placementJobs.id))
    .leftJoin(placementOffers,
      eq(placementOffers.applicationId, placementApplications.id))
    .leftJoin(placementJoiningOutcomes,
      eq(placementJoiningOutcomes.offerId, placementOffers.id))
    .where(and(
      eq(placementJobs.collegeId, collegeId),
      eq(placementJobs.companyRelationshipId, relationshipId),
    ));

  const usage=(await getManagedCompanyDriveUsageBatch(context,collegeId,[relationshipId])).get(relationshipId);
  return {
    collegeId,
    companyRelationshipId: relationship.id,
    relationshipExists: true,
    driveCount:usage?.driveCount??0,
    lastPostedAt:usage?.lastPostedAt??null,
    ...deriveCompanyDriveFacts(rows),
  };
}

/** vNext intentionally has no unlinked name-only jobs: the UUID company
 * relationship is mandatory. Fuzzy company-name fallback can cross a tenant
 * boundary and must never be used on a college-scoped report. Historical
 * legacy name-only drives need explicit import into scoped canonical identity.
 */
export const COMPANY_DRIVE_FACTS_LEGACY_FALLBACK_POLICY={
 nameOnlyMatch:false,
 reason:"Historical name-only drives require tenant-scoped identity import before reporting.",
} as const;

/** Organization-wide/global canonical company facts are visible only to a
 * Super Admin outside any acting-college or organization scope. Aggregate
 * SQL avoids reading individual applicant/offer rows into server memory. */
export async function getSuperAdminCompanyDriveFacts(
 context:RequestContext,companyIdInput:unknown,
){
 const companyId=z.string().uuid().parse(companyIdInput);
 if(!isSuperAdmin(context)||context.user.platformStatus!=="ACTIVE" ||
    context.adminScope?.collegeId || context.adminScope?.organizationId)
  throw new AuthorizationError("placements.manage");
 const eligible=sql`${placementJobs.archivedAt} is null
    and ${placementJobs.status} in ('PUBLISHED','CLOSED')`;
 const [totals]=await getDb().select({
  plannedDriveCount:sql<number>`count(distinct ${placementJobs.id})
   filter (where ${eligible})::int`,
  acceptedOfferDriveCount:sql<number>`count(distinct ${placementJobs.id})
   filter (where ${eligible} and ${placementOffers.status}='ACCEPTED')::int`,
  confirmedJoinedDriveCount:sql<number>`count(distinct ${placementJobs.id})
   filter (where ${eligible} and ${placementOffers.status}='ACCEPTED'
     and ${placementJoiningOutcomes.status}='JOINED')::int`,
 }).from(placementCompanyRelationships)
  .innerJoin(placementJobs,and(
   eq(placementJobs.companyRelationshipId,placementCompanyRelationships.id),
   eq(placementJobs.collegeId,placementCompanyRelationships.collegeId),
  ))
  .leftJoin(placementApplications,eq(placementApplications.jobId,placementJobs.id))
  .leftJoin(placementOffers,eq(placementOffers.applicationId,placementApplications.id))
  .leftJoin(placementJoiningOutcomes,eq(placementJoiningOutcomes.offerId,placementOffers.id))
  .where(eq(placementCompanyRelationships.companyId,companyId));
 const planned=totals?.plannedDriveCount??0;
 const accepted=totals?.acceptedOfferDriveCount??0;
 const joined=totals?.confirmedJoinedDriveCount??0;
 return {companyId,plannedDriveCount:planned,acceptedOfferDriveCount:accepted,
  confirmedJoinedDriveCount:joined,hasDrivePlanned:planned>0,
  hasAcceptedOffer:accepted>0,hasConfirmedJoin:joined>0};
}
