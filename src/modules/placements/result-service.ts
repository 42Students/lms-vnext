import {
  and,
  asc,
  desc,
  eq,
  gt,
  lt,
  max,
  ne,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {placementTpoApplicationStages} from "@/db/schema/placement-tpo-application-stages";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  placementApplications,
  placementApplicationScreenings,
  placementJobRounds,
  placementJobs,
  placementLearnerRequests,
  placementRoundResults,
} from "@/db/schema";
import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import {
  AuthorizationError,
  can,
} from "@/modules/permissions/policy";
import { PlacementsServiceError } from "./errors";
import { requirePlacementManageScope } from "./scope";
import { requireLearnerPlacementAccess } from "./learner-participation-guard";
import {recruiterOwnJobExists} from "./recruiter-job-ownership";
import {notifyTpoOfRecruiterAction} from "./hr-tpo-notification-service";
import {
  placementResultIdSchema,
  placementRoundIdSchema,
  stagePlacementRoundResultInputSchema,
  type StagePlacementRoundResultInput,
} from "./validation";

async function loadRoundContext(roundId: string) {
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

async function loadApplicationForRound(
  round: typeof placementJobRounds.$inferSelect,
  applicationId: string,
) {
  const [row] = await getDb()
    .select({
      application: placementApplications,
      screening: placementApplicationScreenings,
    })
    .from(placementApplications)
    .innerJoin(
      placementApplicationScreenings,
      eq(
        placementApplicationScreenings.applicationId,
        placementApplications.id,
      ),
    )
    .where(eq(placementApplications.id, applicationId))
    .limit(1);

  if (!row || row.application.jobId !== round.jobId) {
    throw new PlacementsServiceError(
      "PLACEMENT_RESULT_NOT_PARTICIPANT",
    );
  }
  if (row.application.status !== "SUBMITTED") {
    throw new PlacementsServiceError(
      "PLACEMENT_RESULT_APPLICATION_INACTIVE",
    );
  }
  if (row.screening.status !== "SHORTLISTED") {
    throw new PlacementsServiceError(
      "PLACEMENT_RESULT_SCREENING_NOT_SHORTLISTED",
    );
  }
  return row;
}

async function requireRoundParticipant(
  round: typeof placementJobRounds.$inferSelect,
  applicationId: string,
) {
  const application =
    await loadApplicationForRound(
      round,
      applicationId,
    );

  const previousRounds = await getDb()
    .select()
    .from(placementJobRounds)
    .where(
      and(
        eq(placementJobRounds.jobId, round.jobId),
        lt(
          placementJobRounds.sequence,
          round.sequence,
        ),
        ne(
          placementJobRounds.status,
          "CANCELLED",
        ),
      ),
    )
    .orderBy(asc(placementJobRounds.sequence));

  for (const previous of previousRounds) {
    if (previous.kind === "TALK") continue;

    const [applied] = await getDb()
      .select({
        outcome: placementRoundResults.outcome,
      })
      .from(placementRoundResults)
      .where(
        and(
          eq(
            placementRoundResults.roundId,
            previous.id,
          ),
          eq(
            placementRoundResults.applicationId,
            applicationId,
          ),
          eq(
            placementRoundResults.status,
            "APPLIED",
          ),
        ),
      )
      .limit(1);

    if (!applied || applied.outcome !== "PASS") {
      throw new PlacementsServiceError(
        "PLACEMENT_RESULT_NOT_PARTICIPANT",
      );
    }
  }

  return application;
}

function sameStagedResult(
  current: typeof placementRoundResults.$inferSelect,
  input: ReturnType<
    typeof stagePlacementRoundResultInputSchema.parse
  >,
) {
  return (
    current.outcome === input.outcome &&
    current.waitlistRank ===
      (input.waitlistRank ?? null) &&
    current.scorePercent ===
      (input.scorePercent ?? null) &&
    current.reasonCategory ===
      (input.reasonCategory ?? null) &&
    current.candidateMessage ===
      (input.candidateMessage ?? null) &&
    current.internalComment ===
      (input.internalComment ?? null)
  );
}

export async function listPlacementRoundResults(
  context: RequestContext,
  roundIdInput: string,
) {
  const roundId = placementRoundIdSchema.parse(
    roundIdInput,
  );
  const { round, job } =
    await loadRoundContext(roundId);
  await requirePlacementManageScope(
    context,
    job.collegeId,
  );

  return getDb()
    .select()
    .from(placementRoundResults)
    .where(
      eq(placementRoundResults.roundId, round.id),
    )
    .orderBy(
      asc(placementRoundResults.applicationId),
      desc(placementRoundResults.version),
    );
}

export async function stagePlacementRoundResult(
  context: RequestContext,
  roundIdInput: string,
  rawInput: StagePlacementRoundResultInput,
  expectedCurrentResultId?: string | null,
) {
  const roundId = placementRoundIdSchema.parse(
    roundIdInput,
  );
  const input =
    stagePlacementRoundResultInputSchema.parse(
      rawInput,
    );
  const { round, job } =
    await loadRoundContext(roundId);
  const managerCanStage = can(
    context,
    "placements.manage",
    { collegeId: job.collegeId },
  );
  const recruiterCanStage =
    !managerCanStage &&
    can(
      context,
      "placements.recruiter.result.stage",
      {
        collegeId: job.collegeId,
        placementCompanyRelationshipId:
          job.companyRelationshipId,
      },
    );

  // Company grants do not authorize changing a colleague\u0027s results.
  if(recruiterCanStage && !(await recruiterOwnJobExists(context.user.id,job.id)))
    throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");

  if (
    job.status === "CLOSED" ||
    job.status === "ARCHIVED"
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_JOB_READ_ONLY",
    );
  }

  if (!managerCanStage && !recruiterCanStage) {
    if (context.recruiter) {
      throw new AuthorizationError(
        "placements.recruiter.result.stage",
      );
    }
    await requirePlacementManageScope(
      context,
      job.collegeId,
    );
  }

  if (
    recruiterCanStage &&
    input.internalComment != null
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_RECRUITER_INTERNAL_COMMENT_FORBIDDEN",
    );
  }

  if (round.kind === "TALK") {
    throw new PlacementsServiceError(
      "PLACEMENT_RESULT_INVALID_ROUND_TYPE",
    );
  }
  if (
    round.status !== "SCHEDULED" &&
    round.status !== "COMPLETED"
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_RESULT_ROUND_NOT_READY",
    );
  }

  await requireRoundParticipant(
    round,
    input.applicationId,
  );

  const db = getDb();
  return db.transaction(async (tx) => {
    // Serialize result staging with drive closure; a pre-transaction status
    // read alone can admit a result after another operator closes the drive.
    const [lockedJob] = await tx.select({status: placementJobs.status})
      .from(placementJobs).where(eq(placementJobs.id, job.id)).for("update").limit(1);
    if (!lockedJob || lockedJob.status === "CLOSED" || lockedJob.status === "ARCHIVED") {
      throw new PlacementsServiceError("PLACEMENT_JOB_READ_ONLY");
    }
    const [lockedRound] = await tx
      .select({
        status: placementJobRounds.status,
      })
      .from(placementJobRounds)
      .where(
        eq(
          placementJobRounds.id,
          round.id,
        ),
      )
      .for("update")
      .limit(1);

    if (
      !lockedRound ||
      (lockedRound.status !== "SCHEDULED" &&
        lockedRound.status !== "COMPLETED")
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_RESULT_ROUND_NOT_READY",
      );
    }

    const [lockedApplication] = await tx
      .select({
        status: placementApplications.status,
      })
      .from(placementApplications)
      .where(
        eq(
          placementApplications.id,
          input.applicationId,
        ),
      )
      .for("update")
      .limit(1);

    if (
      !lockedApplication ||
      lockedApplication.status !== "SUBMITTED"
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_RESULT_APPLICATION_INACTIVE",
      );
    }

    if(input.outcome==="ABSENT"){
      // TPO-requests-verification-05: a learner awaiting withdrawal is excused
      // from an upcoming round, not deemed absent or a no-show.
      const [pendingWithdrawal]=await tx.select({id:placementLearnerRequests.id})
        .from(placementLearnerRequests)
        .where(and(eq(placementLearnerRequests.applicationId,input.applicationId),
          eq(placementLearnerRequests.requestType,"APPLICATION_WITHDRAWAL"),
          eq(placementLearnerRequests.status,"PENDING"))).limit(1);
      if(pendingWithdrawal)throw new PlacementsServiceError("PLACEMENT_REQUEST_PENDING_WITHDRAWAL");
    }

    const [current] = await tx
      .select()
      .from(placementRoundResults)
      .where(
        and(
          eq(
            placementRoundResults.roundId,
            round.id,
          ),
          eq(
            placementRoundResults.applicationId,
            input.applicationId,
          ),
          ne(
            placementRoundResults.status,
            "SUPERSEDED",
          ),
        ),
      )
      .limit(1);

    // Confirmed TPO submissions use the actual current row identity.
    // Evaluate this under the existing application/round row locks so a
    // stale operator screen can never silently overwrite a newer result.
    if (
      expectedCurrentResultId !== undefined &&
      (current?.id ?? null) !== expectedCurrentResultId
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_RESULT_NOT_FOUND",
      );
    }
    if (current?.status === "APPLIED") {
      throw new PlacementsServiceError(
        "PLACEMENT_RESULT_ALREADY_APPLIED",
      );
    }
    if (
      recruiterCanStage &&
      current?.status === "STAGED" &&
      current.source !== "HR"
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_RECRUITER_RESULT_CONFLICT",
      );
    }
    if (
      current?.status === "STAGED" &&
      sameStagedResult(current, input)
    ) {
      return current;
    }

    const [aggregate] = await tx
      .select({
        maxVersion: max(
          placementRoundResults.version,
        ),
      })
      .from(placementRoundResults)
      .where(
        and(
          eq(
            placementRoundResults.roundId,
            round.id,
          ),
          eq(
            placementRoundResults.applicationId,
            input.applicationId,
          ),
        ),
      );

    const nextVersion =
      Number(aggregate?.maxVersion ?? 0) + 1;
    const now = new Date();

    if (current?.status === "STAGED") {
      await tx
        .update(placementRoundResults)
        .set({
          status: "SUPERSEDED",
          supersededAt: now,
          updatedAt: now,
        })
        .where(
          eq(
            placementRoundResults.id,
            current.id,
          ),
        );
    }

    const [staged] = await tx
      .insert(placementRoundResults)
      .values({
        roundId: round.id,
        applicationId: input.applicationId,
        version: nextVersion,
        outcome: input.outcome,
        waitlistRank:
          input.waitlistRank ?? null,
        scorePercent:
          input.scorePercent ?? null,
        reasonCategory:
          input.reasonCategory ?? null,
        candidateMessage:
          input.candidateMessage ?? null,
        internalComment:
          input.internalComment ?? null,
        source: recruiterCanStage ? "HR" : "TPO",
        status: "STAGED",
        submittedByUserId: context.user.id,
        submittedAt: now,
      })
      .returning();

    if (!staged) {
      throw new PlacementsServiceError("PLACEMENT_RESULT_NOT_FOUND");
    }

    if(recruiterCanStage){
      await notifyTpoOfRecruiterAction(tx,context,{
        collegeId:job.collegeId,jobId:job.id,roundId:round.id,
        subjectId:staged.id,action:"RESULT_STAGED",
      });
    }
    if (expectedCurrentResultId !== undefined) {
      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.PLACEMENTS_RESULT_STAGED,
        collegeId: job.collegeId,
        subjectType: "placement_result",
        subjectId: staged.id,
        subjectLabel: round.name,
        summary: "Round result staged for " + job.title,
        metadata: {
          jobId: job.id,
          roundId: round.id,
          applicationId: input.applicationId,
          outcome: staged.outcome,
          version: staged.version,
        },
        groupKey: "placement-job:" + job.id + ":results",
        dedupeKey: "placement-result:" + staged.id + ":staged",
      });
    }

    return staged;
  });
}

