import "server-only";
import {and,asc,count,desc,eq,gt,ilike,inArray,lt,or,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {collegeMemberships,departments,placementApplications,
 placementCompanies,placementCompanyRelationships,placementJobRounds,placementJobs,users}
 from "@/db/schema";
import {placementRoundCandidateSlots as interviews} from "@/db/schema/placement-round-candidate-slots";
import type {RequestContext} from "@/modules/identity/context";
import {requireCollegePlacementAdmin} from "./college-drive-read-service";
/** Exact legacy interview states and subtype captions. The underlying slot
 * status remains a separate scheduling/booking authority; historic completed
 * or cancelled appointments are read from their persisted outcome. */
export const LEGACY_COLLEGE_INTERVIEW_STATUS_LABELS={
 SCHEDULED:"Scheduled",CONFIRMED:"Confirmed",
 RESCHEDULE_REQUESTED:"Reschedule requested",
 COMPLETED:"Completed",NO_SHOW:"No Show",CANCELLED:"Cancelled",
} as const;
export const LEGACY_COLLEGE_INTERVIEW_TYPE_LABELS={
 INTERVIEW:"Interview",GD:"Group discussion",SCREENING:"Screening",
 TECHNICAL:"Technical interview",HR:"HR interview",
 MANAGERIAL:"Managerial interview",FINAL:"Final interview",
} as const;
export const collegeInterviewFilters=z.object({
 q:z.string().trim().max(100).default(""),
 status:z.enum(["ALL","ACTIVE","SCHEDULED","CONFIRMED","RESCHEDULE_REQUESTED","COMPLETED","NO_SHOW","CANCELLED"]).default("ALL"),
 mode:z.enum(["ALL","ON_CAMPUS","VIRTUAL"]).default("ALL"),
 type:z.enum(["ALL","INTERVIEW","GD","SCREENING","TECHNICAL","HR","MANAGERIAL","FINAL"]).default("ALL"),
 companyId:z.uuid().optional(),
 /** A scoped single-interview ICS export retains the same college authorization. */
 interviewId:z.uuid().optional(),
 departmentId:z.uuid().optional(),
 // Retain URL compatibility with newer sort labels and offer legacy choices.
 sort:z.enum(["UPCOMING","RECENT","STUDENT","EARLIEST","LATEST","JOB","STATUS"]).default("EARLIEST"),
 pageSize:z.coerce.number().int().refine(value=>[10,20,50,100].includes(value),
  "Choose 10, 20, 50 or 100 rows per page").default(20),
 page:z.coerce.number().int().min(1).max(1000).default(1),
}).strict();
export async function listCollegeInterviewDirectory(ctx:RequestContext,raw:unknown,options:{exportAll?:boolean}={}){
 const filters=collegeInterviewFilters.parse(raw);
 const collegeId=await requireCollegePlacementAdmin(ctx);
 const db=getDb();
 const [companies,departmentChoices]=await Promise.all([
  db.select({id:placementCompanies.id,name:placementCompanies.name}).from(placementCompanyRelationships)
   .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
   .where(eq(placementCompanyRelationships.collegeId,collegeId))
   .orderBy(asc(placementCompanies.name)),
  db.select({id:departments.id,name:departments.name}).from(departments)
   .where(eq(departments.collegeId,collegeId)).orderBy(asc(departments.name)),
 ]);

 const literalSearch="%"+filters.q.replace(/[\\%_]/g,"\\$&")+"%";
 const conditions=and(eq(placementJobs.collegeId,collegeId),
  filters.interviewId?eq(interviews.id,filters.interviewId):undefined,
  // Preserve imported completed/no-show interviews, including historical
  // cancelled appointment states. AVAILABLE capacity is not an appointment.
  or(eq(interviews.status,"BOOKED"),
     and(eq(interviews.status,"CANCELLED"),sql`${interviews.legacyInterviewId} is not null`)),
  filters.type==="ALL"?inArray(placementJobRounds.kind,["INTERVIEW","GD"]):
    ["SCREENING","TECHNICAL","HR","MANAGERIAL","FINAL"].includes(filters.type)
      ?and(eq(placementJobRounds.kind,"INTERVIEW"),eq(interviews.legacyInterviewType,filters.type))
      :eq(placementJobRounds.kind,filters.type),
  filters.companyId?eq(placementCompanyRelationships.companyId,filters.companyId):undefined,
  filters.departmentId?sql`exists(select 1 from learner_program_enrollments e
   join programs p on p.id=e.program_id
   join departments d on d.id=p.department_id
   where e.membership_id=${collegeMemberships.id} and e.status='ACTIVE'
   and d.college_id=${collegeId} and d.id=${filters.departmentId})`:undefined,
  filters.q?or(ilike(users.displayName,literalSearch),
   ilike(placementJobs.title,literalSearch),
   ilike(placementCompanies.name,literalSearch)):undefined);
 const source=db.select({
  id:sql<string>`${interviews.id}`.as("interview_id"),
  jobId:interviews.jobId,roundId:interviews.roundId,
  applicationId:interviews.applicationId,
  studentId:sql<string>`${collegeMemberships.id}`.as("student_id"),
  student:users.displayName,
  company:sql<string>`${placementCompanies.name}`.as("company_name"),
  companyId:sql<string>`${placementCompanies.id}`.as("company_id"),
  department:sql<string|null>`(select d.name from learner_program_enrollments e
   join programs p on p.id=e.program_id join departments d on d.id=p.department_id
   where e.membership_id=${collegeMemberships.id} and e.status='ACTIVE'
    and d.college_id=${collegeId}
   order by e.admitted_at desc,e.id desc limit 1)`.as("department_name"),
  job:placementJobs.title,
  roundName:sql<string>`${placementJobRounds.name}`.as("round_name"),
  interviewerName:sql<string|null>`coalesce(nullif(trim(${interviews.legacyInterviewerName}),''),nullif(trim(${interviews.panel}),''))`.as("interviewer_name"),
  kind:placementJobRounds.kind,
  legacyInterviewType:interviews.legacyInterviewType,
  start:interviews.startsAt,
  duration:sql<number>`extract(epoch from(${interviews.endsAt}-${interviews.startsAt}))/60`.as("slot_minutes"),
  status:sql<string>`case
    when ${interviews.status}='CANCELLED' then 'CANCELLED'
    -- Final persisted outcome takes precedence over an imported scheduled
    -- label. A fresh NO_SHOW result must remain visible in filtered lists.
    when ${interviews.interviewOutcome} in ('COMPLETED','NO_SHOW')
      then ${interviews.interviewOutcome}
    when exists(select 1 from activity_events ae
      where ae.subject_type='placement_round_candidate_slot' and ae.subject_id=${interviews.id}::text
       and ae.college_id=${placementJobs.collegeId}
       and ae.event_type='PLACEMENTS_COLLEGE_INTERVIEW_NO_SHOW') then 'NO_SHOW'
    when exists(select 1 from activity_events ae
      where ae.subject_type='placement_round_candidate_slot' and ae.subject_id=${interviews.id}::text
       and ae.college_id=${placementJobs.collegeId}
       and ae.event_type='PLACEMENTS_COLLEGE_INTERVIEW_COMPLETED') then 'COMPLETED'
    when ${interviews.legacyInterviewStatus} in
      ('SCHEDULED','CONFIRMED','RESCHEDULE_REQUESTED','COMPLETED','CANCELLED','NO_SHOW')
      then ${interviews.legacyInterviewStatus}
    when ${interviews.confirmedAt} is not null then 'CONFIRMED'
    else 'SCHEDULED' end`.as("interview_status"),
  mode:sql<string>`case when ${interviews.room} like 'https://%' then 'VIRTUAL' else 'ON_CAMPUS' end`.as("interview_mode"),
  venue:interviews.room,meetingUrl:sql<string|null>`case when ${interviews.room} like 'https://%'
    then ${interviews.room} else null end`.as("meeting_url"),
  version:interviews.version,
 }).from(interviews)
 .innerJoin(placementJobs,eq(placementJobs.id,interviews.jobId))
 .innerJoin(placementApplications,eq(placementApplications.id,interviews.applicationId))
 .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
  eq(collegeMemberships.collegeId,collegeId)))
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .innerJoin(placementJobRounds,eq(placementJobRounds.id,interviews.roundId))
 .innerJoin(placementCompanyRelationships,eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId))
 .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
 .where(conditions).as("interview_base");
 // Filter BEFORE any LIMIT. Status/mode are SQL projections, not client-side
 // predicates against the first 5,000 interviews in the college.
 const filtered=db.select().from(source).where(and(
  filters.status==="ALL"?undefined:filters.status==="ACTIVE"?
    inArray(source.status,["SCHEDULED","CONFIRMED","RESCHEDULE_REQUESTED"]):
    eq(source.status,filters.status),
  filters.mode==="ALL"?undefined:eq(source.mode,filters.mode),
 )).as("interview_filtered");
 const [summaries,selected]=await Promise.all([
  db.select({
   total:count(),
   scheduled:sql<number>`count(*) filter(where ${filtered.status} in
    ('SCHEDULED','CONFIRMED','RESCHEDULE_REQUESTED'))::int`.mapWith(Number),
   today:sql<number>`count(*) filter(where (${filtered.start} at time zone 'Asia/Kolkata')::date=(now() at time zone 'Asia/Kolkata')::date)::int`.mapWith(Number),
   companies:sql<number>`count(distinct ${filtered.companyId})::int`.mapWith(Number),
  }).from(filtered),
  db.select().from(filtered).orderBy(
   filters.sort==="RECENT"||filters.sort==="LATEST"?desc(filtered.start):
    filters.sort==="STUDENT"?asc(filtered.student):
    filters.sort==="JOB"?asc(filtered.job):
    filters.sort==="STATUS"?asc(filtered.status):asc(filtered.start),
   asc(filtered.start),asc(filtered.id),
  ).limit(options.exportAll?10000:filters.pageSize)
   .offset(options.exportAll?0:(filters.page-1)*filters.pageSize),
 ]);
 const totals=summaries[0]??{total:0,scheduled:0,today:0,companies:0};
 const total=totals.total;
 const limited=options.exportAll&&total>10000;
 // Re-evaluate collisions against ALL active college bookings for the
 // displayed learners and time span, including records on other pages/jobs.
 // A completed or no-show appointment cannot block a new booking.
 const windowStart=selected.length?Math.min(...selected.map(r=>r.start.getTime())):0;
 const windowEnd=selected.length?Math.max(...selected.map(r=>r.start.getTime()+r.duration*60000)):0;
 const buffer=15*60_000;
 const active=selected.length?await db.select({
   id:interviews.id,studentId:placementApplications.membershipId,
   interviewerName:sql<string|null>`coalesce(nullif(trim(${interviews.legacyInterviewerName}),''),nullif(trim(${interviews.panel}),''))`.as("interviewer_name"),
   start:interviews.startsAt,end:interviews.endsAt,
  }).from(interviews)
   .innerJoin(placementApplications,eq(placementApplications.id,interviews.applicationId))
   .innerJoin(placementJobs,and(eq(placementJobs.id,interviews.jobId),
    eq(placementJobs.collegeId,collegeId)))
   .where(and(eq(interviews.status,"BOOKED"),
    // Persisted appointment outcome outranks slot capacity. Imported
    // completed/cancelled/no-show bookings must not block future slots.
    sql`coalesce(${interviews.legacyInterviewStatus},'SCHEDULED') not in
      ('CANCELLED','COMPLETED','NO_SHOW')`,
    sql`coalesce(${interviews.interviewOutcome},'SCHEDULED') not in
      ('COMPLETED','NO_SHOW')`,
    lt(interviews.startsAt,new Date(windowEnd+buffer)),
    gt(interviews.endsAt,new Date(windowStart-buffer)),
    sql`not exists(select 1 from activity_events ended
     where ended.subject_type='placement_round_candidate_slot'
     and ended.subject_id=${interviews.id}::text and ended.college_id=${collegeId}
     and ended.event_type in ('PLACEMENTS_COLLEGE_INTERVIEW_COMPLETED','PLACEMENTS_COLLEGE_INTERVIEW_NO_SHOW'))`))
   .limit(10001):[];
 const conflicts=new Map<string,"CANDIDATE"|"INTERVIEWER"|"BOTH">();
 const conflictsIncomplete=active.length>10000;
 for(const row of selected){
  if(!["SCHEDULED","CONFIRMED","RESCHEDULE_REQUESTED"].includes(row.status))continue;
  const start=row.start.getTime(),end=start+row.duration*60000;
  const overlaps=active.filter(other=>other.id!==row.id&&
    other.start.getTime()<end+buffer&&other.end.getTime()>start-buffer);
  const candidate=overlaps.some(other=>other.studentId===row.studentId);
  const interviewer=Boolean(row.interviewerName&&overlaps.some(other=>
    other.interviewerName?.toLocaleLowerCase()===row.interviewerName?.toLocaleLowerCase()));
  if(candidate||interviewer)
   conflicts.set(row.id,candidate&&interviewer?"BOTH":candidate?"CANDIDATE":"INTERVIEWER");
 }
 return {ready:true,filters,total,limited,pageCount:Math.max(1,Math.ceil(total/filters.pageSize)),
  pageSize:filters.pageSize,
  rows:selected.map(row=>({...row,
    statusLabel:LEGACY_COLLEGE_INTERVIEW_STATUS_LABELS[
      row.status as keyof typeof LEGACY_COLLEGE_INTERVIEW_STATUS_LABELS
    ]??"Scheduled",
    typeLabel:LEGACY_COLLEGE_INTERVIEW_TYPE_LABELS[
      (row.legacyInterviewType??row.kind) as keyof typeof LEGACY_COLLEGE_INTERVIEW_TYPE_LABELS
    ]??"Interview",
    conflict:conflicts.has(row.id),conflictKind:conflicts.get(row.id)??null})),
  companies,departments:departmentChoices,
  summary:{scheduled:totals.scheduled,today:totals.today,
   companies:totals.companies,conflicts:conflicts.size},
  conflictsIncomplete,
  conflictScope:options.exportAll?"EXPORTED_ROWS":"CURRENT_PAGE",
 };
}
