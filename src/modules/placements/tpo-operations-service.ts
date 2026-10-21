import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNull,
  ne,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  placementApplications,
  placementApplicationScreeningHistory,
  placementApplicationScreenings,
  placementCompanies,
  placementCompanyRelationships,
  placementJobRounds,
  placementJobs,
  placementJoiningHistory,
  placementJoiningOutcomes,
  placementOffers,
  placementOfferStatusHistory,
  placementRoundResults,
  placementSeasons,
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
  staleApplicationDays = 7,
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
  const [analyticsSeason] = await db
    .select({
      id: placementSeasons.id,
      name: placementSeasons.name,
      code: placementSeasons.code,
      status: placementSeasons.status,
      startDate: placementSeasons.startDate,
      endDate: placementSeasons.endDate,
    })
    .from(placementSeasons)
    .where(
      eq(
        placementSeasons.collegeId,
        collegeId,
      ),
    )
    .orderBy(
      desc(placementSeasons.startDate),
      desc(placementSeasons.createdAt),
    )
    .limit(1);

  const analytics = analyticsSeason
    ? await Promise.all([
        db
          .select({
            totalJobs:
              sql<number>`count(*)::int`,
            draftJobs:
              sql<number>`count(*) filter (where ${placementJobs.status} = 'DRAFT')::int`,
            publishedJobs:
              sql<number>`count(*) filter (where ${placementJobs.status} = 'PUBLISHED')::int`,
            closedJobs:
              sql<number>`count(*) filter (where ${placementJobs.status} = 'CLOSED')::int`,
          })
          .from(placementJobs)
          .where(
            and(
              eq(
                placementJobs.collegeId,
                collegeId,
              ),
              eq(
                placementJobs.seasonId,
                analyticsSeason.id,
              ),
              isNull(
                placementJobs.archivedAt,
              ),
            ),
          ),
        db
          .select({
            applications:
              sql<number>`count(distinct ${placementApplications.id})::int`,
            shortlisted:
              sql<number>`count(distinct ${placementApplications.id}) filter (where ${placementApplicationScreeningHistory.toStatus} = 'SHORTLISTED')::int`,
          })
          .from(placementApplications)
          .innerJoin(
            placementJobs,
            eq(
              placementJobs.id,
              placementApplications.jobId,
            ),
          )
          .leftJoin(
            placementApplicationScreeningHistory,
            eq(
              placementApplicationScreeningHistory.applicationId,
              placementApplications.id,
            ),
          )
          .where(
            and(
              eq(
                placementJobs.collegeId,
                collegeId,
              ),
              eq(
                placementJobs.seasonId,
                analyticsSeason.id,
              ),
              isNull(
                placementJobs.archivedAt,
              ),
            ),
          ),
        db
          .select({
            offered:
              sql<number>`count(distinct ${placementOffers.applicationId})::int`,
            accepted:
              sql<number>`count(distinct ${placementOffers.applicationId}) filter (where ${placementOfferStatusHistory.toStatus} = 'ACCEPTED')::int`,
            joined:
              sql<number>`count(distinct ${placementOffers.applicationId}) filter (where ${placementJoiningHistory.toStatus} = 'JOINED')::int`,
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
            placementOfferStatusHistory,
            eq(
              placementOfferStatusHistory.offerId,
              placementOffers.id,
            ),
          )
          .leftJoin(
            placementJoiningHistory,
            eq(
              placementJoiningHistory.offerId,
              placementOffers.id,
            ),
          )
          .where(
            and(
              eq(
                placementJobs.collegeId,
                collegeId,
              ),
              eq(
                placementJobs.seasonId,
                analyticsSeason.id,
              ),
              isNull(
                placementJobs.archivedAt,
              ),
            ),
          ),
      ])
    : null;


  // A dashboard must not materialize every drive and its learner fanout.
  // Legacy samples at most 60 latest active cards; draft/closed sample is
  // intentionally separate. Directory filters need DB-side pagination.
  const [activeJobs, otherJobs] = await Promise.all([
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
            eq(placementJobs.status, "PUBLISHED"),
            isNull(placementJobs.archivedAt),
          ),
        )
        .orderBy(sql`${placementJobs.publishedAt} desc nulls last`, desc(placementJobs.createdAt), desc(placementJobs.id)).limit(60),
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
            ne(placementJobs.status, "PUBLISHED"),
            isNull(placementJobs.archivedAt),
          ),
        )
        .orderBy(sql`${placementJobs.publishedAt} desc nulls last`, desc(placementJobs.createdAt), desc(placementJobs.id)).limit(20),
  ]);
  const jobs = [...activeJobs, ...otherJobs];
  const sampledJobIds = jobs.map(({ job }) => job.id);
  const [applications, rounds, resultRows, offerRows] = await Promise.all([
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
            inArray(placementJobs.id, sampledJobIds),
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
            inArray(placementJobs.id, sampledJobIds),
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
            inArray(placementJobs.id, sampledJobIds),
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
            inArray(placementJobs.id, sampledJobIds),
          ),
        ),
    ]);



  // Dashboard cards are bounded; headline counts are NOT card-array lengths.
  // Metrics represent all non-archived jobs for the selected college.
  const [[jobTotals], [applicationTotals], [resultTotals], [offerTotals], [roundTotals]] =
    await Promise.all([
      db.select({
        total: sql<number>`count(*)::int`,
        draft: sql<number>`count(*) filter (where ${placementJobs.status} = 'DRAFT')::int`,
        published: sql<number>`count(*) filter (where ${placementJobs.status} = 'PUBLISHED')::int`,
        closed: sql<number>`count(*) filter (where ${placementJobs.status} = 'CLOSED')::int`,
      }).from(placementJobs).where(and(
        eq(placementJobs.collegeId, collegeId), isNull(placementJobs.archivedAt),
      )),
      db.select({
        submitted: sql<number>`count(*)::int`,
        pending: sql<number>`count(*) filter (where ${placementApplicationScreenings.status} in ('PENDING', 'HOLD'))::int`,
      }).from(placementApplications)
        .innerJoin(placementApplicationScreenings, eq(placementApplicationScreenings.applicationId, placementApplications.id))
        .innerJoin(placementJobs, eq(placementJobs.id, placementApplications.jobId))
        .where(and(eq(placementJobs.collegeId, collegeId),
          isNull(placementJobs.archivedAt), eq(placementApplications.status, "SUBMITTED"))),
      db.select({
        staged: sql<number>`count(*) filter (where ${placementRoundResults.status} = 'STAGED')::int`,
      }).from(placementRoundResults)
        .innerJoin(placementJobRounds, eq(placementJobRounds.id, placementRoundResults.roundId))
        .innerJoin(placementJobs, eq(placementJobs.id, placementJobRounds.jobId))
        .where(and(eq(placementJobs.collegeId, collegeId),
          isNull(placementJobs.archivedAt), ne(placementRoundResults.status, "SUPERSEDED"))),
      db.select({
        issued: sql<number>`count(*) filter (where ${placementOffers.status} = 'ISSUED')::int`,
        pendingJoining: sql<number>`count(*) filter (where ${placementOffers.status} = 'ACCEPTED' and ${placementJoiningOutcomes.status} = 'PENDING')::int`,
        joined: sql<number>`count(*) filter (where ${placementJoiningOutcomes.status} = 'JOINED')::int`,
      }).from(placementOffers)
        .innerJoin(placementApplications, eq(placementApplications.id, placementOffers.applicationId))
        .innerJoin(placementJobs, eq(placementJobs.id, placementApplications.jobId))
        .leftJoin(placementJoiningOutcomes, eq(placementJoiningOutcomes.offerId, placementOffers.id))
        .where(and(eq(placementJobs.collegeId, collegeId), isNull(placementJobs.archivedAt))),
      db.select({
        scheduled: sql<number>`count(*) filter (where ${placementJobRounds.status} = 'SCHEDULED')::int`,
      }).from(placementJobRounds)
        .innerJoin(placementJobs, eq(placementJobs.id, placementJobRounds.jobId))
        .where(and(eq(placementJobs.collegeId, collegeId),
          isNull(placementJobs.archivedAt), ne(placementJobRounds.status, "CANCELLED"))),
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
    if(job.status==="PUBLISHED"){
      const withoutLetter=jobOffers.filter(({offer})=>
        (offer.status==="ISSUED"||offer.status==="ACCEPTED") && !offer.offerLetterUrl).length;
      pushQueue("HIGH","OFFERED_NO_LETTER",withoutLetter);
    }
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
    if (job.status === "PUBLISHED") {
      const stale = jobApplications.filter(({application,screening}) =>
        (screening.status === "PENDING" || screening.status === "HOLD") &&
        now.getTime()-application.submittedAt.getTime() >= Math.max(1,Math.min(90,staleApplicationDays))*86400000).length;
      pushQueue("HIGH","STALE_APPLICATIONS",stale);
      if(shortlisted > 0 && jobRounds.some(round=>round.kind==="INTERVIEW") &&
        !jobRounds.some(round=>round.kind==="INTERVIEW" && round.status==="SCHEDULED")){
        pushQueue("MEDIUM","INTERVIEW_UNSCHEDULED",shortlisted);
      }
      if(job.applicationDeadline && job.openings &&
        job.applicationDeadline.getTime()>now.getTime() &&
        job.applicationDeadline.getTime()-now.getTime()<=7*86400000 &&
        jobApplications.length < Math.ceil(job.openings/2)){
        pushQueue("MEDIUM","CLOSING_SOON_LOW_CONVERSION",jobApplications.length || 1);
      }
    }

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
        employmentType: job.employmentType,
        locations: job.locations,
        publishedAt: job.publishedAt,
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

  const [
    jobAnalytics,
    applicationAnalytics,
    offerAnalytics,
  ] = analytics ?? [null, null, null];

  return {
    collegeId,
    analytics: {
      season: analyticsSeason ?? null,
      jobs: {
        total:
          Number(
            jobAnalytics?.[0]?.totalJobs ??
              0,
          ),
        draft:
          Number(
            jobAnalytics?.[0]?.draftJobs ??
              0,
          ),
        published:
          Number(
            jobAnalytics?.[0]?.publishedJobs ??
              0,
          ),
        closed:
          Number(
            jobAnalytics?.[0]?.closedJobs ??
              0,
          ),
      },
      funnel: {
        applications:
          Number(
            applicationAnalytics?.[0]
              ?.applications ?? 0,
          ),
        shortlisted:
          Number(
            applicationAnalytics?.[0]
              ?.shortlisted ?? 0,
          ),
        offered:
          Number(
            offerAnalytics?.[0]
              ?.offered ?? 0,
          ),
        accepted:
          Number(
            offerAnalytics?.[0]
              ?.accepted ?? 0,
          ),
        joined:
          Number(
            offerAnalytics?.[0]
              ?.joined ?? 0,
          ),
      },
    },
    summary: {
      totalJobs: Number(jobTotals?.total ?? 0),
      draftJobs: Number(jobTotals?.draft ?? 0),
      publishedJobs: Number(jobTotals?.published ?? 0),
      closedJobs: Number(jobTotals?.closed ?? 0),
      submittedApplications: Number(applicationTotals?.submitted ?? 0),
      pendingScreening: Number(applicationTotals?.pending ?? 0),
      stagedResults: Number(resultTotals?.staged ?? 0),
      issuedOffers: Number(offerTotals?.issued ?? 0),
      acceptedPendingJoining: Number(offerTotals?.pendingJoining ?? 0),
      joinedOffers: Number(offerTotals?.joined ?? 0),
      activeDrives: Number(roundTotals?.scheduled ?? 0),
      jobsNeedingAttention: new Set(
        workQueue.map((item) => item.jobId),
      ).size,
    },
    workQueue,
    upcomingRounds,
    jobs: jobViews,
  };
}