async function loadResultContext(resultId: string) {
  const [row] = await getDb()
    .select({
      result: placementRoundResults,
      round: placementJobRounds,
      job: placementJobs,
      application: placementApplications,
      screening: placementApplicationScreenings,
    })
    .from(placementRoundResults)
    .innerJoin(
      placementJobRounds,
      eq(
        placementJobRounds.id,
        placementRoundResults.roundId,
      ),
    )
    .innerJoin(
      placementJobs,
      eq(
        placementJobs.id,
        placementJobRounds.jobId,
      ),
    )
    .innerJoin(
      placementApplications,
      eq(
        placementApplications.id,
        placementRoundResults.applicationId,
      ),
    )
    .innerJoin(
      placementApplicationScreenings,
      eq(
        placementApplicationScreenings.applicationId,
        placementApplications.id,
      ),
    )
    .where(eq(placementRoundResults.id, resultId))
    .limit(1);

  if (!row) {
    throw new PlacementsServiceError(
      "PLACEMENT_RESULT_NOT_FOUND",
    );
  }
  return row;
}

export async function applyPlacementRoundResult(
  context: RequestContext,
  resultIdInput: string,
) {
  const resultId =
    placementResultIdSchema.parse(resultIdInput);
  const current =
    await loadResultContext(resultId);
  await requirePlacementManageScope(
    context,
    current.job.collegeId,
  );

  if (
    current.job.status === "CLOSED" ||
    current.job.status === "ARCHIVED"
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_JOB_READ_ONLY",
    );
  }

  if (current.result.status === "APPLIED") {
    return current.result;
  }
  if (current.result.status !== "STAGED") {
    throw new PlacementsServiceError(
      "PLACEMENT_RESULT_NOT_FOUND",
    );
  }
  if (current.round.status !== "COMPLETED") {
    throw new PlacementsServiceError(
      "PLACEMENT_RESULT_ROUND_NOT_READY",
    );
  }
  if (current.round.kind === "TALK") {
    throw new PlacementsServiceError(
      "PLACEMENT_RESULT_INVALID_ROUND_TYPE",
    );
  }

  await requireRoundParticipant(
    current.round,
    current.application.id,
  );

  const db = getDb();
  return db.transaction(async (tx) => {
    const [lockedApplication] = await tx
      .select({
        status: placementApplications.status,
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
      lockedApplication.status !== "SUBMITTED"
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_RESULT_APPLICATION_INACTIVE",
      );
    }

    const [lockedResult] = await tx
      .select()
      .from(placementRoundResults)
      .where(
        eq(
          placementRoundResults.id,
          resultId,
        ),
      )
      .for("update")
      .limit(1);

    if (!lockedResult) {
      throw new PlacementsServiceError(
        "PLACEMENT_RESULT_NOT_FOUND",
      );
    }
    if (lockedResult.status === "APPLIED") {
      return lockedResult;
    }
    if (lockedResult.status !== "STAGED") {
      throw new PlacementsServiceError(
        "PLACEMENT_RESULT_NOT_FOUND",
      );
    }

    const now = new Date();
    const [applied] = await tx
      .update(placementRoundResults)
      .set({
        status: "APPLIED",
        appliedByUserId: context.user.id,
        appliedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(
            placementRoundResults.id,
            resultId,
          ),
          eq(
            placementRoundResults.status,
            "STAGED",
          ),
        ),
      )
      .returning();

    if (!applied) {
      throw new PlacementsServiceError(
        "PLACEMENT_RESULT_NOT_FOUND",
      );
    }

    // TPO-drive-workspace-42: applied PASS advances this applicant to the
    // next active evaluative round. Applied FAIL/HOLD/ABSENT clears stale
    // progression. 0108 is the registered durable stage table.
    if(applied.outcome==="PASS"){
      const [nextRound]=await tx.select({id:placementJobRounds.id,kind:placementJobRounds.kind})
        .from(placementJobRounds).where(and(
          eq(placementJobRounds.jobId,current.job.id),
          ne(placementJobRounds.kind,"TALK"),
          ne(placementJobRounds.status,"CANCELLED"),
          gt(placementJobRounds.sequence,current.round.sequence),
        )).orderBy(asc(placementJobRounds.sequence)).limit(1);
      if(nextRound){
        const stage=nextRound.kind==="INTERVIEW"?"INTERVIEW":"TEST";
        await tx.insert(placementTpoApplicationStages).values({
          applicationId:current.application.id,jobId:current.job.id,roundId:nextRound.id,
          stage,changedByUserId:context.user.id,changedAt:now,
        }).onConflictDoUpdate({
          target:placementTpoApplicationStages.applicationId,
          set:{jobId:current.job.id,roundId:nextRound.id,stage,
            changedByUserId:context.user.id,changedAt:now,
            version:sql`${placementTpoApplicationStages.version}+1`},
        });
      }else{
        await tx.delete(placementTpoApplicationStages).where(
          eq(placementTpoApplicationStages.applicationId,current.application.id));
      }
    }else{
      await tx.delete(placementTpoApplicationStages).where(
        eq(placementTpoApplicationStages.applicationId,current.application.id));
    }

    await recordActivityEventInTransaction(
      tx,
      context,
      {
        eventType:
          ACTIVITY_EVENT_TYPES.PLACEMENTS_RESULT_APPLIED,
        collegeId: current.job.collegeId,
        subjectType:
          "placement_result",
        subjectId: applied.id,
        subjectLabel: current.round.name,
        summary:
          `${current.round.name} result applied for ${current.job.title}`,
        metadata: {
          jobId: current.job.id,
          roundId: current.round.id,
          applicationId:
            current.application.id,
          outcome: applied.outcome,
        },
        groupKey:
          `placement-job:${current.job.id}:results`,
        dedupeKey:
          `placement-result:${applied.id}:applied`,
      },
    );

    return applied;
  });
}

