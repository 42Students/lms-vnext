import "server-only";
import { and, count, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {placementDriveSelections} from "@/db/schema/placement-drive-selections";
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
    const cancellable = job.status === "DRAFT" || (job.status === "PUBLISHED" && season?.status === "ACTIVE");
    return {
      id: job.id,
      title: job.title,
      status: job.status,
      expectedUpdatedAt: job.updatedAt.toISOString(),
      cancellable,
      blockedByAcceptedOffers: false,
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
      .limit(1);
    const current = await impact(tx, job.id);
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
    // P-S2-12: stop live ISSUED offers in the same transaction as closure.
    // The registered offer schema permits WITHDRAWN; CANCELLED job status
    // requires a separate orchestrator-owned migration.
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
