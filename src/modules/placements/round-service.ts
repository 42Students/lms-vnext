import {
  and,
  asc,
  eq,
  max,
  ne,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  placementJobRoundEvents,
  placementJobRounds,
  placementJobs,
  placementRoundResults,
  placementRoundAttendance,
  placementApplicationRoundExceptions,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { PlacementsServiceError } from "./errors";
import { requirePlacementManageScope } from "./scope";
import {requireAvailableRoundVenue} from "./round-venue-booking-service";
import { roundReorderLockMessage } from "./tpo-round-reorder-model";
import { roundActionJobMutable, roundActionSnapshotMatches } from "./round-action-guards";
import {
  createPlacementRoundInputSchema,
  placementJobIdSchema,
  placementRoundActionInputSchema,
  placementRoundIdSchema,
  reorderPlacementRoundsInputSchema,
  updatePlacementRoundInputSchema,
  type CreatePlacementRoundInput,
  type PlacementRoundActionInput,
  type ReorderPlacementRoundsInput,
  type UpdatePlacementRoundInput,
} from "./validation";

async function loadJob(jobId: string) {
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
  return job;
}

async function loadRound(roundId: string) {
  const [row] = await getDb()
    .select({
      round: placementJobRounds,
      job: placementJobs,
    })
    .from(placementJobRounds)
    .innerJoin(
      placementJobs,
      eq(
        placementJobs.id,
        placementJobRounds.jobId,
      ),
    )
    .where(eq(placementJobRounds.id, roundId))
    .limit(1);

  if (!row) {
    throw new PlacementsServiceError(
      "PLACEMENT_ROUND_NOT_FOUND",
    );
  }
  return row;
}

async function requireMutableJob(
  context: RequestContext,
  job: typeof placementJobs.$inferSelect,
) {
  await requirePlacementManageScope(
    context,
    job.collegeId,
  );
  if (
    job.status === "CLOSED" ||
    job.status === "ARCHIVED"
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_ROUND_JOB_READ_ONLY",
    );
  }
}

export async function listPlacementRounds(
  context: RequestContext,
  jobIdInput: string,
) {
  const jobId = placementJobIdSchema.parse(jobIdInput);
  const job = await loadJob(jobId);
  await requirePlacementManageScope(
    context,
    job.collegeId,
  );

  return getDb()
    .select()
    .from(placementJobRounds)
    .where(eq(placementJobRounds.jobId, job.id))
    .orderBy(
      asc(placementJobRounds.sequence),
      asc(placementJobRounds.createdAt),
    );
}

export async function getPlacementRound(
  context: RequestContext,
  roundIdInput: string,
) {
  const roundId = placementRoundIdSchema.parse(
    roundIdInput,
  );
  const row = await loadRound(roundId);
  await requirePlacementManageScope(
    context,
    row.job.collegeId,
  );

  const events = await getDb()
    .select()
    .from(placementJobRoundEvents)
    .where(
      eq(placementJobRoundEvents.roundId, roundId),
    )
    .orderBy(asc(placementJobRoundEvents.createdAt));

  return { ...row, events };
}

export async function createPlacementRound(
  context: RequestContext,
  jobIdInput: string,
  rawInput: CreatePlacementRoundInput,
) {
  const jobId = placementJobIdSchema.parse(jobIdInput);
  const input =
    createPlacementRoundInputSchema.parse(rawInput);
  const job = await loadJob(jobId);
  await requireMutableJob(context, job);
  const db = getDb();

  return db.transaction(async (tx) => {
    const [lockedJob] = await tx
      .select()
      .from(placementJobs)
      .where(eq(placementJobs.id, job.id))
      .for("update")
      .limit(1);

    if (
      !lockedJob ||
      lockedJob.status === "CLOSED" ||
      lockedJob.status === "ARCHIVED"
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_ROUND_JOB_READ_ONLY",
      );
    }

    const [aggregate] = await tx
      .select({
        maxSequence: max(
          placementJobRounds.sequence,
        ),
      })
      .from(placementJobRounds)
      // Include cancelled rounds: historic sequence numbers may still appear
      // in event logs or applicant results, and should never be reassigned.
      .where(eq(placementJobRounds.jobId, job.id));
    const sequence =
      Number(aggregate?.maxSequence ?? 0) + 1;

    const [round] = await tx
      .insert(placementJobRounds)
      .values({
        jobId: job.id,
        sequence,
        kind: input.kind,
        name: input.name,
        whatToBring:
          input.whatToBring ?? null,
        platform: input.platform ?? null,
        testUrl: input.testUrl ?? null,
        durationMinutes:
          input.durationMinutes ?? null,
        createdByUserId: context.user.id,
      })
      .returning();

    await tx
      .insert(placementJobRoundEvents)
      .values({
        roundId: round.id,
        eventType: "CREATED",
        actorUserId: context.user.id,
        metadata: {
          sequence,
          kind: round.kind,
          name: round.name,
        },
      });

    return round;
  });
}

