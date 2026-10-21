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
import {placementCollegeApplicationStages,placementCollegeApplicationStageHistory} from "@/db/schema/placement-college-application-stages";
import {placementRoundCandidateSlots} from "@/db/schema/placement-round-candidate-slots";
import {z} from "zod";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import {deliverRecordedLearnerPlacementEvent} from "./learner-placement-event-delivery";
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
import {assertTpoRoundApplyJobState,assertTpoRoundApplyRoundState} from "./tpo-round-apply-model";
import { requirePlacementManageScope } from "./scope";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
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

/** Old GET /tpo/results/pending never included applied/superseded versions.
 * Keep this separate from the auditing view which lists all history. */
export async function listPendingPlacementRoundResults(
 context:RequestContext,roundIdInput:string,
){
 const roundId=placementRoundIdSchema.parse(roundIdInput);
 const {round,job}=await loadRoundContext(roundId);
 await requirePlacementManageScope(context,job.collegeId);
 return getDb().select().from(placementRoundResults)
  .where(and(eq(placementRoundResults.roundId,round.id),
   eq(placementRoundResults.status,"STAGED")))
  .orderBy(asc(placementRoundResults.applicationId),desc(placementRoundResults.version));
}

/** The legacy interview ID is a source locator, not a vNext permission grant.
 * Both scoped job and booked application membership are verified before
 * presenting a feedback affordance to the operator. */
