import { randomUUID } from "node:crypto";
import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  max,
  ne,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {hasAvailablePlacementOfferSeat,isPlacementIssuanceConcurrencyError} from "./offer-seat-capacity-policy";
import {placementWaitlistPromotions} from "@/db/schema/placement-waitlist-promotions";
import {placementDriveSelections} from "@/db/schema/placement-drive-selections";
import {placementRoundCandidateSlots} from "@/db/schema/placement-round-candidate-slots";
type PlacementDb = ReturnType<typeof getDb>;
type PlacementTx = Parameters<Parameters<PlacementDb["transaction"]>[0]>[0];
import { deliverInAppNotificationInTransaction } from "@/modules/activity/notification-service";
import {deliverRecordedLearnerPlacementEvent} from "./learner-placement-event-delivery";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  collegeMemberships,
  placementApplications,
  placementApplicationStatusHistory,
  placementApplicationScreenings,
  placementCompanies,
  placementCompanyRelationships,
  placementCollegeRules,
  placementDebarments,
  placementJoiningHistory,
  placementJoiningOutcomes,
  placementJobRounds,
  placementJobRoleOptions,
  placementJobs,
  placementSeasons,
  placementOffers,
  placementOfferStatusHistory,
  membershipRoles,
  placementRoundResults,
  users,
} from "@/db/schema";
import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import { AuthorizationError, can } from "@/modules/permissions/policy";
import { PlacementsServiceError } from "./errors";
import { isDebarmentActive } from "./batch-registration-policy";
import { parsePlacementCascadeId, isPlacementInternship, shouldKeepPlacementCascadeSibling } from "./placement-cascade-policy";
import { loadPlacementHeldOfferFacts } from "./held-offer-facts-service";
import {
  canReleaseAnotherHeldOffer,
  minimumOfferResponseDeadline,
  isPlacementOfferResponseExpired,
  placementOfferLockedDecisionTime,
  canReplayFinalOfferResponseAfterExpiry,
} from "./offer-college-rules-policy";
import { requireLearnerPlacementAccess } from "./learner-participation-guard";
import { requirePlacementManageScope } from "./scope";
import {
  issuePlacementOfferInputSchema,
  placementApplicationIdSchema,
  placementJoiningOutcomeInputSchema,
  placementOfferActionSchema,
  placementOfferIdSchema,
  placementJobIdSchema,
  type PlacementJoiningOutcomeInput,
  type PlacementOfferActionInput,
} from "./validation";

async function loadApplicationContext(
  applicationId: string,
) {
  const [row] = await getDb()
    .select({
      application: placementApplications,
      screening: placementApplicationScreenings,
      job: placementJobs,
    })
    .from(placementApplications)
    .innerJoin(
      placementApplicationScreenings,
      eq(
        placementApplicationScreenings.applicationId,
        placementApplications.id,
      ),
    )
    .innerJoin(
      placementJobs,
      eq(
        placementJobs.id,
        placementApplications.jobId,
      ),
    )
    .where(
      eq(
        placementApplications.id,
        applicationId,
      ),
    )
    .limit(1);

  if (!row) {
    throw new PlacementsServiceError(
      "PLACEMENT_APPLICATION_NOT_FOUND",
    );
  }

  return row;
}

async function loadOfferContext(
  offerId: string,
) {
  const [row] = await getDb()
    .select({
      offer: placementOffers,
      application: placementApplications,
      job: placementJobs,
    })
    .from(placementOffers)
    .innerJoin(
      placementApplications,
      eq(
        placementApplications.id,
        placementOffers.applicationId,
      ),
    )
    .innerJoin(
      placementJobs,
      eq(
        placementJobs.id,
        placementApplications.jobId,
      ),
    )
    .where(eq(placementOffers.id, offerId))
    .limit(1);

  if (!row) {
    throw new PlacementsServiceError(
      "PLACEMENT_OFFER_NOT_FOUND",
    );
  }

  return row;
}

function requireLearnerOfferOwner(
  context: RequestContext,
  membershipId: string,
) {
  if (
    !context.membership ||
    !hasMembershipRole(context, "LEARNER") ||
    context.membership.id !== membershipId
  ) {
    // A foreign offer and an absent offer must have the same public status
    // and error identifier. Do not expose whether the supplied UUID belongs
    // to another learner in this college or another tenant.
    throw new PlacementsServiceError("PLACEMENT_OFFER_NOT_FOUND");
  }
}

async function assertApplicationOfferReady(
  tx: PlacementTx,
  applicationId: string,
  jobId: string,
) {
  const rounds = await tx
    .select({
      id: placementJobRounds.id,
      status: placementJobRounds.status,
      sequence: placementJobRounds.sequence,
    })
    .from(placementJobRounds)
    .where(
      and(
        eq(placementJobRounds.jobId, jobId),
        ne(placementJobRounds.kind, "TALK"),
        ne(
          placementJobRounds.status,
          "CANCELLED",
        ),
      ),
    )
    .orderBy(asc(placementJobRounds.sequence));

  if (
    rounds.length === 0 ||
    rounds.some(
      (round) =>
        round.status !== "COMPLETED",
    )
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_OFFER_NOT_READY",
    );
  }

  const results = await tx
    .select({
      roundId: placementRoundResults.roundId,
      outcome: placementRoundResults.outcome,
      waitlistRank: placementRoundResults.waitlistRank,
    })
    .from(placementRoundResults)
    .where(
      and(
        eq(
          placementRoundResults.applicationId,
          applicationId,
        ),
        eq(
          placementRoundResults.status,
          "APPLIED",
        ),
        inArray(
          placementRoundResults.roundId,
          rounds.map((round) => round.id),
        ),
      ),
    );

  const passed = new Set(
    results
      .filter(
        (result) =>
          result.outcome === "PASS",
      )
      .map((result) => result.roundId),
  );

  const missing = rounds.filter(round=>!passed.has(round.id));
  if(missing.length===1){
    // TPO-drive-workspace-53: registered 0113 allows one audited promotion
    // of an applied HOLD, never FAIL/ABSENT or an unrecorded round.
    const [promotion]=await tx.select().from(placementWaitlistPromotions)
      .where(and(eq(placementWaitlistPromotions.applicationId,applicationId),
       eq(placementWaitlistPromotions.jobId,jobId))).limit(1);
    const waitlist=results.find(result=>result.roundId===missing[0]!.id&&
     result.outcome==="HOLD"&&result.waitlistRank===promotion?.waitlistRank);
    if(promotion&&promotion.roundId===missing[0]!.id&&waitlist&&
     ["PENDING","RELEASED"].includes(promotion.status))passed.add(promotion.roundId);
  }
  if(rounds.some(round=>!passed.has(round.id))){
    throw new PlacementsServiceError("PLACEMENT_OFFER_NOT_READY");
  }
}

function sameOfferPayload(
  offer: typeof placementOffers.$inferSelect,
  input: ReturnType<
    typeof issuePlacementOfferInputSchema.parse
  >,
) {
  return (
    offer.kind === (input.kind ?? "OFFER") &&
    offer.roleTitle === input.roleTitle &&
    offer.annualCtcInr ===
      (input.annualCtcInr ?? null) &&
    offer.joiningDate ===
      (input.joiningDate ?? null) &&
    // An omitted expiry uses the college minimum-response default on issue;
    // retries must not mismatch that generated timestamp.
    (input.expiresAt == null ||
      (offer.expiresAt?.getTime() ?? null) === input.expiresAt.getTime())
  );
}

/** A selected learner is not yet the recipient of an issued offer.
 * Staff see the verified pre-release record separately; the learner's Offers
 * page continues to read only issued placement_offers rows.
 */
