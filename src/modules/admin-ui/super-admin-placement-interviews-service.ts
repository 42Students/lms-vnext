import "server-only";
import {and,asc,count,eq,ilike,or,sql,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {
  placementApplications,placementCompanies,placementCompanyRelationships,
  placementJobs,placementJobRounds,collegeMemberships,users,
} from "@/db/schema";
import {placementRoundCandidateSlots} from "@/db/schema/placement-round-candidate-slots";
import type {RequestContext} from "@/modules/identity/context";
import {requireSuperAdminSelectedCollege} from "./super-admin-selected-college";
import {
  scopedSearchLike,superAdminReadPages,superAdminReadQuerySchema,
  type SuperAdminReadResult,
} from "./super-admin-read-directory-model";

/** Each row is a real candidate appointment (0116), never a round placeholder.
 * The persisted legacy status is retained for historic confirmations and
 * reschedule requests; new bookings project distinct acknowledgment/outcome facts.
 * Appointments without a learner (cancelled legacy records) remain visible.
 */
export async function listSuperAdminInterviews(
 context:RequestContext,raw:unknown,
):Promise<SuperAdminReadResult & {items:(SuperAdminReadResult["items"][number]&{jobId:string})[]}>{
 const query=superAdminReadQuerySchema.parse(raw);
 const scope=requireSuperAdminSelectedCollege(context,"placements.read");
 const s=placementRoundCandidateSlots;
 const effectiveStatus=sql<string>`case
   when ${s.legacyInterviewStatus} is not null then ${s.legacyInterviewStatus}
   when ${s.status} = 'CANCELLED' then 'CANCELLED'
   when ${s.interviewOutcome} = 'NO_SHOW' then 'NO_SHOW'
   when ${s.interviewOutcome} = 'COMPLETED' then 'COMPLETED'
   when ${s.learnerConfirmedAt} is not null then 'CONFIRMED'
   else 'SCHEDULED' end`;
 const searchable=query.q?scopedSearchLike(query.q):null;
 const statusFilter=query.status==="ALL"?undefined:
   query.status==="ACTIVE"?
    inArray(effectiveStatus,["SCHEDULED","CONFIRMED","RESCHEDULE_REQUESTED"]):
    sql`${effectiveStatus} = ${query.status}`;
 // Compare the complete college appointment set before page/filter slicing.
 // Legacy allows both a learner and an interviewer to have concurrent slots;
 // never restrict conflict detection to the rows currently displayed.
 const candidateOverlap=sql<boolean>`case when ${s.status} <> 'BOOKED' then false
  else exists(
   select 1 from placement_round_candidate_slots collision
   join placement_jobs collision_job on collision_job.id=collision.job_id
   join placement_applications other_app on other_app.id=collision.application_id
   join placement_applications own_app on own_app.id=${s.applicationId}
   where collision.id <> ${s.id}
    and collision.status='BOOKED'
    and collision_job.college_id=${scope.collegeId}::uuid
    and collision.starts_at < ${s.endsAt}
    and collision.ends_at > ${s.startsAt}
    and other_app.membership_id=own_app.membership_id
  ) end`;
 const interviewerOverlap=sql<boolean>`case when ${s.status} <> 'BOOKED' then false
  else exists(
   select 1 from placement_round_candidate_slots collision
   join placement_jobs collision_job on collision_job.id=collision.job_id
   where collision.id <> ${s.id}
    and collision.status='BOOKED'
    and collision_job.college_id=${scope.collegeId}::uuid
    and collision.starts_at < ${s.endsAt}
    and collision.ends_at > ${s.startsAt}
    and nullif(lower(trim(coalesce(${s.legacyInterviewerName},${s.panel}))), '') is not null
    and lower(trim(coalesce(collision.legacy_interviewer_name,collision.panel))) =
        lower(trim(coalesce(${s.legacyInterviewerName},${s.panel})))
  ) end`;
 const source=getDb().select({
  id:s.id,jobId:placementJobs.id,jobTitle:placementJobs.title,
  companyName:placementCompanies.name,candidateName:users.displayName,
  applicationId:s.applicationId,roundName:placementJobRounds.name,
  interviewType:s.legacyInterviewType,roundKind:placementJobRounds.kind,
  status:effectiveStatus.as("interview_status"),
  startsAt:s.startsAt,endsAt:s.endsAt,panel:s.panel,
  legacyInterviewerName:s.legacyInterviewerName,
  room:s.room,legacyInterviewMode:s.legacyInterviewMode,
  version:s.version,
  candidateConflict:candidateOverlap.as("candidate_conflict"),
  interviewerConflict:interviewerOverlap.as("interviewer_conflict"),
 }).from(s)
 .innerJoin(placementJobs,and(eq(placementJobs.id,s.jobId),eq(placementJobs.collegeId,scope.collegeId)))
 .innerJoin(placementJobRounds,and(eq(placementJobRounds.id,s.roundId),eq(placementJobRounds.jobId,s.jobId)))
 .innerJoin(placementCompanyRelationships,and(
   eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
   eq(placementCompanyRelationships.collegeId,scope.collegeId)))
 .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
 .leftJoin(placementApplications,and(
   eq(placementApplications.id,s.applicationId),eq(placementApplications.jobId,s.jobId)))
 .leftJoin(collegeMemberships,and(
   eq(collegeMemberships.id,placementApplications.membershipId),
   eq(collegeMemberships.collegeId,scope.collegeId)))
 .leftJoin(users,eq(users.id,collegeMemberships.userId))
 .where(and(
   inArray(s.status,["BOOKED","CANCELLED"]),
   query.jobId?eq(placementJobs.id,query.jobId):undefined,
   statusFilter,
   searchable?or(ilike(placementJobs.title,searchable),
     ilike(placementCompanies.name,searchable),
     ilike(users.displayName,searchable)):undefined,
 )).as("super_admin_interview_appointments");
 const db=getDb();
 const [totals,rows]=await Promise.all([
  db.select({total:count()}).from(source),
  db.select().from(source).orderBy(asc(source.startsAt),asc(source.id))
   .limit(query.pageSize).offset((query.page-1)*query.pageSize),
 ]);
 const total=totals[0]?.total??0;
 const fmt=new Intl.DateTimeFormat("en-IN",{
  dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
 });
 return {query,total,totalPages:superAdminReadPages(total,query.pageSize),
  items:rows.map(row=>{
   const date=fmt.format(row.startsAt)+" IST";
   const candidate=row.candidateName??"Candidate unavailable";
   const kind=row.interviewType??row.roundKind;
   const mode=row.legacyInterviewMode??(row.room.startsWith("https://")?"ONLINE":"IN_PERSON");
   const interviewer=row.legacyInterviewerName??row.panel??"Not assigned";
   const conflict=row.candidateConflict&&row.interviewerConflict?"Both candidate and interviewer":
    row.candidateConflict?"Candidate":row.interviewerConflict?"Interviewer":"None";
   const dateKey=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",
    year:"numeric",month:"2-digit",day:"2-digit"}).format(row.startsAt);
   const href="/admin/placements/calendar?view=agenda&date="+
    encodeURIComponent(dateKey)+"&jobId="+encodeURIComponent(row.jobId);
   return {
    id:row.id,jobId:row.jobId,title:row.jobTitle,subtitle:candidate+" · "+row.companyName,
    status:row.status,revision:String(row.version),href,
    ...(row.applicationId?{
     secondaryHref:"/admin/placements/applications?applicationId="+encodeURIComponent(row.applicationId),
     secondaryLabel:"View application",
    }:{}),
    details:[
     "Job: "+row.jobTitle,
     "Round: "+row.roundName,
     "Location: "+row.room,
     "Candidate: "+candidate,
     "Type: "+kind,
     "Status: "+row.status,
     "Date & Time: "+date,
     "Interviewer: "+interviewer,
     "Mode: "+mode,
     "Conflict: "+conflict,
     "Actions: Open interview calendar",
    ],
   };
  })};
}


