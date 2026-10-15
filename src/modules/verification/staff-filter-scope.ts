import "server-only";
import {and,eq,exists} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,learnerProgramEnrollments,sectionEnrollments,sections,cohorts,programs,departments} from "@/db/schema";
import type {VerificationQueueFilters} from "./queue-filters";
import {verificationEnrollmentFilterMode} from "./enrollment-mode";

/** Correlated EXISTS checks avoid duplicate roster rows or conflicting joined
 * column aliases; every academic path is anchored in this college. */
export function verificationEnrollmentPredicates(collegeId:string,filter:VerificationQueueFilters){
 const db=getDb();
 const mode=verificationEnrollmentFilterMode(filter);
 const cohortOrBranch=mode==="PROGRAM"?exists(
  db.select({enrollmentId:learnerProgramEnrollments.id}).from(learnerProgramEnrollments)
   .innerJoin(cohorts,and(eq(cohorts.id,learnerProgramEnrollments.cohortId),
     eq(cohorts.programId,learnerProgramEnrollments.programId)))
   .innerJoin(programs,eq(programs.id,cohorts.programId))
   .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,collegeId)))
   .where(and(eq(learnerProgramEnrollments.membershipId,collegeMemberships.id),
    eq(learnerProgramEnrollments.status,"ACTIVE"),
    filter.batchId?eq(cohorts.id,filter.batchId):undefined,
    filter.branchId?eq(departments.id,filter.branchId):undefined,
    filter.programId?eq(programs.id,filter.programId):undefined))
 ):undefined;
 const section=mode==="SECTION"?exists(
  db.select({sectionEnrollmentId:sectionEnrollments.id}).from(sectionEnrollments)
   .innerJoin(learnerProgramEnrollments,and(
     eq(learnerProgramEnrollments.id,sectionEnrollments.learnerEnrollmentId),
     eq(learnerProgramEnrollments.status,"ACTIVE")))
   .innerJoin(sections,and(eq(sections.id,sectionEnrollments.sectionId),
     eq(sections.cohortId,learnerProgramEnrollments.cohortId),
     eq(sections.academicPeriodId,sectionEnrollments.academicPeriodId),
     eq(sections.status,"ACTIVE")))
   .innerJoin(cohorts,and(eq(cohorts.id,sections.cohortId),
     eq(cohorts.programId,learnerProgramEnrollments.programId)))
   .innerJoin(programs,eq(programs.id,cohorts.programId))
   .innerJoin(departments,and(eq(departments.id,programs.departmentId),
     eq(departments.collegeId,collegeId)))
   .where(and(eq(learnerProgramEnrollments.membershipId,collegeMemberships.id),
     eq(sectionEnrollments.sectionId,filter.sectionId),
     eq(sectionEnrollments.status,"ACTIVE"),
     filter.batchId?eq(cohorts.id,filter.batchId):undefined,
     filter.branchId?eq(departments.id,filter.branchId):undefined,
     filter.programId?eq(programs.id,filter.programId):undefined)))
 ):undefined;
 return [cohortOrBranch,section] as const;
}
