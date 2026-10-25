import "server-only";

import {
  and,
  count,
  desc,
  eq,
  inArray,
  isNull,
  sql,
} from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  collegeMemberships,
  users,
  placementApplications,
  placementJobs,
  placementOffers,
  placementJoiningOutcomes,
} from "@/db/schema";

import type {
  RequestContext,
} from "@/modules/identity/context";
import {
  requirePermission,
} from "@/modules/permissions/policy";

import {
  buildRecruiterCompanyReportRows,
  recruiterCompanyReportsQuerySchema,
  summarizeRecruiterReportPortfolio,
  clampRecruiterCompanyReportPage,
} from "./recruiter-company-reports-model";
import {
  getRecruiterCompanyTeam,
} from "./recruiter-company-team-service";

/**
 * Read-only employer hiring report.
 *
 * The established recruiter company/team service resolves the
 * recruiter's persisted active grant and checks its company
 * relationship. It deliberately returns CHOOSE_COLLEGE when
 * several grants exist and no college is selected.
 *
 * Every reporting query additionally restricts:
 * - college ID;
 * - exact granted company relationship;
 * - recruiter-visible PUBLISHED/CLOSED jobs.
 *
 * The central placement recruiter permission is checked
 * against the resolved grant before reporting queries.
 *
 * This service never reads the unmigrated registration,
 * external-offer, message or TPO collaboration tables.
 */
