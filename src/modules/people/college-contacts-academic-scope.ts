import "server-only";
import {and,eq,exists,not,sql,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,learnerProfiles,facultyProfiles,learnerProgramEnrollments,programs,departments,courseTeachingAssignments,courseSectionDeliveries,courseOfferings,courses} from "@/db/schema";
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
 const activeEnrollment=exists(db.select({enrollmentId:learnerProgramEnrollments.id}).from(learnerProgramEnrollments)
  .innerJoin(programs,eq(programs.id,learnerProgramEnrollments.programId))
  .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,collegeId)))
  .where(and(eq(learnerProgramEnrollments.membershipId,collegeMemberships.id),eq(learnerProgramEnrollments.status,"ACTIVE"))));
 const activeTeaching=exists(db.select({assignmentId:courseTeachingAssignments.id}).from(courseTeachingAssignments)
  .innerJoin(courseSectionDeliveries,and(eq(courseSectionDeliveries.id,courseTeachingAssignments.deliveryId),isNull(courseSectionDeliveries.endedAt)))
  .innerJoin(courseOfferings,eq(courseOfferings.id,courseSectionDeliveries.offeringId))
  .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
  .innerJoin(departments,and(eq(departments.id,courses.departmentId),eq(departments.collegeId,collegeId)))
  .where(and(eq(courseTeachingAssignments.membershipId,collegeMemberships.id),isNull(courseTeachingAssignments.endedAt))));
 return {learnerProfile,facultyProfile,hasRoll,hasRegistration,hasAcademicTitle,activeEnrollment,activeTeaching};
}