export async function updatePlacementRound(
  context: RequestContext,
  roundIdInput: string,
  rawInput: UpdatePlacementRoundInput,
) {
  const roundId = placementRoundIdSchema.parse(
    roundIdInput,
  );
  const input =
    updatePlacementRoundInputSchema.parse(rawInput);
  const current = await loadRound(roundId);
  await requireMutableJob(context, current.job);

  if (current.round.status !== "PENDING") {
    throw new PlacementsServiceError(
      "PLACEMENT_ROUND_NOT_EDITABLE",
    );
  }

  const db = getDb();
  // If another officer edits the same PENDING round after our scoped read,
  // preserve their change rather than silently overwriting it. PostgreSQL
  // timestamps can carry microseconds, while JS Date tokens are milliseconds.
  const expectedUpdatedAt = current.round.updatedAt.toISOString();
  return db.transaction(async (tx) => {
    const [lockedJob] = await tx.select({ status: placementJobs.status })
      .from(placementJobs).where(eq(placementJobs.id, current.job.id))
      .for("update").limit(1);
    if (!roundActionJobMutable(lockedJob)) {
      throw new PlacementsServiceError("PLACEMENT_ROUND_JOB_READ_ONLY");
    }
    const [updated] = await tx
      .update(placementJobRounds)
      .set({
        ...input,
        updatedAt: sql`greatest(clock_timestamp(),date_trunc('milliseconds',${placementJobRounds.updatedAt}) + interval '1 millisecond')`,
      })
      .where(
        and(
          eq(placementJobRounds.id, roundId),
          eq(placementJobRounds.status, "PENDING"),
          sql`date_trunc('milliseconds',${placementJobRounds.updatedAt}) = ${expectedUpdatedAt}::timestamptz`,
        ),
      )
      .returning();

    if (!updated) {
      throw new PlacementsServiceError(
        "PLACEMENT_ROUND_NOT_EDITABLE",
      );
    }

    await tx
      .insert(placementJobRoundEvents)
      .values({
        roundId,
        eventType: "UPDATED",
        actorUserId: context.user.id,
        metadata: input,
      });

    return updated;
  });
}