export async function listOwnAppliedPlacementResults(
  context: RequestContext,
) {
  if (
    !context.membership ||
    !hasMembershipRole(context, "LEARNER")
  ) {
    throw new AuthorizationError("placements.read");
  }
  await requireLearnerPlacementAccess(context);

  return getDb()
    .select({
      resultId: placementRoundResults.id,
      applicationId:
        placementApplications.id,
      jobId: placementJobs.id,
      roundId: placementJobRounds.id,
      roundSequence: placementJobRounds.sequence,
      roundKind: placementJobRounds.kind,
      roundName: placementJobRounds.name,
      outcome: placementRoundResults.outcome,
      waitlistRank:
        placementRoundResults.waitlistRank,
      scorePercent:
        placementRoundResults.scorePercent,
      reasonCategory:
        placementRoundResults.reasonCategory,
      candidateMessage:
        placementRoundResults.candidateMessage,
      appliedAt: placementRoundResults.appliedAt,
    })
    .from(placementRoundResults)
    .innerJoin(
      placementApplications,
      eq(
        placementApplications.id,
        placementRoundResults.applicationId,
      ),
    )
    .innerJoin(
      placementJobRounds,
      eq(
        placementJobRounds.id,
        placementRoundResults.roundId,
      ),
    )
    .innerJoin(
      placementJobs,
      eq(
        placementJobs.id,
        placementJobRounds.jobId,
      ),
    )
    .where(
      and(
        eq(
          placementApplications.membershipId,
          context.membership.id,
        ),
        eq(
          placementRoundResults.status,
          "APPLIED",
        ),
      ),
    )
    .orderBy(
      desc(placementRoundResults.appliedAt),
    );
}
