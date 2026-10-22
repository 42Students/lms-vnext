import "server-only";

import { and, asc, desc, count, eq, exists, gte, lte, ilike, isNull, lt, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  collegeMemberships, learnerProfiles, placementApplications, placementApplicationScreenings,
  placementJobRoleOptions, placementJobs, placementCompanies, placementCompanyRelationships, users,
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

const LEGACY_CSV_EXPORT_CAP=20_000;
function pattern(value: string) {
  return "%" + value.replace(/[\\%_]/g, "\\$&") + "%";
}

export async function listCollegeDriveApplications(
  context: RequestContext,
  jobIdInput: unknown,
  raw: unknown,
  options: { exportAll?: boolean; bulkAll?: boolean; pageSize?: number;exportCap?:number;
    sort?:"AGE_ASC"|"AGE_DESC"|"SCORE_ASC"|"SCORE_DESC"|"SUBMITTED_DESC"; } = {},
) {
  const jobId = collegeDriveIdSchema.parse(jobIdInput);
  const query = driveApplicationsQuerySchema.parse(raw);
  if(query.appliedFrom && query.appliedTo && query.appliedFrom>query.appliedTo)
    throw new z.ZodError([{code:"custom",path:["appliedTo"],
      message:"Applied before must not precede Applied after."}]);
  const appliedFrom=query.appliedFrom?new Date(`${query.appliedFrom}T00:00:00+05:30`):null;
  const appliedTo=query.appliedTo?new Date(new Date(`${query.appliedTo}T00:00:00+05:30`).getTime()+86_400_000):null;
  const collegeId = await requireCollegePlacementAdmin(context);
  const db = getDb();
  const requestedPageSize=options.pageSize??query.size??DRIVE_APPLICATIONS_PAGE_SIZE;
  const pageSize = !Number.isFinite(requestedPageSize)
    ?DRIVE_APPLICATIONS_PAGE_SIZE
    :Math.max(1,Math.min(100,Math.floor(requestedPageSize)));
  // Only the audited legacy CSV adapter may request the historic 20k cap.
  const exportCap=options.exportCap===LEGACY_CSV_EXPORT_CAP?
    LEGACY_CSV_EXPORT_CAP:DRIVE_APPLICATION_EXPORT_CAP;
  const [drive] = await db.select({ id: placementJobs.id, title: placementJobs.title,
    companyName: placementCompanies.name, legacyJobId: placementJobs.legacyJobId,
  }).from(placementJobs)
    .innerJoin(placementCompanyRelationships,eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId))
    .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
    .where(and(
      eq(placementJobs.id, jobId), eq(placementJobs.collegeId, collegeId),
    )).limit(1);
  if (!drive) throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");

  const base = db.select({
    id: placementApplications.id,
    legacyApplicationId: placementApplications.legacyApplicationId,
    membershipId: placementApplications.membershipId,
    submittedByUserId: placementApplications.submittedByUserId,
    submittedByName: sql<string | null>`(select actor.display_name from users actor where actor.id = ${placementApplications.submittedByUserId})`.as("submitted_by_name"),
    // Use applied, unsuperseded round evidence rather than inventing an automated score.
    screeningScore:sql<number|null>`(select max(rr.score_percent)::double precision
      from placement_round_results rr where rr.application_id=${placementApplications.id}
      and rr.status='APPLIED' and rr.superseded_at is null)`.as("screening_score"),
    partialScore: sql<number | null>`null::integer`.as("partial_score"),
    screeningReason: placementApplicationScreenings.internalReason,
    name: users.displayName,
    legacyFirstName:users.legacyFirstName,
    legacyLastName:users.legacyLastName,
    legacyLearnerId:learnerProfiles.legacyLearnerId,
    email: users.email,
    collegeName: colleges.name,
    lastStatusUpdatedAt:sql<Date>`greatest(${placementApplications.submittedAt},${placementApplications.statusUpdatedAt},${placementCollegeApplicationStages.movedAt},${placementApplicationScreenings.updatedAt})`.as("last_status_updated_at"),
    // A stage move or application status update resets Age, but never rewrites submission time.
    ageDays: sql<number>`greatest(0,floor(extract(epoch from (now() - greatest(${placementApplications.submittedAt},${placementApplications.statusUpdatedAt},${placementCollegeApplicationStages.movedAt},${placementApplicationScreenings.updatedAt})))/86400))::integer`.as("age_days"),
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
      appliedFrom?gte(placementApplications.submittedAt,appliedFrom):undefined,
      appliedTo?lt(placementApplications.submittedAt,appliedTo):undefined,
      query.status === "ALL" ? undefined : eq(placementApplications.status, query.status),
      query.attention==="OFFERED_NO_LETTER"?
        sql`exists(select 1 from placement_offers o where o.application_id=${placementApplications.id}
          and o.status in ('ISSUED','ACCEPTED')
          and (o.offer_letter_url is null or trim(o.offer_letter_url)=''))`:
      query.attention==="INTERVIEW_UNSCHEDULED"?
        sql`coalesce(${placementCollegeApplicationStages.stage},'APPLIED')='INTERVIEW'
          and not exists(select 1 from placement_round_candidate_slots s
            where s.job_id=${placementApplications.jobId}
              and s.application_id=${placementApplications.id} and s.status='BOOKED')`:
      query.attention==="STALE_APPLICATIONS"?
        and(eq(placementApplications.status,"SUBMITTED"),
          sql`coalesce(${placementCollegeApplicationStages.stage},
            case when ${placementApplicationScreenings.status}='SHORTLISTED' then 'SHORTLISTED'
              when ${placementApplicationScreenings.status}='REJECTED' then 'REJECTED'
              else 'APPLIED' end)='APPLIED'`,
          lt(placementApplications.submittedAt,new Date(Date.now()-7*86400000))):undefined,
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
      query.skills?sql`exists(select 1 from jsonb_array_elements(
        case when jsonb_typeof(${learnerProfiles.profileDocument}->'skills')='array'
          then ${learnerProfiles.profileDocument}->'skills' else '[]'::jsonb end
        ) skill(value) where coalesce(skill.value->>'name',
          skill.value->>'skill',skill.value#>>'{}','') ilike ${pattern(query.skills)})`:undefined,
      query.screening === "ALL" ? undefined
        : query.screening === "UNRECORDED" ? isNull(placementApplicationScreenings.applicationId)
        : eq(placementApplicationScreenings.status, query.screening),
      query.q && ![drive.title,drive.companyName].some(value=>
        value.toLocaleLowerCase("en-IN").includes(query.q.toLocaleLowerCase("en-IN"))) ? or(
        ilike(users.displayName, pattern(query.q)),
        ilike(users.legacyFirstName, pattern(query.q)),
        ilike(users.legacyLastName, pattern(query.q)),
        sql`concat_ws(' ',nullif(trim(${users.legacyFirstName}),''),
          nullif(trim(${users.legacyLastName}),'')) ilike ${pattern(query.q)}`,
        ilike(users.email, pattern(query.q)),
        ilike(learnerProfiles.rollNumber, pattern(query.q)),
        ilike(placementJobRoleOptions.title, pattern(query.q)),
      ) : undefined,
    )).as("college_scoped_applicants_base");
  const source=db.select().from(base).where(and(
    query.stage==="ALL"?undefined:eq(base.stage,query.stage),
    query.minScore===undefined?undefined:gte(base.screeningScore,query.minScore),
    query.maxScore===undefined?undefined:lte(base.screeningScore,query.maxScore),
  )).as("college_scoped_applicants");

  // Every order ends in a stable application UUID to prevent rows changing
  // positions between pages when score or status age ties.
  const requestedSort=options.sort??query.sort;
  // Age is elapsed days: newest stage updates are youngest and sort first ASC.
  const order=requestedSort==="AGE_ASC"?[desc(source.lastStatusUpdatedAt),asc(source.id)]:
    requestedSort==="AGE_DESC"?[asc(source.lastStatusUpdatedAt),asc(source.id)]:
    requestedSort==="SCORE_ASC"?[sql`${source.screeningScore} asc nulls first`,desc(source.submittedAt),asc(source.id)]:
    requestedSort==="SCORE_DESC"?[sql`${source.screeningScore} desc nulls last`,desc(source.submittedAt),asc(source.id)]:
    [desc(source.submittedAt),asc(source.id)];
  const [totalRows, items, stageCountRows] = await Promise.all([
    db.select({ total: count() }).from(source),
    db.select().from(source).orderBy(...order)
      .limit(options.bulkAll ? DRIVE_APPLICATION_BULK_CAP + 1 : options.exportAll ? exportCap : pageSize)
      .offset(options.exportAll || options.bulkAll ? 0 : (query.page - 1) * pageSize),
    db.select({stage:base.stage,total:count()}).from(base).groupBy(base.stage),
  ]);
  const total = totalRows[0]?.total ?? 0;
  const shortAppliedDate=new Intl.DateTimeFormat("en-GB",{
    timeZone:"Asia/Kolkata",day:"2-digit",month:"short",year:"numeric",
  });
  return { drive, query, items:items.map(item=>({
    ...item,name:item.name??"",
    appliedDateIst:shortAppliedDate.format(item.submittedAt),
    ageLabel:item.ageDays===0?"today":item.ageDays+"d",
    ageDotColor:item.ageDays>=14?"#ad6800":item.ageDays>=7?"#8c8c8c":"#d9d9d9",
  })), total,
    pageSize,scoreSortAvailable:true as const,
    stageCounts:Object.fromEntries(stageCountRows.map(row=>[row.stage,row.total])),
    truncated: options.exportAll && total > exportCap,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
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
      "", "", "", "", "", "", "", "", "", ""]);
  }
  return { csv: "\uFEFF" + placementReportCsv(headings, rows),
    truncated: data.truncated, exported: data.items.length, total: data.total };
}


