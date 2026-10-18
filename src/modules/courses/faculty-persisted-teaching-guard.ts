import "server-only";

import {and,eq,isNull} from "drizzle-orm";
import {courseSectionDeliveries,courseTeachingAssignments} from "@/db/schema";
import {assertPersistedPlatformPermission,type PermissionTransaction}
  from "@/modules/permissions/persisted-actor";
import type {RequestContext} from "@/modules/identity/context";
import {CoursesServiceError} from "./errors";

/** Recheck the canonical user, membership, roles and teaching grant while
 * holding SHARE locks in the SAME transaction that publishes results.
 *
 * The earlier page/service check is UX-only: another session may revoke
 * Faculty rights after that initial read and before the quiz row update. */
export async function assertPersistedFacultyTeachingMutation(
 tx:PermissionTransaction,
 context:RequestContext,
 deliveryId:string,
 scope:{collegeId:string;organizationId:string},
):Promise<void>{
 const submitted=context.membership;
 if(!submitted)throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
 let persisted:RequestContext;
 try{
  persisted=await assertPersistedPlatformPermission(
   tx,context,"courses.read",scope,
  );
 }catch{
  throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
 }
 if(!persisted.membership||
   persisted.membership.id!==submitted.id||
   persisted.membership.status!=="ACTIVE"||
   !persisted.membership.roles.includes("FACULTY")||
   persisted.membership.collegeId!==scope.collegeId||
   persisted.membership.organizationId!==scope.organizationId){
  throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
 }
 const [grant]=await tx.select({id:courseTeachingAssignments.id})
  .from(courseTeachingAssignments)
  .innerJoin(courseSectionDeliveries,
   eq(courseSectionDeliveries.id,courseTeachingAssignments.deliveryId))
  .where(and(
   eq(courseTeachingAssignments.deliveryId,deliveryId),
   eq(courseTeachingAssignments.membershipId,persisted.membership.id),
   isNull(courseTeachingAssignments.endedAt),
   isNull(courseSectionDeliveries.endedAt),
  ))
  .for("share").limit(1);
 if(!grant)throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
}
