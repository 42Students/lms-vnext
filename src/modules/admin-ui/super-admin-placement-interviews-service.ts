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
):Promise<SuperAdminReadResult>{
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
   const dateKey=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",
    year:"numeric",month:"2-digit",day:"2-digit"}).format(row.startsAt);
   const href="/admin/placements/calendar?view=agenda&date="+
    encodeURIComponent(dateKey)+"&jobId="+encodeURIComponent(row.jobId);
   return {
    id:row.id,title:row.jobTitle,subtitle:candidate+" · "+row.companyName,
    status:row.status,revision:String(row.version),href,
    secondaryHref:row.applicationId?
     "/admin/placements/applications?applicationId="+encodeURIComponent(row.applicationId):undefined,
    secondaryLabel:row.applicationId?"View application":undefined,
    details:[
     "Job: "+row.jobTitle,
     "Candidate: "+candidate,
     "Type: "+kind,
     "Status: "+row.status,
     "Date & Time: "+date,
     "Interviewer: "+interviewer,
     "Mode: "+mode,
     "Actions: Open interview calendar",
    ],
   };
  })};
}