/** 0-based paging and the legacy ASSESSMENT default are confined to this
 * compatibility adapter. The canonical vNext college roster stays 1-based
 * and never interprets a stage as an offer or automated score. */
export const legacyCollegeApplicationsQuerySchema=z.object({
 page:z.coerce.number().int().transform(page=>Math.max(0,Math.min(999,page))).default(0),
 size:z.coerce.number().int().transform(size=>size<=0?20:Math.min(100,size)).default(20),
 sort:z.enum(["AGE_ASC","AGE_DESC","SCORE_ASC","SCORE_DESC","SUBMITTED_DESC"]).optional(),
 applicationStatus:z.enum(["ALL","APPLIED","SHORTLISTED","ASSESSMENT",
  "INTERVIEW","WAITLISTED","OFFERED","HIRED","REJECTED","WITHDRAWN"]).default("ASSESSMENT"),
 status:z.enum(["ALL","SUBMITTED","WITHDRAWN"]).default("ALL"),
 source:z.enum(["ALL","INTERNAL","EXTERNAL"]).default("ALL"),
 q:z.string().trim().max(100).default(""),
 departmentId:z.string().uuid().optional(),
 programId:z.string().uuid().optional(),
 cohortId:z.string().uuid().optional(),
}).strict();

export async function listLegacyCollegeDriveApplications(
 context:RequestContext,jobId:unknown,raw:unknown,
){
 const query=legacyCollegeApplicationsQuerySchema.parse(raw);
 const filters={
  stage:query.applicationStatus,status:query.status,
  source:query.source,q:query.q,
  departmentId:query.departmentId,programId:query.programId,cohortId:query.cohortId,
 };
 const sort=query.sort??(query.applicationStatus==="ASSESSMENT"?
  "SUBMITTED_DESC":"AGE_ASC");
 const firstRead=await listCollegeDriveApplications(context,jobId,{
  ...filters,page:query.page+1,
 },{pageSize:query.size,sort});
 const pageCount=Math.ceil(firstRead.total/query.size);
 const effectivePage=Math.min(query.page,Math.max(0,pageCount-1));
 // An out-of-range browser bookmark uses the last valid page, without
 // changing filters or accidentally exposing another college.
 const result=query.page>effectivePage&&firstRead.total>0?
  await listCollegeDriveApplications(context,jobId,{
   ...filters,page:effectivePage+1,
  },{pageSize:query.size,sort}):firstRead;
 return {
  ...result,
  // The legacy Spring page response is zero-based. Keep the canonical
  // vNext page/index model unchanged for its existing consumers.
  content:result.items,number:effectivePage,size:query.size,
  totalElements:result.total,totalPages:pageCount,
  numberOfElements:result.items.length,
  first:effectivePage===0,last:pageCount===0||effectivePage>=pageCount-1,
  empty:result.items.length===0,
  hasPrevious:effectivePage>0,hasNext:effectivePage+1<pageCount,
  emptyLabel:"No applications",sort,
 };
}

