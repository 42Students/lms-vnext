import "server-only";
import {and,eq,exists,not,sql,isNull,ilike} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,learnerProfiles,facultyProfiles,learnerProgramEnrollments,academicPeriods,programs,departments,courseTeachingAssignments,courseSectionDeliveries,courseOfferings,courses,sectionEnrollments,sections,cohorts} from "@/db/schema";
export function collegeContactAcademicScope(collegeId:string){
 const db=getDb();
 const learnerProfile=exists(db.select({memberId:learnerProfiles.membershipId}).from(learnerProfiles)
  .where(eq(learnerProfiles.membershipId,collegeMemberships.id)));
 const facultyProfile=exists(db.select({memberId:facultyProfiles.membershipId}).from(facultyProfiles)
  .where(eq(facultyProfiles.membershipId,collegeMemberships.id)));
 const hasRoll=exists(db.select({memberId:learnerProfiles.membershipId}).from(learnerProfiles)
  .where(and(eq(learnerProfiles.membershipId,collegeMemberships.id),sql`nullif(btrim(${learnerProfiles.rollNumber}), '') is not null`)));
 const hasRegistration=exists(db.select({memberId:learnerProfiles.membershipId}).from(learnerProfiles)
  .where(and(eq(learnerProfiles.membershipId,collegeMemberships.id),sql`nullif(btrim(${learnerProfiles.registrationNumber}), '') is not null`)));
 const hasAcademicTitle=exists(db.select({memberId:facultyProfiles.membershipId}).from(facultyProfiles)
  .where(and(eq(facultyProfiles.membershipId,collegeMemberships.id),sql`nullif(btrim(${facultyProfiles.academicTitle}), '') is not null`)));
 const hasPrimaryDepartment=exists(db.select({facultyId:facultyProfiles.membershipId}).from(facultyProfiles)
  .innerJoin(departments,and(eq(departments.id,facultyProfiles.primaryDepartmentId),eq(departments.collegeId,collegeId)))
  .where(eq(facultyProfiles.membershipId,collegeMemberships.id)));
 const activeClass=exists(db.select({sectionId:sectionEnrollments.id}).from(sectionEnrollments)
  .innerJoin(learnerProgramEnrollments,and(eq(learnerProgramEnrollments.id,sectionEnrollments.learnerEnrollmentId),eq(learnerProgramEnrollments.status,"ACTIVE")))
  .innerJoin(sections,and(eq(sections.id,sectionEnrollments.sectionId),eq(sections.cohortId,learnerProgramEnrollments.cohortId),eq(sections.academicPeriodId,sectionEnrollments.academicPeriodId),eq(sections.status,"ACTIVE")))
  .innerJoin(academicPeriods,and(
    eq(academicPeriods.id,sections.academicPeriodId),
    eq(academicPeriods.collegeId,collegeId)))
  .innerJoin(cohorts,and(eq(cohorts.id,sections.cohortId),eq(cohorts.programId,learnerProgramEnrollments.programId)))
  .innerJoin(programs,eq(programs.id,cohorts.programId))
  .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,collegeId)))
  .where(and(eq(learnerProgramEnrollments.membershipId,collegeMemberships.id),eq(sectionEnrollments.status,"ACTIVE"))));
 const inSection=(sectionId:string)=>exists(db.select({enrollmentId:sectionEnrollments.id}).from(sectionEnrollments)
  .innerJoin(learnerProgramEnrollments,and(eq(learnerProgramEnrollments.id,sectionEnrollments.learnerEnrollmentId),eq(learnerProgramEnrollments.status,"ACTIVE")))
  .innerJoin(sections,and(eq(sections.id,sectionEnrollments.sectionId),eq(sections.cohortId,learnerProgramEnrollments.cohortId),eq(sections.status,"ACTIVE")))
  .innerJoin(academicPeriods,and(
    eq(academicPeriods.id,sections.academicPeriodId),
    eq(academicPeriods.collegeId,collegeId)))
  .innerJoin(cohorts,and(eq(cohorts.id,sections.cohortId),eq(cohorts.programId,learnerProgramEnrollments.programId)))
  .innerJoin(programs,eq(programs.id,cohorts.programId))
  .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,collegeId)))
  .where(and(eq(learnerProgramEnrollments.membershipId,collegeMemberships.id),eq(sectionEnrollments.status,"ACTIVE"),eq(sections.academicPeriodId,sectionEnrollments.academicPeriodId),eq(sections.id,sectionId))));
 const inCombinedPlacement=(input:{cohortId?:string;programId?:string;sectionId?:string;classPresence?:string})=>{
  const placedInEnrollment=exists(db.select({id:sectionEnrollments.id}).from(sectionEnrollments)
   .innerJoin(sections,and(eq(sections.id,sectionEnrollments.sectionId),
     eq(sections.academicPeriodId,sectionEnrollments.academicPeriodId),eq(sections.status,"ACTIVE")))
   .innerJoin(academicPeriods,and(
     eq(academicPeriods.id,sections.academicPeriodId),
     eq(academicPeriods.collegeId,collegeId)))
   .where(and(eq(sectionEnrollments.learnerEnrollmentId,learnerProgramEnrollments.id),
     eq(sections.cohortId,cohorts.id),eq(sectionEnrollments.status,"ACTIVE"),
     input.sectionId?eq(sections.id,input.sectionId):undefined)));
  return exists(db.select({id:learnerProgramEnrollments.id}).from(learnerProgramEnrollments)
   .innerJoin(cohorts,and(eq(cohorts.id,learnerProgramEnrollments.cohortId),eq(cohorts.programId,learnerProgramEnrollments.programId)))
   .innerJoin(programs,eq(programs.id,cohorts.programId))
   .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,collegeId)))
   .where(and(eq(learnerProgramEnrollments.membershipId,collegeMemberships.id),
     eq(learnerProgramEnrollments.status,"ACTIVE"),
     input.programId?eq(programs.id,input.programId):undefined,
     input.cohortId?eq(cohorts.id,input.cohortId):undefined,
     input.sectionId||input.classPresence==="ASSIGNED"?placedInEnrollment:
       input.classPresence==="NONE"?not(placedInEnrollment):undefined)));
 };
 const inProgram=(programId:string)=>exists(db.select({enrollmentId:learnerProgramEnrollments.id}).from(learnerProgramEnrollments)
  // A learner's cohort and program are independent foreign keys. They must
  // agree before counting or filtering the learner in a college directory.
  .innerJoin(cohorts,and(eq(cohorts.id,learnerProgramEnrollments.cohortId),
    eq(cohorts.programId,learnerProgramEnrollments.programId)))
  .innerJoin(programs,eq(programs.id,cohorts.programId))
  .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,collegeId)))
  .where(and(eq(learnerProgramEnrollments.membershipId,collegeMemberships.id),eq(learnerProgramEnrollments.status,"ACTIVE"),eq(programs.id,programId))));
 const inCohort=(cohortId:string)=>exists(db.select({enrollmentId:learnerProgramEnrollments.id}).from(learnerProgramEnrollments)
  .innerJoin(cohorts,and(eq(cohorts.id,learnerProgramEnrollments.cohortId),eq(cohorts.programId,learnerProgramEnrollments.programId)))
  .innerJoin(programs,eq(programs.id,cohorts.programId))
  .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,collegeId)))
  .where(and(eq(learnerProgramEnrollments.membershipId,collegeMemberships.id),eq(learnerProgramEnrollments.status,"ACTIVE"),eq(cohorts.id,cohortId))));
 const titleMatches=(pattern:string)=>exists(db.select({memberId:facultyProfiles.membershipId}).from(facultyProfiles)
  .where(and(eq(facultyProfiles.membershipId,collegeMemberships.id),ilike(facultyProfiles.academicTitle,pattern))));
 const inEmploymentType=(employmentType:string)=>exists(db.select({memberId:facultyProfiles.membershipId}).from(facultyProfiles)
  .where(and(eq(facultyProfiles.membershipId,collegeMemberships.id),eq(facultyProfiles.employmentType,employmentType))));
 const inFacultyDepartment=(departmentId:string)=>exists(db.select({memberId:facultyProfiles.membershipId}).from(facultyProfiles)
  .innerJoin(departments,and(eq(departments.id,facultyProfiles.primaryDepartmentId),eq(departments.collegeId,collegeId)))
  .where(and(eq(facultyProfiles.membershipId,collegeMemberships.id),eq(departments.id,departmentId))));
 const activeEnrollment=exists(db.select({enrollmentId:learnerProgramEnrollments.id}).from(learnerProgramEnrollments)
  // A learner's cohort and program are independent foreign keys. They must
  // agree before counting or filtering the learner in a college directory.
  .innerJoin(cohorts,and(eq(cohorts.id,learnerProgramEnrollments.cohortId),
    eq(cohorts.programId,learnerProgramEnrollments.programId)))
  .innerJoin(programs,eq(programs.id,cohorts.programId))
  .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,collegeId)))
  .where(and(eq(learnerProgramEnrollments.membershipId,collegeMemberships.id),eq(learnerProgramEnrollments.status,"ACTIVE"))));
 const teachingInRole=(role:"PRIMARY"|"CO_TEACHER"|"TA")=>exists(db.select({assignmentId:courseTeachingAssignments.id}).from(courseTeachingAssignments)
  .innerJoin(courseSectionDeliveries,and(eq(courseSectionDeliveries.id,courseTeachingAssignments.deliveryId),isNull(courseSectionDeliveries.endedAt)))
  .innerJoin(courseOfferings,eq(courseOfferings.id,courseSectionDeliveries.offeringId))
  .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
  .innerJoin(departments,and(eq(departments.id,courses.departmentId),eq(departments.collegeId,collegeId)))
  .where(and(eq(courseTeachingAssignments.membershipId,collegeMemberships.id),isNull(courseTeachingAssignments.endedAt),eq(courseTeachingAssignments.role,role))));
 const activeTeaching=exists(db.select({assignmentId:courseTeachingAssignments.id}).from(courseTeachingAssignments)
  .innerJoin(courseSectionDeliveries,and(eq(courseSectionDeliveries.id,courseTeachingAssignments.deliveryId),isNull(courseSectionDeliveries.endedAt)))
  .innerJoin(courseOfferings,eq(courseOfferings.id,courseSectionDeliveries.offeringId))
  .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
  .innerJoin(departments,and(eq(departments.id,courses.departmentId),eq(departments.collegeId,collegeId)))
  .where(and(eq(courseTeachingAssignments.membershipId,collegeMemberships.id),isNull(courseTeachingAssignments.endedAt))));
 return {learnerProfile,facultyProfile,hasRoll,hasRegistration,hasAcademicTitle,hasPrimaryDepartment,activeClass,inSection,inProgram,inCohort,inCombinedPlacement,titleMatches,inEmploymentType,inFacultyDepartment,activeEnrollment,activeTeaching,teachingInRole};
}