export async function getRecruiterCompanyReports(
  context: RequestContext,
  rawQuery: unknown = {},
) {
  const query =
    recruiterCompanyReportsQuerySchema.parse(rawQuery);

  const companyScope = await getRecruiterCompanyTeam(
    context,
    query.collegeId,
  );

  if (companyScope.status !== "READY") {
    return {
      status: companyScope.status,
      query,
      choices: companyScope.choices,
    };
  }

  const collegeId = companyScope.grant.collegeId;
  const relationshipId =
    companyScope.grant.companyRelationshipId;

  requirePermission(
    context,
    "placements.recruiter.read",
    {
      collegeId,
      placementCompanyRelationshipId: relationshipId,
    },
  );

  const db = getDb();

  const visibleCondition = and(
    eq(placementJobs.collegeId, collegeId),
    eq(
      placementJobs.companyRelationshipId,
      relationshipId,
    ),
    inArray(
      placementJobs.status,
      ["PUBLISHED", "CLOSED"],
    ),
    // Keep summary, paginated jobs and the SQL funnel on the same
    // non-archived employer-visible portfolio.
    isNull(placementJobs.archivedAt),
  );

  const selectedCondition =
    query.status === "ALL"
      ? visibleCondition
      : and(
          visibleCondition,
          eq(placementJobs.status, query.status),
        );

  const [portfolioCounts, selectedCounts] = await Promise.all([
    db
      .select({
        total: count(),
        published: sql<number>`
          count(*) filter (
            where ${placementJobs.status} = 'PUBLISHED'
          )::integer
        `,
        closed: sql<number>`
          count(*) filter (
            where ${placementJobs.status} = 'CLOSED'
          )::integer
        `,
      })
      .from(placementJobs)
      .where(visibleCondition),

    db
      .select({
        total: count(),
      })
      .from(placementJobs)
      .where(selectedCondition)
  ]);
  const selectedTotal=Number(selectedCounts[0]?.total??0);
  const effectivePage=clampRecruiterCompanyReportPage(
    query.page,selectedTotal,query.pageSize,
  );
  const pageJobs=await
    db
      .select({
        id: placementJobs.id,
        title: placementJobs.title,
        status: placementJobs.status,
        employmentType: placementJobs.employmentType,
        publishedAt: placementJobs.publishedAt,
        closedAt: placementJobs.closedAt,
      })
      .from(placementJobs)
      .where(selectedCondition)
      .orderBy(
        desc(placementJobs.createdAt),
        desc(placementJobs.id),
      )
      .limit(query.pageSize)
      .offset(
        (effectivePage - 1) * query.pageSize,
      );
  
  const jobIds = pageJobs.map((job) => job.id);

  /**
   * Report only active college members with active platform accounts.
   * Authorization remains scoped by the granted college and relationship.
   *
   * Multiple offer versions are separate persisted offer
   * rows. ISSUED means currently outstanding, not
   * "all offers ever issued"; ACCEPTED means the row's
   * current persisted status.
   */
  const reportCounts = jobIds.length === 0
    ? []
    : await db
        .select({
          jobId: placementApplications.jobId,
          applications: sql<number>`
            count(
              distinct ${placementApplications.id}
            )::integer
          `,
          submittedApplications: sql<number>`
            count(
              distinct ${placementApplications.id}
            ) filter (
              where ${placementApplications.status}
                = 'SUBMITTED'
            )::integer
          `,
          withdrawnApplications: sql<number>`
            count(
              distinct ${placementApplications.id}
            ) filter (
              where ${placementApplications.status}
                = 'WITHDRAWN'
            )::integer
          `,
          outstandingOffers: sql<number>`
            count(
              distinct ${placementOffers.id}
            ) filter (
              where ${placementOffers.status}
                = 'ISSUED'
            )::integer
          `,
          acceptedOffers: sql<number>`
            count(distinct ${placementOffers.id})
              filter (where ${placementOffers.status} = 'ACCEPTED')::integer
          `,
          declinedOffers: sql<number>`
            count(distinct ${placementOffers.id})
              filter (where ${placementOffers.status} = 'DECLINED')::integer
          `,
          joinedOffers: sql<number>`
            count(distinct ${placementOffers.id})
              filter (where ${placementOffers.status} = 'ACCEPTED'
                and ${placementJoiningOutcomes.status} = 'JOINED')::integer
          `,
        })
        .from(placementApplications)
        .innerJoin(
          collegeMemberships,
          and(
            eq(
              collegeMemberships.id,
              placementApplications.membershipId,
            ),
            eq(
              collegeMemberships.collegeId,
              collegeId,
            ),
          ),
        )
        .innerJoin(users,and(
          eq(users.id,collegeMemberships.userId),
        ))
        .leftJoin(
          placementOffers,
          eq(placementOffers.applicationId,placementApplications.id),
        )
        .leftJoin(
          placementJoiningOutcomes,
          eq(placementJoiningOutcomes.offerId,placementOffers.id),
        )
        .where(
          inArray(
            placementApplications.jobId,
            jobIds,
          ),
        )
        .groupBy(
          placementApplications.jobId,
        );

  // The prototype's CLEARED column means applicants who have applied PASS
  // outcomes in every completed evaluative round of this employer drive.
  // Scheduled or pending rounds must not reduce the count; when no evaluative
  // round is completed, NULL is honest and safer than inventing a zero.
  // Only job IDs from the already authorized, paginated company/college query
  // enter this aggregate. Never materialize student names or unshared notes.
  const clearedRows=jobIds.length?await db.execute<{
    jobId:string;cleared:number;
  }>(sql`
    with completed as (
      select r.id,r.job_id
      from placement_job_rounds r
      where r.job_id in (${sql.join(jobIds.map(id=>sql`${id}::uuid`),sql`,`)})
        and r.status='COMPLETED'
        and r.kind in ('TEST','VENDOR_TEST','GD','INTERVIEW')
    ), totals as (
      select job_id,count(*)::int as required
      from completed group by job_id
    ), passing as (
      select r.job_id,results.application_id,count(distinct r.id)::int as passed
      from completed r
      join placement_round_results results on results.round_id=r.id
        and results.status='APPLIED' and results.outcome='PASS'
      join placement_applications application on application.id=results.application_id
        and application.job_id=r.job_id
      join college_memberships membership on membership.id=application.membership_id
        and membership.college_id=${collegeId}::uuid
      group by r.job_id,results.application_id
    )
    select totals.job_id as "jobId",
      count(passing.application_id) filter
        (where passing.passed=totals.required)::int as cleared
    from totals left join passing on passing.job_id=totals.job_id
    group by totals.job_id,totals.required
  `).then(value=>value.rows).catch(()=>[]):[];
  const clearedByJob=new Map(clearedRows.map(row=>[row.jobId,Number(row.cleared)]));

  const summaryRecord = portfolioCounts[0];

  const summary = summarizeRecruiterReportPortfolio({
    total: Number(summaryRecord?.total ?? 0),
    published: Number(
      summaryRecord?.published ?? 0,
    ),
    closed: Number(
      summaryRecord?.closed ?? 0,
    ),
  });


  // Entire authorized employer-college portfolio, independent of pagination.
  // Preserve historical job-funnel outcomes after graduation, account
  // suspension or college transfer. Employment outcomes are immutable
  // events: active status is not a condition for employer aggregate reads.
  // Job and college relationship authorization still bound the entire query.
  // Return counts only; never materialize private candidate information.
  const funnelRows=await db.execute<{
    applied:number;shortlisted:number;assessment:number;interview:number;
    offered:number;hired:number;
  }>(sql`
    with jobs as (
      select id from placement_jobs
      where college_id=${collegeId}::uuid
        and company_relationship_id=${relationshipId}::uuid
        and status in ('PUBLISHED','CLOSED') and archived_at is null
    ),
    applicants as (
      select a.id,a.status from placement_applications a
      join jobs j on j.id=a.job_id
      join college_memberships m on m.id=a.membership_id
        and m.college_id=${collegeId}::uuid
      join users u on u.id=m.user_id
    )
    select
      (select count(*)::int from applicants) as applied,
      (select count(distinct a.id)::int from applicants a
        join placement_application_screenings s on s.application_id=a.id
        where s.status='SHORTLISTED') as shortlisted,
      (select count(distinct a.id)::int from applicants a
        join placement_round_results r on r.application_id=a.id
        join placement_job_rounds p on p.id=r.round_id
        join jobs j on j.id=p.job_id
        where p.kind in ('TEST','VENDOR_TEST','GD') and r.status='APPLIED') as assessment,
      (select count(distinct a.id)::int from applicants a
        join placement_round_results r on r.application_id=a.id
        join placement_job_rounds p on p.id=r.round_id
        join jobs j on j.id=p.job_id
        where p.kind='INTERVIEW' and r.status='APPLIED') as interview,
      (select count(distinct a.id)::int from applicants a
        join placement_offers o on o.application_id=a.id
        where o.status in ('ISSUED','ACCEPTED','DECLINED')) as offered,
      (select count(distinct a.id)::int from applicants a
        join placement_offers o on o.application_id=a.id
        join placement_joining_outcomes j on j.offer_id=o.id
        where j.status='JOINED' and o.status='ACCEPTED') as hired
  `);
  const totalFunnel=funnelRows.rows[0]??{applied:0,shortlisted:0,assessment:0,
    interview:0,offered:0,hired:0};

  const matchedTotal = selectedTotal;
  // Unlike the legacy unbounded table, pages stay bounded even for a
  // 200+ drive portfolio. The summary and funnel above use the whole
  // authorized relationship, independent of the current page or filter.
  const startRow=matchedTotal?(effectivePage-1)*query.pageSize+1:0;
  const endRow=Math.min(matchedTotal,effectivePage*query.pageSize);

  return {
    status: "READY" as const,
    query,
    choices: companyScope.choices,
    grant: companyScope.grant,
    company: {
      id: companyScope.company.id,
      name: companyScope.company.name,
    },
    summary,
    // Legacy /recruiter/colleges/{collegeId}/reports maps to this self-scoped
    // summary + paged jobs contract. Individual recruiter attribution was
    // not persisted in all vNext jobs, so these are company-wide totals.
    reportingScope:"COMPANY_COLLEGE" as const,
    reportingScopeLabel:"All company drives with this college",
    paginationNotice:"Showing authorized company drives in pages of up to 50. Export CSV includes the complete matching report.",
    firstRow:startRow,lastRow:endRow,
    funnel:totalFunnel,
    matchedTotal,
    page: effectivePage,
    pageSize: query.pageSize,
    totalPages: Math.ceil(
      matchedTotal / query.pageSize,
    ),
    jobs: buildRecruiterCompanyReportRows(
      pageJobs,
      reportCounts.map((record) => ({
        jobId: record.jobId,
        applications: Number(record.applications),
        submittedApplications: Number(
          record.submittedApplications,
        ),
        withdrawnApplications: Number(
          record.withdrawnApplications,
        ),
        outstandingOffers: Number(
          record.outstandingOffers,
        ),
        acceptedOffers: Number(record.acceptedOffers),
        declinedOffers: Number(record.declinedOffers),
        joinedOffers: Number(record.joinedOffers),
        cleared:clearedByJob.get(record.jobId)??null,
      })),
    ),
  };
}
