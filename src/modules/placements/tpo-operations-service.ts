import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  ne,
  or,
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
import { adminDriveDirectoryQuerySchema } from "./admin-drive-directory-model";

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

  // Group all learner-dependent metrics in SQL: the response is proportional
  // to sampled drives, never to their applicant, result or offer row counts.
  const staleBefore = new Date(now.getTime() -
    Math.max(1, Math.min(90, staleApplicationDays)) * 86400000);
  const [applicationStats, roundStats, resultStats, offerStats, scheduledRows] =
    await Promise.all([
      db.select({
        jobId: placementApplications.jobId,
        submitted: sql<number>`count(*)::int`,
        pending: sql<number>`count(*) filter (where ${placementApplicationScreenings.status} in ('PENDING', 'HOLD'))::int`,
        shortlisted: sql<number>`count(*) filter (where ${placementApplicationScreenings.status} = 'SHORTLISTED')::int`,
        rejected: sql<number>`count(*) filter (where ${placementApplicationScreenings.status} = 'REJECTED')::int`,
        stale: sql<number>`count(*) filter (where ${placementApplicationScreenings.status} in ('PENDING', 'HOLD') and ${placementApplications.submittedAt} <= ${staleBefore})::int`,
      }).from(placementApplications)
        .innerJoin(placementApplicationScreenings, eq(placementApplicationScreenings.applicationId, placementApplications.id))
        .innerJoin(placementJobs, eq(placementJobs.id, placementApplications.jobId))
        .where(and(eq(placementJobs.collegeId, collegeId), isNull(placementJobs.archivedAt),
          inArray(placementJobs.id, sampledJobIds), eq(placementApplications.status, "SUBMITTED")))
        .groupBy(placementApplications.jobId),
      db.select({
        jobId: placementJobRounds.jobId,
        total: sql<number>`count(*)::int`,
        pending: sql<number>`count(*) filter (where ${placementJobRounds.status} = 'PENDING')::int`,
        scheduled: sql<number>`count(*) filter (where ${placementJobRounds.status} = 'SCHEDULED')::int`,
        completed: sql<number>`count(*) filter (where ${placementJobRounds.status} = 'COMPLETED')::int`,
        interviews: sql<number>`count(*) filter (where ${placementJobRounds.kind} = 'INTERVIEW')::int`,
        scheduledInterviews: sql<number>`count(*) filter (where ${placementJobRounds.kind} = 'INTERVIEW' and ${placementJobRounds.status} = 'SCHEDULED')::int`,
      }).from(placementJobRounds)
        .innerJoin(placementJobs, eq(placementJobs.id, placementJobRounds.jobId))
        .where(and(eq(placementJobs.collegeId, collegeId), isNull(placementJobs.archivedAt),
          inArray(placementJobs.id, sampledJobIds), ne(placementJobRounds.status, "CANCELLED")))
        .groupBy(placementJobRounds.jobId),
      db.select({
        jobId: placementJobRounds.jobId,
        staged: sql<number>`count(*) filter (where ${placementRoundResults.status} = 'STAGED')::int`,
        applied: sql<number>`count(*) filter (where ${placementRoundResults.status} = 'APPLIED')::int`,
      }).from(placementRoundResults)
        .innerJoin(placementJobRounds, eq(placementJobRounds.id, placementRoundResults.roundId))
        .innerJoin(placementJobs, eq(placementJobs.id, placementJobRounds.jobId))
        .where(and(eq(placementJobs.collegeId, collegeId), isNull(placementJobs.archivedAt),
          inArray(placementJobs.id, sampledJobIds), ne(placementRoundResults.status, "SUPERSEDED")))
        .groupBy(placementJobRounds.jobId),
      db.select({
        jobId: placementApplications.jobId,
        issued: sql<number>`count(*) filter (where ${placementOffers.status} = 'ISSUED')::int`,
        acceptedPending: sql<number>`count(*) filter (where ${placementOffers.status} = 'ACCEPTED' and ${placementJoiningOutcomes.status} = 'PENDING')::int`,
        joined: sql<number>`count(*) filter (where ${placementJoiningOutcomes.status} = 'JOINED')::int`,
        missingLetter: sql<number>`count(*) filter (where ${placementOffers.status} in ('ISSUED', 'ACCEPTED') and (${placementOffers.offerLetterUrl} is null or ${placementOffers.offerLetterUrl} = ''))::int`,
      }).from(placementOffers)
        .innerJoin(placementApplications, eq(placementApplications.id, placementOffers.applicationId))
        .innerJoin(placementJobs, eq(placementJobs.id, placementApplications.jobId))
        .leftJoin(placementJoiningOutcomes, eq(placementJoiningOutcomes.offerId, placementOffers.id))
        .where(and(eq(placementJobs.collegeId, collegeId), isNull(placementJobs.archivedAt),
          inArray(placementJobs.id, sampledJobIds)))
        .groupBy(placementApplications.jobId),
      db.select({
        round: placementJobRounds,
        jobId: placementJobs.id,
        jobTitle: placementJobs.title,
        companyName: placementCompanies.name,
      }).from(placementJobRounds)
        .innerJoin(placementJobs, eq(placementJobs.id, placementJobRounds.jobId))
        .innerJoin(placementCompanyRelationships,
          eq(placementCompanyRelationships.id, placementJobs.companyRelationshipId))
        .innerJoin(placementCompanies,
          eq(placementCompanies.id, placementCompanyRelationships.companyId))
        .where(and(eq(placementJobs.collegeId, collegeId), isNull(placementJobs.archivedAt),
          eq(placementJobRounds.status, "SCHEDULED"),
          sql`${placementJobRounds.scheduledAt} >= ${now}`))
        .orderBy(asc(placementJobRounds.scheduledAt), asc(placementJobRounds.id))
        .limit(20),
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


  const byJob = <T extends {jobId: string}>(rows: readonly T[]) =>
    new Map(rows.map(row => [row.jobId, row] as const));
  const applicationByJob = byJob(applicationStats);
  const roundByJob = byJob(roundStats);
  const resultByJob = byJob(resultStats);
  const offerByJob = byJob(offerStats);
  const count = (value: number | null | undefined) => Number(value ?? 0);

  const workQueue: Array<{
    priority: QueuePriority;
    code: string;
    jobId: string;
    jobTitle: string;
    companyName: string;
    count: number;
  }> = [];
  const jobViews = jobs.map(({job, company}) => {
    const a = applicationByJob.get(job.id);
    const r = roundByJob.get(job.id);
    const results = resultByJob.get(job.id);
    const offers = offerByJob.get(job.id);
    const submitted = count(a?.submitted);
    const pending = count(a?.pending);
    const shortlisted = count(a?.shortlisted);
    const rejected = count(a?.rejected);
    const staged = count(results?.staged);
    const applied = count(results?.applied);
    const roundCount = count(r?.total);
    const unscheduled = count(r?.pending);
    const scheduled = count(r?.scheduled);
    const completed = count(r?.completed);
    const issued = count(offers?.issued);
    const acceptedPending = count(offers?.acceptedPending);
    const joined = count(offers?.joined);
    const pushQueue = (priority: QueuePriority, code: string, amount: number) => {
      if (amount <= 0) return;
      workQueue.push({priority, code, jobId: job.id,
        jobTitle: job.title, companyName: company.name, count: amount});
    };
    if (job.status === "DRAFT") pushQueue("LOW", "JOB_DRAFT", 1);
    if (job.status === "PUBLISHED" && roundCount === 0)
      pushQueue("MEDIUM", "EVALUATION_PLAN_MISSING", 1);
    if (job.status === "PUBLISHED" && roundCount > 0 && roundCount === unscheduled)
      pushQueue("MEDIUM", "DRIVE_NOT_SCHEDULED", unscheduled);
    pushQueue("HIGH", "SCREENING_PENDING", pending);
    pushQueue("HIGH", "RESULTS_AWAITING_APPLY", staged);
    // Hired learners remain ACCEPTED in the offer model and JOINED in the
    // joining model; include them in missing-letter attention.
    if (job.status === "PUBLISHED")
      pushQueue("HIGH", "OFFERED_NO_LETTER", count(offers?.missingLetter));
    pushQueue("MEDIUM", "OFFERS_AWAITING_RESPONSE", issued);
    pushQueue("MEDIUM", "JOINING_OUTCOME_PENDING", acceptedPending);
    if (job.status === "PUBLISHED") {
      pushQueue("HIGH", "STALE_APPLICATIONS", count(a?.stale));
      if (shortlisted > 0 && count(r?.interviews) > 0 &&
          count(r?.scheduledInterviews) === 0)
        pushQueue("MEDIUM", "INTERVIEW_UNSCHEDULED", shortlisted);
      if (job.applicationDeadline && job.openings &&
          job.applicationDeadline.getTime() > now.getTime() &&
          job.applicationDeadline.getTime() - now.getTime() <= 7 * 86400000 &&
          submitted < Math.ceil(job.openings / 2))
        pushQueue("MEDIUM", "CLOSING_SOON_LOW_CONVERSION", submitted || 1);
    }
    const nextScheduledRound = scheduledRows.find(item => item.jobId === job.id)?.round ?? null;
    return {
      job: {
        id: job.id, title: job.title, status: job.status,
        applicationDeadline: job.applicationDeadline,
        employmentType: job.employmentType, locations: job.locations,
        publishedAt: job.publishedAt,
        company: {id: company.id, name: company.name},
      },
      metrics: {
        submittedApplications: submitted, pendingScreening: pending, shortlisted,
        rejected, roundCount, unscheduledRounds: unscheduled,
        scheduledRounds: scheduled, completedRounds: completed,
        stagedResults: staged, appliedResults: applied,
        issuedOffers: issued, acceptedPendingJoining: acceptedPending,
        joinedOffers: joined,
      },
      nextScheduledRound: nextScheduledRound ? {
        id: nextScheduledRound.id, sequence: nextScheduledRound.sequence,
        kind: nextScheduledRound.kind, name: nextScheduledRound.name,
        scheduledAt: nextScheduledRound.scheduledAt,
        timezone: nextScheduledRound.timezone, mode: nextScheduledRound.mode,
        venue: nextScheduledRound.venue, meetingUrl: nextScheduledRound.meetingUrl,
      } : null,
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

  const upcomingRounds = scheduledRows.map(({round, jobId, jobTitle, companyName}) => ({
    jobId, jobTitle, companyName, roundId: round.id,
    sequence: round.sequence, kind: round.kind, name: round.name,
    scheduledAt: round.scheduledAt!, timezone: round.timezone,
    mode: round.mode, venue: round.venue, meetingUrl: round.meetingUrl,
  }));

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


/**
 * Exact, database-filtered directory complement to the bounded TPO dashboard.
 * Do not sort/filter/page the dashboard's 60+20 sample on the client; call
 * this function with validated URL filters to obtain the selected-college
 * page and a separate total. Search escapes SQL LIKE metacharacters so user
 * text is treated literally.
 */
export async function listPlacementOperationsJobPage(
  context: RequestContext,
  collegeIdInput: string,
  rawFilters: unknown = {},
) {
  const collegeId = createPlacementJobInputSchema.shape.collegeId.parse(collegeIdInput);
  await requirePlacementManageScope(context, collegeId);
  const filters = adminDriveDirectoryQuerySchema.parse(rawFilters);
  const db = getDb();
  const statusPredicate = filters.status === "ACTIVE"
    ? eq(placementJobs.status, "PUBLISHED")
    : filters.status === "DRAFT"
      ? eq(placementJobs.status, "DRAFT")
      : filters.status === "CLOSED"
        ? inArray(placementJobs.status, ["CLOSED", "CANCELLED"])
        : undefined;
  const literalSearch = filters.q.replace(/[\\%_]/g, "\\$&");
  const searchPredicate = filters.q
    ? or(
        ilike(placementJobs.title, "%" + literalSearch + "%"),
        ilike(placementCompanies.name, "%" + literalSearch + "%"),
      )
    : undefined;
  const where = and(
    eq(placementJobs.collegeId, collegeId),
    isNull(placementJobs.archivedAt),
    statusPredicate,
    searchPredicate,
  );
  const directory = () => db.select({
    job: placementJobs,
    company: placementCompanies,
  }).from(placementJobs)
    .innerJoin(placementCompanyRelationships,
      eq(placementCompanyRelationships.id, placementJobs.companyRelationshipId))
    .innerJoin(placementCompanies,
      eq(placementCompanies.id, placementCompanyRelationships.companyId));
  const [totalRow] = await db.select({total: sql<number>`count(*)::int`})
    .from(placementJobs)
    .innerJoin(placementCompanyRelationships,
      eq(placementCompanyRelationships.id, placementJobs.companyRelationshipId))
    .innerJoin(placementCompanies,
      eq(placementCompanies.id, placementCompanyRelationships.companyId))
    .where(where);
  const total = Number(totalRow?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));
  const page = Math.min(filters.page, totalPages);
  const rows = await directory().where(where)
    .orderBy(
      sql`${placementJobs.publishedAt} desc nulls last`,
      desc(placementJobs.createdAt),
      desc(placementJobs.id),
    )
    .limit(filters.pageSize).offset((page - 1) * filters.pageSize);
  const ids = rows.map(({job}) => job.id);
  const counts = await db.select({
    jobId: placementApplications.jobId,
    submitted: sql<number>`count(*)::int`,
  }).from(placementApplications)
    .innerJoin(placementJobs, eq(placementJobs.id, placementApplications.jobId))
    .where(and(
      eq(placementJobs.collegeId, collegeId),
      isNull(placementJobs.archivedAt),
      inArray(placementApplications.jobId, ids),
      eq(placementApplications.status, "SUBMITTED"),
    )).groupBy(placementApplications.jobId);
  const countsByJob = new Map(counts.map(row => [row.jobId, Number(row.submitted)] as const));
  return {
    total, totalPages, page, pageSize: filters.pageSize,
    items: rows.map(({job, company}) => ({
      job: {
        id: job.id, title: job.title, status: job.status,
        applicationDeadline: job.applicationDeadline,
        employmentType: job.employmentType,
        locations: job.locations,
        publishedAt: job.publishedAt,
        company: {id: company.id, name: company.name},
      },
      company: {id: company.id, name: company.name},
      metrics: {submittedApplications: countsByJob.get(job.id) ?? 0},
    })),
  };
}
