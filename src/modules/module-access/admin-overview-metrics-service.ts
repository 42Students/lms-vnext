import "server-only";
import {and,countDistinct,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,membershipRoles,moduleAccessRules,colleges,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requirePermission} from "@/modules/permissions/policy";
import {parseModuleMetricsCollegeIds,assertModuleMetricsCollegeScopes} from "./admin-overview-metrics-scope";

/** SA-tenants-modules-R01: only persisted, authorized colleges in this
 * displayed page can contribute to learner counts or override summaries. */
export async function getModuleAccessOverviewMetrics(
 context:RequestContext,visibleCollegeIds:readonly string[],
){
 requirePermission(context,"admin-scope.select");
 const ids=parseModuleMetricsCollegeIds(visibleCollegeIds);
 if(!ids.length)return {largestLearnerScope:0,studentOverrides:0};
 const db=getDb();
 // Do not trust the caller-selected IDs. Load the college and its persisted
 // organization, then reject missing, archived or out-of-scope colleges.
 const visible=await db.select({
  id:colleges.id,organizationId:colleges.organizationId,status:colleges.status,
 }).from(colleges).where(inArray(colleges.id,ids));
 assertModuleMetricsCollegeScopes(context,ids,visible);
 const [learners,overrides]=await Promise.all([
  db.select({collegeId:collegeMemberships.collegeId,total:countDistinct(collegeMemberships.id)})
    .from(collegeMemberships)
    .innerJoin(membershipRoles,and(
      eq(membershipRoles.membershipId,collegeMemberships.id),
      eq(membershipRoles.role,"LEARNER"),
    ))
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .where(and(inArray(collegeMemberships.collegeId,ids),
      eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE")))
    .groupBy(collegeMemberships.collegeId),
  db.select({total:countDistinct(moduleAccessRules.id)}).from(moduleAccessRules)
    .innerJoin(collegeMemberships,eq(moduleAccessRules.scopeId,collegeMemberships.id))
    .innerJoin(membershipRoles,and(
      eq(membershipRoles.membershipId,collegeMemberships.id),
      eq(membershipRoles.role,"LEARNER"),
    ))
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .where(and(eq(moduleAccessRules.scopeType,"MEMBERSHIP"),
      inArray(collegeMemberships.collegeId,ids),
      eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE"))),
 ]);
 return {largestLearnerScope:Math.max(0,...learners.map(row=>row.total)),
  studentOverrides:overrides[0]?.total??0};
}
