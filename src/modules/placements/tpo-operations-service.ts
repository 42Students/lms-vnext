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

  // Funnel stages mean "ever reached" here. Correlated EXISTS preserves those
  // historical semantics without multiplying joined history rows at scale.
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
              sql<number>`count(*)::int`,
            shortlisted:
              sql<number>`count(*) filter (where exists (
                select 1 from ${placementApplicationScreeningHistory}
                where ${placementApplicationScreeningHistory.applicationId} = ${placementApplications.id}
                  and ${placementApplicationScreeningHistory.toStatus} = 'SHORTLISTED'
              ))::int`,
          })
          .from(placementApplications)
          .innerJoin(
            placementJobs,
            eq(
              placementJobs.id,
              placementApplications.jobId,
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
              sql<number>`count(distinct ${placementOffers.applicationId}) filter (where exists (
                select 1 from ${placementOfferStatusHistory}
                where ${placementOfferStatusHistory.offerId} = ${placementOffers.id}
                  and ${placementOfferStatusHistory.toStatus} = 'ACCEPTED'
              ))::int`,
            joined:
              sql<number>`count(distinct ${placementOffers.applicationId}) filter (where exists (
                select 1 from ${placementJoiningHistory}
                where ${placementJoiningHistory.offerId} = ${placementOffers.id}
                  and ${placementJoiningHistory.toStatus} = 'JOINED'
              ))::int`,
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
            inArray(placementJobs.status, ["DRAFT", "CLOSED"]),
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
        acceptedPending: sql<number>`count(*) filter (where ${placementOffers.status} = 'ACCEPTED' and ${placementJoiningOutcomes.status} = 'PENDING' and (${placementOffers.acceptanceChannel} is distinct from 'EXTERNAL_IMPORT' or ${placementOffers.cascadeId} is not null))::int`,
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
  const [[jobTotals], [applicationTotals], [resultTotals], [offerTotals], [actionTotals]] =
    await Promise.all([
      db.select({
        total: sql<number>`count(*)::int`,
        draft: sql<number>`count(*) filter (where ${placementJobs.status} = 'DRAFT')::int`,
        published: sql<number>`count(*) filter (where ${placementJobs.status} = 'PUBLISHED')::int`,
        closed: sql<number>`count(*) filter (where ${placementJobs.status} = 'CLOSED')::int`,
        cancelled: sql<number>`count(*) filter (where ${placementJobs.status} = 'CANCELLED')::int`,
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
        pendingJoining: sql<number>`count(*) filter (where ${placementOffers.status} = 'ACCEPTED' and ${placementJoiningOutcomes.status} = 'PENDING' and (${placementOffers.acceptanceChannel} is distinct from 'EXTERNAL_IMPORT' or ${placementOffers.cascadeId} is not null))::int`,
        joined: sql<number>`count(*) filter (where ${placementJoiningOutcomes.status} = 'JOINED')::int`,
      }).from(placementOffers)
        .innerJoin(placementApplications, eq(placementApplications.id, placementOffers.applicationId))
        .innerJoin(placementJobs, eq(placementJobs.id, placementApplications.jobId))
        .leftJoin(placementJoiningOutcomes, eq(placementJoiningOutcomes.offerId, placementOffers.id))
        .where(and(eq(placementJobs.collegeId, collegeId), isNull(placementJobs.archivedAt))),
      // One distinct, college-scoped count across ALL non-archived drives.
      // A job can have many action categories; per-job EXISTS avoids both
      // double counting and loading applications/offers into the process.
      // Unlike workQueue, this must not depend on the 60+20 card sample.
      db.select({
        count: sql<number>`count(*)::int`,
      }).from(placementJobs)
        .where(and(
          eq(placementJobs.collegeId, collegeId),
          isNull(placementJobs.archivedAt),
          ne(placementJobs.status, "CANCELLED"),
          sql`(
            ${placementJobs.status} = 'DRAFT'
            or (
              ${placementJobs.status} = 'PUBLISHED'
              and not exists (
                select 1 from placement_job_rounds r
                where r.job_id = ${placementJobs.id} and r.status <> 'CANCELLED'
              )
            )
            or (
              ${placementJobs.status} = 'PUBLISHED'
              and exists (
                select 1 from placement_job_rounds r
                where r.job_id = ${placementJobs.id} and r.status = 'PENDING'
              )
              and not exists (
                select 1 from placement_job_rounds r
                where r.job_id = ${placementJobs.id}
                  and r.status not in ('PENDING', 'CANCELLED')
              )
            )
            or exists (
              select 1 from placement_applications a
              join placement_application_screenings s on s.application_id = a.id
              where a.job_id = ${placementJobs.id} and a.status = 'SUBMITTED'
                and s.status in ('PENDING', 'HOLD')
            )
            or exists (
              select 1 from placement_round_results res
              join placement_job_rounds r on r.id = res.round_id
              where r.job_id = ${placementJobs.id} and res.status = 'STAGED'
            )
            or exists (
              select 1 from placement_offers o
              join placement_applications a on a.id = o.application_id
              where a.job_id = ${placementJobs.id} and o.status = 'ISSUED'
            )
            or exists (
              select 1 from placement_offers o
              join placement_applications a on a.id = o.application_id
              join placement_joining_outcomes jo on jo.offer_id = o.id
              where a.job_id = ${placementJobs.id}
                and o.status = 'ACCEPTED' and jo.status = 'PENDING'
                and (o.acceptance_channel is distinct from 'EXTERNAL_IMPORT'
                     or o.cascade_id is not null)
            )
            or (
              ${placementJobs.status} = 'PUBLISHED'
              and (
                exists (
                  select 1 from placement_offers o
                  join placement_applications a on a.id = o.application_id
                  where a.job_id = ${placementJobs.id}
                    and o.status in ('ISSUED', 'ACCEPTED')
                    and nullif(btrim(o.offer_letter_url), '') is null
                )
                or exists (
                  select 1 from placement_applications a
                  join placement_application_screenings s on s.application_id = a.id
                  where a.job_id = ${placementJobs.id} and a.status = 'SUBMITTED'
                    and s.status in ('PENDING', 'HOLD')
                    and a.submitted_at <= ${staleBefore}
                )
                or (
                  exists (
                    select 1 from placement_job_rounds r
                    where r.job_id = ${placementJobs.id}
                      and r.kind = 'INTERVIEW' and r.status <> 'CANCELLED'
                  )
                  and not exists (
                    select 1 from placement_job_rounds r
                    where r.job_id = ${placementJobs.id}
                      and r.kind = 'INTERVIEW' and r.status = 'SCHEDULED'
                  )
                  and exists (
                    select 1 from placement_applications a
                    join placement_application_screenings s on s.application_id = a.id
                    where a.job_id = ${placementJobs.id} and a.status = 'SUBMITTED'
                      and s.status = 'SHORTLISTED'
                  )
                )
                or (
                  ${placementJobs.openings} is not null
                  and ${placementJobs.applicationDeadline} > ${now}
                  and ${placementJobs.applicationDeadline} <= ${new Date(now.getTime() + 7 * 86400000)}
                  and (
                    select count(*) from placement_applications a
                    where a.job_id = ${placementJobs.id}
                      and a.status = 'SUBMITTED'
                  ) < ceil(${placementJobs.openings} / 2.0)
                )
              )
            )
          )`,
        )),
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


  // The Super Admin attention summary is an independent, college-scoped
  // read. Only capped sample rows leave PostgreSQL; window aggregates retain
  // exact drive and candidate counts across the entire selected college.
  // A failure must not hide the independently loaded drives and KPI tiles.
  type AttentionRow = {
    code: string; job_id: string; job_title: string; company_name: string;
    affected: number; category_jobs: number; category_affected: number;
  };
  const attentionRead = await db.execute(sql<AttentionRow>`
    with scoped_jobs as (
      select j.id, j.title, j.status, j.application_deadline, j.openings,
             c.name as company_name
        from placement_jobs j
        join placement_company_relationships rel on rel.id = j.company_relationship_id
        join placement_companies c on c.id = rel.company_id
       where j.college_id = ${collegeId} and j.archived_at is null
    ),
    applications as (
      select a.job_id,
             count(*) filter (where a.status = 'SUBMITTED')::int as submitted,
             count(*) filter (where a.status = 'SUBMITTED' and s.status = 'SHORTLISTED')::int as shortlisted,
             count(*) filter (
               where a.status = 'SUBMITTED' and s.status in ('PENDING','HOLD')
                 and a.submitted_at <= ${staleBefore}
             )::int as stale
        from placement_applications a
        join scoped_jobs j on j.id = a.job_id
        left join placement_application_screenings s on s.application_id = a.id
       group by a.job_id
    ),
    interviews as (
      select r.job_id,
             count(*) filter (where r.kind = 'INTERVIEW' and r.status <> 'CANCELLED')::int as interviews,
             count(*) filter (where r.kind = 'INTERVIEW' and r.status = 'SCHEDULED')::int as scheduled
        from placement_job_rounds r join scoped_jobs j on j.id = r.job_id
       group by r.job_id
    ),
    missing_letters as (
      select a.job_id, count(*)::int as missing
        from placement_offers o
        join placement_applications a on a.id = o.application_id
        join scoped_jobs j on j.id = a.job_id
       where o.status in ('ISSUED','ACCEPTED')
         and nullif(btrim(o.offer_letter_url),'') is null
       group by a.job_id
    ),
    candidates as (
      select 'STALE_APPLICATIONS'::text as code,
             j.id as job_id, j.title as job_title, j.company_name,
             coalesce(a.stale,0) as affected
        from scoped_jobs j left join applications a on a.job_id = j.id
       where j.status = 'PUBLISHED' and coalesce(a.stale,0) > 0
      union all
      select 'INTERVIEW_UNSCHEDULED', j.id, j.title, j.company_name,
             coalesce(a.shortlisted,0)
        from scoped_jobs j
        left join applications a on a.job_id = j.id
        left join interviews i on i.job_id = j.id
       where j.status = 'PUBLISHED' and coalesce(a.shortlisted,0)>0
         and coalesce(i.interviews,0)>0 and coalesce(i.scheduled,0)=0
      union all
      select 'OFFERED_NO_LETTER', j.id, j.title, j.company_name,
             coalesce(o.missing,0)
        from scoped_jobs j left join missing_letters o on o.job_id = j.id
       where coalesce(o.missing,0)>0 and j.status <> 'CANCELLED'
      union all
      select 'CLOSING_SOON_LOW_CONVERSION', j.id, j.title, j.company_name,
             greatest(1,coalesce(a.submitted,0))
        from scoped_jobs j left join applications a on a.job_id = j.id
       where j.status = 'PUBLISHED' and j.openings is not null
         and j.application_deadline > ${now}
         and j.application_deadline <= ${new Date(now.getTime()+7*86400000)}
         and coalesce(a.submitted,0) < ceil(j.openings / 2.0)
    ),
    ranked as (
      select code,job_id,job_title,company_name,affected,
             count(*) over(partition by code)::int as category_jobs,
             sum(affected) over(partition by code)::int as category_affected,
             row_number() over(partition by code
               order by affected desc,job_title asc,job_id asc) as rn
        from candidates
    )
    select code,job_id,job_title,company_name,affected,category_jobs,category_affected
      from ranked where rn<=3
      order by code,rn
  `).then(result=>result.rows).catch(()=>null);
  const attentionCodes = [
    "STALE_APPLICATIONS", "INTERVIEW_UNSCHEDULED",
    "OFFERED_NO_LETTER", "CLOSING_SOON_LOW_CONVERSION",
  ] as const;
  const attentionCategories = attentionCodes.map(code => {
    const rows = (attentionRead ?? []).filter(row => row.code === code);
    return {
      code,
      jobs: Number(rows[0]?.category_jobs ?? 0),
      affected: Number(rows[0]?.category_affected ?? 0),
      samples: rows.map(row => ({
        code, jobId: row.job_id, jobTitle: row.job_title,
        companyName: row.company_name, count: Number(row.affected),
        priority: (code === "STALE_APPLICATIONS" ||
          code === "OFFERED_NO_LETTER" ? "HIGH" : "MEDIUM") as QueuePriority,
      })),
    };
  });
  // Avoid mixing sample size (three per category), number of flagged drives,
  // and the number of affected learners. Keep each metric separately exposed.
  // The existing workQueue is a dashboard sample; consumer UI must switch to
  // attention.categories for exact category counts and distinct empty/error UI.
  const attention = {
    available: attentionRead !== null,
    error: attentionRead === null ?
      "Couldn't check for anything that needs attention." : null,
    categories: attentionCategories,
  };

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
      cancelledJobs: Number(jobTotals?.cancelled ?? 0),
      // Dashboard samples contain up to 60 newest published jobs and 20
      // other jobs, but these totals include every non-archived college job.
      // Active=PUBLISHED, draft=DRAFT, closed=CLOSED; CANCELLED is separate.
      submittedApplications: Number(applicationTotals?.submitted ?? 0),
      pendingScreening: Number(applicationTotals?.pending ?? 0),
      stagedResults: Number(resultTotals?.staged ?? 0),
      issuedOffers: Number(offerTotals?.issued ?? 0),
      acceptedPendingJoining: Number(offerTotals?.pendingJoining ?? 0),
      joinedOffers: Number(offerTotals?.joined ?? 0),
      // Active drive means a published drive, not the number of its
      // scheduled rounds. A single drive can schedule several rounds.
      activeDrives: Number(jobTotals?.published ?? 0),
      jobsNeedingAttention: Number(actionTotals?.count ?? 0),
    },
    workQueue,
    attention,
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
    submitted: sql<number>`count(*) filter (where ${placementApplications.status} = 'SUBMITTED')::int`,
    applicants: sql<number>`count(*)::int`,
  }).from(placementApplications)
    .innerJoin(placementJobs, eq(placementJobs.id, placementApplications.jobId))
    .where(and(
      eq(placementJobs.collegeId, collegeId),
      isNull(placementJobs.archivedAt),
      inArray(placementApplications.jobId, ids),
    )).groupBy(placementApplications.jobId);
  const countsByJob = new Map(counts.map(row => [row.jobId, {
    submitted:Number(row.submitted),applicants:Number(row.applicants),
  }] as const));
  return {
    total, totalPages, page, pageSize: filters.pageSize,
    items: rows.map(({job, company}) => ({
      job: {
        id: job.id, title: job.title, status: job.status,
        applicationDeadline: job.applicationDeadline,
        employmentType: job.employmentType,
        locations: job.locations,
        publishedAt: job.publishedAt,
        createdAt: job.createdAt,
        jobTypeLabel: job.jobTypeLabel,
        company: {id: company.id, name: company.name},
      },
      company: {id: company.id, name: company.name},
      metrics: {submittedApplications: countsByJob.get(job.id)?.submitted ?? 0,
        applicants:countsByJob.get(job.id)?.applicants ?? 0},
    })),
  };
}
