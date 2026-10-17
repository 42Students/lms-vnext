import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementTpoTeamAsks} from "@/db/schema/tpo-internal";
import {type RequestContext,hasMembershipRole} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {requirePlacementManageScope} from "./scope";
import {placementTableExists} from "./staged-tables";

/** Only persisted OPEN asks count; never infer workload from a person's role. */
export async function readTpoTeamAskWorkload(context:RequestContext,now:Date=new Date()){
 const membership=context.membership;
 if(!membership||membership.status!=="ACTIVE"||!hasMembershipRole(context,"TPO"))
  throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(context,membership.collegeId);
 if(!await placementTableExists("placement_tpo_team_asks"))
  return {ready:false as const,items:[]};
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId:college.id,organizationId:college.organizationId,
  });
  const items=await tx.select({
   membershipId:placementTpoTeamAsks.assigneeMembershipId,
   openAsks:sql<number>`count(*)::integer`,
   overdueAsks:sql<number>`count(*) filter(where ${placementTpoTeamAsks.dueAt} < ${now})::integer`,
  }).from(placementTpoTeamAsks).where(and(
   eq(placementTpoTeamAsks.collegeId,college.id),
   eq(placementTpoTeamAsks.status,"OPEN"),
  )).groupBy(placementTpoTeamAsks.assigneeMembershipId);
  return {ready:true as const,items:items.map(row=>({
   membershipId:row.membershipId,openAsks:Number(row.openAsks),overdueAsks:Number(row.overdueAsks),
  }))};
 });
}
