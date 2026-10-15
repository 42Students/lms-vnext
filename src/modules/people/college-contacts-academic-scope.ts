import "server-only";
import {and,eq,exists,sql,isNull,ilike} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,learnerProfiles,facultyProfiles,learnerProgramEnrollments,programs,departments,courseTeachingAssignments,courseSectionDeliveries,courseOfferings,courses,sectionEnrollments,sections,cohorts} from "@/db/schema";
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
  .innerJoin(cohorts,and(eq(cohorts.id,sections.cohortId),eq(cohorts.programId,learnerProgramEnrollments.programId)))
  .innerJoin(programs,eq(programs.id,cohorts.programId))
  .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,collegeId)))
  .where(and(eq(learnerProgramEnrollments.membershipId,collegeMemberships.id),eq(sectionEnrollments.status,"ACTIVE"))));
 const inSection=(sectionId:string)=>exists(db.select({enrollmentId:sectionEnrollments.id}).from(sectionEnrollments)
  .innerJoin(learnerProgramEnrollments,and(eq(learnerProgramEnrollments.id,sectionEnrollments.learnerEnrollmentId),eq(learnerProgramEnrollments.status,"ACTIVE")))
  .innerJoin(sections,and(eq(sections.id,sectionEnrollments.sectionId),eq(sections.cohortId,learnerProgramEnrollments.cohortId),eq(sections.status,"ACTIVE")))
  .innerJoin(cohorts,and(eq(cohorts.id,sections.cohortId),eq(cohorts.programId,learnerProgramEnrollments.programId)))
  .innerJoin(programs,eq(programs.id,cohorts.programId))
  .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,collegeId)))
  .where(and(eq(learnerProgramEnrollments.membershipId,collegeMemberships.id),eq(sectionEnrollments.status,"ACTIVE"),eq(sections.academicPeriodId,sectionEnrollments.academicPeriodId),eq(sections.id,sectionId))));
 const inProgram=(programId:string)=>exists(db.select({enrollmentId:learnerProgramEnrollments.id}).from(learnerProgramEnrollments)
  .innerJoin(programs,eq(programs.id,learnerProgramEnrollments.programId))
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
  .innerJoin(programs,eq(programs.id,learnerProgramEnrollments.programId))
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
 return {learnerProfile,facultyProfile,hasRoll,hasRegistration,hasAcademicTitle,hasPrimaryDepartment,activeClass,inSection,inProgram,inCohort,titleMatches,inEmploymentType,inFacultyDepartment,activeEnrollment,activeTeaching,teachingInRole};
}
