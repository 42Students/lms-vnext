import "server-only";

import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  membershipRoles,
  placementApplications,
  placementApplicationStatusHistory,
  placementCompanies,
  placementCompanyRelationships,
  placementJobRoleOptions,
  placementJobRounds,
  placementJobs,
  placementJoiningOutcomes,
  placementOffers,
  placementOfferStatusHistory,
  placementRoundResults,
  placementSeasons,
  users,
} from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import {
  AuthorizationError,
  can,
  requirePermission,
} from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "./scope";
import {requireTpoBatchActor} from "./tpo-batch-workspace-read-service";
import {
  projectTpoStudentPlacementHistory,
  tpoStudentHistoryQuerySchema,
} from "./tpo-student-history-model";

/** Legacy bulk status transitions: bounded, sorted, and college-scoped. */
const transitionQuery=z.object({
 applicationIds:z.array(z.string().uuid()).min(1).max(200)
  .refine(ids=>new Set(ids).size===ids.length,"Duplicate application ID"),
 toStatus:z.enum(["SUBMITTED","WITHDRAWN","APPLIED","SHORTLISTED",
  "ASSESSMENT","INTERVIEW","OFFERED","HIRED","REJECTED","WAITLISTED"]).optional(),
}).strict();
export async function listTpoApplicationStatusTransitions(context:RequestContext,raw:unknown){
 if(!context.membership||!hasMembershipRole(context,"TPO"))
  throw new AuthorizationError("placements.manage");
 const collegeId=await requireTpoBatchActor(context);
 await requirePlacementManageScope(context,collegeId);
 const input=transitionQuery.parse(raw);
 const events=await getDb().select({
  id:placementApplicationStatusHistory.id,
  applicationId:placementApplicationStatusHistory.applicationId,
  fromStatus:placementApplicationStatusHistory.fromStatus,
  toStatus:placementApplicationStatusHistory.toStatus,
  createdAt:placementApplicationStatusHistory.createdAt,
 }).from(placementApplicationStatusHistory)
  .innerJoin(placementApplications,eq(placementApplications.id,placementApplicationStatusHistory.applicationId))
  .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
  .where(and(inArray(placementApplicationStatusHistory.applicationId,input.applicationIds),
   eq(placementJobs.collegeId,collegeId),
   input.toStatus?eq(placementApplicationStatusHistory.toStatus,input.toStatus):undefined))
  .orderBy(asc(placementApplicationStatusHistory.applicationId),
   asc(placementApplicationStatusHistory.createdAt),asc(placementApplicationStatusHistory.id))
  .limit(2001);
 return {items:events.slice(0,2000),hasMore:events.length>2000};
}

/**
 * All seasons, including archived drives. The requested membership must
 * belong to the TPO's active college and have a persisted LEARNER role.
 * No private profile fields, academic evidence, or internal offer comments
 * are returned. Every application source is joined back to the same college.
 */
