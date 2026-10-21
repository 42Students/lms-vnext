import "server-only";

import { and, asc, count, countDistinct, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  placementApplications,
  placementCompanies,
  placementCompanyRelationships,
  placementJobs,
  placementJoiningOutcomes,
  placementOffers,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { PlacementsServiceError } from "./errors";
import { requirePlacementManageScope } from "./scope";

/**
 * College-only relationship history; a shared canonical company ID is never
 * sufficient authorization to retrieve another college's recruiting history.
 * The bounded history lists at most 100 drives and marks truncated totals.
 */
export async function getCollegeCompanyHistory(
  context: RequestContext,
  rawRelationshipId: string,
) {
  const relationshipId = z.string().uuid().parse(rawRelationshipId);
  const db = getDb();
  const [relationship] = await db
    .select({
      id: placementCompanyRelationships.id,
      collegeId: placementCompanyRelationships.collegeId,
      companyName: placementCompanies.name,
      relationshipStatus: placementCompanyRelationships.status,
      internalNotes: placementCompanyRelationships.internalNotes,
      contactName: placementCompanyRelationships.contactPersonName,
      contactEmail: placementCompanyRelationships.contactEmail,
      contactPhone: placementCompanyRelationships.contactPhone,
    })
    .from(placementCompanyRelationships)
    .innerJoin(
      placementCompanies,
      eq(placementCompanies.id, placementCompanyRelationships.companyId),
    )
    .where(eq(placementCompanyRelationships.id, relationshipId))
    .limit(1);

  if (!relationship) {
    throw new PlacementsServiceError("PLACEMENT_COMPANY_RELATIONSHIP_NOT_FOUND");
  }
  await requirePlacementManageScope(context, relationship.collegeId);

  const rows = await db
    .select({
      id: placementJobs.id,
      title: placementJobs.title,
      status: placementJobs.status,
      publishedAt: placementJobs.publishedAt,
    })
    .from(placementJobs)
    .where(
      and(
        eq(placementJobs.companyRelationshipId, relationship.id),
        eq(placementJobs.collegeId, relationship.collegeId),
      ),
    )
    .orderBy(asc(placementJobs.title), asc(placementJobs.id))
    .limit(101);

  const jobs = rows.slice(0, 100);
  const jobIds = jobs.map((job) => job.id);
  const [applications, joined] = await Promise.all([
    jobIds.length
      ? db
          .select({
            jobId: placementApplications.jobId,
            total: count(),
          })
          .from(placementApplications)
          .innerJoin(
            collegeMemberships,
            and(
              eq(collegeMemberships.id, placementApplications.membershipId),
              eq(collegeMemberships.collegeId, relationship.collegeId),
            ),
          )
          .where(inArray(placementApplications.jobId, jobIds))
          .groupBy(placementApplications.jobId)
      : Promise.resolve([]),
    jobIds.length
      ? db
          .select({
            jobId: placementApplications.jobId,
            total: countDistinct(placementApplications.membershipId),
          })
          .from(placementApplications)
          .innerJoin(
            collegeMemberships,
            and(
              eq(collegeMemberships.id, placementApplications.membershipId),
              eq(collegeMemberships.collegeId, relationship.collegeId),
            ),
          )
          .innerJoin(
            placementOffers,
            and(
              eq(placementOffers.applicationId, placementApplications.id),
              eq(placementOffers.status, "ACCEPTED"),
            ),
          )
          .innerJoin(
            placementJoiningOutcomes,
            and(
              eq(placementJoiningOutcomes.offerId, placementOffers.id),
              eq(placementJoiningOutcomes.status, "JOINED"),
            ),
          )
          .where(inArray(placementApplications.jobId, jobIds))
          .groupBy(placementApplications.jobId)
      : Promise.resolve([]),
  ]);

  const applicationCounts = new Map(applications.map((row) => [row.jobId, row.total]));
  const joiningCounts = new Map(joined.map((row) => [row.jobId, row.total]));
  const items = jobs.map((job) => ({
    ...job,
    applicants: applicationCounts.get(job.id) ?? 0,
    hired: joiningCounts.get(job.id) ?? 0,
  }));

  return {
    company: {
      name: relationship.companyName,
      relationshipStatus: relationship.relationshipStatus,
      contactName: relationship.contactName,
      contactEmail: relationship.contactEmail,
      contactPhone: relationship.contactPhone,
      // Internal college CRM notes must never be returned from public endpoints.
      internalNotes: relationship.internalNotes,
    },
    items,
    totals: {
      drives: items.length,
      applicants: items.reduce((sum, item) => sum + item.applicants, 0),
      hired: items.reduce((sum, item) => sum + item.hired, 0),
    },
    truncated: rows.length > 100,
  };
}

/** Only relationship-owned CRM details can be edited by a college placement admin.
 * Never change the shared canonical company's identity or show notes to learners. */
export const updateCollegeCompanyPrivateDetailsSchema = z.object({
  contactPersonName: z.string().trim().max(150).nullable(),
  contactEmail: z.string().trim().max(150)
    .email("Must be a valid email").nullable(),
  contactPhone: z.string().trim().max(30)
    .regex(/^[+()\d][\d\s().-]{6,29}$/, "Enter a valid phone number").nullable(),
  internalNotes: z.string().max(2000).nullable(),
}).strict();

export async function updateCollegeCompanyPrivateDetails(
  context: RequestContext,
  rawRelationshipId: string,
  rawInput: unknown,
) {
  const relationshipId = z.string().uuid().parse(rawRelationshipId);
  const input = updateCollegeCompanyPrivateDetailsSchema.parse(rawInput);
  const db = getDb();
  const [existing] = await db.select({
    collegeId: placementCompanyRelationships.collegeId,
    name: placementCompanies.name,
  }).from(placementCompanyRelationships)
    .innerJoin(placementCompanies,
      eq(placementCompanies.id, placementCompanyRelationships.companyId))
    .where(eq(placementCompanyRelationships.id, relationshipId)).limit(1);
  if (!existing) {
    throw new PlacementsServiceError("PLACEMENT_COMPANY_RELATIONSHIP_NOT_FOUND");
  }
  await requirePlacementManageScope(context, existing.collegeId);

  return db.transaction(async (tx) => {
    const [locked] = await tx.select({
      id: placementCompanyRelationships.id,
      status: placementCompanyRelationships.status,
    }).from(placementCompanyRelationships)
      .where(and(
        eq(placementCompanyRelationships.id, relationshipId),
        eq(placementCompanyRelationships.collegeId, existing.collegeId),
      )).for("update").limit(1);
    if (!locked || locked.status !== "ACTIVE") {
      throw new PlacementsServiceError("PLACEMENT_COMPANY_RELATIONSHIP_NOT_FOUND");
    }
    await tx.update(placementCompanyRelationships).set({
      ...input,
      updatedAt: new Date(),
    }).where(and(
      eq(placementCompanyRelationships.id, relationshipId),
      eq(placementCompanyRelationships.collegeId, existing.collegeId),
      eq(placementCompanyRelationships.status, "ACTIVE"),
    ));

    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.PLACEMENTS_COMPANY_LINKED,
      collegeId: existing.collegeId,
      subjectType: "placement_company_relationship",
      subjectId: relationshipId,
      subjectLabel: existing.name,
      summary: "College employer private contact details updated",
      // Store the action, never private contact values or notes in audit metadata.
      metadata: { action: "UPDATE_PRIVATE_CONTACT", relationshipId },
      groupKey: "placement-companies:" + existing.collegeId,
    });
    return { updated: true };
  });
}
