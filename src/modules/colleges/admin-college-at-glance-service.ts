import "server-only";
import {and,countDistinct,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,membershipRoles,courses,departments,colleges,placementJobs} from "@/db/schema";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {z} from "zod";
/** Counts only recorded active members and in-college content. Unknown is
 * represented by a failed read, never silently reported as 0. */
export async function getSuperAdminCollegeAtGlance(ctx:RequestContext,collegeRaw:string){
 if(!isSuperAdmin(ctx))throw new AuthorizationError("admin-scope.select");
 requirePermission(ctx,"admin-scope.select");
 const collegeId=z.uuid().parse(collegeRaw);
 const [college]=await getDb().select({id:colleges.id,organizationId:colleges.organizationId})
  .from(colleges).where(and(eq(colleges.id,collegeId),eq(colleges.status,"ACTIVE"))).limit(1);
 if(!college)throw new AuthorizationError("college.read");
 requirePermission(ctx,"college.read",{collegeId,organizationId:college.organizationId});
 const db=getDb();
 const byRole=async(role:"LEARNER"|"FACULTY")=>{
  const [row]=await db.select({n:countDistinct(collegeMemberships.id)})
   .from(collegeMemberships).innerJoin(membershipRoles,eq(membershipRoles.membershipId,collegeMemberships.id))
   .where(and(eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.status,"ACTIVE"),eq(membershipRoles.role,role)));
  return row?.n??0;
 };
 const [students,faculty,courseRows,driveRows]=await Promise.all([
  byRole("LEARNER"),byRole("FACULTY"),
  db.select({n:countDistinct(courses.id)}).from(courses)
   .innerJoin(departments,eq(departments.id,courses.departmentId))
   .where(and(eq(departments.collegeId,collegeId),eq(courses.status,"ACTIVE"))),
  db.select({n:countDistinct(placementJobs.id)}).from(placementJobs)
   .where(and(eq(placementJobs.collegeId,collegeId),eq(placementJobs.status,"PUBLISHED"))),
 ]);
 return {students,faculty,courses:courseRows[0]?.n??0,activeDrives:driveRows[0]?.n??0};
}
