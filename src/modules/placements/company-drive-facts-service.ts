import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  placementApplications,
  placementCompanyRelationships,
  placementJobs,
  placementJoiningOutcomes,
  placementOffers,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePlacementManageScope } from "./scope";
import { deriveCompanyDriveFacts } from "./company-drive-facts-policy";

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

  return {
    collegeId,
    companyRelationshipId: relationship.id,
    relationshipExists: true,
    ...deriveCompanyDriveFacts(rows),
  };
}