export async function actOnPlacementRound(
  context: RequestContext,
  roundIdInput: string,
  rawInput: PlacementRoundActionInput,
  expectedUpdatedAt?: string,
) {
  const roundId = placementRoundIdSchema.parse(
    roundIdInput,
  );
  const input =
    placementRoundActionInputSchema.parse(rawInput);
  const current = await loadRound(roundId);
  await requireMutableJob(context, current.job);
  const db = getDb();

  if (input.action === "SCHEDULE") {
    if (
      current.round.status !== "PENDING" &&
      current.round.status !== "SCHEDULED"
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_ROUND_INVALID_TRANSITION",
      );
    }
    if (
      !input.scheduledAt ||
      !input.timezone ||
      !input.mode
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_ROUND_INVALID_TRANSITION",
      );
    }

    const eventType =
      current.round.status === "SCHEDULED"
        ? "RESCHEDULED"
        : "SCHEDULED";
    return db.transaction(async (tx) => {
      const [lockedJob] = await tx.select({status:placementJobs.status})
        .from(placementJobs).where(eq(placementJobs.id,current.job.id)).for("update").limit(1);
      if (!roundActionJobMutable(lockedJob))
        throw new PlacementsServiceError("PLACEMENT_ROUND_JOB_READ_ONLY");
      const [locked] = await tx.select({
        updatedAt: placementJobRounds.updatedAt,
        status: placementJobRounds.status,
        durationMinutes: placementJobRounds.durationMinutes,
      }).from(placementJobRounds)
        .where(eq(placementJobRounds.id, roundId)).for("update").limit(1);
      if (!roundActionSnapshotMatches(locked, current.round.status, expectedUpdatedAt))
        throw new PlacementsServiceError("PLACEMENT_ROUND_INVALID_TRANSITION");
      if(input.mode==="ON_CAMPUS")await requireAvailableRoundVenue(tx,{
        collegeId:current.job.collegeId,roundId,venue:input.venue??"",
        start:input.scheduledAt!,durationMinutes:locked.durationMinutes,
      });
      const [updated] = await tx
        .update(placementJobRounds)
        .set({
          status: "SCHEDULED",
          scheduledAt: input.scheduledAt,
          timezone: input.timezone,
          mode: input.mode,
          venue:
            input.mode === "ON_CAMPUS"
              ? input.venue ?? null
              : null,
          meetingUrl:
            input.mode === "VIRTUAL"
              ? input.meetingUrl ?? null
              : null,
          resultsDueAt:
            input.resultsDueAt ?? null,
          updatedAt: sql`greatest(clock_timestamp(),date_trunc('milliseconds',${placementJobRounds.updatedAt}) + interval '1 millisecond')`,
        })
        .where(
          and(
            eq(placementJobRounds.id, roundId),
            eq(
              placementJobRounds.status,
              current.round.status,
            ),
          ),
        )
        .returning();

      if (!updated) {
        throw new PlacementsServiceError(
          "PLACEMENT_ROUND_INVALID_TRANSITION",
        );
      }

      await tx
        .insert(placementJobRoundEvents)
        .values({
          roundId,
          eventType,
          actorUserId: context.user.id,
          metadata: {
            scheduledAt:
              updated.scheduledAt?.toISOString(),
            timezone: updated.timezone,
            mode: updated.mode,
            venue: updated.venue,
            meetingUrl: updated.meetingUrl,
            resultsDueAt:
              updated.resultsDueAt?.toISOString() ??
              null,
          },
        });

      return updated;
    });
  }

  if (input.action === "COMPLETE") {
    if (current.round.status !== "SCHEDULED") {
      throw new PlacementsServiceError(
        "PLACEMENT_ROUND_INVALID_TRANSITION",
      );
    }

    return db.transaction(async (tx) => {
      const [lockedJob] = await tx.select({ status: placementJobs.status })
        .from(placementJobs).where(eq(placementJobs.id, current.job.id))
        .for("update").limit(1);
      if (!roundActionJobMutable(lockedJob)) {
        throw new PlacementsServiceError("PLACEMENT_ROUND_JOB_READ_ONLY");
      }
      const [lockedRound] = await tx.select({
        status: placementJobRounds.status,
        updatedAt: placementJobRounds.updatedAt,
      }).from(placementJobRounds)
        .where(eq(placementJobRounds.id, roundId)).for("update").limit(1);
      if (!roundActionSnapshotMatches(lockedRound, "SCHEDULED", expectedUpdatedAt)) {
        throw new PlacementsServiceError("PLACEMENT_ROUND_INVALID_TRANSITION");
      }
      const now = new Date();
      const [updated] = await tx
        .update(placementJobRounds)
        .set({
          status: "COMPLETED",
          completedAt: now,
          updatedAt: sql`greatest(clock_timestamp(),date_trunc('milliseconds',${placementJobRounds.updatedAt}) + interval '1 millisecond')`,
        })
        .where(
          and(
            eq(placementJobRounds.id, roundId),
            eq(
              placementJobRounds.status,
              "SCHEDULED",
            ),
          ),
        )
        .returning();

      if (!updated) {
        throw new PlacementsServiceError(
          "PLACEMENT_ROUND_INVALID_TRANSITION",
        );
      }
      await tx
        .insert(placementJobRoundEvents)
        .values({
          roundId,
          eventType: "COMPLETED",
          actorUserId: context.user.id,
        });

      await recordActivityEventInTransaction(
        tx,
        context,
        {
          eventType:
            ACTIVITY_EVENT_TYPES.PLACEMENTS_ROUND_COMPLETED,
          collegeId: current.job.collegeId,
          subjectType:
            "placement_round",
          subjectId: updated.id,
          subjectLabel: updated.name,
          summary:
            `${updated.name} completed for ${current.job.title}`,
          metadata: {
            jobId: current.job.id,
            sequence: updated.sequence,
            kind: updated.kind,
          },
          groupKey:
            `placement-job:${current.job.id}:rounds`,
          dedupeKey:
            `placement-round:${updated.id}:completed`,
        },
      );

      return updated;
    });
  }

  if (
    current.round.status !== "PENDING" &&
    current.round.status !== "SCHEDULED"
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_ROUND_INVALID_TRANSITION",
    );
  }

  return db.transaction(async (tx) => {
    const [lockedJob] = await tx.select({ status: placementJobs.status })
      .from(placementJobs).where(eq(placementJobs.id, current.job.id))
      .for("update").limit(1);
    if (!roundActionJobMutable(lockedJob)) {
      throw new PlacementsServiceError("PLACEMENT_ROUND_JOB_READ_ONLY");
    }
    const [locked] = await tx.select({
      updatedAt: placementJobRounds.updatedAt,
      status: placementJobRounds.status,
    }).from(placementJobRounds)
      .where(eq(placementJobRounds.id, roundId)).for("update").limit(1);
    if (!roundActionSnapshotMatches(locked, current.round.status, expectedUpdatedAt))
      throw new PlacementsServiceError("PLACEMENT_ROUND_INVALID_TRANSITION");
    const now = new Date();
    const [updated] = await tx
      .update(placementJobRounds)
      .set({
        status: "CANCELLED",
        cancelledAt: now,
        updatedAt: sql`greatest(clock_timestamp(),date_trunc('milliseconds',${placementJobRounds.updatedAt}) + interval '1 millisecond')`,
      })
      .where(
        and(
          eq(placementJobRounds.id, roundId),
          eq(
            placementJobRounds.status,
            current.round.status,
          ),
        ),
      )
      .returning();

    if (!updated) {
      throw new PlacementsServiceError(
        "PLACEMENT_ROUND_INVALID_TRANSITION",
      );
    }
    await tx
      .insert(placementJobRoundEvents)
      .values({
        roundId,
        eventType: "CANCELLED",
        actorUserId: context.user.id,
        metadata: {
          reason: input.reason,
        },
      });
    return updated;
  });
}

