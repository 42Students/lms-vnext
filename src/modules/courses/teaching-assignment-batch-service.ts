import "server-only";
import {and,eq,inArray,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {
  collegeMemberships,courseSectionDeliveries,courseTeachingAssignments,
  membershipRoles,courseOfferings,courses,departments,colleges,organizations,sections,academicPeriods,
} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requirePermission} from "@/modules/permissions/policy";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {loadCourseMembership,loadCourseSectionDeliveryScope} from "./scope";
import {teachingAssignmentConflict} from "./teaching-assignment-guard";
import {CoursesServiceError,postgresConstraintName} from "./errors";
import {createCourseTeachingAssignmentsBatchInputSchema} from "./validation";

/** SA-academics-people-101: selected courses share one class and period.
 * All teaching grants and their audit records commit or roll back together. */
export async function createCourseTeachingAssignmentsBatch(
 context:RequestContext,rawInput:unknown,
){
 const input=createCourseTeachingAssignmentsBatchInputSchema.parse(rawInput);
 const ids=[...input.deliveryIds].sort();
 const [deliveries,member]=await Promise.all([
  Promise.all(ids.map(id=>loadCourseSectionDeliveryScope(id))),
  loadCourseMembership(input.membershipId),
 ]);
 const first=deliveries[0];
 if(!first)throw new CoursesServiceError("SECTION_DELIVERY_NOT_FOUND");
 requirePermission(context,"courses.manage",{
  organizationId:first.organizationId,collegeId:first.collegeId,
 });
 if(!deliveries.every(delivery=>
   delivery.collegeId===first.collegeId&&
   delivery.organizationId===first.organizationId&&
   delivery.sectionId===first.sectionId&&
   delivery.cohortId===first.cohortId&&
   delivery.academicPeriodId===first.academicPeriodId
 ))throw new CoursesServiceError("OFFERING_COHORT_PERIOD_MISMATCH");
 if(member.status!=="ACTIVE")throw new CoursesServiceError("MEMBERSHIP_NOT_ACTIVE");
 if(member.collegeId!==first.collegeId)throw new CoursesServiceError("MEMBERSHIP_COLLEGE_MISMATCH");
 if(!member.roles.includes("FACULTY"))throw new CoursesServiceError("FACULTY_ROLE_REQUIRED");
 try{
  return await getDb().transaction(async tx=>{
   // Explicit row locks serialize overlapping writers, including same-member
   // requests with different roles that the per-role unique index permits.
   const lockedDeliveries=await tx.select({id:courseSectionDeliveries.id})
    .from(courseSectionDeliveries)
    .where(and(inArray(courseSectionDeliveries.id,ids),isNull(courseSectionDeliveries.endedAt)))
    .orderBy(courseSectionDeliveries.id).for("update");
   if(lockedDeliveries.length!==ids.length)
    throw new CoursesServiceError("SECTION_DELIVERY_NOT_FOUND");
   // Lock and recheck tenant/course ancestry while still in this transaction.
   const live=await tx.select({
    id:courseSectionDeliveries.id,
    sectionId:courseSectionDeliveries.sectionId,
    offeringId:courseSectionDeliveries.offeringId,
    collegeId:departments.collegeId,
    organizationId:colleges.organizationId,
    cohortId:courseOfferings.cohortId,
    academicPeriodId:courseOfferings.academicPeriodId,
   }).from(courseSectionDeliveries)
    .innerJoin(courseOfferings,eq(courseOfferings.id,courseSectionDeliveries.offeringId))
    .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
    .innerJoin(sections,and(eq(sections.id,courseSectionDeliveries.sectionId),
      eq(sections.cohortId,courseOfferings.cohortId),
      eq(sections.academicPeriodId,courseOfferings.academicPeriodId)))
    .innerJoin(academicPeriods,and(eq(academicPeriods.id,sections.academicPeriodId),
      eq(academicPeriods.collegeId,first.collegeId)))
    .innerJoin(departments,eq(departments.id,courses.departmentId))
    .innerJoin(colleges,eq(colleges.id,departments.collegeId))
    .innerJoin(organizations,eq(organizations.id,colleges.organizationId))
    .where(and(inArray(courseSectionDeliveries.id,ids),
      isNull(courseSectionDeliveries.endedAt),
      eq(departments.collegeId,first.collegeId),
      eq(colleges.organizationId,first.organizationId),
      eq(colleges.status,"ACTIVE"),eq(organizations.status,"ACTIVE"),
      eq(sections.status,"ACTIVE"),eq(courseOfferings.status,"ACTIVE"),
    )).orderBy(courseSectionDeliveries.id).for("share");
   if(live.length!==ids.length||!live.every(delivery=>
     delivery.sectionId===first.sectionId&&
     delivery.cohortId===first.cohortId&&
     delivery.academicPeriodId===first.academicPeriodId
   ))throw new CoursesServiceError("SECTION_DELIVERY_NOT_FOUND");
   // Mutations also recheck the faculty's persisted actor grant.
   const [liveMember]=await tx.select({
    collegeId:collegeMemberships.collegeId,status:collegeMemberships.status,
   }).from(collegeMemberships)
    .where(eq(collegeMemberships.id,input.membershipId))
    .for("share").limit(1);
   if(!liveMember||liveMember.status!=="ACTIVE")throw new CoursesServiceError("MEMBERSHIP_NOT_ACTIVE");
   if(liveMember.collegeId!==first.collegeId)throw new CoursesServiceError("MEMBERSHIP_COLLEGE_MISMATCH");
   const [facultyRole]=await tx.select({id:membershipRoles.id}).from(membershipRoles)
    .where(and(eq(membershipRoles.membershipId,input.membershipId),eq(membershipRoles.role,"FACULTY")))
    .for("share").limit(1);
   if(!facultyRole)throw new CoursesServiceError("FACULTY_ROLE_REQUIRED");
   const existing=await tx.select({
    deliveryId:courseTeachingAssignments.deliveryId,
    membershipId:courseTeachingAssignments.membershipId,
    role:courseTeachingAssignments.role,
   }).from(courseTeachingAssignments).where(and(
    inArray(courseTeachingAssignments.deliveryId,ids),
    isNull(courseTeachingAssignments.endedAt),
   ));
   for(const id of ids){
    const conflict=teachingAssignmentConflict(
     {membershipId:input.membershipId,role:input.role},
     existing.filter(item=>item.deliveryId===id),
    );
    if(conflict)throw new CoursesServiceError(conflict);
   }
   const created=await tx.insert(courseTeachingAssignments).values(ids.map(deliveryId=>({
    deliveryId,membershipId:input.membershipId,role:input.role,
   }))).returning();
   if(created.length!==ids.length)throw new CoursesServiceError("TEACHING_ASSIGNMENT_CONFLICT");
   for(const row of created){
    await recordActivityEventInTransaction(tx,context,{
     eventType:ACTIVITY_EVENT_TYPES.COURSES_TEACHING_ASSIGNED,
     collegeId:first.collegeId,organizationId:first.organizationId,
     subjectType:"course_teaching_assignment",subjectId:row.id,
     subjectLabel:row.role,summary:"Faculty teaching assignment created",
     metadata:{after:{deliveryId:row.deliveryId,membershipId:row.membershipId,
       role:row.role,endedAt:null}},
    });
   }
   return created;
  });
 }catch(error){
  if(error instanceof CoursesServiceError)throw error;
  const constraint=postgresConstraintName(error);
  if(constraint==="course_teaching_assignments_active_uq")
   throw new CoursesServiceError("TEACHING_ASSIGNMENT_CONFLICT");
  if(constraint==="course_teaching_assignments_active_primary_uq")
   throw new CoursesServiceError("PRIMARY_TEACHER_CONFLICT");
  throw error;
 }
}
