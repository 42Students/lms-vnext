import "server-only";
import {and,eq,gt,lt,asc} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,placementApplications,placementCompanies,placementCompanyRelationships,
 placementJobRounds,placementJobs,learnerProgramEnrollments,programs,departments,users} from "@/db/schema";
import {placementRoundCandidateSlots} from "@/db/schema/placement-round-candidate-slots";
import type {RequestContext} from "@/modules/identity/context";
import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
import type {SuperAdminCalendarRound} from "@/modules/admin-ui/super-admin-interview-operations-model";

/** Registered candidate-slot bookings, not round-only calendar approximations. */
export async function listSuperAdminBookedInterviews(
 context:RequestContext,from:string,to:string,
):Promise<{events:SuperAdminCalendarRound[];truncated:boolean}> {
 const scope=requireSuperAdminSelectedCollege(context,"placements.read");
 const fromDate=new Date(from+"T00:00:00+05:30");
 const toDate=new Date(new Date(to+"T00:00:00+05:30").getTime()+86400000);
 if(!Number.isFinite(fromDate.getTime())||!Number.isFinite(toDate.getTime())||
   toDate.getTime()<=fromDate.getTime())return {events:[],truncated:false};
 const s=placementRoundCandidateSlots;
 const rows=await getDb().select({
  id:s.id,roundId:s.roundId,jobId:s.jobId,applicationId:s.applicationId,
  startsAt:s.startsAt,endsAt:s.endsAt,room:s.room,panel:s.panel,status:s.status,
  candidateMembershipId:collegeMemberships.id,candidateName:users.displayName,
  departmentId:departments.id,departmentName:departments.name,
  jobTitle:placementJobs.title,roundTitle:placementJobRounds.name,
  roundKind:placementJobRounds.kind,companyName:placementCompanies.name,
 }).from(s)
 .innerJoin(placementJobs,and(eq(placementJobs.id,s.jobId),eq(placementJobs.collegeId,scope.collegeId)))
 .innerJoin(placementJobRounds,eq(placementJobRounds.id,s.roundId))
 .innerJoin(placementCompanyRelationships,eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId))
 .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
 .leftJoin(placementApplications,eq(placementApplications.id,s.applicationId))
 .leftJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),eq(collegeMemberships.collegeId,scope.collegeId)))
 .leftJoin(users,eq(users.id,collegeMemberships.userId))
 .leftJoin(learnerProgramEnrollments,and(eq(learnerProgramEnrollments.membershipId,collegeMemberships.id),eq(learnerProgramEnrollments.status,"ACTIVE")))
 .leftJoin(programs,eq(programs.id,learnerProgramEnrollments.programId))
 .leftJoin(departments,eq(departments.id,programs.departmentId))
 .where(and(eq(s.status,"BOOKED"),gt(s.endsAt,fromDate),lt(s.startsAt,toDate)))
 .orderBy(asc(s.startsAt),asc(s.id)).limit(2001);
 const events:SuperAdminCalendarRound[]=rows.slice(0,2000).map(row=>({
  id:row.id,roundId:row.roundId,jobId:row.jobId,jobTitle:row.jobTitle,
  title:row.roundTitle,companyName:row.companyName,status:"SCHEDULED",
  kind:row.roundKind,startsAt:row.startsAt.toISOString(),endsAt:row.endsAt.toISOString(),
  venue:row.room.startsWith("https://")?null:row.room,
  mode:row.room.startsWith("https://")?("Virtual" as const):("On campus" as const),
  candidateMembershipId:row.candidateMembershipId,candidateName:row.candidateName,
  departmentId:row.departmentId,departmentName:row.departmentName,
  interviewer:row.panel,
 }));
 return {events,truncated:rows.length>2000};
}
