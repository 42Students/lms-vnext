import "server-only";
import {and,eq,gt,lt,asc} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,placementApplications,placementCompanies,placementCompanyRelationships,
 placementJobRounds,placementJobs,learnerProgramEnrollments,programs,departments,users} from "@/db/schema";
import {placementRoundCandidateSlots} from "@/db/schema/placement-round-candidate-slots";
import type {RequestContext} from "@/modules/identity/context";
import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
import type {SuperAdminCalendarRound} from "@/modules/admin-ui/super-admin-interview-operations-model";
import {superAdminBookedInterviewWindow} from "./super-admin-booked-interviews-range";

/** Registered candidate-slot bookings, not round-only calendar approximations. */
export async function listSuperAdminBookedInterviews(
 context:RequestContext,from:string,to:string,
):Promise<{events:SuperAdminCalendarRound[];truncated:boolean}> {
 const scope=requireSuperAdminSelectedCollege(context,"placements.read");
 const window=superAdminBookedInterviewWindow(from,to);
 if(!window)return {events:[],truncated:false};
 const {fromDate,toDate}=window;
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
 .innerJoin(placementJobRounds,and(eq(placementJobRounds.id,s.roundId),eq(placementJobRounds.jobId,s.jobId)))
 .innerJoin(placementCompanyRelationships,and(eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),eq(placementCompanyRelationships.collegeId,scope.collegeId)))
 .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
 .innerJoin(placementApplications,and(eq(placementApplications.id,s.applicationId),eq(placementApplications.jobId,s.jobId)))
 .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),eq(collegeMemberships.collegeId,scope.collegeId)))
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .leftJoin(learnerProgramEnrollments,and(eq(learnerProgramEnrollments.membershipId,collegeMemberships.id),eq(learnerProgramEnrollments.status,"ACTIVE")))
 .leftJoin(programs,eq(programs.id,learnerProgramEnrollments.programId))
 .leftJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,scope.collegeId)))
 .where(and(eq(s.status,"BOOKED"),gt(s.endsAt,fromDate),lt(s.startsAt,toDate)))
 .orderBy(asc(s.startsAt),asc(s.id)).limit(2001);
 const events:SuperAdminCalendarRound[]=rows.slice(0,2000).map(row=>({
  id:row.id,roundId:row.roundId,jobId:row.jobId,jobTitle:row.jobTitle,
  title:row.roundTitle,companyName:row.companyName,status:"SCHEDULED",
  kind:row.roundKind,startsAt:row.startsAt.toISOString(),endsAt:row.endsAt.toISOString(),
  venue:row.room.startsWith("https://")?null:row.room,
  meetingUrl:row.room.startsWith("https://")?row.room:null,
  mode:row.room.startsWith("https://")?("Virtual" as const):("On campus" as const),
  candidateMembershipId:row.candidateMembershipId,candidateName:row.candidateName,
  departmentId:row.departmentId,departmentName:row.departmentName,
  interviewer:row.panel,
 }));
 return {events,truncated:rows.length>2000};
}