export async function getPlacementOfferReleaseState(
 context:RequestContext,applicationIdInput:string,
){
 const applicationId=placementApplicationIdSchema.parse(applicationIdInput);
 const current=await loadApplicationContext(applicationId);
 await requirePlacementManageScope(context,current.job.collegeId);
 const [selection]=await getDb().select().from(placementDriveSelections)
  .where(and(eq(placementDriveSelections.applicationId,applicationId),
    eq(placementDriveSelections.jobId,current.job.id))).limit(1);
 const [latestOffer]=await getDb().select().from(placementOffers)
  .where(eq(placementOffers.applicationId,applicationId))
  .orderBy(desc(placementOffers.issuedAt),desc(placementOffers.id)).limit(1);
 const state=selection?.status??"NOT_SELECTED";
 // Legacy migration could record RELEASED on the application while the
 // separately persisted offer is missing or references another row. Never
 // infer a learner-visible offer from that coarse application status.
 const inconsistentLegacyRelease=state==="RELEASED"&&
  (!selection?.releasedOfferId||!latestOffer||
   selection.releasedOfferId!==latestOffer.id);
 const issued=latestOffer!==undefined;
 const activeOffer=latestOffer?.status==="ISSUED"||latestOffer?.status==="ACCEPTED";
 const eligibleApplication=current.application.status==="SUBMITTED"&&
   current.screening.status==="SHORTLISTED";
 const expiredLatest=latestOffer?.status==="EXPIRED"||
   (latestOffer?.status==="ISSUED"&&latestOffer.expiresAt!==null&&latestOffer.expiresAt.getTime()<=Date.now());
 const releaseBlockReason=inconsistentLegacyRelease
  ?"This legacy release has no matching persisted offer. Review and repair the offer record before taking another action."
  :!eligibleApplication
  ?"Only an active shortlisted application can receive an offer."
  :state==="NOT_SELECTED"?"Select this applicant before verifying or releasing an offer."
  :state==="SELECTED"?"Verify the selected applicant before releasing the offer."
  :state==="CANCELLED"?"This selection was cancelled; select the applicant again."
  :state==="RELEASED"?"This selection has already been released."
  :activeOffer?"An active issued or accepted offer already exists."
  :null;
 const letterState=latestOffer?.offerLetterObjectPath?"ATTACHED":
  latestOffer?.offerLetterUrl?"EXTERNAL_REFERENCE":"NOT_ATTACHED";
 return {
  applicationId,jobId:current.job.id,
  selectionId:selection?.id??null,selectionStatus:state,
  selectionRecordedAt:selection?.recordedAt.toISOString()??null,
  selectionVerifiedAt:selection?.verifiedAt?.toISOString()??null,
  releasedOfferId:selection?.releasedOfferId??null,
  latestOffer:latestOffer?{
   id:latestOffer.id,status:latestOffer.status,kind:latestOffer.kind,
   version:latestOffer.version,issuedAt:latestOffer.issuedAt.toISOString(),
   expiresAt:latestOffer.expiresAt?.toISOString()??null,
   annualCtcInr:latestOffer.annualCtcInr,
   fixedLpa:latestOffer.fixedLpa,variableLpa:latestOffer.variableLpa,
   joiningBonusLpa:latestOffer.joiningBonusLpa,
   createdByType:latestOffer.createdByType??"TPO",
   letterState,
  }:null,
  selectionRoleTitle:selection?.roleTitle??null,
  selectionAnnualCtcInr:selection?.annualCtcInr??null,
  releaseBlockReason,expiredLatest,inconsistentLegacyRelease,
  // SELECTED/VERIFIED never imply an applicant-visible issued offer.
  canVerifySelection:state==="SELECTED"&&eligibleApplication,
  canReleaseSelection:state==="VERIFIED"&&!activeOffer&&eligibleApplication,
  learnerOfferVisible:issued,
 };
}
/** Scoped latest-by-application query for authorized TPO/College Admin readers
 * and the learner who owns this persisted application. An unauthorized UUID
 * is indistinguishable from an unavailable application at this boundary.
 */
export async function getLatestPlacementOfferForApplication(
 context:RequestContext,applicationIdInput:string,
){
 const applicationId=placementApplicationIdSchema.parse(applicationIdInput);
 const current=await loadApplicationContext(applicationId);
 if(context.membership?.id===current.application.membershipId&&
    hasMembershipRole(context,"LEARNER")){
  await requireLearnerPlacementAccess(context);
 }else{
  await requirePlacementManageScope(context,current.job.collegeId);
 }
 const [offer]=await getDb().select().from(placementOffers)
  .where(eq(placementOffers.applicationId,applicationId))
  .orderBy(desc(placementOffers.issuedAt),desc(placementOffers.id)).limit(1);
 return offer??null;
}

/** Scoped, chronological offer history for one application, retaining
 * superseded, declined, withdrawn and expired versions beside the latest.
 * A learner may only inspect their own offers; staff require college scope.
 */
export async function listPlacementOfferHistoryForApplication(
 context:RequestContext,applicationIdInput:string,
){
 const applicationId=placementApplicationIdSchema.parse(applicationIdInput);
 const current=await loadApplicationContext(applicationId);
 if(context.membership?.id===current.application.membershipId&&
    hasMembershipRole(context,"LEARNER")){
  await requireLearnerPlacementAccess(context);
 }else{
  await requirePlacementManageScope(context,current.job.collegeId);
 }
 return getDb().select({
  offer:placementOffers,joining:placementJoiningOutcomes,
 }).from(placementOffers)
  .leftJoin(placementJoiningOutcomes,eq(placementJoiningOutcomes.offerId,placementOffers.id))
  .where(eq(placementOffers.applicationId,applicationId))
  .orderBy(desc(placementOffers.issuedAt),desc(placementOffers.id));
}

