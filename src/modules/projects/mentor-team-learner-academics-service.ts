import "server-only";
import {and,eq,inArray,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {cohorts,collegeMemberships,departments,learnerProfiles,
 learnerProgramEnrollments,membershipRoles,programs,projectMembers,users}
 from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireProjectReadAccess} from "./access";
import {ProjectsServiceError} from "./errors";

export type MentorTeamLearnerAcademic={
 registration:string|null;academicYear:string|null;department:string|null;
};

/** Minimal academic identity for current learners on the *assigned* project.
 * Never return personal contact, email, placement or profile-document data.
 * Both project membership and college are rechecked in the SQL read.
 */
export async function getMentorTeamLearnerAcademics(
 context:RequestContext,projectId:string,learners:readonly {membershipId:string;role:string}[],
):Promise<Record<string,MentorTeamLearnerAcademic>>{
 const scope=await requireProjectReadAccess(context,projectId);
 if(scope.access!=="MENTOR")throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const ids=[...new Set(learners.filter(row=>row.role==="LEARNER")
   .map(row=>row.membershipId))];
 if(!ids.length)return {};
 const rows=await getDb().select({
   membershipId:projectMembers.membershipId,
   registration:learnerProfiles.registrationNumber,
   rollNumber:learnerProfiles.rollNumber,
   academicYear:cohorts.academicYear,
   department:departments.name,
 }).from(projectMembers)
 .innerJoin(collegeMemberships,and(
   eq(collegeMemberships.id,projectMembers.membershipId),
   eq(collegeMemberships.collegeId,scope.collegeId),
   eq(collegeMemberships.status,"ACTIVE"),
 ))
 .innerJoin(users,and(
   eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE"),
 ))
 .innerJoin(membershipRoles,and(
   eq(membershipRoles.membershipId,collegeMemberships.id),
   eq(membershipRoles.role,"LEARNER"),
 ))
 .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,collegeMemberships.id))
 .leftJoin(learnerProgramEnrollments,and(
   eq(learnerProgramEnrollments.membershipId,collegeMemberships.id),
   eq(learnerProgramEnrollments.status,"ACTIVE"),
 ))
 .leftJoin(cohorts,eq(cohorts.id,learnerProgramEnrollments.cohortId))
 .leftJoin(programs,eq(programs.id,learnerProgramEnrollments.programId))
 .leftJoin(departments,and(
   eq(departments.id,programs.departmentId),
   eq(departments.collegeId,scope.collegeId),
 ))
 .where(and(
   eq(projectMembers.projectId,scope.project.id),
   eq(projectMembers.role,"LEARNER"),isNull(projectMembers.endedAt),
   inArray(projectMembers.membershipId,ids),
 ));
 return Object.fromEntries(rows.map(row=>[row.membershipId,{
   registration:row.registration||row.rollNumber||null,
   academicYear:row.academicYear||null,
   department:row.department||null,
 }]));
}
