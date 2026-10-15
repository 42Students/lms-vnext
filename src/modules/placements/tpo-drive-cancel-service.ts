import "server-only";
import { and, count, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  placementApplications,
  placementJobRoundEvents,
  placementJobRounds,
  placementJobs,
  placementOffers,
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
import {
  evaluateTpoDriveCancellation,
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
    const cancellable = job.status === "PUBLISHED" && season?.status === "ACTIVE";
    return {
      id: job.id,
      title: job.title,
      status: job.status,
      expectedUpdatedAt: job.updatedAt.toISOString(),
      cancellable,
      blockedByAcceptedOffers: cancellable && counts.acceptedOffers > 0,
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
        status: "CLOSED",
        closedAt: new Date(),
        updatedAt: sql`greatest(clock_timestamp(),date_trunc('milliseconds',${placementJobs.updatedAt})+interval '1 millisecond')`,
      })
      .where(
        and(
          eq(placementJobs.id, jobId),
          eq(placementJobs.collegeId, collegeId),
          eq(placementJobs.status, "PUBLISHED"),
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
        previewVersion: input.expectedUpdatedAt,
        updatedAt: saved.updatedAt.toISOString(),
      },
    );
    return {
      id: saved.id,
      status: saved.status,
      updatedAt: saved.updatedAt.toISOString(),
      roundsCancelled: cancelledRounds.length,
      impact: current,
    };
  });
}