export async function issuePlacementOffer(
  context: RequestContext,
  applicationIdInput: string,
  rawInput: unknown,
) {
  const applicationId =
    placementApplicationIdSchema.parse(
      applicationIdInput,
    );
  const input =
    issuePlacementOfferInputSchema.parse(
      rawInput,
    );
  const current =
    await loadApplicationContext(applicationId);

  await requirePlacementManageScope(
    context,
    current.job.collegeId,
  );

  if (
    current.application.status !==
      "SUBMITTED" ||
    current.screening.status !==
      "SHORTLISTED"
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_OFFER_NOT_READY",
    );
  }

  const now = new Date();
  if (
    input.expiresAt &&
    input.expiresAt.getTime() <=
      now.getTime()
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_OFFER_EXPIRED",
    );
  }

  const db = getDb();
  return db.transaction(async (tx) => {
    // A cancellation locks this job first, then revokes pending offers.
    // Issuance must take the same lock order and only target open drives.
    const [liveJob] = await tx.select({
      status: placementJobs.status, archivedAt: placementJobs.archivedAt,
      openings: placementJobs.openings,
    }).from(placementJobs).where(eq(placementJobs.id, current.job.id))
      .for("update").limit(1);
    if (!liveJob || liveJob.status !== "PUBLISHED" ||
        liveJob.archivedAt !== null) {
      throw new PlacementsServiceError("PLACEMENT_OFFER_NOT_READY");
    }
    // An inconsistent PUBLISHED job must never issue a new offer after the
    // owning season is closed. The season read lock also serializes a
    // competing season-close transaction against this issuance.
    const [liveSeason]=await tx.select({
      status:placementSeasons.status,collegeId:placementSeasons.collegeId,
    }).from(placementSeasons)
      .where(eq(placementSeasons.id,current.job.seasonId))
      .for("share").limit(1);
    if(liveSeason?.status!=="ACTIVE"||
      liveSeason.collegeId!==current.job.collegeId)
      throw new PlacementsServiceError("PLACEMENT_OFFER_NOT_READY");
    // Per-learner serialization for cross-drive releases, in the same
    // membership-before-application order used by learner withdrawal.
    const [member] = await tx.select({
      id: collegeMemberships.id,
      collegeId: collegeMemberships.collegeId,
      userId: collegeMemberships.userId,
      status: collegeMemberships.status,
    }).from(collegeMemberships).where(
      eq(collegeMemberships.id, current.application.membershipId),
    ).for("update").limit(1);
    if (!member || member.collegeId !== current.job.collegeId) {
      throw new PlacementsServiceError("PLACEMENT_APPLICATION_NOT_FOUND");
    }
    // Screening can remain SHORTLISTED after an account is suspended.
    // No TPO may issue a new commitment to a deactivated membership/user.
    if(member.status!=="ACTIVE")throw new PlacementsServiceError("PLACEMENT_OFFER_NOT_READY");
    const [candidateAccount]=await tx.select({status:users.platformStatus})
      .from(users).where(eq(users.id,member.userId)).for("share").limit(1);
    if(candidateAccount?.status!=="ACTIVE")
      throw new PlacementsServiceError("PLACEMENT_OFFER_NOT_READY");
    const [lockedApplication] =
      await tx
        .select({
          status:
            placementApplications.status,
        })
        .from(placementApplications)
        .where(
          eq(
            placementApplications.id,
            current.application.id,
          ),
        )
        .for("update")
        .limit(1);

    if (
      !lockedApplication ||
      lockedApplication.status !==
        "SUBMITTED"
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_OFFER_NOT_READY",
      );
    }

    // Candidate screening and applied round results can change while a manager
    // is issuing an offer. Re-evaluate under this transaction, not from a
    // pre-transaction snapshot, and abort a conflicting serializable write.
    const [lockedScreening] = await tx
      .select({ status: placementApplicationScreenings.status })
      .from(placementApplicationScreenings)
      .where(eq(placementApplicationScreenings.applicationId, current.application.id))
      .for("update")
      .limit(1);
    if (!lockedScreening || lockedScreening.status !== "SHORTLISTED") {
      throw new PlacementsServiceError("PLACEMENT_OFFER_NOT_READY");
    }
    await assertApplicationOfferReady(tx, current.application.id, current.job.id);

    const [active] = await tx
      .select()
      .from(placementOffers)
      .where(
        and(
          eq(
            placementOffers.applicationId,
            current.application.id,
          ),
          inArray(
            placementOffers.status,
            ["ISSUED", "ACCEPTED"],
          ),
        ),
      )
      .limit(1);

    if (active) {
      if (
        active.status === "ISSUED" &&
        sameOfferPayload(active, input)
      ) {
        return active;
      }
      throw new PlacementsServiceError(
        "PLACEMENT_OFFER_ACTIVE_EXISTS",
      );
    }

    // This is the same job row mutex used by cancellation and waitlist seat
    // reservation. Check the official OFFER seat ceiling under that lock:
    // otherwise two ready applicants in different membership rows can both
    // issue the final opening. LOIs do not take up an official offer seat.
    if((input.kind??"OFFER")==="OFFER"){
      const [occupied]=await tx.select({total:count()}).from(placementOffers)
        .innerJoin(placementApplications,
          eq(placementApplications.id,placementOffers.applicationId))
        .where(and(
          eq(placementApplications.jobId,current.job.id),
          eq(placementOffers.kind,"OFFER"),
          inArray(placementOffers.status,["ISSUED","ACCEPTED"]),
        ));
      const [reserved]=await tx.select({total:count()}).from(placementWaitlistPromotions)
        .where(and(
          eq(placementWaitlistPromotions.jobId,current.job.id),
          eq(placementWaitlistPromotions.status,"PENDING"),
          ne(placementWaitlistPromotions.applicationId,current.application.id),
        ));
      if(!hasAvailablePlacementOfferSeat({
        openings:liveJob.openings,
        activeOfferCount:occupied?.total??0,
        otherPendingReservations:reserved?.total??0,
      }))throw new PlacementsServiceError("PLACEMENT_OFFER_NOT_READY");
    }

    // P-S1-02: active debarments deny new offer release. Resolve this
    // after the application lock so a concurrently lifted ban is observed.
    const debarments = await tx.select().from(placementDebarments)
      .where(and(
        eq(placementDebarments.collegeId, current.job.collegeId),
        eq(placementDebarments.membershipId, current.application.membershipId),
      ))
      .for("share");
    const localDateParts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(now);
    const datePart = (type: string) =>
      localDateParts.find((part) => part.type === type)?.value ?? "";
    const collegeToday = `${datePart("year")}-${datePart("month")}-${datePart("day")}`;
    if (debarments.some((ban) => isDebarmentActive(ban, collegeToday))) {
      throw new PlacementsServiceError("PLACEMENT_OFFER_NOT_READY");
    }

    // P-S1-01/P-S1-05/P-S2-06: use persisted college settings instead of
    // the default client value. Current schema has no dream-drive marker;
    // the distinct exemption requires a staged, approved schema addition.
    const [rules] = await tx.select().from(placementCollegeRules)
      .where(eq(placementCollegeRules.collegeId, current.job.collegeId))
      .for("share").limit(1);
    const earliestResponse = minimumOfferResponseDeadline(
      now, rules?.minResponseHours ?? 48,
    );
    if (input.expiresAt && input.expiresAt < earliestResponse) {
      throw new PlacementsServiceError("PLACEMENT_OFFER_NOT_READY");
    }
    const effectiveExpiresAt = input.expiresAt ?? earliestResponse;
    if ((input.kind ?? "OFFER") === "OFFER") {
      const heldOffers = await loadPlacementHeldOfferFacts(
        current.job.collegeId, current.application.membershipId, tx,
      );
      if (!canReleaseAnotherHeldOffer({
        maxHeldOffers: rules?.maxHeldOffers ?? 1,
        upliftPct: rules?.upliftPct ?? 40,
        heldOffers,
        annualCtcInr: input.annualCtcInr ?? null,
        isDreamDrive: current.job.isDream,
      })) {
        throw new PlacementsServiceError("PLACEMENT_OFFER_NOT_READY");
      }
    }

    const [aggregate] = await tx
      .select({
        maxVersion: max(
          placementOffers.version,
        ),
      })
      .from(placementOffers)
      .where(
        eq(
          placementOffers.applicationId,
          current.application.id,
        ),
      );

    const [offer] = await tx
      .insert(placementOffers)
      .values({
        applicationId:
          current.application.id,
        version:
          Number(
            aggregate?.maxVersion ?? 0,
          ) + 1,
        kind: input.kind ?? "OFFER",
        roleTitle: input.roleTitle,
        annualCtcInr:
          input.annualCtcInr ?? null,
        joiningDate:
          input.joiningDate ?? null,
        expiresAt: effectiveExpiresAt,
        issuedByUserId:
          context.user.id,
        issuedAt: now,
      })
      .returning();
    if (!offer) throw new PlacementsServiceError("PLACEMENT_OFFER_INVALID_TRANSITION");

    await tx
      .insert(
        placementOfferStatusHistory,
      )
      .values({
        offerId: offer.id,
        fromStatus: null,
        toStatus: "ISSUED",
        actorUserId: context.user.id,
      });

    const [recipient] = await tx
      .select({
        userId: collegeMemberships.userId,
      })
      .from(collegeMemberships)
      .where(
        and(
          eq(
            collegeMemberships.id,
            current.application.membershipId,
          ),
          eq(
            collegeMemberships.collegeId,
            current.job.collegeId,
          ),
        ),
      )
      .limit(1);

    if (!recipient) {
      throw new PlacementsServiceError(
        "PLACEMENT_APPLICATION_NOT_FOUND",
      );
    }

    const event =
      await recordActivityEventInTransaction(
        tx,
        context,
        {
          eventType:
            ACTIVITY_EVENT_TYPES.PLACEMENTS_OFFER_ISSUED,
          collegeId: current.job.collegeId,
          subjectType: "placement_offer",
          subjectId: offer.id,
          subjectLabel: input.roleTitle,
          summary:
            `${input.kind === "LOI" ? "Letter of intent" : "Offer"} issued for ${current.job.title}`,
          metadata: {
            kind: input.kind ?? "OFFER",
            jobId: current.job.id,
            applicationId:
              current.application.id,
            membershipId:
              current.application.membershipId,
            roleTitle: input.roleTitle,
            version: offer.version,
          },
          groupKey:
            `placement-job:${current.job.id}:offers`,
          dedupeKey:
            `placement-offer:${offer.id}:issued`,
        },
      );

    await deliverInAppNotificationInTransaction(
      tx,
      event.id,
      [recipient.userId],
      {
        title: input.kind === "LOI" ? "Letter of intent received" : "Placement offer received",
        body:
          `You received a ${input.roleTitle} ${input.kind === "LOI" ? "letter of intent" : "offer"} for ${current.job.title}. Review and respond to it.`,
        actionHref: "/learn/my-placements/offers?status=pending",
      },
    );

    return offer;
  }, { isolationLevel: "serializable" }).catch(error=>{
    if(isPlacementIssuanceConcurrencyError(error))
      throw new PlacementsServiceError("PLACEMENT_JOB_PREVIEW_STALE");
    throw error;
  });
}

