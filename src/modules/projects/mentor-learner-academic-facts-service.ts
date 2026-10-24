import "server-only";
import {and,eq,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,projectMembers,membershipRoles,
 learnerProfiles,learnerProgramEnrollments,programs,departments,cohorts,users}
 from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireProjectReadAccess} from "./access";
import {ProjectsServiceError} from "./errors";

export type MentorLearnerAcademicFact={
 membershipId:string;rollNumber:string|null;
 registrationNumber:string|null;programName:string|null;
 departmentName:string|null;cohortName:string|null;academicYear:string|null;
};
/** Mentor-only learner academic context, scoped to the exact authorized
 * project and college. Generic Project workspace readers never receive this.
 * Active program enrollment is required for programme/cohort labels; missing
 * or retired academic records are displayed as unavailable rather than guessed.
 */
export async function getMentorLearnerAcademicFacts(
 context:RequestContext,projectIdInput:string,
):Promise<MentorLearnerAcademicFact[]>{
 const scope=await requireProjectReadAccess(context,projectIdInput);
 if(scope.access!=="MENTOR")throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const rows=await getDb().select({
  membershipId:projectMembers.membershipId,
  rollNumber:learnerProfiles.rollNumber,
  registrationNumber:learnerProfiles.registrationNumber,
  programName:programs.name,
  departmentName:departments.name,
  cohortName:cohorts.name,
  academicYear:cohorts.academicYear,
 }).from(projectMembers)
  .innerJoin(collegeMemberships,and(
    eq(collegeMemberships.id,projectMembers.membershipId),
    eq(collegeMemberships.collegeId,scope.collegeId),
    eq(collegeMemberships.status,"ACTIVE"),
  ))
  .innerJoin(users,and(eq(users.id,collegeMemberships.userId),
    eq(users.platformStatus,"ACTIVE")))
  .innerJoin(membershipRoles,and(
    eq(membershipRoles.membershipId,collegeMemberships.id),
    eq(membershipRoles.role,"LEARNER"),
  ))
  .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,projectMembers.membershipId))
  .leftJoin(learnerProgramEnrollments,and(
    eq(learnerProgramEnrollments.membershipId,projectMembers.membershipId),
    eq(learnerProgramEnrollments.status,"ACTIVE"),
  ))
  .leftJoin(programs,eq(programs.id,learnerProgramEnrollments.programId))
  .leftJoin(departments,and(
    eq(departments.id,programs.departmentId),
    eq(departments.collegeId,scope.collegeId),
  ))
  .leftJoin(cohorts,and(
    eq(cohorts.id,learnerProgramEnrollments.cohortId),
    eq(cohorts.programId,programs.id),
  ))
  .where(and(
    eq(projectMembers.projectId,scope.project.id),
    eq(projectMembers.role,"LEARNER"),
    isNull(projectMembers.endedAt),
  ));
 return rows.map(row=>({
  membershipId:row.membershipId,
  rollNumber:row.rollNumber,
  registrationNumber:row.registrationNumber,
  programName:row.departmentName?row.programName:null,
  departmentName:row.departmentName,
  cohortName:row.departmentName?row.cohortName:null,
  academicYear:row.departmentName?row.academicYear:null,
 }));
}
