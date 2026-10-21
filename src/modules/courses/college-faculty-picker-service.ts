import "server-only";
import {and,asc,desc,eq,ilike,or,isNull,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {collegeMemberships,membershipRoles,users,facultyProfiles,courseTeachingAssignments} from "@/db/schema";
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

/** Legacy faculty endpoint crosswalk (all operations selected-college scoped):
 * /search → GET /api/academics/faculty-suggestions?q=... (default 15)
 * /popular → same route with mode=popular (default 10, actual active
 *   teaching assignments rather than a client click counter).
 * /college/{id} → the signed-in college selector, not a caller-provided id.
 * /department/{id} → departmentId; /type → employmentType; limit <= 50.
 * /colleges and /record-usage were legacy global cache features, retired
 * under the one-workspace-per-role membership model. Never mutate popularity
 * from search keystrokes, and never expose another tenant's faculty cache.
 * Existing native select controls provide keyboard and scroll affordances.
 */
/** The old faculty typeahead defaulted to 15 hits. Keep this bounded path
 * separate from the 500-row course-editor picker and the paged people directory.
 * Popularity counters are not inferred from reads or written on a keystroke.
 */
const facultySuggestionSchema=z.strictObject({
 q:z.string().trim().max(80).default(""),
 limit:z.coerce.number().int().min(1).max(50).default(15),
 departmentId:z.uuid().optional(),
 employmentType:z.string().trim().max(128).optional(),
});
export async function searchCollegeFacultySuggestions(
 context:RequestContext,collegeId:string,raw:unknown,
){
 const input=facultySuggestionSchema.parse(raw);
 const college=await loadAcademicCollegeScope(collegeId);
 requirePermission(context,"courses.manage",{
  collegeId:college.id,organizationId:college.organizationId,
 });
 const pattern="%"+input.q.replace(/[\\%_]/g,value=>"\\"+value)+"%";
 const rows=await getDb().select({
  membershipId:collegeMemberships.id,
  displayName:users.displayName,email:users.email,
 }).from(collegeMemberships)
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
   eq(membershipRoles.role,"FACULTY")))
  .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
  .leftJoin(facultyProfiles,eq(facultyProfiles.membershipId,collegeMemberships.id))
  .where(and(eq(collegeMemberships.collegeId,college.id),
   eq(collegeMemberships.status,"ACTIVE"),
   input.departmentId?eq(facultyProfiles.primaryDepartmentId,input.departmentId):undefined,
   input.employmentType?eq(facultyProfiles.employmentType,input.employmentType):undefined,
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

/** Legacy /popular equivalent for the selected college only. There is no
 * arbitrary cross-tenant faculty cache or keystroke-based usage mutation.
 * Rank by actual active teaching assignments (a defensible usage proxy);
 * fall back to stable name order when there are no assignments.
 */
export async function listPopularCollegeFaculty(
 context:RequestContext,collegeId:string,rawLimit:unknown=10,
){
 const limit=z.coerce.number().int().min(1).max(50).parse(rawLimit);
 const college=await loadAcademicCollegeScope(collegeId);
 requirePermission(context,"courses.manage",{
  collegeId:college.id,organizationId:college.organizationId,
 });
 const assignments=sql<number>`count(distinct ${courseTeachingAssignments.id})::int`;
 const rows=await getDb().select({
  membershipId:collegeMemberships.id,
  displayName:users.displayName,email:users.email,
  activeTeachingAssignments:assignments,
 }).from(collegeMemberships)
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
   eq(membershipRoles.role,"FACULTY")))
  .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
  .leftJoin(courseTeachingAssignments,and(
   eq(courseTeachingAssignments.membershipId,collegeMemberships.id),
   isNull(courseTeachingAssignments.endedAt),isNull(courseTeachingAssignments.deletedAt)))
  .where(and(eq(collegeMemberships.collegeId,college.id),eq(collegeMemberships.status,"ACTIVE")))
  .groupBy(collegeMemberships.id,users.displayName,users.email)
  .orderBy(desc(assignments),asc(users.displayName),asc(collegeMemberships.id))
  .limit(limit+1);
 return {faculty:rows.slice(0,limit).map(item=>({
  membershipId:item.membershipId,displayName:item.displayName??item.email??"Unnamed Faculty",
  email:item.email,activeTeachingAssignments:item.activeTeachingAssignments,
 })),truncated:rows.length>limit};
}