export async function getLegacyInterviewFeedbackContext(
 context:RequestContext,rawInterviewId:unknown,
){
 const interviewId=z.number().int().positive().parse(
  typeof rawInterviewId==="string"?Number(rawInterviewId):rawInterviewId);
 const [record]=await getDb().select({
  slot:placementRoundCandidateSlots,round:placementJobRounds,job:placementJobs,
 }).from(placementRoundCandidateSlots)
  .innerJoin(placementJobRounds,and(eq(placementJobRounds.id,placementRoundCandidateSlots.roundId),
    eq(placementJobRounds.jobId,placementRoundCandidateSlots.jobId)))
  .innerJoin(placementJobs,eq(placementJobs.id,placementRoundCandidateSlots.jobId))
  .where(and(eq(placementRoundCandidateSlots.legacyInterviewId,interviewId),
    eq(placementRoundCandidateSlots.status,"BOOKED"))).limit(1);
 if(!record||!record.slot.applicationId)
  throw new PlacementsServiceError("PLACEMENT_RESULT_NOT_PARTICIPANT");
 await requirePlacementManageScope(context,record.job.collegeId);
 return {
  interviewId,applicationId:record.slot.applicationId,
  jobId:record.job.id,roundId:record.round.id,
  roundName:record.round.name,roundStatus:record.round.status,
  completed:record.round.status==="COMPLETED",
  mayStage:record.round.status==="COMPLETED"&&
   record.job.status!=="CLOSED"&&record.job.status!=="ARCHIVED",
  // A feedback decision is staged first and applied separately. HIRE must
  // create and release a real offer: it cannot silently mark a learner hired.
  outcomes:{
   HIRE:"CREATE_OFFER_AFTER_CONFIRMATION",
   REJECT:"STAGE_FAIL_THEN_APPLY",
   HOLD:"REVIEW_WITHOUT_RANKED_WAITLIST",
   PROCEED:"REVIEW_WITHOUT_AUTOMATIC_STAGE",
  } as const,
  warning:"Applying a rejection will notify the learner in-app. An offer requires a separate confirmed offer workflow.",
 };
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

    // Company-result staging has its own recruiter grant guard. For campus
    // officers, do not trust a role cached at request start: role revocation
    // can race the earlier preview or round participant lookup.
    if(managerCanStage)await assertPersistedPlatformPermission(tx,context,
      "placements.manage",{collegeId:job.collegeId});

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
  expectedVersion?: number,
) {
  const resultId =
    placementResultIdSchema.parse(resultIdInput);
  const current =
    await loadResultContext(resultId);
  await requirePlacementManageScope(
    context,
    current.job.collegeId,
  );
  // A bulk-round preview is approval of the exact saved result revision.
  // Do not apply a decision silently changed in another tab afterwards.
  if (expectedVersion !== undefined &&
      (!Number.isSafeInteger(expectedVersion) || expectedVersion < 1 ||
       current.result.version !== expectedVersion))
    throw new PlacementsServiceError("PLACEMENT_JOB_PREVIEW_STALE");

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
    // Lock the drive and round before a staged result is applied. A drive can
    // close or a round can be cancelled after the initial read but before
    // the result and progression updates. Follow staging's lock order.
    const [lockedJob] = await tx.select({status:placementJobs.status})
      .from(placementJobs).where(eq(placementJobs.id,current.job.id))
      .for("update").limit(1);
    assertTpoRoundApplyJobState(lockedJob?.status??null);
    const [lockedRound] = await tx.select({
      status:placementJobRounds.status,kind:placementJobRounds.kind,
    }).from(placementJobRounds).where(and(
      eq(placementJobRounds.id,current.round.id),
      eq(placementJobRounds.jobId,current.job.id),
    )).for("update").limit(1);
    assertTpoRoundApplyRoundState(lockedRound?.status??null,lockedRound?.kind??null);
    // The HTTP request may outlive the officer's membership or system-role
    // grant. Keep actor SHARE locks through the result, audit and delivery.
    await assertPersistedPlatformPermission(tx,context,"placements.manage",{
      collegeId:current.job.collegeId,
    });
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

    // Screening can be changed by a second operator while the first one is
    // reviewing a preview. A result for a no-longer-shortlisted learner must
    // not be applied or notified.
    const [lockedScreening] = await tx.select({
      status:placementApplicationScreenings.status,
    }).from(placementApplicationScreenings)
      .where(eq(placementApplicationScreenings.applicationId,current.application.id))
      .for("share").limit(1);
    if(!lockedScreening || lockedScreening.status!=="SHORTLISTED")
      throw new PlacementsServiceError("PLACEMENT_RESULT_SCREENING_NOT_SHORTLISTED");

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
    if (expectedVersion !== undefined && lockedResult.version !== expectedVersion)
      throw new PlacementsServiceError("PLACEMENT_JOB_PREVIEW_STALE");
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

    // Read learner-facing pipeline stage under lock. A repeated result
    // that does not change the learner-visible stage must not dispatch a
    // second APPLICATION_STATUS_CHANGED notification.
    const [beforeStage]=await tx.select().from(placementCollegeApplicationStages)
      .where(eq(placementCollegeApplicationStages.applicationId,current.application.id))
      .for("update").limit(1);
    if(beforeStage&&["OFFERED","HIRED"].includes(beforeStage.stage))
      throw new PlacementsServiceError("PLACEMENT_RESULT_APPLICATION_INACTIVE");
    let nextLearnerStage:"SHORTLISTED"|"ASSESSMENT"|"INTERVIEW"|"WAITLISTED"|"REJECTED"=
      applied.outcome==="HOLD"?"WAITLISTED":
      applied.outcome==="FAIL"||applied.outcome==="ABSENT"?"REJECTED":"SHORTLISTED";
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
        nextLearnerStage=nextRound.kind==="INTERVIEW"?"INTERVIEW":"ASSESSMENT";
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

    if(beforeStage?.stage!==nextLearnerStage){
      const [saved]=await tx.insert(placementCollegeApplicationStages).values({
        jobId:current.job.id,applicationId:current.application.id,
        stage:nextLearnerStage,previousStage:beforeStage?.stage??null,
        movedByUserId:context.user.id,reason:"Round result applied",
        movedAt:now,updatedAt:now,
      }).onConflictDoUpdate({
        target:placementCollegeApplicationStages.applicationId,
        set:{stage:nextLearnerStage,previousStage:beforeStage?.stage??null,
          movedByUserId:context.user.id,reason:"Round result applied",
          movedAt:now,updatedAt:now,
          version:sql`${placementCollegeApplicationStages.version}+1`},
      }).returning({id:placementCollegeApplicationStages.id});
      if(saved)await tx.insert(placementCollegeApplicationStageHistory).values({
        stageId:saved.id,fromStage:beforeStage?.stage??null,
        toStage:nextLearnerStage,reason:"Round result applied",
        actorUserId:context.user.id,movedAt:now,
      });
    }
    const learnerResultEvent=await recordActivityEventInTransaction(
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
          learnerStage:nextLearnerStage,
          stageChanged:beforeStage?.stage!==nextLearnerStage,
        },
        groupKey:
          `placement-job:${current.job.id}:results`,
        dedupeKey:
          `placement-result:${applied.id}:applied`,
      },
    );

    if(beforeStage?.stage!==nextLearnerStage){
      await deliverRecordedLearnerPlacementEvent(tx,{
        eventId:learnerResultEvent.id,collegeId:current.job.collegeId,
        membershipId:current.application.membershipId,
        kind:applied.outcome==="ABSENT"?"MARKED_ABSENT":"APPLICATION_STATUS_CHANGED",
        subject:current.round.name+" · "+current.job.title,
      });
    }

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
