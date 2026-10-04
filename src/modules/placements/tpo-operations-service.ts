import {
  and,
  asc,
  eq,
  isNull,
  ne,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  placementApplications,
  placementApplicationScreenings,
  placementCompanies,
  placementCompanyRelationships,
  placementJobRounds,
  placementJobs,
  placementJoiningOutcomes,
  placementOffers,
  placementRoundResults,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePlacementManageScope } from "./scope";
import { createPlacementJobInputSchema } from "./validation";

type QueuePriority = "HIGH" | "MEDIUM" | "LOW";

const priorityRank: Record<QueuePriority, number> = {
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export async function getPlacementTpoOperations(
  context: RequestContext,
  collegeIdInput: string,
  now: Date = new Date(),
) {
  const collegeId =
    createPlacementJobInputSchema.shape.collegeId.parse(
      collegeIdInput,
    );
  await requirePlacementManageScope(
    context,
    collegeId,
  );

  const db = getDb();
  const [jobs, applications, rounds, resultRows, offerRows] =
    await Promise.all([
      db
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
        .where(
          and(
            eq(placementJobs.collegeId, collegeId),
            isNull(placementJobs.archivedAt),
          ),
        )
        .orderBy(asc(placementJobs.title)),
      db
        .select({
          application: placementApplications,
          screening:
            placementApplicationScreenings,
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
          and(
            eq(placementJobs.collegeId, collegeId),
            isNull(placementJobs.archivedAt),
            eq(
              placementApplications.status,
              "SUBMITTED",
            ),
          ),
        ),
      db
        .select({
          round: placementJobRounds,
        })
        .from(placementJobRounds)
        .innerJoin(
          placementJobs,
          eq(
            placementJobs.id,
            placementJobRounds.jobId,
          ),
        )
        .where(
          and(
            eq(placementJobs.collegeId, collegeId),
            isNull(placementJobs.archivedAt),
            ne(
              placementJobRounds.status,
              "CANCELLED",
            ),
          ),
        )
        .orderBy(
          asc(placementJobRounds.sequence),
        ),
      db
        .select({
          result: placementRoundResults,
          jobId: placementJobRounds.jobId,
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
        .where(
          and(
            eq(placementJobs.collegeId, collegeId),
            isNull(placementJobs.archivedAt),
            ne(
              placementRoundResults.status,
              "SUPERSEDED",
            ),
          ),
        ),
      db
        .select({
          offer: placementOffers,
          joining: placementJoiningOutcomes,
          jobId: placementApplications.jobId,
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
              placementJobs.collegeId,
              collegeId,
            ),
            isNull(
              placementJobs.archivedAt,
            ),
          ),
        ),
    ]);

  const applicationsByJob = new Map<
    string,
    typeof applications
  >();
  for (const row of applications) {
    const list =
      applicationsByJob.get(
        row.application.jobId,
      ) ?? [];
    list.push(row);
    applicationsByJob.set(
      row.application.jobId,
      list,
    );
  }

  const roundsByJob = new Map<
    string,
    Array<(typeof rounds)[number]["round"]>
  >();
  for (const { round } of rounds) {
    const list =
      roundsByJob.get(round.jobId) ?? [];
    list.push(round);
    roundsByJob.set(round.jobId, list);
  }

  const resultsByJob = new Map<
    string,
    Array<(typeof resultRows)[number]["result"]>
  >();
  for (const row of resultRows) {
    const list =
      resultsByJob.get(row.jobId) ?? [];
    list.push(row.result);
    resultsByJob.set(row.jobId, list);
  }

  const offersByJob = new Map<
    string,
    typeof offerRows
  >();
  for (const row of offerRows) {
    const list =
      offersByJob.get(row.jobId) ?? [];
    list.push(row);
    offersByJob.set(row.jobId, list);
  }

  const workQueue: Array<{
    priority: QueuePriority;
    code: string;
    jobId: string;
    jobTitle: string;
    companyName: string;
    count: number;
  }> = [];

  const jobViews = jobs.map(({ job, company }) => {
    const jobApplications =
      applicationsByJob.get(job.id) ?? [];
    const jobRounds =
      roundsByJob.get(job.id) ?? [];
    const jobResults =
      resultsByJob.get(job.id) ?? [];
    const jobOffers =
      offersByJob.get(job.id) ?? [];
    const pendingScreening =
      jobApplications.filter(
        ({ screening }) =>
          screening.status === "PENDING" ||
          screening.status === "HOLD",
      ).length;
    const shortlisted = jobApplications.filter(
      ({ screening }) =>
        screening.status === "SHORTLISTED",
    ).length;
    const rejected = jobApplications.filter(
      ({ screening }) =>
        screening.status === "REJECTED",
    ).length;
    const stagedResults = jobResults.filter(
      (result) => result.status === "STAGED",
    ).length;
    const appliedResults = jobResults.filter(
      (result) => result.status === "APPLIED",
    ).length;
    const unscheduledRounds = jobRounds.filter(
      (round) => round.status === "PENDING",
    ).length;
    const scheduledRounds = jobRounds.filter(
      (round) => round.status === "SCHEDULED",
    ).length;
    const completedRounds = jobRounds.filter(
      (round) => round.status === "COMPLETED",
    ).length;
    const issuedOffers = jobOffers.filter(
      ({ offer }) =>
        offer.status === "ISSUED",
    ).length;
    const acceptedPendingJoining =
      jobOffers.filter(
        ({ offer, joining }) =>
          offer.status === "ACCEPTED" &&
          joining?.status === "PENDING",
      ).length;
    const joinedOffers = jobOffers.filter(
      ({ joining }) =>
        joining?.status === "JOINED",
    ).length;

    const pushQueue = (
      priority: QueuePriority,
      code: string,
      count: number,
    ) => {
      if (count <= 0) return;
      workQueue.push({
        priority,
        code,
        jobId: job.id,
        jobTitle: job.title,
        companyName: company.name,
        count,
      });
    };

    if (job.status === "DRAFT") {
      pushQueue("LOW", "JOB_DRAFT", 1);
    }
    if (
      job.status === "PUBLISHED" &&
      jobRounds.length === 0
    ) {
      pushQueue(
        "MEDIUM",
        "EVALUATION_PLAN_MISSING",
        1,
      );
    }
    if (
      job.status === "PUBLISHED" &&
      jobRounds.length > 0 &&
      jobRounds.every(
        (round) => round.status === "PENDING",
      )
    ) {
      pushQueue(
        "MEDIUM",
        "DRIVE_NOT_SCHEDULED",
        unscheduledRounds,
      );
    }
    pushQueue(
      "HIGH",
      "SCREENING_PENDING",
      pendingScreening,
    );
    pushQueue(
      "HIGH",
      "RESULTS_AWAITING_APPLY",
      stagedResults,
    );
    pushQueue(
      "MEDIUM",
      "OFFERS_AWAITING_RESPONSE",
      issuedOffers,
    );
    pushQueue(
      "MEDIUM",
      "JOINING_OUTCOME_PENDING",
      acceptedPendingJoining,
    );

    const nextScheduledRound =
      jobRounds
        .filter(
          (round) =>
            round.status === "SCHEDULED" &&
            round.scheduledAt &&
            round.scheduledAt.getTime() >=
              now.getTime(),
        )
        .sort(
          (left, right) =>
            left.scheduledAt!.getTime() -
            right.scheduledAt!.getTime(),
        )[0] ?? null;

    return {
      job: {
        id: job.id,
        title: job.title,
        status: job.status,
        applicationDeadline:
          job.applicationDeadline,
        company: {
          id: company.id,
          name: company.name,
        },
      },
      metrics: {
        submittedApplications:
          jobApplications.length,
        pendingScreening,
        shortlisted,
        rejected,
        roundCount: jobRounds.length,
        unscheduledRounds,
        scheduledRounds,
        completedRounds,
        stagedResults,
        appliedResults,
        issuedOffers,
        acceptedPendingJoining,
        joinedOffers,
      },
      nextScheduledRound: nextScheduledRound
        ? {
            id: nextScheduledRound.id,
            sequence:
              nextScheduledRound.sequence,
            kind: nextScheduledRound.kind,
            name: nextScheduledRound.name,
            scheduledAt:
              nextScheduledRound.scheduledAt,
            timezone: nextScheduledRound.timezone,
            mode: nextScheduledRound.mode,
            venue: nextScheduledRound.venue,
            meetingUrl:
              nextScheduledRound.meetingUrl,
          }
        : null,
    };
  });

  workQueue.sort((left, right) => {
    const priorityDifference =
      priorityRank[left.priority] -
      priorityRank[right.priority];
    if (priorityDifference !== 0) {
      return priorityDifference;
    }
    const companyDifference =
      left.companyName.localeCompare(
        right.companyName,
      );
    if (companyDifference !== 0) {
      return companyDifference;
    }
    return left.jobTitle.localeCompare(
      right.jobTitle,
    );
  });

  const upcomingRounds = rounds
    .map(({ round }) => {
      const jobView = jobViews.find(
        (item) => item.job.id === round.jobId,
      );
      if (
        round.status !== "SCHEDULED" ||
        !round.scheduledAt ||
        round.scheduledAt.getTime() <
          now.getTime() ||
        !jobView
      ) {
        return null;
      }
      return {
        jobId: jobView.job.id,
        jobTitle: jobView.job.title,
        companyName: jobView.job.company.name,
        roundId: round.id,
        sequence: round.sequence,
        kind: round.kind,
        name: round.name,
        scheduledAt: round.scheduledAt,
        timezone: round.timezone,
        mode: round.mode,
        venue: round.venue,
        meetingUrl: round.meetingUrl,
      };
    })
    .filter(
      (
        round,
      ): round is NonNullable<typeof round> =>
        round !== null,
    )
    .sort(
      (left, right) =>
        left.scheduledAt.getTime() -
        right.scheduledAt.getTime(),
    )
    .slice(0, 20);

  return {
    collegeId,
    summary: {
      totalJobs: jobs.length,
      draftJobs: jobs.filter(
        ({ job }) => job.status === "DRAFT",
      ).length,
      publishedJobs: jobs.filter(
        ({ job }) => job.status === "PUBLISHED",
      ).length,
      closedJobs: jobs.filter(
        ({ job }) => job.status === "CLOSED",
      ).length,
      submittedApplications:
        applications.length,
      pendingScreening: applications.filter(
        ({ screening }) =>
          screening.status === "PENDING" ||
          screening.status === "HOLD",
      ).length,
      stagedResults: resultRows.filter(
        ({ result }) =>
          result.status === "STAGED",
      ).length,
      issuedOffers: offerRows.filter(
        ({ offer }) =>
          offer.status === "ISSUED",
      ).length,
      acceptedPendingJoining:
        offerRows.filter(
          ({ offer, joining }) =>
            offer.status === "ACCEPTED" &&
            joining?.status ===
              "PENDING",
        ).length,
      joinedOffers: offerRows.filter(
        ({ joining }) =>
          joining?.status === "JOINED",
      ).length,
      activeDrives: rounds.filter(
        ({ round }) =>
          round.status === "SCHEDULED",
      ).length,
      jobsNeedingAttention: new Set(
        workQueue.map((item) => item.jobId),
      ).size,
    },
    workQueue,
    upcomingRounds,
    jobs: jobViews,
  };
}
