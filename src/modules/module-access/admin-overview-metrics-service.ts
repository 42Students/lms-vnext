import "server-only";
import {and,count,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,membershipRoles,moduleAccessRules} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requirePermission} from "@/modules/permissions/policy";

/** SA-tenants-modules-R01: only the already-authorized visible colleges are
 * counted; totals must never be extrapolated to a whole tenant. */
export async function getModuleAccessOverviewMetrics(
 context:RequestContext,visibleCollegeIds:readonly string[],
){
 requirePermission(context,"admin-scope.select");
 if(!visibleCollegeIds.length)return {largestLearnerScope:0,studentOverrides:0};
 const db=getDb();
 const [learners,overrides]=await Promise.all([
  db.select({collegeId:collegeMemberships.collegeId,total:count()})
    .from(collegeMemberships)
    .innerJoin(membershipRoles,and(
      eq(membershipRoles.membershipId,collegeMemberships.id),
      eq(membershipRoles.role,"LEARNER"),
    ))
    .where(and(inArray(collegeMemberships.collegeId,[...visibleCollegeIds]),
      eq(collegeMemberships.status,"ACTIVE")))
    .groupBy(collegeMemberships.collegeId),
  db.select({total:count()}).from(moduleAccessRules)
    .innerJoin(collegeMemberships,eq(moduleAccessRules.scopeId,collegeMemberships.id))
    .where(and(eq(moduleAccessRules.scopeType,"MEMBERSHIP"),
      inArray(collegeMemberships.collegeId,[...visibleCollegeIds]))),
 ]);
 return {largestLearnerScope:Math.max(0,...learners.map(row=>row.total)),
  studentOverrides:overrides[0]?.total??0};
}