/** Notify only active college TPOs after a committed ACCEPT/DECLINE.
 * The event and bell are atomic, and no foreign-college membership receives
 * a learner's offer information. */
async function notifyCollegeTpoOfOfferResponse(
 tx:PlacementTx,collegeId:string,jobId:string,jobTitle:string,eventId:string,
 response:"ACCEPTED"|"DECLINED",
){
 const officers=await tx.select({userId:collegeMemberships.userId})
  .from(collegeMemberships)
  .innerJoin(membershipRoles,and(
   eq(membershipRoles.membershipId,collegeMemberships.id),
   eq(membershipRoles.role,"TPO"),
  ))
  .innerJoin(users,and(
   eq(users.id,collegeMemberships.userId),
   eq(users.platformStatus,"ACTIVE"),
  ))
  .where(and(
   eq(collegeMemberships.collegeId,collegeId),
   eq(collegeMemberships.status,"ACTIVE"),
  ));
 const recipients=[...new Set(officers.map(row=>row.userId))];
 if(!recipients.length)return;
 await deliverInAppNotificationInTransaction(tx,eventId,recipients,{
  title:response==="ACCEPTED"?"Placement offer accepted":"Placement offer declined",
  body:"A learner "+(response==="ACCEPTED"?"accepted":"declined")+
   " an offer for "+jobTitle+". Review the offer register.",
  actionHref:"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/offers",
 });
}

/** A response may invalidate future booked interview slots for the SAME
 * application. Only INTERVIEW rounds and future BOOKED rows are touched.
 * Clear the booking's applicationId alongside CANCELLED to preserve the
 * database booking-status constraint. The event and participant bells commit
 * atomically, so no notification is visible on a rolled-back cancellation.
 */
async function cancelFutureOfferInterviews(tx:PlacementTx,context:RequestContext,
 collegeId:string,jobId:string,applicationId:string,offerId:string,
 action:"DECLINED"|"WITHDRAWN",lockedNow:Date,
){
 const bookings=await tx.select({id:placementRoundCandidateSlots.id,
   startsAt:placementRoundCandidateSlots.startsAt,
   room:placementRoundCandidateSlots.room,
 }).from(placementRoundCandidateSlots)
  .innerJoin(placementJobRounds,and(
   eq(placementJobRounds.id,placementRoundCandidateSlots.roundId),
   eq(placementJobRounds.jobId,placementRoundCandidateSlots.jobId),
   eq(placementJobRounds.kind,"INTERVIEW")))
  .where(and(
   eq(placementRoundCandidateSlots.applicationId,applicationId),
   eq(placementRoundCandidateSlots.jobId,jobId),
   eq(placementRoundCandidateSlots.status,"BOOKED"),
   sql`${placementRoundCandidateSlots.startsAt} > ${lockedNow}`,
  )).for("update",{of:placementRoundCandidateSlots});
 if(!bookings.length)return 0;
 const ids=bookings.map(row=>row.id);
 const released=await tx.update(placementRoundCandidateSlots).set({
  status:"CANCELLED",applicationId:null,legacyInterviewStatus:"CANCELLED",
  learnerConfirmedAt:null,confirmedAt:null,updatedAt:lockedNow,
  changedByUserId:context.user.id,
  version:sql`${placementRoundCandidateSlots.version} + 1`,
 }).where(and(
  inArray(placementRoundCandidateSlots.id,ids),
  eq(placementRoundCandidateSlots.jobId,jobId),
  eq(placementRoundCandidateSlots.status,"BOOKED"),
 )).returning({id:placementRoundCandidateSlots.id});
 if(released.length!==ids.length)
  throw new PlacementsServiceError("PLACEMENT_OFFER_INVALID_TRANSITION");
 const event=await recordActivityEventInTransaction(tx,context,{
  eventType:ACTIVITY_EVENT_TYPES.PLACEMENTS_OFFER_RESPONDED,
  collegeId,subjectType:"placement_offer",subjectId:offerId,
  summary:released.length+" future interview booking(s) cancelled after offer "+action.toLowerCase(),
  metadata:{jobId,applicationId,action,slotIds:ids,source:"OFFER_RESPONSE",
   correlationId:"placement-offer:"+offerId+":"+action.toLowerCase()+":interviews-cancelled"},
  groupKey:"placement-job:"+jobId+":interviews",
  dedupeKey:"placement-offer:"+offerId+":"+action.toLowerCase()+":interviews-cancelled",
 });
 const collegeRecipients=await tx.select({userId:collegeMemberships.userId})
  .from(collegeMemberships)
  .innerJoin(membershipRoles,and(
   eq(membershipRoles.membershipId,collegeMemberships.id),
   eq(membershipRoles.role,"TPO")))
  .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
  .where(and(eq(collegeMemberships.collegeId,collegeId),
   eq(collegeMemberships.status,"ACTIVE")));
 const recipients=[...new Set(collegeRecipients.map(row=>row.userId))];
 if(recipients.length)await deliverInAppNotificationInTransaction(tx,event.id,recipients,{
  title:"Interview booking cancelled",
  body:released.length+" future interview booking(s) were cancelled after an offer was "+action.toLowerCase()+
   ". Review the drive schedule and inform panel participants if necessary.",
  actionHref:"/tpo/placements/jobs/"+encodeURIComponent(jobId),
 });
 return released.length;
}