/** Legacy interviews.csv exports the selected-college filtered rows across
 * pages, not a global all-college feed. Keep the same nine column names and
 * field order and cap the response at 5000 appointments.
 */
export async function exportSuperAdminInterviewsCsv(
 context:RequestContext,raw:unknown,
):Promise<{csv:string;total:number;exported:number;truncated:boolean}>{
 const base=superAdminReadQuerySchema.parse(raw);
 const lines:string[]=[];
 let total=0;
 const quoted=(value:string)=>{
  const protectedValue=/^\s*[=+\-@\t\r]/.test(value)?"'"+value:value;
  return '"'+protectedValue.replaceAll('"','""')+'"';
 };
 const headers=["id","job","candidate","type","status","scheduledDate",
  "interviewer","location","mode"];
 lines.push(headers.map(quoted).join(","));
 for(let page=1;page<=25;page++){
  const batch=await listSuperAdminInterviews(context,{...base,page,pageSize:200});
  total=batch.total;
  for(const row of batch.items){
   const detail=(prefix:string)=>
    row.details.find(item=>item.startsWith(prefix))?.slice(prefix.length)??"";
   lines.push([
    row.id,row.title,detail("Candidate: "),detail("Type: "),
    row.status,detail("Date & Time: "),detail("Interviewer: "),
    detail("Location: "),detail("Mode: "),
   ].map(quoted).join(","));
  }
  if(batch.items.length<200||page*200>=total)break;
 }
 return {csv:"\uFEFF"+lines.join("\r\n")+"\r\n",total,
  exported:lines.length-1,truncated:lines.length-1<total};
}