/**
 * TPO-drive-workspace-37: deny reordering even when all round statuses remain
 * PENDING but a student already has an attendance entry, result or exception.
 * These are real persisted execution artifacts, not candidate projections.
 */
type PlacementRoundTx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
async function findRoundOrderLock(tx: PlacementRoundTx, jobId: string): Promise<string | null> {
  const [result] = await tx.select({id: placementRoundResults.id})
    .from(placementRoundResults)
    .innerJoin(placementJobRounds, eq(placementJobRounds.id,placementRoundResults.roundId))
    .where(eq(placementJobRounds.jobId,jobId)).limit(1);
  if (result) return "RESULT";
  const [attendance] = await tx.select({id:placementRoundAttendance.id})
    .from(placementRoundAttendance)
    .innerJoin(placementJobRounds,eq(placementJobRounds.id,placementRoundAttendance.roundId))
    .where(eq(placementJobRounds.jobId,jobId)).limit(1);
  if (attendance) return "ATTENDANCE";
  const [exception] = await tx.select({id:placementApplicationRoundExceptions.id})
    .from(placementApplicationRoundExceptions)
    .innerJoin(placementJobRounds,eq(placementJobRounds.id,placementApplicationRoundExceptions.roundId))
    .where(eq(placementJobRounds.jobId,jobId)).limit(1);
  if (exception) return "ASSIGNMENT";
  return null;
}

