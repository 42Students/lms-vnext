import "server-only";
import { and, desc, eq, inArray, isNull, lte, or } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
 courseLearningPaths, courseLessons, lessonContents, learnerContentProgress,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { hasMembershipRole, isSuperAdmin } from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import { loadCourseMembership, loadCourseSectionDeliveryScope } from "./scope";

const id = z.string().uuid();

/** Legacy live-content universe, narrowed by the selected college and delivery.
 * Attempts are compared per learner and per content, never globally.
 */
export async function getAdminLearnerCurrentContentAttempts(
 context:RequestContext, learnerMembershipIdRaw:string, deliveryIdRaw:string,
) {
 const learnerMembershipId=id.parse(learnerMembershipIdRaw);
 const deliveryId=id.parse(deliveryIdRaw);
 const selectedCollegeId=isSuperAdmin(context)
  ? context.adminScope?.collegeId
  : hasMembershipRole(context,"COLLEGE_ADMIN") ? context.membership?.collegeId : null;
 const selectedOrgId=isSuperAdmin(context)?context.adminScope?.organizationId:context.membership?.organizationId;
 if(!selectedCollegeId || !selectedOrgId)throw new AuthorizationError("courses.read");
 requirePermission(context,"courses.read",{
   collegeId:selectedCollegeId,organizationId:selectedOrgId,
 });
 const [delivery,learner]=await Promise.all([
   loadCourseSectionDeliveryScope(deliveryId),
   loadCourseMembership(learnerMembershipId),
 ]);
 if(delivery.collegeId!==selectedCollegeId || learner.collegeId!==selectedCollegeId ||
    learner.status!=="ACTIVE" || !learner.roles.includes("LEARNER"))
   throw new AuthorizationError("courses.read");
 const now=new Date();
 const valid=await getDb().select({
   id:lessonContents.id,
 }).from(lessonContents)
 .innerJoin(courseLessons,eq(courseLessons.id,lessonContents.lessonId))
 .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
 .where(and(
   eq(courseLearningPaths.offeringId,delivery.offeringId),
   eq(courseLearningPaths.status,"PUBLISHED"),
   eq(courseLessons.status,"ACTIVE"),eq(courseLessons.visibleToStudents,true),
   isNull(courseLessons.deletedAt),
   eq(lessonContents.status,"PUBLISHED"),
   eq(lessonContents.visibleToStudents,true),
   isNull(lessonContents.deletedAt),
   eq(lessonContents.deletedWithLesson,false),
   or(isNull(lessonContents.deliveryId),eq(lessonContents.deliveryId,deliveryId)),
   or(isNull(lessonContents.startsAt),lte(lessonContents.startsAt,now)),
 ));
 const validContentIds=valid.map(row=>row.id);
 if(!validContentIds.length)return {
   deliveryId,learnerMembershipId,validContentIds,
   attempts:[] as Array<{contentId:string;attempt:number;completedAt:Date|null}>,
 };
 const progressRows=await getDb().select({
   contentId:learnerContentProgress.lessonContentId,
   attempt:learnerContentProgress.attempt,
   completedAt:learnerContentProgress.completedAt,
 }).from(learnerContentProgress).where(and(
   eq(learnerContentProgress.membershipId,learnerMembershipId),
   inArray(learnerContentProgress.lessonContentId,validContentIds),
 )).orderBy(desc(learnerContentProgress.attempt),desc(learnerContentProgress.updatedAt));
 const seen=new Set<string>();
 const attempts: Array<{contentId:string;attempt:number;completedAt:Date|null}>=[];
 for(const row of progressRows){
   if(seen.has(row.contentId))continue;
   seen.add(row.contentId);
   attempts.push(row);
 }
 return {deliveryId,learnerMembershipId,validContentIds,attempts};
}