export async function actOnPlacementOffer(
  context: RequestContext,
  offerIdInput: string,
  rawInput: PlacementOfferActionInput,
  now: Date = new Date(),
  expectedStatus?: "ISSUED" | "ACCEPTED",
) {
  const offerId =
    placementOfferIdSchema.parse(
      offerIdInput,
    );
  const input =
    placementOfferActionSchema.parse(
      rawInput,
    );
  const current =
    await loadOfferContext(offerId);
  // Explicit/injected clocks must be finite. Invalid time is never a way
  // to bypass the expiration guard.
  if(!Number.isFinite(now.getTime()))throw new PlacementsServiceError("PLACEMENT_OFFER_EXPIRED");

  if (
    input.action === "ACCEPT" ||
    input.action === "DECLINE"
  ) {
    requireLearnerOfferOwner(
      context,
      current.application.membershipId,
    );
    // Self acceptance/decline is not a back door around paid module or the
    // learner/class/batch placement decision. TPO withdrawal is separate.
    await requireLearnerPlacementAccess(context);
    if (!context.membership || !can(context, "placements.read", {
      collegeId: current.job.collegeId,
      organizationId: context.membership.organizationId,
    })) throw new AuthorizationError("placements.read");
  } else {
    await requirePlacementManageScope(
      context,
      current.job.collegeId,
    );
  }

  // The transactional guard below is authoritative. Reading the offer
  // before a competing response commits must not deny an exact no-op retry.

  const db = getDb();
  return db.transaction(async (tx) => {
    if (input.action === "ACCEPT" || input.action === "DECLINE") {
      // Validate current persisted identity under locks before changing an offer.
      const [member] = await tx.select({
        userId: collegeMemberships.userId, collegeId: collegeMemberships.collegeId,
        status: collegeMemberships.status,
      }).from(collegeMemberships).where(eq(collegeMemberships.id, context.membership!.id))
        // Serialize competing acceptances for the same learner.
        .for("update").limit(1);
      const [account] = await tx.select({ status: users.platformStatus })
        .from(users).where(eq(users.id, context.user.id)).for("share").limit(1);
      if (!member || member.userId !== context.user.id ||
          member.collegeId !== current.job.collegeId ||
          member.status !== "ACTIVE" || !account || account.status !== "ACTIVE") {
        throw new AuthorizationError("placements.read");
      }
    }
    const [offer] = await tx
      .select()
      .from(placementOffers)
      .where(
        eq(placementOffers.id, offerId),
      )
      .for("update")
      .limit(1);

    if (!offer) {
      throw new PlacementsServiceError(
        "PLACEMENT_OFFER_NOT_FOUND",
      );
    }
    // A caller can wait on this offer row lock past its response deadline.
    // The function-entry instant must not let an already expired offer
    // transition after a competing transaction releases the lock.
    const lockedNow=placementOfferLockedDecisionTime(now,new Date());

    // Guard selected status beneath the same offer row lock as the transition.
    if (expectedStatus && offer.status !== expectedStatus) {
      throw new PlacementsServiceError("PLACEMENT_OFFER_INVALID_TRANSITION");
    }

    if (
      input.action !== "WITHDRAW" &&
      isPlacementOfferResponseExpired(offer.expiresAt, lockedNow) &&
      !canReplayFinalOfferResponseAfterExpiry({
        action: input.action, status: offer.status,
        respondedByUserId: offer.respondedByUserId, actorUserId: context.user.id,
      })
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_OFFER_EXPIRED",
      );
    }

    if (input.action === "ACCEPT") {
      if (offer.status === "ACCEPTED") {
        // A retried response returns the same durable cascade identifier.
        const [acceptedHistory] = await tx.select({
          reason: placementOfferStatusHistory.reason,
        }).from(placementOfferStatusHistory).where(and(
          eq(placementOfferStatusHistory.offerId, offer.id),
          eq(placementOfferStatusHistory.toStatus, "ACCEPTED"),
        )).orderBy(desc(placementOfferStatusHistory.createdAt)).limit(1);
        return { ...offer, cascadeId: parsePlacementCascadeId(acceptedHistory?.reason) };
      }
      if (offer.status !== "ISSUED") {
        throw new PlacementsServiceError(
          "PLACEMENT_OFFER_INVALID_TRANSITION",
        );
      }

      const [updated] = await tx
        .update(placementOffers)
        .set({
          status: "ACCEPTED",
          respondedByUserId:
            context.user.id,
          respondedAt: lockedNow,
          updatedAt: lockedNow,
        })
        .where(
          and(
            eq(
              placementOffers.id,
              offer.id,
            ),
            eq(
              placementOffers.status,
              "ISSUED",
            ),
          ),
        )
        .returning();

      if (!updated) {
        throw new PlacementsServiceError(
          "PLACEMENT_OFFER_INVALID_TRANSITION",
        );
      }

      const cascadeId = randomUUID();
      await tx
        .insert(
          placementOfferStatusHistory,
        )
        .values({
          offerId: offer.id,
          fromStatus: "ISSUED",
          toStatus: "ACCEPTED",
          actorUserId:
            context.user.id,
          reason: `cascade:${cascadeId}`,
          cascadeId,
        });

      await tx
        .insert(
          placementJoiningOutcomes,
        )
        .values({
          offerId: offer.id,
        })
        .onConflictDoNothing();

      // LEARNER-placements-R03: keep live siblings whenever the accepted
      // offer is an internship, or college policy still permits this drive.
      const [acceptedRole] = await tx.select({
        employmentType: placementJobRoleOptions.employmentType,
      }).from(placementJobRoleOptions)
        .where(eq(placementJobRoleOptions.id,current.application.roleOptionId)).limit(1);
      const [collegeRules] = await tx.select({
        maxHeldOffers: placementCollegeRules.maxHeldOffers,
        upliftPct: placementCollegeRules.upliftPct,
      }).from(placementCollegeRules)
        .where(eq(placementCollegeRules.collegeId,current.job.collegeId))
        .for("share").limit(1);
      const acceptedCountsAsPlaced = offer.kind === "OFFER" &&
        !isPlacementInternship(acceptedRole?.employmentType) &&
        !isPlacementInternship(current.job.employmentType);
      const wouldKeep = (candidate: {
        roleEmploymentType: string; jobEmploymentType: string;
        isDream: boolean; annualCtcInr: number | null;
      }) => shouldKeepPlacementCascadeSibling({
        acceptedCountsAsPlaced,
        siblingIsInternship: isPlacementInternship(candidate.roleEmploymentType) ||
          isPlacementInternship(candidate.jobEmploymentType),
        siblingIsDream: candidate.isDream,
        siblingAnnualCtcInr: candidate.annualCtcInr,
        acceptedAnnualCtcInr: offer.annualCtcInr,
        maxHeldOffers: collegeRules?.maxHeldOffers ?? 1,
        upliftPct: collegeRules?.upliftPct ?? 40,
      });
      const otherOffers = await tx.select({
        id: placementOffers.id, status: placementOffers.status,
        kind: placementOffers.kind, annualCtcInr: placementOffers.annualCtcInr,
        roleEmploymentType: placementJobRoleOptions.employmentType,
        jobEmploymentType: placementJobs.employmentType,
        isDream: placementJobs.isDream,
      }).from(placementOffers)
        .innerJoin(placementApplications,
          eq(placementApplications.id,placementOffers.applicationId))
        .innerJoin(placementJobRoleOptions,
          eq(placementJobRoleOptions.id,placementApplications.roleOptionId))
        .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
        .where(and(
          eq(placementApplications.membershipId,current.application.membershipId),
          eq(placementJobs.collegeId,current.job.collegeId),
          ne(placementOffers.id,offer.id),
          inArray(placementOffers.status,["ISSUED","ACCEPTED"]),
        // Acquire sibling offer row locks in UUID order across tabs/workers.
        )).orderBy(asc(placementOffers.id)).for("update");
      if(otherOffers.some(candidate=>candidate.status==="ACCEPTED")){
        throw new PlacementsServiceError("PLACEMENT_OFFER_ACTIVE_EXISTS");
      }
      const declinedOffers = otherOffers.filter(candidate=>
        candidate.status==="ISSUED" && candidate.kind==="OFFER" &&
        !wouldKeep(candidate));
      for(const other of declinedOffers){
        const [declined]=await tx.update(placementOffers).set({
          status:"DECLINED",respondedByUserId:context.user.id,
          respondedAt:lockedNow,updatedAt:lockedNow,
        }).where(and(
          eq(placementOffers.id,other.id),
          eq(placementOffers.status,"ISSUED"),
        )).returning({id:placementOffers.id});
        if(!declined)throw new PlacementsServiceError("PLACEMENT_OFFER_INVALID_TRANSITION");
        await tx.insert(placementOfferStatusHistory).values({
          offerId:declined.id,fromStatus:"ISSUED",toStatus:"DECLINED",
          actorUserId:context.user.id,
          reason:"placed elsewhere; cascade:"+cascadeId,cascadeId,
        });
      }

      const siblingApplications=await tx.select({
        id:placementApplications.id,
        annualCtcInr:placementJobRoleOptions.minimumAnnualCtcInr,
        jobAnnualCtcInr:placementJobs.minimumAnnualCtcInr,
        roleEmploymentType:placementJobRoleOptions.employmentType,
        jobEmploymentType:placementJobs.employmentType,
        isDream:placementJobs.isDream,
      }).from(placementApplications)
        .innerJoin(placementJobRoleOptions,
          eq(placementJobRoleOptions.id,placementApplications.roleOptionId))
        .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
        .where(and(
          eq(placementApplications.membershipId,current.application.membershipId),
          eq(placementJobs.collegeId,current.job.collegeId),
          ne(placementApplications.id,current.application.id),
          eq(placementApplications.status,"SUBMITTED"),
        // The following bulk withdrawal must use the same stable lock order.
        )).orderBy(asc(placementApplications.id)).for("update");
      const withdrawIds=siblingApplications.filter(candidate=>!wouldKeep({
        ...candidate,annualCtcInr:candidate.annualCtcInr??candidate.jobAnnualCtcInr,
      })).map(candidate=>candidate.id);
      const withdrawn=withdrawIds.length>0
        ? await tx.update(placementApplications).set({
          status:"WITHDRAWN",withdrawnAt:lockedNow,updatedAt:lockedNow,
        }).where(and(
          inArray(placementApplications.id,withdrawIds),
          eq(placementApplications.status,"SUBMITTED"),
        )).returning({id:placementApplications.id}) : [];
      if(withdrawn.length>0){
        await tx.insert(placementApplicationStatusHistory).values(
          withdrawn.map(candidate=>({
            applicationId:candidate.id,fromStatus:"SUBMITTED" as const,
            toStatus:"WITHDRAWN" as const,actorUserId:context.user.id,
            reason:"placed elsewhere; cascade:"+cascadeId,cascadeId,
          })),
        );
      }

      const acceptedNoticeEvent=await recordActivityEventInTransaction(
        tx,
        context,
        {
          eventType:
            ACTIVITY_EVENT_TYPES.PLACEMENTS_OFFER_RESPONDED,
          collegeId: current.job.collegeId,
          subjectType: "placement_offer",
          subjectId: updated.id,
          subjectLabel: updated.roleTitle,
          summary:
            `Offer accepted for ${current.job.title}`,
          metadata: {
            jobId: current.job.id,
            applicationId:
              current.application.id,
            response: "ACCEPTED",
            correlationId: "placement-offer:"+updated.id+":accepted",
            cascadeId,
            cascadedOfferCount: declinedOffers.length,
            withdrawnApplicationCount: withdrawn.length,
          },
          groupKey:
            `placement-job:${current.job.id}:offers`,
          dedupeKey:
            `placement-offer:${updated.id}:accepted`,
        },
      );
      await deliverRecordedLearnerPlacementEvent(tx,{
        eventId:acceptedNoticeEvent.id,collegeId:current.job.collegeId,
        membershipId:current.application.membershipId,
        kind:"APPLICATION_STATUS_CHANGED",subject:"Offer accepted for "+current.job.title,
      });
      await notifyCollegeTpoOfOfferResponse(tx,current.job.collegeId,
        current.job.id,current.job.title,acceptedNoticeEvent.id,"ACCEPTED");

      return { ...updated, cascadeId };
    }

    if (input.action === "DECLINE") {
      if (offer.status === "DECLINED") {
        return offer;
      }
      if (offer.status !== "ISSUED") {
        throw new PlacementsServiceError(
          "PLACEMENT_OFFER_INVALID_TRANSITION",
        );
      }

      const [updated] = await tx
        .update(placementOffers)
        .set({
          status: "DECLINED",
          respondedByUserId:
            context.user.id,
          respondedAt: lockedNow,
          updatedAt: lockedNow,
        })
        .where(
          and(
            eq(
              placementOffers.id,
              offer.id,
            ),
            eq(
              placementOffers.status,
              "ISSUED",
            ),
          ),
        )
        .returning();

      if (!updated) {
        throw new PlacementsServiceError(
          "PLACEMENT_OFFER_INVALID_TRANSITION",
        );
      }

      await tx
        .insert(
          placementOfferStatusHistory,
        )
        .values({
          offerId: offer.id,
          fromStatus: "ISSUED",
          toStatus: "DECLINED",
          actorUserId:
            context.user.id,
          reason:
            input.reason ?? null,
        });

      await cancelFutureOfferInterviews(tx,context,current.job.collegeId,
       current.job.id,current.application.id,offer.id,"DECLINED",lockedNow);

      const declinedNoticeEvent=await recordActivityEventInTransaction(
        tx,
        context,
        {
          eventType:
            ACTIVITY_EVENT_TYPES.PLACEMENTS_OFFER_RESPONDED,
          collegeId: current.job.collegeId,
          subjectType: "placement_offer",
          subjectId: updated.id,
          subjectLabel: updated.roleTitle,
          summary:
            `Offer declined for ${current.job.title}`,
          metadata: {
            jobId: current.job.id,
            applicationId:
              current.application.id,
            response: "DECLINED",
            correlationId: "placement-offer:"+updated.id+":declined",
          },
          groupKey:
            `placement-job:${current.job.id}:offers`,
          dedupeKey:
            `placement-offer:${updated.id}:declined`,
        },
      );
      await deliverRecordedLearnerPlacementEvent(tx,{
        eventId:declinedNoticeEvent.id,collegeId:current.job.collegeId,
        membershipId:current.application.membershipId,
        kind:"APPLICATION_STATUS_CHANGED",subject:"Offer declined for "+current.job.title,
      });
      await notifyCollegeTpoOfOfferResponse(tx,current.job.collegeId,
        current.job.id,current.job.title,declinedNoticeEvent.id,"DECLINED");

      return updated;
    }

    if (offer.status === "WITHDRAWN") {
      return offer;
    }
    if (
      offer.status !== "ISSUED" &&
      offer.status !== "ACCEPTED"
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_OFFER_INVALID_TRANSITION",
      );
    }

    if (offer.status === "ACCEPTED") {
      const [joining] = await tx
        .select()
        .from(placementJoiningOutcomes)
        .where(
          eq(
            placementJoiningOutcomes.offerId,
            offer.id,
          ),
        )
        .for("update")
        .limit(1);

      if (
        joining &&
        joining.status !== "PENDING"
      ) {
        throw new PlacementsServiceError(
          "PLACEMENT_OFFER_INVALID_TRANSITION",
        );
      }
    }

    const [updated] = await tx
      .update(placementOffers)
      .set({
        status: "WITHDRAWN",
        withdrawnByUserId:
          context.user.id,
        withdrawnAt: lockedNow,
        updatedAt: lockedNow,
      })
      .where(
        eq(
          placementOffers.id,
          offer.id,
        ),
      )
      .returning();
    if (!updated) throw new PlacementsServiceError("PLACEMENT_OFFER_INVALID_TRANSITION");

    await tx
      .insert(
        placementOfferStatusHistory,
      )
      .values({
        offerId: offer.id,
        fromStatus: offer.status,
        toStatus: "WITHDRAWN",
        actorUserId:
          context.user.id,
        reason: input.reason,
      });

    await cancelFutureOfferInterviews(tx,context,current.job.collegeId,
     current.job.id,current.application.id,offer.id,"WITHDRAWN",lockedNow);

    const withdrawalEvent=await recordActivityEventInTransaction(
      tx,
      context,
      {
        eventType:
          ACTIVITY_EVENT_TYPES.PLACEMENTS_OFFER_RESPONDED,
        collegeId: current.job.collegeId,
        subjectType: "placement_offer",
        subjectId: updated.id,
        subjectLabel: updated.roleTitle,
        summary:
          `Offer withdrawn for ${current.job.title}`,
        metadata: {
          jobId: current.job.id,
          applicationId:
            current.application.id,
          response: "WITHDRAWN",
          correlationId: "placement-offer:"+updated.id+":withdrawn",
        },
        groupKey:
          `placement-job:${current.job.id}:offers`,
        dedupeKey:
          `placement-offer:${updated.id}:withdrawn`,
      },
    );
    const [recipient]=await tx.select({userId:collegeMemberships.userId})
      .from(collegeMemberships).where(and(
        eq(collegeMemberships.id,current.application.membershipId),
        eq(collegeMemberships.collegeId,current.job.collegeId),
        eq(collegeMemberships.status,"ACTIVE"),
      )).limit(1);
    if(recipient)await deliverInAppNotificationInTransaction(tx,withdrawalEvent.id,
      [recipient.userId],{
        title:"Placement offer withdrawn",
        body:"Your placement team withdrew the offer for "+current.job.title+
          ". Review the updated offer status before taking further action.",
        actionHref:"/learn/my-placements/offers?status=withdrawn",
      });

    return updated;
  });
}