export async function getTpoStudentPlacementHistory(
  context: RequestContext,
  rawQuery: unknown,
) {
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    throw new AuthorizationError("placements.manage");
  }
  const collegeId = context.membership.collegeId;
  if (!can(context, "placements.manage", { collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", { collegeId });
  const query = tpoStudentHistoryQuerySchema.parse(rawQuery);
  const college = await requirePlacementManageScope(context, collegeId);
  // Revocation after session issuance must take effect before opening any
  // learner application/offer history, even when the URL holds a valid UUID.
  const liveCollegeId=await requireTpoBatchActor(context);
  if(liveCollegeId!==college.id)throw new AuthorizationError("placements.manage");
  const db = getDb();

  const [learner] = await db.select({
    membershipId: collegeMemberships.id,
    displayName: users.displayName,
    membershipStatus: collegeMemberships.status,
  })
    .from(collegeMemberships)
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .innerJoin(membershipRoles, and(
      eq(membershipRoles.membershipId, collegeMemberships.id),
      eq(membershipRoles.role, "LEARNER"),
    ))
    .where(and(
      eq(collegeMemberships.id, query.membershipId),
      eq(collegeMemberships.collegeId, college.id),
    ))
    .limit(1);

  // Unknown membership and foreign-college membership are indistinguishable.
  if (!learner) return null;

  const scope = and(
    eq(placementApplications.membershipId, learner.membershipId),
    eq(placementJobs.collegeId, college.id),
  );
  const [countRow] = await db.select({ total: count() })
    .from(placementApplications)
    .innerJoin(placementJobs, eq(placementJobs.id, placementApplications.jobId))
    .where(scope);

  const applications = await db.select({
    id: placementApplications.id,
    jobId:placementJobs.id,
    eligibilitySnapshot:placementApplications.eligibilitySnapshot,
    jobTitle: placementJobs.title,
    companyName: placementCompanies.name,
    seasonName: placementSeasons.name,
    roleTitle: placementJobRoleOptions.title,
    applicationStatus: placementApplications.status,
    channel: placementApplications.channel,
    submittedAt: placementApplications.submittedAt,
  })
    .from(placementApplications)
    .innerJoin(placementJobs, eq(placementJobs.id, placementApplications.jobId))
    .innerJoin(placementJobRoleOptions, and(
      eq(placementJobRoleOptions.id, placementApplications.roleOptionId),
      eq(placementJobRoleOptions.jobId, placementJobs.id),
    ))
    .innerJoin(placementCompanyRelationships, and(
      eq(placementCompanyRelationships.id, placementJobs.companyRelationshipId),
      eq(placementCompanyRelationships.collegeId, college.id),
    ))
    .innerJoin(
      placementCompanies,
      eq(placementCompanies.id, placementCompanyRelationships.companyId),
    )
    .innerJoin(placementSeasons, and(
      eq(placementSeasons.id, placementJobs.seasonId),
      eq(placementSeasons.collegeId, college.id),
    ))
    .where(scope)
    .orderBy(desc(placementApplications.submittedAt), desc(placementApplications.id))
    .limit(25)
    .offset((query.page - 1) * 25);

  const applicationIds = applications.map((item) => item.id);
  const [offers, rounds, applicationEvents] = applicationIds.length === 0
    ? [[], [], []] as const
    : await Promise.all([
      db.select({
        id: placementOffers.id,
        applicationId: placementOffers.applicationId,
        status: placementOffers.status,
        roleTitle: placementOffers.roleTitle,
        annualCtcInr: placementOffers.annualCtcInr,
        issuedAt: placementOffers.issuedAt,
        joiningStatus: placementJoiningOutcomes.status,
      })
        .from(placementOffers)
        .innerJoin(
          placementApplications,
          eq(placementApplications.id, placementOffers.applicationId),
        )
        .innerJoin(placementJobs, eq(placementJobs.id, placementApplications.jobId))
        .leftJoin(
          placementJoiningOutcomes,
          eq(placementJoiningOutcomes.offerId, placementOffers.id),
        )
        .where(and(
          inArray(placementOffers.applicationId, applicationIds),
          eq(placementApplications.membershipId, learner.membershipId),
          eq(placementJobs.collegeId, college.id),
        )),
      db.select({
        id: placementRoundResults.id,
        applicationId: placementRoundResults.applicationId,
        name: placementJobRounds.name,
        outcome: placementRoundResults.outcome,
        appliedAt: placementRoundResults.appliedAt,
        status: placementRoundResults.status,
        version: placementRoundResults.version,
        submittedAt: placementRoundResults.submittedAt,
      })
        .from(placementRoundResults)
        .innerJoin(
          placementJobRounds,
          eq(placementJobRounds.id, placementRoundResults.roundId),
        )
        .innerJoin(placementApplications, and(
          eq(placementApplications.id, placementRoundResults.applicationId),
          eq(placementApplications.jobId, placementJobRounds.jobId),
        ))
        .innerJoin(placementJobs, eq(placementJobs.id, placementJobRounds.jobId))
        .where(and(
          inArray(placementRoundResults.applicationId, applicationIds),
          eq(placementApplications.membershipId, learner.membershipId),
          eq(placementJobs.collegeId, college.id),
        )),
      db.select({
        id: placementApplicationStatusHistory.id,
        applicationId: placementApplicationStatusHistory.applicationId,
        fromStatus: placementApplicationStatusHistory.fromStatus,
        toStatus: placementApplicationStatusHistory.toStatus,
        createdAt: placementApplicationStatusHistory.createdAt,
      })
        .from(placementApplicationStatusHistory)
        .innerJoin(placementApplications, eq(
          placementApplications.id, placementApplicationStatusHistory.applicationId,
        ))
        .innerJoin(placementJobs, eq(
          placementJobs.id, placementApplications.jobId,
        ))
        .where(and(
          inArray(placementApplicationStatusHistory.applicationId, applicationIds),
          eq(placementApplications.membershipId, learner.membershipId),
          eq(placementJobs.collegeId, college.id),
        ))
        .orderBy(asc(placementApplicationStatusHistory.applicationId),
          asc(placementApplicationStatusHistory.createdAt),
          asc(placementApplicationStatusHistory.id)),
    ]);

  const offerIds = offers.map((offer) => offer.id);
  const offerEvents = offerIds.length === 0 ? [] : await db.select({
    id: placementOfferStatusHistory.id,
    offerId: placementOfferStatusHistory.offerId,
    fromStatus: placementOfferStatusHistory.fromStatus,
    toStatus: placementOfferStatusHistory.toStatus,
    createdAt: placementOfferStatusHistory.createdAt,
  }).from(placementOfferStatusHistory)
    .innerJoin(placementOffers, eq(
      placementOffers.id, placementOfferStatusHistory.offerId,
    ))
    .innerJoin(placementApplications, eq(
      placementApplications.id, placementOffers.applicationId,
    ))
    .innerJoin(placementJobs, eq(placementJobs.id, placementApplications.jobId))
    .where(and(
      inArray(placementOfferStatusHistory.offerId, offerIds),
      eq(placementApplications.membershipId, learner.membershipId),
      eq(placementJobs.collegeId, college.id),
    ));

  const total = countRow?.total ?? 0;
  return {
    learner: {
      membershipId: learner.membershipId,
      displayName: learner.displayName?.trim() || "Unnamed learner",
      membershipStatus: learner.membershipStatus,
    },
    ...projectTpoStudentPlacementHistory(
      applications.map(application=>({
        ...application,
        addedByCollege:application.eligibilitySnapshot!==null&&
          typeof application.eligibilitySnapshot==="object"&&
          !Array.isArray(application.eligibilitySnapshot)&&
          "source" in application.eligibilitySnapshot&&
          application.eligibilitySnapshot.source==="TPO_BULK_ADD",
      })), offers, rounds, applicationEvents, offerEvents,
    ),
    total,
    page: query.page,
    totalPages: Math.max(1, Math.ceil(total / 25)),
  };
}
