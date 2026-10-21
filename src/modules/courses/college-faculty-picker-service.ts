import "server-only";
import {and,asc,eq,ilike,or} from "drizzle-orm";
import {z} from "zod";
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

/** The old faculty typeahead defaulted to 15 hits. Keep this bounded path
 * separate from the 500-row course-editor picker and the paged people directory.
 * Popularity counters are not inferred from reads or written on a keystroke.
 */
const facultySuggestionSchema=z.strictObject({
 q:z.string().trim().max(80).default(""),
 limit:z.coerce.number().int().min(1).max(50).default(15),
});
export async function searchCollegeFacultySuggestions(
 context:RequestContext,collegeId:string,raw:unknown,
){
 const input=facultySuggestionSchema.parse(raw);
 const college=await loadAcademicCollegeScope(collegeId);
 requirePermission(context,"courses.manage",{
  collegeId:college.id,organizationId:college.organizationId,
 });
 const pattern="%"+input.q.replace(/[\\%_]/g,value=>"\\\\"+value)+"%";
 const rows=await getDb().select({
  membershipId:collegeMemberships.id,
  displayName:users.displayName,email:users.email,
 }).from(collegeMemberships)
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
   eq(membershipRoles.role,"FACULTY")))
  .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
  .where(and(eq(collegeMemberships.collegeId,college.id),
   eq(collegeMemberships.status,"ACTIVE"),
   input.q?or(ilike(users.displayName,pattern),ilike(users.email,pattern)):undefined))
  .orderBy(asc(users.displayName),asc(collegeMemberships.id))
  .limit(input.limit+1);
 return {
  faculty:rows.slice(0,input.limit).map(item=>({
   membershipId:item.membershipId,displayName:item.displayName??item.email??"Unnamed Faculty",
   email:item.email,
  })),
  truncated:rows.length>input.limit,
 };
}