/**
 * LEARNER-placements-R02: advisory, learner-owned impact read.
 * Matches the current college-policy-aware ACCEPT cascade (Dream/uplift/\n * internship exemptions included). The POST rechecks under locks.
 */
export async function previewOwnOfferAcceptanceImpact(
 context:RequestContext,rawOfferId:unknown,
){
 const offerId=placementOfferIdSchema.parse(rawOfferId);
 const membership=await requireLearnerPlacementAccess(context);
 const current=await loadOfferContext(offerId);
 requireLearnerOfferOwner(context,current.application.membershipId);
 if(current.job.collegeId!==membership.collegeId ||
    !can(context,"placements.read",{collegeId:membership.collegeId,
      organizationId:membership.organizationId}))
   throw new AuthorizationError("placements.read");
 const [[acceptedRole],[collegeRules],otherOffers,applications]=await Promise.all([
  getDb().select({employmentType:placementJobRoleOptions.employmentType})
   .from(placementJobRoleOptions)
   .where(eq(placementJobRoleOptions.id,current.application.roleOptionId)).limit(1),
  getDb().select({maxHeldOffers:placementCollegeRules.maxHeldOffers,
   upliftPct:placementCollegeRules.upliftPct})
   .from(placementCollegeRules)
   .where(eq(placementCollegeRules.collegeId,membership.collegeId)).limit(1),
  getDb().select({
   id:placementOffers.id,status:placementOffers.status,kind:placementOffers.kind,
   title:placementJobs.title,annualCtcInr:placementOffers.annualCtcInr,
   roleEmploymentType:placementJobRoleOptions.employmentType,
   jobEmploymentType:placementJobs.employmentType,isDream:placementJobs.isDream,
  }).from(placementOffers)
   .innerJoin(placementApplications,eq(placementApplications.id,placementOffers.applicationId))
   .innerJoin(placementJobRoleOptions,eq(placementJobRoleOptions.id,placementApplications.roleOptionId))
   .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
   .where(and(eq(placementApplications.membershipId,membership.id),
    eq(placementJobs.collegeId,membership.collegeId),
    ne(placementOffers.id,offerId),
    inArray(placementOffers.status,["ISSUED","ACCEPTED"]))),
  getDb().select({
   id:placementApplications.id,title:placementJobs.title,
   status:placementApplications.status,
   annualCtcInr:placementJobRoleOptions.minimumAnnualCtcInr,
   jobAnnualCtcInr:placementJobs.minimumAnnualCtcInr,
   roleEmploymentType:placementJobRoleOptions.employmentType,
   jobEmploymentType:placementJobs.employmentType,
   isDream:placementJobs.isDream,
  }).from(placementApplications)
   .innerJoin(placementJobRoleOptions,eq(placementJobRoleOptions.id,placementApplications.roleOptionId))
   .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
   .where(and(eq(placementApplications.membershipId,membership.id),
    eq(placementJobs.collegeId,membership.collegeId))),
 ]);
 const acceptedCountsAsPlaced=current.offer.kind==="OFFER" &&
  !isPlacementInternship(acceptedRole?.employmentType) &&
  !isPlacementInternship(current.job.employmentType);
 const wouldKeep=(candidate:{
  roleEmploymentType:string;jobEmploymentType:string;
  isDream:boolean;annualCtcInr:number|null;
 }):boolean=>shouldKeepPlacementCascadeSibling({
  acceptedCountsAsPlaced,
  siblingIsInternship:isPlacementInternship(candidate.roleEmploymentType) ||
   isPlacementInternship(candidate.jobEmploymentType),
  siblingIsDream:candidate.isDream,
  siblingAnnualCtcInr:candidate.annualCtcInr,
  acceptedAnnualCtcInr:current.offer.annualCtcInr,
  maxHeldOffers:collegeRules?.maxHeldOffers??1,
  upliftPct:collegeRules?.upliftPct??40,
 });
 const withdrawn=applications.filter(candidate=>
  candidate.id!==current.application.id&&candidate.status==="SUBMITTED" &&
  !wouldKeep({...candidate,annualCtcInr:candidate.annualCtcInr??candidate.jobAnnualCtcInr}));
 const stayed=applications.filter(candidate=>
  candidate.id===current.application.id || candidate.status!=="SUBMITTED" ||
  wouldKeep({...candidate,annualCtcInr:candidate.annualCtcInr??candidate.jobAnnualCtcInr}));
 const declined=otherOffers.filter(candidate=>
  candidate.status==="ISSUED" && candidate.kind==="OFFER" && !wouldKeep(candidate));
 const blockedByAnotherAcceptedOffer=otherOffers.some(row=>row.status==="ACCEPTED");
 const expired=isPlacementOfferResponseExpired(current.offer.expiresAt,new Date());
 const blockingReasons:string[]=[];
 if(current.offer.status!=="ISSUED")
  blockingReasons.push("This offer is not awaiting a response.");
 if(expired)blockingReasons.push("The offer response deadline has passed.");
 if(blockedByAnotherAcceptedOffer)
  blockingReasons.push("Another accepted offer must be reviewed by the placement cell.");
 return {
  offerId,offerStatus:current.offer.status,expiresAt:current.offer.expiresAt?.toISOString()??null,
  blockedByAnotherAcceptedOffer,
  canAccept:current.offer.status==="ISSUED"&&!expired&&!blockedByAnotherAcceptedOffer,
  blockingReasons,
  withdrawn:withdrawn.map(row=>({id:row.id,title:row.title})),
  declined:declined.map(row=>({id:row.id,title:row.title})),
  stayed:stayed.map(row=>({id:row.id,title:row.title})),
  previewOnly:true,
 };
}

