import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships, placementApplications, placementCompanies,
  placementCompanyRelationships, placementJobRounds, placementJobs, users,
} from "@/db/schema";
import { placementRoundCandidateSlots } from "@/db/schema/placement-round-candidate-slots";
import { requireSuperAdminSelectedCollege } from "@/modules/admin-ui/super-admin-selected-college";
import type { RequestContext } from "@/modules/identity/context";

export type SuperAdminCalendarAppointment = {
  id:string;jobId:string;applicationId:string|null;candidateName:string|null;
  companyName:string;jobTitle:string;roundName:string;
  type:string;status:string;mode:"ONLINE"|"IN_PERSON";
  startsAt:string;endsAt:string;interviewer:string|null;venue:string;
  conflict:boolean;
};

const activeStatuses=new Set(["SCHEDULED","CONFIRMED","RESCHEDULE_REQUESTED"]);
function appointmentStatus(row:{
 status:string;legacyInterviewStatus:string|null;interviewOutcome:string|null;
 learnerConfirmedAt:Date|null;
}){
 if(row.legacyInterviewStatus)return row.legacyInterviewStatus;
 if(row.status==="CANCELLED")return "CANCELLED";
 if(row.interviewOutcome==="NO_SHOW")return "NO_SHOW";
 if(row.interviewOutcome==="COMPLETED")return "COMPLETED";
 return row.learnerConfirmedAt?"CONFIRMED":"SCHEDULED";
}

/** Exact selected-college appointment rows, not round rows or graphic-window samples.
 * Resolve conflicts against the full retrieved active set before UI filters. */
export async function listSuperAdminCalendarAppointments(context:RequestContext){
 const scope=requireSuperAdminSelectedCollege(context,"placements.read");
 const s=placementRoundCandidateSlots;
 const raw=await getDb().select({
  id:s.id,jobId:s.jobId,applicationId:s.applicationId,
  candidateMembershipId:collegeMemberships.id,candidateName:users.displayName,
  companyName:placementCompanies.name,jobTitle:placementJobs.title,
  roundName:placementJobRounds.name,roundKind:placementJobRounds.kind,
  interviewType:s.legacyInterviewType,legacyStatus:s.legacyInterviewStatus,
  interviewOutcome:s.interviewOutcome,learnerConfirmedAt:s.learnerConfirmedAt,
  legacyMode:s.legacyInterviewMode,interviewer:s.legacyInterviewerName,
  panel:s.panel,startsAt:s.startsAt,endsAt:s.endsAt,status:s.status,room:s.room,
 }).from(s)
 .innerJoin(placementJobs,and(eq(placementJobs.id,s.jobId),eq(placementJobs.collegeId,scope.collegeId)))
 .innerJoin(placementJobRounds,and(eq(placementJobRounds.id,s.roundId),eq(placementJobRounds.jobId,s.jobId)))
 .innerJoin(placementCompanyRelationships,and(eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
   eq(placementCompanyRelationships.collegeId,scope.collegeId)))
 .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
 .leftJoin(placementApplications,and(eq(placementApplications.id,s.applicationId),eq(placementApplications.jobId,s.jobId)))
 .leftJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
   eq(collegeMemberships.collegeId,scope.collegeId)))
 .leftJoin(users,eq(users.id,collegeMemberships.userId))
 .where(inArray(s.status,["BOOKED","CANCELLED"]))
 .orderBy(asc(s.startsAt),asc(s.id))
 .limit(2001);
 const items=raw.slice(0,2000).map(row=>({
  id:row.id,jobId:row.jobId,applicationId:row.applicationId,
  candidateMembershipId:row.candidateMembershipId,
  candidateName:row.candidateName,companyName:row.companyName,
  jobTitle:row.jobTitle,roundName:row.roundName,
  type:row.interviewType??row.roundKind,
  status:appointmentStatus({status:row.status,legacyInterviewStatus:row.legacyStatus,
    interviewOutcome:row.interviewOutcome,learnerConfirmedAt:row.learnerConfirmedAt}),
  mode:(row.legacyMode==="ONLINE"||(!row.legacyMode&&row.room.startsWith("https://"))?
    "ONLINE":"IN_PERSON") as "ONLINE"|"IN_PERSON",
  startsAt:row.startsAt.toISOString(),endsAt:row.endsAt.toISOString(),
  interviewer:row.interviewer??row.panel,venue:row.room,
  conflict:false,
 }));
 const conflicts=new Set<string>();
 for(let i=0;i<items.length;i++){
  const first=items[i];
  if(!activeStatuses.has(first.status))continue;
  for(let j=i+1;j<items.length;j++){
   const second=items[j];
   if(second.startsAt>=first.endsAt)break;
   if(!activeStatuses.has(second.status)||second.endsAt<=first.startsAt)continue;
   const sameCandidate=Boolean(first.candidateMembershipId&&
    first.candidateMembershipId===second.candidateMembershipId);
   const firstInterviewer=first.interviewer?.trim().toLowerCase()??"";
   const sameInterviewer=Boolean(firstInterviewer&&
    firstInterviewer===second.interviewer?.trim().toLowerCase());
   const sameVenue=first.mode==="IN_PERSON"&&second.mode==="IN_PERSON"&&
    first.venue.trim().toLowerCase()===second.venue.trim().toLowerCase();
   if(sameCandidate||sameInterviewer||sameVenue){
    conflicts.add(first.id);conflicts.add(second.id);
   }
  }
 }
 const appointments:SuperAdminCalendarAppointment[]=items.map(({candidateMembershipId,...item})=>({
  ...item,conflict:conflicts.has(item.id),
 }));
 return {items:appointments,truncated:raw.length>2000,collegeId:scope.collegeId};
}
