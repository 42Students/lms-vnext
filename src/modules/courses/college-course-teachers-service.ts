import "server-only";
import {and,asc,eq,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,courseSectionDeliveries,courseTeachingAssignments,sections,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requirePermission} from "@/modules/permissions/policy";
import {loadCourseOfferingScope} from "./scope";

/** Teaching roster belongs to the exact selected offering; cannot be queried
 * through a course ID across another cohort, period, or tenant. */
export async function listOfferingTeachingOverview(context:RequestContext,offeringId:string){
 const offering=await loadCourseOfferingScope(offeringId);
 requirePermission(context,"courses.read",{
  collegeId:offering.collegeId,organizationId:offering.organizationId,
 });
 const rows=await getDb().select({
  assignmentId:courseTeachingAssignments.id,
  facultyName:users.displayName,facultyEmail:users.email,
  membershipId:collegeMemberships.id,
  role:courseTeachingAssignments.role,
  sectionName:sections.name,sectionCode:sections.code,
  sectionId:sections.id,
 }).from(courseTeachingAssignments)
  .innerJoin(courseSectionDeliveries,and(
   eq(courseSectionDeliveries.id,courseTeachingAssignments.deliveryId),
   eq(courseSectionDeliveries.offeringId,offering.id),
   isNull(courseSectionDeliveries.endedAt),
  ))
  .innerJoin(sections,eq(sections.id,courseSectionDeliveries.sectionId))
  .innerJoin(collegeMemberships,and(
   eq(collegeMemberships.id,courseTeachingAssignments.membershipId),
   eq(collegeMemberships.collegeId,offering.collegeId),
   eq(collegeMemberships.status,"ACTIVE"),
  ))
  .innerJoin(users,and(eq(users.id,collegeMemberships.userId),
   eq(users.platformStatus,"ACTIVE")))
  .where(isNull(courseTeachingAssignments.endedAt))
  .orderBy(asc(sections.name),asc(users.displayName),asc(courseTeachingAssignments.id))
  .limit(101);
 return {faculty:rows.slice(0,100),truncated:rows.length>100};
}