export async function recordPlacementJoiningOutcome(
  context: RequestContext,
  offerIdInput: string,
  rawInput: PlacementJoiningOutcomeInput,
) {
  const offerId =
    placementOfferIdSchema.parse(
      offerIdInput,
    );
  const input =
    placementJoiningOutcomeInputSchema.parse(
      rawInput,
    );
  const current =
    await loadOfferContext(offerId);

  await requirePlacementManageScope(
    context,
    current.job.collegeId,
  );

  if (current.offer.status !== "ACCEPTED") {
    throw new PlacementsServiceError(
      "PLACEMENT_JOINING_NOT_READY",
    );
  }

  const db = getDb();
  return db.transaction(async (tx) => {
    const [lockedOffer] = await tx
      .select({
        status: placementOffers.status,
      })
      .from(placementOffers)
      .where(
        eq(
          placementOffers.id,
          offerId,
        ),
      )
      .for("update")
      .limit(1);

    if (
      !lockedOffer ||
      lockedOffer.status !== "ACCEPTED"
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_JOINING_NOT_READY",
      );
    }

    await tx
      .insert(placementJoiningOutcomes)
      .values({ offerId })
      .onConflictDoNothing();

    const [joining] = await tx
      .select()
      .from(placementJoiningOutcomes)
      .where(
        eq(
          placementJoiningOutcomes.offerId,
          offerId,
        ),
      )
      .for("update")
      .limit(1);

    if (!joining) {
      throw new PlacementsServiceError(
        "PLACEMENT_JOINING_NOT_READY",
      );
    }

    const nextJoiningDate =
      input.joiningDate ?? null;
    const nextReason =
      input.reason ?? null;

    if (
      joining.status === input.status &&
      joining.joiningDate ===
        nextJoiningDate &&
      joining.reason === nextReason
    ) {
      return joining;
    }

    if (
      joining.status !== "PENDING" &&
      !input.correctionReason
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_JOINING_CORRECTION_REASON_REQUIRED",
      );
    }

    const now = new Date();
    const [updated] = await tx
      .update(placementJoiningOutcomes)
      .set({
        status: input.status,
        joiningDate:
          nextJoiningDate,
        reason: nextReason,
        recordedByUserId:
          context.user.id,
        recordedAt: now,
        updatedAt: now,
      })
      .where(
        eq(
          placementJoiningOutcomes.offerId,
          offerId,
        ),
      )
      .returning();

    await tx
      .insert(
        placementJoiningHistory,
      )
      .values({
        offerId,
        fromStatus: joining.status,
        toStatus: input.status,
        joiningDate:
          nextJoiningDate,
        reason:
          input.correctionReason ??
          nextReason,
        actorUserId:
          context.user.id,
      });

    await recordActivityEventInTransaction(
      tx,
      context,
      {
        eventType:
          ACTIVITY_EVENT_TYPES.PLACEMENTS_JOINING_RECORDED,
        collegeId: current.job.collegeId,
        subjectType:
          "placement_joining",
        subjectId: offerId,
        subjectLabel:
          current.offer.roleTitle,
        summary:
          `Joining outcome set to ${input.status} for ${current.job.title}`,
        metadata: {
          jobId: current.job.id,
          applicationId:
            current.application.id,
          offerId,
          fromStatus: joining.status,
          toStatus: input.status,
          joiningDate:
            nextJoiningDate,
        },
        groupKey:
          `placement-job:${current.job.id}:joining`,
      },
    );

    return updated;
  });
}

