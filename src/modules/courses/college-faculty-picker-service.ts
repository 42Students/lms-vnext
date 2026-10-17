import "server-only";
import {and,asc,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,membershipRoles,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requirePermission} from "@/modules/permissions/policy";
import {loadAcademicCollegeScope} from "@/modules/academics/scope";

const MAX_FACULTY_CHOICES=500;
/** Course creation needs active FACULTY only, not a paginated scan of every
 * Learner, Mentor, College Admin and HR membership at a large college. */
export async function listCollegeFacultyPicker(context:RequestContext,collegeId:string){
 const college=await loadAcademicCollegeScope(collegeId);
 requirePermission(context,"courses.manage",{
  collegeId:college.id,organizationId:college.organizationId,
 });
 const rows=await getDb().select({
  membershipId:collegeMemberships.id,
  displayName:users.displayName,email:users.email,
 }).from(collegeMemberships)
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
   eq(membershipRoles.role,"FACULTY")))
  .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
  .where(and(eq(collegeMemberships.collegeId,college.id),eq(collegeMemberships.status,"ACTIVE")))
  .orderBy(asc(users.displayName),asc(collegeMemberships.id))
  .limit(MAX_FACULTY_CHOICES+1);
 return {
  faculty:rows.slice(0,MAX_FACULTY_CHOICES).map(item=>({
   membershipId:item.membershipId,displayName:item.displayName??item.email??"Unnamed Faculty",
   email:item.email,
  })),
  truncated:rows.length>MAX_FACULTY_CHOICES,
 };
}
