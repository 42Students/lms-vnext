import {
  and,
  asc,
  eq,
  ne,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  placementApplications,
  placementApplicationScreenings,
  placementCompanies,
  placementCompanyRelationships,
  placementJobRounds,
  placementJobs,
  placementRoundResults,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { PlacementsServiceError } from "./errors";
import { requirePlacementManageScope } from "./scope";
import { placementJobIdSchema } from "./validation";

async function loadDriveJob(jobId: string) {
  const [row] = await getDb()
    .select({
      job: placementJobs,
      company: placementCompanies,
    })
    .from(placementJobs)
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
    .where(eq(placementJobs.id, jobId))
    .limit(1);

  if (!row) {
    throw new PlacementsServiceError(
      "PLACEMENT_JOB_NOT_FOUND",
    );
  }
  return row;
}

function resultKey(
  roundId: string,
  applicationId: string,
) {
  return `${roundId}:${applicationId}`;
}

export async function getPlacementDriveDay(
  context: RequestContext,
  jobIdInput: string,
  now: Date = new Date(),
) {
  const jobId = placementJobIdSchema.parse(jobIdInput);
  const { job, company } =
    await loadDriveJob(jobId);
  await requirePlacementManageScope(
    context,
    job.collegeId,
  );

  const db = getDb();
  const [rounds, candidates, currentResultRows] =
    await Promise.all([
      db
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
        ),
      db
        .select({
          application: placementApplications,
          screening:
            placementApplicationScreenings,
          candidate: {
            membershipId: collegeMemberships.id,
            membershipStatus:
              collegeMemberships.status,
            userId: users.id,
            displayName: users.displayName,
            email: users.email,
            phoneE164: users.phoneE164,
          },
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
          collegeMemberships,
          eq(
            collegeMemberships.id,
            placementApplications.membershipId,
          ),
        )
        .innerJoin(
          users,
          eq(users.id, collegeMemberships.userId),
        )
        .where(
          and(
            eq(placementApplications.jobId, job.id),
            eq(
              placementApplications.status,
              "SUBMITTED",
            ),
          ),
        )
        .orderBy(
          asc(placementApplications.submittedAt),
        ),
      db
        .select({
          result: placementRoundResults,
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
            eq(placementJobRounds.jobId, job.id),
            ne(
              placementRoundResults.status,
              "SUPERSEDED",
            ),
          ),
        ),
    ]);

  const currentResults = new Map(
    currentResultRows.map(({ result }) => [
      resultKey(
        result.roundId,
        result.applicationId,
      ),
      result,
    ]),
  );
  const shortlisted = candidates.filter(
    (candidate) =>
      candidate.screening.status === "SHORTLISTED",
  );
  const attention: Array<
    Record<string, unknown>
  > = [];

  const pendingScreeningCount = candidates.filter(
    (candidate) =>
      candidate.screening.status === "PENDING" ||
      candidate.screening.status === "HOLD",
  ).length;
  if (pendingScreeningCount > 0) {
    attention.push({
      code: "SCREENING_QUEUE_PENDING",
      count: pendingScreeningCount,
    });
  }

  const inactiveCandidateCount =
    shortlisted.filter(
      (candidate) =>
        candidate.candidate.membershipStatus !==
        "ACTIVE",
    ).length;
  if (inactiveCandidateCount > 0) {
    attention.push({
      code: "INACTIVE_CANDIDATES",
      count: inactiveCandidateCount,
    });
  }

  const gatingRoundIds: string[] = [];
  const roundViews = rounds.map((round) => {
    const participants = shortlisted.filter(
      (candidate) =>
        gatingRoundIds.every((previousRoundId) => {
          const previousResult =
            currentResults.get(
              resultKey(
                previousRoundId,
                candidate.application.id,
              ),
            );
          return (
            previousResult?.status === "APPLIED" &&
            previousResult.outcome === "PASS"
          );
        }),
    );

    const participantViews = participants.map(
      (candidate) => {
        const result = currentResults.get(
          resultKey(
            round.id,
            candidate.application.id,
          ),
        );
        return {
          applicationId: candidate.application.id,
          membershipId:
            candidate.candidate.membershipId,
          membershipStatus:
            candidate.candidate.membershipStatus,
          userId: candidate.candidate.userId,
          displayName:
            candidate.candidate.displayName,
          email: candidate.candidate.email,
          phoneE164: candidate.candidate.phoneE164,
          result: result
            ? {
                id: result.id,
                status: result.status,
                outcome: result.outcome,
                waitlistRank: result.waitlistRank,
                scorePercent: result.scorePercent,
                reasonCategory:
                  result.reasonCategory,
                candidateMessage:
                  result.candidateMessage,
                internalComment:
                  result.internalComment,
              }
            : null,
        };
      },
    );

    const evaluative = round.kind !== "TALK";
    const stagedResultCount = evaluative
      ? participantViews.filter(
          (participant) =>
            participant.result?.status === "STAGED",
        ).length
      : 0;
    const appliedResults = evaluative
      ? participantViews.filter(
          (participant) =>
            participant.result?.status === "APPLIED",
        )
      : [];
    const appliedResultCount =
      appliedResults.length;
    const missingResultCount = evaluative
      ? Math.max(
          0,
          participantViews.length -
            stagedResultCount -
            appliedResultCount,
        )
      : 0;

    const outcomes = {
      pass: appliedResults.filter(
        (participant) =>
          participant.result?.outcome === "PASS",
      ).length,
      fail: appliedResults.filter(
        (participant) =>
          participant.result?.outcome === "FAIL",
      ).length,
      hold: appliedResults.filter(
        (participant) =>
          participant.result?.outcome === "HOLD",
      ).length,
      absent: appliedResults.filter(
        (participant) =>
          participant.result?.outcome === "ABSENT",
      ).length,
    };

    if (round.status === "PENDING") {
      attention.push({
        code: "ROUND_UNSCHEDULED",
        roundId: round.id,
        sequence: round.sequence,
      });
    }
    if (stagedResultCount > 0) {
      attention.push({
        code: "STAGED_RESULTS_PENDING_APPLY",
        roundId: round.id,
        sequence: round.sequence,
        count: stagedResultCount,
      });
    }
    if (
      evaluative &&
      round.status === "COMPLETED" &&
      missingResultCount > 0
    ) {
      attention.push({
        code: "COMPLETED_RESULTS_MISSING",
        roundId: round.id,
        sequence: round.sequence,
        count: missingResultCount,
      });
    }
    if (
      evaluative &&
      round.resultsDueAt &&
      round.resultsDueAt.getTime() < now.getTime() &&
      missingResultCount + stagedResultCount > 0
    ) {
      attention.push({
        code: "RESULTS_OVERDUE",
        roundId: round.id,
        sequence: round.sequence,
        count:
          missingResultCount + stagedResultCount,
      });
    }

    const view = {
      id: round.id,
      sequence: round.sequence,
      kind: round.kind,
      name: round.name,
      status: round.status,
      scheduledAt: round.scheduledAt,
      timezone: round.timezone,
      mode: round.mode,
      venue: round.venue,
      meetingUrl: round.meetingUrl,
      platform: round.platform,
      testUrl: round.testUrl,
      whatToBring: round.whatToBring,
      durationMinutes: round.durationMinutes,
      resultsDueAt: round.resultsDueAt,
      participantCount: participantViews.length,
      stagedResultCount,
      appliedResultCount,
      missingResultCount,
      outcomes,
      participants: participantViews,
    };

    if (evaluative) {
      gatingRoundIds.push(round.id);
    }
    return view;
  });

  const driveStatus =
    rounds.length === 0
      ? "NOT_CONFIGURED"
      : rounds.every(
            (round) => round.status === "PENDING",
          )
        ? "PLANNED"
        : rounds.every(
              (round) =>
                round.status === "COMPLETED",
            )
          ? "COMPLETED"
          : "ACTIVE";
  const nextRound =
    roundViews.find(
      (round) =>
        round.status === "SCHEDULED" ||
        round.status === "PENDING",
    ) ?? null;

  return {
    job: {
      id: job.id,
      title: job.title,
      status: job.status,
      applicationMode: job.applicationMode,
      company: {
        id: company.id,
        name: company.name,
      },
    },
    driveStatus,
    summary: {
      submittedApplications: candidates.length,
      pendingScreening: pendingScreeningCount,
      shortlisted: shortlisted.length,
      rejected: candidates.filter(
        (candidate) =>
          candidate.screening.status === "REJECTED",
      ).length,
      inactiveShortlistedCandidates:
        inactiveCandidateCount,
      roundCount: rounds.length,
    },
    nextRound: nextRound
      ? {
          id: nextRound.id,
          sequence: nextRound.sequence,
          kind: nextRound.kind,
          name: nextRound.name,
          status: nextRound.status,
          scheduledAt: nextRound.scheduledAt,
          timezone: nextRound.timezone,
          mode: nextRound.mode,
          venue: nextRound.venue,
          meetingUrl: nextRound.meetingUrl,
        }
      : null,
    attention,
    rounds: roundViews,
  };
}
