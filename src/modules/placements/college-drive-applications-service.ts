import "server-only";

import { and, asc, count, eq, exists, ilike, isNull, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships, learnerProfiles, placementApplications, placementApplicationScreenings,
  placementJobRoleOptions, placementJobs, users,
  cohorts, departments, learnerProgramEnrollments, programs, colleges,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import {placementCollegeApplicationStages} from "@/db/schema/placement-college-application-stages";
import { PlacementsServiceError } from "./errors";
import { placementReportCsv } from "./report-model";
import { requireCollegePlacementAdmin } from "./college-drive-read-service";
import { collegeDriveIdSchema } from "./college-drive-read-model";
import {
  driveApplicationsQuerySchema, DRIVE_APPLICATIONS_PAGE_SIZE,
  DRIVE_APPLICATION_EXPORT_CAP, DRIVE_APPLICATION_BULK_CAP,
} from "./college-drive-applications-model";

function pattern(value: string) {
  return "%" + value.replace(/[\\%_]/g, "\\$&") + "%";
}

export async function listCollegeDriveApplications(
  context: RequestContext,
  jobIdInput: unknown,
  raw: unknown,
  options: { exportAll?: boolean; bulkAll?: boolean } = {},
) {
  const jobId = collegeDriveIdSchema.parse(jobIdInput);
  const query = driveApplicationsQuerySchema.parse(raw);
  const collegeId = await requireCollegePlacementAdmin(context);
  const db = getDb();
  const [drive] = await db.select({ id: placementJobs.id, title: placementJobs.title })
    .from(placementJobs).where(and(
      eq(placementJobs.id, jobId), eq(placementJobs.collegeId, collegeId),
    )).limit(1);
  if (!drive) throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");

  const base = db.select({
    id: placementApplications.id,
    name: users.displayName,
    email: users.email,
    collegeName: colleges.name,
    ageDays: sql<number>`greatest(0,floor(extract(epoch from (now() - ${placementApplications.submittedAt}))/86400))::integer`.as("age_days"),
    source: placementApplications.channel,
    rollNumber: learnerProfiles.rollNumber,
    roleTitle: placementJobRoleOptions.title,
    status: placementApplications.status,
    screening: sql<string | null>`${placementApplicationScreenings.status}`.as("screening_status"),
    submittedAt: placementApplications.submittedAt,
    stage: sql<string>`case when ${placementApplications.status} = 'WITHDRAWN' then 'WITHDRAWN' else coalesce(${placementCollegeApplicationStages.stage}, case when ${placementApplicationScreenings.status} = 'SHORTLISTED' then 'SHORTLISTED' when ${placementApplicationScreenings.status} = 'REJECTED' then 'REJECTED' else 'APPLIED' end) end`.as("college_stage"),
    stageVersion: placementCollegeApplicationStages.version,
    previousStage: placementCollegeApplicationStages.previousStage,
  }).from(placementApplications)
    .innerJoin(collegeMemberships, and(
      eq(collegeMemberships.id, placementApplications.membershipId),
      eq(collegeMemberships.collegeId, collegeId),
    ))
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .innerJoin(colleges, eq(colleges.id, collegeMemberships.collegeId))
    .innerJoin(placementJobRoleOptions, and(
      eq(placementJobRoleOptions.id, placementApplications.roleOptionId),
      eq(placementJobRoleOptions.jobId, jobId),
    ))
    .leftJoin(learnerProfiles, eq(learnerProfiles.membershipId, collegeMemberships.id))
    .leftJoin(placementApplicationScreenings, eq(placementApplicationScreenings.applicationId, placementApplications.id))
    .leftJoin(placementCollegeApplicationStages, and(eq(placementCollegeApplicationStages.applicationId, placementApplications.id),eq(placementCollegeApplicationStages.jobId,jobId)))
    .where(and(
      eq(placementApplications.jobId, jobId),
      query.status === "ALL" ? undefined : eq(placementApplications.status, query.status),
      query.source === "ALL" ? undefined : eq(placementApplications.channel,query.source),
      query.departmentId||query.programId||query.cohortId ? exists(
        db.select({id:learnerProgramEnrollments.id}).from(learnerProgramEnrollments)
          .innerJoin(cohorts,eq(cohorts.id,learnerProgramEnrollments.cohortId))
          .innerJoin(programs,eq(programs.id,learnerProgramEnrollments.programId))
          .innerJoin(departments,eq(departments.id,programs.departmentId))
          .where(and(eq(learnerProgramEnrollments.membershipId,collegeMemberships.id),
            eq(learnerProgramEnrollments.status,"ACTIVE"),
            eq(departments.collegeId,collegeId),
            query.departmentId?eq(departments.id,query.departmentId):undefined,
            query.programId?eq(programs.id,query.programId):undefined,
            query.cohortId?eq(cohorts.id,query.cohortId):undefined,
          ))) : undefined,
      query.screening === "ALL" ? undefined
        : query.screening === "UNRECORDED" ? isNull(placementApplicationScreenings.applicationId)
        : eq(placementApplicationScreenings.status, query.screening),
      query.q ? or(
        ilike(users.displayName, pattern(query.q)),
        ilike(users.email, pattern(query.q)),
        ilike(learnerProfiles.rollNumber, pattern(query.q)),
        ilike(placementJobRoleOptions.title, pattern(query.q)),
      ) : undefined,
    )).as("college_scoped_applicants_base");
  const source = db.select().from(base).where(query.stage==="ALL"?
    undefined:eq(base.stage,query.stage)).as("college_scoped_applicants");

  const [totalRows, items, stageCountRows] = await Promise.all([
    db.select({ total: count() }).from(source),
    db.select().from(source).orderBy(asc(source.name), asc(source.id))
      .limit(options.bulkAll ? DRIVE_APPLICATION_BULK_CAP + 1 : options.exportAll ? DRIVE_APPLICATION_EXPORT_CAP : DRIVE_APPLICATIONS_PAGE_SIZE)
      .offset(options.exportAll || options.bulkAll ? 0 : (query.page - 1) * DRIVE_APPLICATIONS_PAGE_SIZE),
    db.select({stage:base.stage,total:count()}).from(base).groupBy(base.stage),
  ]);
  const total = totalRows[0]?.total ?? 0;
  return { drive, query, items, total,
    stageCounts:Object.fromEntries(stageCountRows.map(row=>[row.stage,row.total])),
    truncated: options.exportAll && total > DRIVE_APPLICATION_EXPORT_CAP,
    totalPages: Math.max(1, Math.ceil(total / DRIVE_APPLICATIONS_PAGE_SIZE)),
  };
}

/** A bounded, neutralized export of exactly the columns present in the College Admin roster. */
export async function exportCollegeDriveApplicationsCsv(
  context: RequestContext, jobId: unknown, raw: unknown,
) {
  const data = await listCollegeDriveApplications(context, jobId, raw, { exportAll: true });
  const headings = ["Student name","Email","College","Roll number","Role option","Source","Pipeline stage","Application status","Screening status","Submitted at","Age (days)"];
  const rows: (string | number | null)[][] = data.items.map(item => [
    item.name ?? "",item.email,item.collegeName,item.rollNumber,item.roleTitle,item.source,item.stage,item.status,
    item.screening ?? "Not recorded",item.submittedAt.toISOString(),item.ageDays,
  ]);
  if (data.truncated) {
    rows.push(["TRUNCATED — export capped at " + DRIVE_APPLICATION_EXPORT_CAP + " of " + data.total + " matching rows",
      "", "", "", "", "", "", "", "", "", "", ""]);
  }
  return { csv: "\uFEFF" + placementReportCsv(headings, rows),
    truncated: data.truncated, exported: data.items.length, total: data.total };
}