/** Keep the historical CSV column order for consumers of the old
 * PlacementJobController route. The source remains strictly one-college and
 * one-job; an absent old algorithm score is blank, never invented. */
export async function exportLegacyCollegeDriveApplicationsCsv(
 context:RequestContext,jobId:unknown,raw:unknown,
){
 const compatible=legacyCollegeApplicationsQuerySchema.safeParse(raw);
 const filters=compatible.success?{
  q:compatible.data.q,status:compatible.data.status,
  source:compatible.data.source,stage:compatible.data.applicationStatus,
  departmentId:compatible.data.departmentId,programId:compatible.data.programId,
  cohortId:compatible.data.cohortId,page:1,
 }:raw;
 const data=await listCollegeDriveApplications(context,jobId,filters,{
  exportAll:true,exportCap:LEGACY_CSV_EXPORT_CAP,
 });
 const headings=["applicationId","jobId","jobTitle","companyName",
  "learnerId","firstName","lastName","email","applicationStatus",
  "screeningScore","isPartialScore","appliedAt","source",
  "internalNotes","rejectionReason"];
 const dateTime=new Intl.DateTimeFormat("sv-SE",{
  timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
  hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23",
 });
 const rows:(string|number|null)[][]=data.items.map(row=>[
  row.legacyApplicationId??row.id,data.drive.legacyJobId??data.drive.id,
  data.drive.title,data.drive.companyName,row.legacyLearnerId??row.membershipId,
  row.legacyFirstName??row.name,row.legacyLastName??"",row.email,row.stage,
  // The old weighted algorithm score/partial flag were removed in vNext.
  // An applied round result is a separate measurement and must not masquerade as one.
  null,null,dateTime.format(row.submittedAt).replace(" ","T"),row.source,
  "", "",
 ]);
 const truncatedLine=data.truncated?"# Export truncated at "+LEGACY_CSV_EXPORT_CAP+
  " rows ("+data.total+" total). Narrow the export scope (e.g. by job) to export the rest.":"";
 const csv=placementReportCsv(headings,rows)+"\r\n"+
  (truncatedLine?truncatedLine+"\r\n":"");
 return {
  csv,exported:data.items.length,total:data.total,truncated:data.truncated,
  warning:truncatedLine||null,filename:"job-applications.csv",
 };
}