export async function listOwnPlacementOffers(
  context: RequestContext,
) {
  if (
    !context.membership ||
    !hasMembershipRole(
      context,
      "LEARNER",
    )
  ) {
    throw new AuthorizationError(
      "placements.read",
    );
  }
  await requireLearnerPlacementAccess(context);

  return getDb()
    .select({
      offer: placementOffers,
      joining: placementJoiningOutcomes,
      job: {
        id: placementJobs.id,
        title: placementJobs.title,
        employmentType: placementJobs.employmentType,
      },
      role: {
        employmentType: placementJobRoleOptions.employmentType,
      },
      company: {
        id: placementCompanies.id,
        name: placementCompanies.name,
        logoPublicUrl: placementCompanies.logoPublicUrl,
      },
    })
    .from(placementOffers)
    .innerJoin(
      placementApplications,
      eq(
        placementApplications.id,
        placementOffers.applicationId,
      ),
    )
    .innerJoin(
      placementJobs,
      eq(
        placementJobs.id,
        placementApplications.jobId,
      ),
    )
    .innerJoin(
      placementJobRoleOptions,
      eq(placementJobRoleOptions.id,placementApplications.roleOptionId),
    )
    .innerJoin(
      placementCompanyRelationships,
      eq(
        placementCompanyRelationships.id,
        placementJobs.companyRelationshipId,
      ),
    )
    .innerJoin(
      placementCompanies,
      eq(
        placementCompanies.id,
        placementCompanyRelationships.companyId,
      ),
    )
    .leftJoin(
      placementJoiningOutcomes,
      eq(
        placementJoiningOutcomes.offerId,
        placementOffers.id,
      ),
    )
    .where(
      eq(
        placementApplications.membershipId,
        context.membership.id,
      ),
    )
    .orderBy(
      desc(placementOffers.issuedAt),desc(placementOffers.id),
    );
}

export async function listPlacementJobOffers(
  context: RequestContext,
  jobIdInput: string,
) {
  const jobId =
    placementJobIdSchema.parse(
      jobIdInput,
    );
  const [job] = await getDb()
    .select()
    .from(placementJobs)
    .where(eq(placementJobs.id, jobId))
    .limit(1);

  if (!job) {
    throw new PlacementsServiceError(
      "PLACEMENT_JOB_NOT_FOUND",
    );
  }

  await requirePlacementManageScope(
    context,
    job.collegeId,
  );

  return getDb()
    .select({
      offer: placementOffers,
      joining: placementJoiningOutcomes,
      candidate: {
        membershipId:
          collegeMemberships.id,
        displayName: users.displayName,
        email: users.email,
      },
    })
    .from(placementOffers)
    .innerJoin(
      placementApplications,
      eq(
        placementApplications.id,
        placementOffers.applicationId,
      ),
    )
    .innerJoin(
      collegeMemberships,
      eq(
        collegeMemberships.id,
        placementApplications.membershipId,
      ),
    )
    .innerJoin(
      users,
      eq(
        users.id,
        collegeMemberships.userId,
      ),
    )
    .leftJoin(
      placementJoiningOutcomes,
      eq(
        placementJoiningOutcomes.offerId,
        placementOffers.id,
      ),
    )
    .where(
      and(
        eq(
          placementApplications.jobId,
          job.id,
        ),
        eq(
          collegeMemberships.collegeId,
          job.collegeId,
        ),
      ),
    )
    .orderBy(
      asc(users.displayName),
      desc(placementOffers.issuedAt),desc(placementOffers.id),
    );
}


export async function listPlacementOfferCandidates(
  context: RequestContext,
  jobIdInput: string,
) {
  const jobId =
    placementJobIdSchema.parse(
      jobIdInput,
    );
  const [job] = await getDb()
    .select()
    .from(placementJobs)
    .where(eq(placementJobs.id, jobId))
    .limit(1);

  if (!job) {
    throw new PlacementsServiceError(
      "PLACEMENT_JOB_NOT_FOUND",
    );
  }

  await requirePlacementManageScope(
    context,
    job.collegeId,
  );

  const db = getDb();
  const [rounds, applications, results, offers] =
    await Promise.all([
      db
        .select({
          id: placementJobRounds.id,
          status: placementJobRounds.status,
        })
        .from(placementJobRounds)
        .where(
          and(
            eq(
              placementJobRounds.jobId,
              job.id,
            ),
            ne(
              placementJobRounds.kind,
              "TALK",
            ),
            ne(
              placementJobRounds.status,
              "CANCELLED",
            ),
          ),
        ),
      db
        .select({
          applicationId:
            placementApplications.id,
          membershipId:
            collegeMemberships.id,
          roleOptionId:
            placementJobRoleOptions.id,
          roleTitle:
            placementJobRoleOptions.title,
          displayName: users.displayName,
          email: users.email,
        })
        .from(placementApplications)
        .innerJoin(
          placementApplicationScreenings,
          eq(
            placementApplicationScreenings.applicationId,
            placementApplications.id,
          ),
        )
        .innerJoin(
          placementJobRoleOptions,
          eq(
            placementJobRoleOptions.id,
            placementApplications.roleOptionId,
          ),
        )
        .innerJoin(
          collegeMemberships,
          eq(
            collegeMemberships.id,
            placementApplications.membershipId,
          ),
        )
        .innerJoin(
          users,
          eq(
            users.id,
            collegeMemberships.userId,
          ),
        )
        .where(
          and(
            eq(
              placementApplications.jobId,
              job.id,
            ),
            eq(
              placementApplications.status,
              "SUBMITTED",
            ),
            eq(
              placementApplicationScreenings.status,
              "SHORTLISTED",
            ),
            eq(
              collegeMemberships.collegeId,
              job.collegeId,
            ),
          ),
        )
        .orderBy(asc(users.displayName)),
      db
        .select({
          roundId:
            placementRoundResults.roundId,
          applicationId:
            placementRoundResults.applicationId,
          outcome:
            placementRoundResults.outcome,
        })
        .from(placementRoundResults)
        .innerJoin(
          placementJobRounds,
          eq(
            placementJobRounds.id,
            placementRoundResults.roundId,
          ),
        )
        .where(
          and(
            eq(
              placementJobRounds.jobId,
              job.id,
            ),
            eq(
              placementRoundResults.status,
              "APPLIED",
            ),
          ),
        ),
      db
        .select({
          offer: placementOffers,
          joining: placementJoiningOutcomes,
        })
        .from(placementOffers)
        .innerJoin(
          placementApplications,
          eq(
            placementApplications.id,
            placementOffers.applicationId,
          ),
        )
        .leftJoin(
          placementJoiningOutcomes,
          eq(
            placementJoiningOutcomes.offerId,
            placementOffers.id,
          ),
        )
        .where(
          eq(
            placementApplications.jobId,
            job.id,
          ),
        )
        .orderBy(
          desc(placementOffers.issuedAt),
        ),
    ]);

  const resultsByApplication = new Map<
    string,
    Set<string>
  >();
  for (const result of results) {
    if (result.outcome !== "PASS") {
      continue;
    }
    const passed =
      resultsByApplication.get(
        result.applicationId,
      ) ?? new Set<string>();
    passed.add(result.roundId);
    resultsByApplication.set(
      result.applicationId,
      passed,
    );
  }

  const latestOfferByApplication =
    new Map<
      string,
      {
        offer:
          typeof placementOffers.$inferSelect;
        joining:
          typeof placementJoiningOutcomes.$inferSelect | null;
      }
    >();
  for (const row of offers) {
    if (
      !latestOfferByApplication.has(
        row.offer.applicationId,
      )
    ) {
      latestOfferByApplication.set(
        row.offer.applicationId,
        row,
      );
    }
  }

  const roundsReady =
    rounds.length > 0 &&
    rounds.every(
      (round) =>
        round.status === "COMPLETED",
    );

  return applications.map(
    (application) => ({
      ...application,
      offerReady:
        roundsReady &&
        rounds.every((round) =>
          resultsByApplication
            .get(
              application.applicationId,
            )
            ?.has(round.id),
        ),
      offer:
        latestOfferByApplication.get(
          application.applicationId,
        )?.offer ?? null,
      joining:
        latestOfferByApplication.get(
          application.applicationId,
        )?.joining ?? null,
    }),
  );
}
