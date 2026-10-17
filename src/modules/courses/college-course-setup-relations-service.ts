import "server-only";

import {and,asc,eq,isNull,ne} from "drizzle-orm";
import {alias} from "drizzle-orm/pg-core";
import {getDb} from "@/db/client";
import {
 academicPeriods,cohorts,collegeMemberships,courseOfferings,courses,
 courseSectionDeliveries,courseTeachingAssignments,departments,programs,
 sections,users,
} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requirePermission} from "@/modules/permissions/policy";
import {loadAcademicCollegeScope} from "@/modules/academics/scope";

/**
 * Bulk College Courses index reader. This avoids one extra network roundtrip
 * per cohort, per offering and per Section Delivery on the setup workspace.
 * Every join that can surface another college's course or Faculty is explicitly
 * rooted at the authorized college.
 */
const programDepartment=alias(departments,"college_courses_program_department");
export async function listCollegeCourseSetupRelations(
 context:RequestContext,collegeId:string,includeArchivedOfferings=false,
){
 const college=await loadAcademicCollegeScope(collegeId);
 requirePermission(context,"courses.read",{
  collegeId:college.id,organizationId:college.organizationId,
 });
 const db=getDb();
 const offerings=await db.select({
  id:courseOfferings.id,
  courseId:courseOfferings.courseId,
  courseName:courses.name,courseCode:courses.code,
  cohortId:cohorts.id,cohortName:cohorts.name,cohortCode:cohorts.code,
  programId:programs.id,programName:programs.name,
  departmentId:departments.id,departmentName:departments.name,
  academicPeriodId:academicPeriods.id,
  academicPeriodName:academicPeriods.name,
  academicPeriodCode:academicPeriods.code,
  type:courseOfferings.type,credits:courseOfferings.credits,
  displayOrder:courseOfferings.displayOrder,status:courseOfferings.status,
  createdAt:courseOfferings.createdAt,updatedAt:courseOfferings.updatedAt,
 }).from(courseOfferings)
 .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
 .innerJoin(departments,and(eq(departments.id,courses.departmentId),
  eq(departments.collegeId,college.id)))
 .innerJoin(cohorts,eq(cohorts.id,courseOfferings.cohortId))
 .innerJoin(programs,eq(programs.id,cohorts.programId))
 .innerJoin(programDepartment,and(
  eq(programDepartment.id,programs.departmentId),eq(programDepartment.collegeId,college.id)))
 .innerJoin(academicPeriods,and(
  eq(academicPeriods.id,courseOfferings.academicPeriodId),
  eq(academicPeriods.collegeId,college.id)))
 .where(and(
  ne(cohorts.status,"ARCHIVED"),
  includeArchivedOfferings?undefined:eq(courseOfferings.status,"ACTIVE"),
 ))
 .orderBy(asc(courseOfferings.displayOrder),asc(courses.name),asc(courseOfferings.id));

 const deliveries=await db.select({
  id:courseSectionDeliveries.id,
  offeringId:courseOfferings.id,
  sectionId:sections.id,sectionName:sections.name,sectionCode:sections.code,
  startedAt:courseSectionDeliveries.startedAt,endedAt:courseSectionDeliveries.endedAt,
  courseId:courses.id,courseName:courses.name,courseCode:courses.code,
  cohortId:cohorts.id,cohortName:cohorts.name,
  academicPeriodId:academicPeriods.id,academicPeriodName:academicPeriods.name,
 }).from(courseSectionDeliveries)
 .innerJoin(courseOfferings,and(
  eq(courseOfferings.id,courseSectionDeliveries.offeringId),
  eq(courseOfferings.status,"ACTIVE")))
 .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
 .innerJoin(departments,and(eq(departments.id,courses.departmentId),eq(departments.collegeId,college.id)))
 .innerJoin(cohorts,eq(cohorts.id,courseOfferings.cohortId))
 .innerJoin(academicPeriods,and(
  eq(academicPeriods.id,courseOfferings.academicPeriodId),
  eq(academicPeriods.collegeId,college.id)))
 .innerJoin(sections,and(
  eq(sections.id,courseSectionDeliveries.sectionId),
  eq(sections.cohortId,courseOfferings.cohortId),
  eq(sections.academicPeriodId,courseOfferings.academicPeriodId)))
 .where(isNull(courseSectionDeliveries.endedAt))
 .orderBy(asc(sections.name),asc(courseSectionDeliveries.id));

 const teachingAssignments=await db.select({
  id:courseTeachingAssignments.id,
  deliveryId:courseSectionDeliveries.id,
  membershipId:collegeMemberships.id,
  displayName:users.displayName,
  role:courseTeachingAssignments.role,
  startedAt:courseTeachingAssignments.startedAt,
  endedAt:courseTeachingAssignments.endedAt,
  courseName:courses.name,courseCode:courses.code,
  sectionName:sections.name,sectionCode:sections.code,
 }).from(courseTeachingAssignments)
 .innerJoin(courseSectionDeliveries,and(
  eq(courseSectionDeliveries.id,courseTeachingAssignments.deliveryId),
  isNull(courseSectionDeliveries.endedAt)))
 .innerJoin(courseOfferings,and(
  eq(courseOfferings.id,courseSectionDeliveries.offeringId),
  eq(courseOfferings.status,"ACTIVE")))
 .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
 .innerJoin(departments,and(eq(departments.id,courses.departmentId),eq(departments.collegeId,college.id)))
 .innerJoin(sections,and(
  eq(sections.id,courseSectionDeliveries.sectionId),
  eq(sections.cohortId,courseOfferings.cohortId),
  eq(sections.academicPeriodId,courseOfferings.academicPeriodId)))
 .innerJoin(collegeMemberships,and(
  eq(collegeMemberships.id,courseTeachingAssignments.membershipId),
  eq(collegeMemberships.collegeId,college.id)))
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .where(isNull(courseTeachingAssignments.endedAt))
 .orderBy(asc(courseTeachingAssignments.role),asc(users.displayName),asc(courseTeachingAssignments.id));

 return {offerings,deliveries,teachingAssignments};
}
