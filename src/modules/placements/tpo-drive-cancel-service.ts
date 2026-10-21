import "server-only";
import { and, count, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {placementDriveSelections} from "@/db/schema/placement-drive-selections";
import {placementWaitlistPromotions} from "@/db/schema/placement-waitlist-promotions";
import {
  placementApplications,
  placementJobRoundEvents,
  placementJobRounds,
  placementJobs,
  placementOffers,
  placementOfferStatusHistory,
  placementSeasons,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { PlacementsServiceError } from "./errors";
import { placementJobIdSchema } from "./validation";
import {
  auditTpoJobChange,
  requireTpoJobActor,
  requireTpoJobCollege,
  type TpoJobTx,
} from "./tpo-job-write-base";
import {endDriveApplicants,settleDriveWithdrawalRequests,tellRecruiterDriveStopped} from "./tpo-drive-stop-effects";
import {
  evaluateTpoDriveCancellation,
  isIssuedOfferCancelable,
  tpoDriveCancelSchema,
  type TpoDriveCancelImpact,
} from "./tpo-drive-cancel-model";

/** Lifecycle contract is shared by the impact preview and locked mutation:
 * cancellation stops a live drive and may withdraw unaccepted issued offers;
 * archive only hides an already stopped record from normal lists. Never use
 * an archive preview to authorize CANCEL or vice versa. */
export const TPO_CANCEL_VS_ARCHIVE_COPY={
 cancel:"Cancel drive",
 cancelImpact:"Cancelling stops pending rounds, withdraws issued offers and removes live learner applications. Accepted offers and the audit history remain.",
 archive:"Archive drive",
 archiveImpact:"Archiving keeps existing placements and history but hides the drive from active lists.",
} as const;
function canCancelTpoDrive(status:string,seasonStatus:string|null,pendingPromotions:number){
 return (status==="DRAFT"||(status==="PUBLISHED"&&seasonStatus==="ACTIVE"))&&
   pendingPromotions===0;
}
/** Legacy lifecycle is split between recruiter requests and real drives.
 * REQUEST, SENT_BACK and REJECTED have request IDs, never phantom Job IDs.
 * CANCELLED is persisted separately from CLOSED with irreversible stop effects.
 */
export function tpoLegacyLifecycleProjection(status:string){
 switch(status){
  case "REQUEST": return {entity:"REQUEST" as const,label:"Requested"};
  case "SENT_BACK": return {entity:"REQUEST" as const,label:"Sent back"};
  case "REJECTED": return {entity:"REQUEST" as const,label:"Rejected"};
  case "DRAFT": return {entity:"JOB" as const,label:"Draft"};
  case "PUBLISHED": return {entity:"JOB" as const,label:"Published"};
  case "CLOSED": return {entity:"JOB" as const,label:"Closed"};
  case "CANCELLED": return {entity:"JOB" as const,label:"Cancelled"};
  default: return null;
 }
}
async function pendingWaitlistReservations(tx:TpoJobTx,jobId:string):Promise<number>{
 const [row]=await tx.select({total:count()}).from(placementWaitlistPromotions)
  .where(and(eq(placementWaitlistPromotions.jobId,jobId),
    eq(placementWaitlistPromotions.status,"PENDING")));
 return row?.total??0;
}
async function impact(tx: TpoJobTx, jobId: string): Promise<TpoDriveCancelImpact> {
  const [applications, rounds, offers] = await Promise.all([
    tx
      .select({ n: count() })
      .from(placementApplications)
      .where(
        and(
          eq(placementApplications.jobId, jobId),
          eq(placementApplications.status, "SUBMITTED"),
        ),
      ),
    tx
      .select({ n: count() })
      .from(placementJobRounds)
      .where(
        and(
          eq(placementJobRounds.jobId, jobId),
          inArray(placementJobRounds.status, ["PENDING", "SCHEDULED"]),
        ),
      ),
    tx
      .select({ status: placementOffers.status, n: count() })
      .from(placementOffers)
      .innerJoin(
        placementApplications,
        eq(placementApplications.id, placementOffers.applicationId),
      )
      .where(
        and(
          eq(placementApplications.jobId, jobId),
          inArray(placementOffers.status, ["ISSUED", "ACCEPTED"]),
        ),
      )
      .groupBy(placementOffers.status),
  ]);
  const byStatus = new Map(offers.map((row) => [row.status, row.n]));
  return {
    submittedApplications: applications[0]?.n ?? 0,
    openRounds: rounds[0]?.n ?? 0,
    issuedOffers: byStatus.get("ISSUED") ?? 0,
    acceptedOffers: byStatus.get("ACCEPTED") ?? 0,
  };
}

export async function getTpoDriveCancelPreview(
  context: RequestContext,
  rawJobId: unknown,
) {
  const collegeId = await requireTpoJobCollege(context);
  const jobId = placementJobIdSchema.parse(rawJobId);
  return getDb().transaction(async (tx) => {
    const [job] = await tx
      .select({
        id: placementJobs.id,
        title: placementJobs.title,
        status: placementJobs.status,
        seasonId: placementJobs.seasonId,
        updatedAt: placementJobs.updatedAt,
      })
      .from(placementJobs)
      .where(and(eq(placementJobs.id, jobId), eq(placementJobs.collegeId, collegeId)))
      .limit(1);
    if (!job) throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
    const [season] = await tx
      .select({ status: placementSeasons.status })
      .from(placementSeasons)
      .where(
        and(
          eq(placementSeasons.id, job.seasonId),
          eq(placementSeasons.collegeId, collegeId),
        ),
      )
      .limit(1);
    const counts = await impact(tx, job.id);
    const pendingPromotions=await pendingWaitlistReservations(tx,job.id);
    const cancellable = canCancelTpoDrive(job.status,season?.status??null,pendingPromotions);
    return {
      id: job.id,
      title: job.title,
      status: job.status,
      expectedUpdatedAt: job.updatedAt.toISOString(),
      cancellable,
      blockedByAcceptedOffers: false,
      pendingPromotions,
      action:"CANCEL" as const,
      actionLabel:TPO_CANCEL_VS_ARCHIVE_COPY.cancel,
      impactDescription:TPO_CANCEL_VS_ARCHIVE_COPY.cancelImpact,
      archiveAlternative:TPO_CANCEL_VS_ARCHIVE_COPY.archiveImpact,
      impact: counts,
    };
  });
}

export async function cancelTpoDriveWithPreview(
  context: RequestContext,
  rawJobId: unknown,
  raw: unknown,
) {
  const collegeId = await requireTpoJobCollege(context);
  const jobId = placementJobIdSchema.parse(rawJobId);
  const input = tpoDriveCancelSchema.parse(raw);
  return getDb().transaction(async (tx) => {
    await requireTpoJobActor(tx, context);
    const [job] = await tx
      .select()
      .from(placementJobs)
      .where(and(eq(placementJobs.id, jobId), eq(placementJobs.collegeId, collegeId)))
      .for("update")
      .limit(1);
    if (!job) throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
    if (job.updatedAt.toISOString() !== input.expectedUpdatedAt) {
      throw new PlacementsServiceError("PLACEMENT_JOB_STALE");
    }
    const [season] = await tx
      .select({ status: placementSeasons.status })
      .from(placementSeasons)
      .where(
        and(
          eq(placementSeasons.id, job.seasonId),
          eq(placementSeasons.collegeId, collegeId),
        ),
      )
      .for("share")
      .limit(1);
    const current = await impact(tx, job.id);
    // A pending promotion can be between seat reservation and actual
    // offer issuance. Job-row locking serializes with the reservation
    // transaction; cancellation must not strand its immutable PENDING row.
    const pendingPromotions=await pendingWaitlistReservations(tx,job.id);
    if(!canCancelTpoDrive(job.status,season?.status??null,pendingPromotions))
      throw new PlacementsServiceError("PLACEMENT_JOB_NOT_CLOSABLE");
    const decision = evaluateTpoDriveCancellation(
      job.status,
      season?.status ?? null,
      current,
      input.expectedImpact,
    );
    if (decision === "PREVIEW_STALE") {
      throw new PlacementsServiceError("PLACEMENT_JOB_PREVIEW_STALE");
    }
    if (decision === "BLOCKED_ACCEPTED_OFFERS") {
      throw new PlacementsServiceError("PLACEMENT_JOB_CANCEL_BLOCKED");
    }
    if (decision !== "ALLOW") {
      throw new PlacementsServiceError("PLACEMENT_JOB_NOT_CLOSABLE");
    }
    const [saved] = await tx
      .update(placementJobs)
      .set({
        status: "CANCELLED",
        closedAt: new Date(),
        updatedAt: sql`greatest(clock_timestamp(),date_trunc('milliseconds',${placementJobs.updatedAt})+interval '1 millisecond')`,
      })
      .where(
        and(
          eq(placementJobs.id, jobId),
          eq(placementJobs.collegeId, collegeId),
          inArray(placementJobs.status, ["DRAFT", "PUBLISHED"]),
          sql`date_trunc('milliseconds',${placementJobs.updatedAt})=${input.expectedUpdatedAt}::timestamptz`,
        ),
      )
      .returning({
        id: placementJobs.id,
        title: placementJobs.title,
        status: placementJobs.status,
        updatedAt: placementJobs.updatedAt,
      });
    if (!saved) throw new PlacementsServiceError("PLACEMENT_JOB_STALE");
    const now = new Date();
    // TPO-drives-03: persist a distinct CANCELLED job status, not CLOSED.
    // The Closed lifecycle tab includes both statuses while preserving their labels.
    // Stop live ISSUED offers within this same cancellation transaction.
    const issued = await tx.select({
      id: placementOffers.id, status: placementOffers.status,
    }).from(placementOffers)
      .innerJoin(placementApplications,
        eq(placementApplications.id, placementOffers.applicationId))
      .where(and(
        eq(placementApplications.jobId, jobId),
        eq(placementOffers.status, "ISSUED"),
      )).for("update");
    const cancelledAt = new Date();
    for (const entry of issued) {
      if (!isIssuedOfferCancelable(entry.status)) continue;
      const [stopped] = await tx.update(placementOffers).set({
        status: "WITHDRAWN",
        withdrawnAt: cancelledAt,
        withdrawnByUserId: context.user.id,
        updatedAt: cancelledAt,
      }).where(and(
        eq(placementOffers.id, entry.id),
        eq(placementOffers.status, "ISSUED"),
      )).returning({ id: placementOffers.id });
      if (!stopped) throw new PlacementsServiceError("PLACEMENT_JOB_PREVIEW_STALE");
      await tx.insert(placementOfferStatusHistory).values({
        offerId: stopped.id, fromStatus: "ISSUED", toStatus: "WITHDRAWN",
        actorUserId: context.user.id,
        reason: input.reason,
      });
    }
    // Release is irreversible: retire only selections that have not yet
    // produced an official offer. Registration: proposed cancellation CHECK.
    const retiredSelections=await tx.update(placementDriveSelections).set({
      status:"CANCELLED",updatedAt:now,
    }).where(and(eq(placementDriveSelections.jobId,jobId),
      inArray(placementDriveSelections.status,["SELECTED","VERIFIED"])))
      .returning({id:placementDriveSelections.id});
    const cancelledRounds = await tx
      .update(placementJobRounds)
      .set({ status: "CANCELLED", cancelledAt: now, updatedAt: now })
      .where(
        and(
          eq(placementJobRounds.jobId, jobId),
          inArray(placementJobRounds.status, ["PENDING", "SCHEDULED"]),
        ),
      )
      .returning({ id: placementJobRounds.id });
    if (cancelledRounds.length > 0) {
      await tx.insert(placementJobRoundEvents).values(
        cancelledRounds.map((round) => ({
          roundId: round.id,
          eventType: "CANCELLED" as const,
          actorUserId: context.user.id,
          metadata: { reason: input.reason, cause: "DRIVE_CANCELLED" },
        })),
      );
    }
    const settledWithdrawalRequests=await settleDriveWithdrawalRequests(
      tx,context,jobId,collegeId,"CANCELLED",input.reason,
    );
    const applicantEffects=await endDriveApplicants(
      tx,context,jobId,collegeId,"CANCELLED",input.reason,
    );
    const recruiterNotified=await tellRecruiterDriveStopped(
      tx,context,jobId,collegeId,"CANCELLED",input.reason,
    );
    await auditTpoJobChange(
      tx,
      context,
      saved,
      "PLACEMENTS_TPO_DRIVE_CANCELLED",
      "cancelled",
      {
        reason: input.reason,
        action: input.action,
        fromStatus: job.status,
        toStatus: saved.status,
        impact: current,
        roundsCancelled: cancelledRounds.length,
        issuedOffersWithdrawn: issued.length,
        pendingSelectionsCancelled:retiredSelections.length,
        settledWithdrawalRequests,applicantEffects,recruiterNotified,
        previewVersion: input.expectedUpdatedAt,
        updatedAt: saved.updatedAt.toISOString(),
      },
    );
    return {
      id: saved.id,
      status: saved.status,
      updatedAt: saved.updatedAt.toISOString(),
      roundsCancelled: cancelledRounds.length,
      issuedOffersWithdrawn: issued.length,
      pendingSelectionsCancelled:retiredSelections.length,
      settledWithdrawalRequests,applicantEffects,recruiterNotified,
      impact: current,
    };
  });
}
