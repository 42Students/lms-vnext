import "server-only";
import {and,asc,eq,inArray,isNull} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {cohorts,courseOfferings,courseSectionDeliveries,courses,departments,
 electiveSlots,lmsGroups,programs,sections,courseTeachingAssignments,collegeMemberships,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {resolveActingCollege} from "@/modules/permissions/acting-college";

import {ElectivesServiceError,listElectiveOfferings} from "./service";
const id=z.string().uuid();
/** Existing elective groups/deliveries only: creating a group/delivery is a separate
 * prerequisite, never an invented insert or a cross-tenant lookup. */
export async function listCollegeOfferingChoices(ctx:RequestContext,rawSlotId:string){
 const acting=await resolveActingCollege(ctx,"academics.manage");
 const slotId=id.parse(rawSlotId);
 const [slot]=await getDb().select().from(electiveSlots)
  .where(and(eq(electiveSlots.id,slotId),eq(electiveSlots.collegeId,acting.collegeId),
   isNull(electiveSlots.deletedAt))).limit(1);
 if(!slot||slot.status!=="ACTIVE")throw new ElectivesServiceError("ELECTIVE_SLOT_NOT_ACTIVE");

 const [deliveries,groups,offerings]=await Promise.all([
  getDb().select({id:courseSectionDeliveries.id,courseId:courses.id,course:courses.name,
   code:courses.code,section:sections.name})
   .from(courseSectionDeliveries)
   .innerJoin(courseOfferings,eq(courseOfferings.id,courseSectionDeliveries.offeringId))
   .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
   .innerJoin(sections,eq(sections.id,courseSectionDeliveries.sectionId))
   .innerJoin(cohorts,eq(cohorts.id,courseOfferings.cohortId))
   .innerJoin(programs,eq(programs.id,cohorts.programId))
   .innerJoin(departments,and(eq(departments.id,programs.departmentId),
    eq(departments.collegeId,slot.collegeId)))
   .where(and(eq(programs.id,slot.programId),eq(courseOfferings.type,"ELECTIVE"),
    eq(courseOfferings.status,"ACTIVE"),eq(courses.status,"ACTIVE"),
    eq(sections.status,"ACTIVE"),isNull(courseSectionDeliveries.endedAt),
    slot.academicPeriodId?eq(courseOfferings.academicPeriodId,slot.academicPeriodId):undefined))
   .orderBy(asc(courses.name)).limit(250),
  getDb().select({id:lmsGroups.id,name:lmsGroups.name,capacity:lmsGroups.capacity})
   .from(lmsGroups).where(and(eq(lmsGroups.collegeId,slot.collegeId),
    eq(lmsGroups.ownerScope,"COLLEGE"),eq(lmsGroups.kind,"ELECTIVE"),
    isNull(lmsGroups.deletedAt),eq(lmsGroups.activeCount,0)))
   .orderBy(asc(lmsGroups.name)).limit(250),
  listElectiveOfferings(ctx,slotId),
 ]);
 const deliveryIds=[...new Set(offerings.map(item=>item.backedDeliveryId))];
 const facultyRows=deliveryIds.length?await getDb().select({
  deliveryId:courseTeachingAssignments.deliveryId,
  role:courseTeachingAssignments.role,
  displayName:users.displayName,
 }).from(courseTeachingAssignments)
  .innerJoin(collegeMemberships,and(
    eq(collegeMemberships.id,courseTeachingAssignments.membershipId),
    eq(collegeMemberships.collegeId,slot.collegeId)))
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .where(and(inArray(courseTeachingAssignments.deliveryId,deliveryIds),
    isNull(courseTeachingAssignments.endedAt),
    eq(collegeMemberships.status,"ACTIVE")))
  .orderBy(asc(courseTeachingAssignments.role),asc(users.displayName)):[];
 const facultyByDelivery=new Map<string,Array<{role:string;displayName:string}>>();
 for(const item of facultyRows){
  const list=facultyByDelivery.get(item.deliveryId)??[];
  list.push({role:item.role,displayName:item.displayName});
  facultyByDelivery.set(item.deliveryId,list);
 }
 return {deliveries,groups,offerings:offerings.map(offering=>({
  ...offering,faculty:facultyByDelivery.get(offering.backedDeliveryId)??[],
 }))};
}