export async function getTpoRoundReorderReadiness(context:RequestContext, jobIdInput:string) {
  const jobId=placementJobIdSchema.parse(jobIdInput);
  const job=await loadJob(jobId);
  await requirePlacementManageScope(context,job.collegeId);
  const db=getDb();
  return db.transaction(async(tx)=>{
    const rounds=await tx.select({
      id:placementJobRounds.id,name:placementJobRounds.name,
      status:placementJobRounds.status,sequence:placementJobRounds.sequence,
    }).from(placementJobRounds)
      .where(and(eq(placementJobRounds.jobId,jobId),ne(placementJobRounds.status,"CANCELLED")))
      .orderBy(asc(placementJobRounds.sequence),asc(placementJobRounds.id));
    const executionLock=await findRoundOrderLock(tx,jobId);
    const blocked=roundReorderLockMessage({
      jobStatus:job.status,
      roundStatuses:rounds.map(r=>r.status),
      hasExecutionArtifacts:Boolean(executionLock),
    });
    return {allowed:blocked===null,reason:blocked,rounds};
  },{accessMode:"read only"});
}

export async function reorderPlacementRounds(
  context: RequestContext,
  jobIdInput: string,
  rawInput: ReorderPlacementRoundsInput,
) {
  const jobId = placementJobIdSchema.parse(jobIdInput);
  const input =
    reorderPlacementRoundsInputSchema.parse(
      rawInput,
    );
  const job = await loadJob(jobId);
  await requireMutableJob(context, job);
  const db = getDb();

  return db.transaction(async (tx) => {
    const [lockedJob] = await tx
      .select()
      .from(placementJobs)
      .where(eq(placementJobs.id, job.id))
      .for("update")
      .limit(1);

    if (
      !lockedJob ||
      lockedJob.status === "CLOSED" ||
      lockedJob.status === "ARCHIVED"
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_ROUND_JOB_READ_ONLY",
      );
    }

    const active = await tx
      .select()
      .from(placementJobRounds)
      .where(
        and(
          eq(placementJobRounds.jobId, job.id),
          ne(
            placementJobRounds.status,
            "CANCELLED",
          ),
        ),
      )
      .orderBy(asc(placementJobRounds.sequence));

    if (
      active.length !== input.roundIds.length ||
      active.some(
        (round) => round.status !== "PENDING",
      )
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_ROUND_REORDER_INVALID",
      );
    }

    if (roundReorderLockMessage({
      jobStatus:lockedJob.status,
      roundStatuses:active.map(round=>round.status),
      hasExecutionArtifacts:Boolean(await findRoundOrderLock(tx,job.id)),
    }) !== null) {
      throw new PlacementsServiceError("PLACEMENT_ROUND_REORDER_INVALID");
    }

    const activeIds = new Set(
      active.map((round) => round.id),
    );
    if (
      input.roundIds.some(
        (roundId) => !activeIds.has(roundId),
      )
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_ROUND_REORDER_INVALID",
      );
    }

    const [historicMax] = await tx.select({
      sequence: max(placementJobRounds.sequence),
    }).from(placementJobRounds)
      .where(eq(placementJobRounds.jobId, job.id));
    const maxSequence = Number(historicMax?.sequence ?? 0);
    const offset = maxSequence + 1_000_000;

    await tx
      .update(placementJobRounds)
      .set({
        sequence: sql`${placementJobRounds.sequence} + ${offset}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(placementJobRounds.jobId, job.id),
          eq(
            placementJobRounds.status,
            "PENDING",
          ),
        ),
      );

    for (
      let index = 0;
      index < input.roundIds.length;
      index += 1
    ) {
      const id = input.roundIds[index]!;
      const sequence = index + 1;
      await tx
        .update(placementJobRounds)
        .set({
          sequence,
          updatedAt: new Date(),
        })
        .where(eq(placementJobRounds.id, id));
      await tx
        .insert(placementJobRoundEvents)
        .values({
          roundId: id,
          eventType: "REORDERED",
          actorUserId: context.user.id,
          metadata: { sequence },
        });
    }

    return tx
      .select()
      .from(placementJobRounds)
      .where(
        and(
          eq(placementJobRounds.jobId, job.id),
          ne(
            placementJobRounds.status,
            "CANCELLED",
          ),
        ),
      )
      .orderBy(asc(placementJobRounds.sequence));
  });
}
