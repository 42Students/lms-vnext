import {
  and,
  asc,
  eq,
  inArray,
  ne,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  placementJobRoundEvents,
  placementJobRounds,
  placementJobs,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { PlacementsServiceError } from "./errors";
import { requirePlacementManageScope } from "./scope";
import {
  placementEvaluationConfigInputSchema,
  placementJobIdSchema,
  type PlacementEvaluationConfigInput,
} from "./validation";

type PlacementJob = typeof placementJobs.$inferSelect;
type PlacementRound = typeof placementJobRounds.$inferSelect;
type ParsedEvaluationConfig = ReturnType<
  typeof placementEvaluationConfigInputSchema.parse
>;
type ParsedEvaluationRound =
  ParsedEvaluationConfig["rounds"][number];

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

function isDefinitionEqual(
  current: PlacementRound,
  desired: ParsedEvaluationRound,
) {
  return (
    current.kind === desired.kind &&
    current.name === desired.name &&
    current.whatToBring ===
      (desired.whatToBring ?? null) &&
    current.platform === (desired.platform ?? null) &&
    current.testUrl === (desired.testUrl ?? null) &&
    current.durationMinutes ===
      (desired.durationMinutes ?? null)
  );
}

function buildEvaluationConfig(
  job: PlacementJob,
  rounds: PlacementRound[],
) {
  const jobLocked =
    job.status === "CLOSED" ||
    job.status === "ARCHIVED";
  const executionStarted = rounds.some(
    (round) => round.status !== "PENDING",
  );
  const editable = !jobLocked && !executionStarted;

  return {
    jobId: job.id,
    jobStatus: job.status,
    state: !editable
      ? "LOCKED"
      : rounds.length === 0
        ? "EMPTY"
        : "DRAFT",
    editable,
    rounds: rounds.map((round) => ({
      id: round.id,
      sequence: round.sequence,
      kind: round.kind,
      name: round.name,
      whatToBring: round.whatToBring,
      platform: round.platform,
      testUrl: round.testUrl,
      durationMinutes: round.durationMinutes,
      status: round.status,
    })),
  };
}

async function listActiveRounds(jobId: string) {
  return getDb()
    .select()
    .from(placementJobRounds)
    .where(
      and(
        eq(placementJobRounds.jobId, jobId),
        ne(placementJobRounds.status, "CANCELLED"),
      ),
    )
    .orderBy(
      asc(placementJobRounds.sequence),
      asc(placementJobRounds.createdAt),
    );
}

export async function getPlacementEvaluationConfig(
  context: RequestContext,
  jobIdInput: string,
) {
  const jobId = placementJobIdSchema.parse(jobIdInput);
  const job = await loadJob(jobId);
  await requirePlacementManageScope(
    context,
    job.collegeId,
  );
  const rounds = await listActiveRounds(job.id);
  return buildEvaluationConfig(job, rounds);
}

export async function replacePlacementEvaluationConfig(
  context: RequestContext,
  jobIdInput: string,
  rawInput: PlacementEvaluationConfigInput,
) {
  const jobId = placementJobIdSchema.parse(jobIdInput);
  const input =
    placementEvaluationConfigInputSchema.parse(
      rawInput,
    );
  const job = await loadJob(jobId);
  await requirePlacementManageScope(
    context,
    job.collegeId,
  );

  const db = getDb();
  return db.transaction(async (tx) => {
    const [lockedJob] = await tx
      .select()
      .from(placementJobs)
      .where(eq(placementJobs.id, job.id))
      .for("update")
      .limit(1);

    if (!lockedJob) {
      throw new PlacementsServiceError(
        "PLACEMENT_JOB_NOT_FOUND",
      );
    }
    if (
      lockedJob.status === "CLOSED" ||
      lockedJob.status === "ARCHIVED"
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_EVALUATION_CONFIG_LOCKED",
      );
    }

    const allRounds = await tx
      .select()
      .from(placementJobRounds)
      .where(eq(placementJobRounds.jobId, job.id))
      .for("update");
    const activeRounds = allRounds
      .filter(
        (round) => round.status !== "CANCELLED",
      )
      .sort(
        (left, right) =>
          left.sequence - right.sequence ||
          left.createdAt.getTime() -
            right.createdAt.getTime(),
      );

    if (
      activeRounds.some(
        (round) => round.status !== "PENDING",
      )
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_EVALUATION_CONFIG_LOCKED",
      );
    }

    const desiredIds = input.rounds.map(
      (round) => round.id,
    );
    if (desiredIds.length > 0) {
      const existingAnywhere = await tx
        .select({
          id: placementJobRounds.id,
          jobId: placementJobRounds.jobId,
          status: placementJobRounds.status,
        })
        .from(placementJobRounds)
        .where(
          inArray(
            placementJobRounds.id,
            desiredIds,
          ),
        );

      if (
        existingAnywhere.some(
          (round) =>
            round.jobId !== job.id ||
            round.status === "CANCELLED",
        )
      ) {
        throw new PlacementsServiceError(
          "PLACEMENT_EVALUATION_CONFIG_ROUND_SCOPE_MISMATCH",
        );
      }
    }

    const activeById = new Map(
      activeRounds.map((round) => [round.id, round]),
    );
    const desiredIdSet = new Set(desiredIds);
    const structuralChange =
      activeRounds.length !== input.rounds.length ||
      input.rounds.some((round, index) => {
        const current = activeById.get(round.id);
        return !current || current.sequence !== index + 1;
      });
    const now = new Date();

    if (structuralChange && activeRounds.length > 0) {
      const maxSequence = activeRounds.reduce(
        (maximum, round) =>
          Math.max(maximum, round.sequence),
        0,
      );
      const offset = maxSequence + 1_000_000;
      await tx
        .update(placementJobRounds)
        .set({
          sequence: sql`${placementJobRounds.sequence} + ${offset}`,
        })
        .where(
          and(
            eq(placementJobRounds.jobId, job.id),
            eq(placementJobRounds.status, "PENDING"),
          ),
        );
    }

    for (const current of activeRounds) {
      if (desiredIdSet.has(current.id)) continue;
      await tx
        .update(placementJobRounds)
        .set({
          status: "CANCELLED",
          cancelledAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(placementJobRounds.id, current.id),
            eq(placementJobRounds.status, "PENDING"),
          ),
        );
      await tx
        .insert(placementJobRoundEvents)
        .values({
          roundId: current.id,
          eventType: "CANCELLED",
          actorUserId: context.user.id,
          metadata: {
            source: "EVALUATION_CONFIG",
            reason:
              "Removed from evaluation configuration",
          },
        });
    }

    for (
      let index = 0;
      index < input.rounds.length;
      index += 1
    ) {
      const desired = input.rounds[index]!;
      const sequence = index + 1;
      const current = activeById.get(desired.id);

      if (!current) {
        const [created] = await tx
          .insert(placementJobRounds)
          .values({
            id: desired.id,
            jobId: job.id,
            sequence,
            kind: desired.kind,
            name: desired.name,
            whatToBring:
              desired.whatToBring ?? null,
            platform: desired.platform ?? null,
            testUrl: desired.testUrl ?? null,
            durationMinutes:
              desired.durationMinutes ?? null,
            createdByUserId: context.user.id,
          })
          .returning();
        await tx
          .insert(placementJobRoundEvents)
          .values({
            roundId: created.id,
            eventType: "CREATED",
            actorUserId: context.user.id,
            metadata: {
              source: "EVALUATION_CONFIG",
              sequence,
              kind: created.kind,
              name: created.name,
            },
          });
        continue;
      }

      const definitionChanged =
        !isDefinitionEqual(current, desired);
      const sequenceChanged =
        current.sequence !== sequence;
      const needsDatabaseRestore =
        structuralChange;

      if (
        definitionChanged ||
        sequenceChanged ||
        needsDatabaseRestore
      ) {
        await tx
          .update(placementJobRounds)
          .set({
            sequence,
            kind: desired.kind,
            name: desired.name,
            whatToBring:
              desired.whatToBring ?? null,
            platform: desired.platform ?? null,
            testUrl: desired.testUrl ?? null,
            durationMinutes:
              desired.durationMinutes ?? null,
            ...(definitionChanged || sequenceChanged
              ? { updatedAt: now }
              : {}),
          })
          .where(
            and(
              eq(
                placementJobRounds.id,
                current.id,
              ),
              eq(
                placementJobRounds.status,
                "PENDING",
              ),
            ),
          );
      }

      if (definitionChanged) {
        await tx
          .insert(placementJobRoundEvents)
          .values({
            roundId: current.id,
            eventType: "UPDATED",
            actorUserId: context.user.id,
            metadata: {
              source: "EVALUATION_CONFIG",
              kind: desired.kind,
              name: desired.name,
              whatToBring:
                desired.whatToBring ?? null,
              platform: desired.platform ?? null,
              testUrl: desired.testUrl ?? null,
              durationMinutes:
                desired.durationMinutes ?? null,
            },
          });
      }
      if (sequenceChanged) {
        await tx
          .insert(placementJobRoundEvents)
          .values({
            roundId: current.id,
            eventType: "REORDERED",
            actorUserId: context.user.id,
            metadata: {
              source: "EVALUATION_CONFIG",
              sequence,
            },
          });
      }
    }

    const rounds = await tx
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
      .orderBy(
        asc(placementJobRounds.sequence),
        asc(placementJobRounds.createdAt),
      );

    return buildEvaluationConfig(lockedJob, rounds);
  });
}
