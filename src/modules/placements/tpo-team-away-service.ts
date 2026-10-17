import {hasPlacementTeamMembership} from "./placement-team-access-model";
import "server-only";
import {and,eq,gt} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {placementTpoTeamAway} from "@/db/schema/tpo-internal";
import {type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {requirePlacementManageScope} from "./scope";
import {placementTableExists} from "./staged-tables";
import {tpoEffectiveAwayUntil} from "./tpo-team-away-model";
export const tpoTeamAwaySchema=z.strictObject({
 until:z.string().datetime({offset:true}).nullable(),
 expectedUntil:z.string().datetime({offset:true}).nullable(),
});
function requireTpoActor(context:RequestContext){
 const member=context.membership;
 if(!member||member.status!=="ACTIVE"||context.user.platformStatus!=="ACTIVE"||
  !hasPlacementTeamMembership(context))throw new AuthorizationError("placements.manage");
 return member;
}
/** Never guess another member's absence from activity or availability. */
export async function listTpoTeamAway(context:RequestContext){
 const member=requireTpoActor(context);
 const college=await requirePlacementManageScope(context,member.collegeId);
 if(!await placementTableExists("placement_tpo_team_away"))return {ready:false as const,items:[]};
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  const items=await tx.select({membershipId:placementTpoTeamAway.membershipId,
   awayUntil:placementTpoTeamAway.awayUntil})
   .from(placementTpoTeamAway).where(and(
    eq(placementTpoTeamAway.collegeId,college.id),gt(placementTpoTeamAway.awayUntil,new Date()),
   ));
  return {ready:true as const,items};
 });
}
/** Only a TPO can set their own away date, CAS against current value. */
export async function setMyTpoTeamAway(context:RequestContext,raw:unknown){
 const input=tpoTeamAwaySchema.parse(raw),member=requireTpoActor(context);
 const college=await requirePlacementManageScope(context,member.collegeId);
 if(!await placementTableExists("placement_tpo_team_away"))throw new Error("TEAM_AWAY_PENDING");
 const now=new Date(),until=input.until?new Date(input.until):null;
 if(until&&(until.getTime()<=now.getTime()||until.getTime()>now.getTime()+365*86400000))
  throw new Error("TEAM_AWAY_INVALID_DATE");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  const [current]=await tx.select({awayUntil:placementTpoTeamAway.awayUntil})
   .from(placementTpoTeamAway).where(and(
    eq(placementTpoTeamAway.collegeId,college.id),
    eq(placementTpoTeamAway.membershipId,member.id),
   )).for("update").limit(1);
  const actual=tpoEffectiveAwayUntil(current?.awayUntil??null,now);
  if(actual!==input.expectedUntil)throw new Error("TEAM_AWAY_STALE");
  if(until)await tx.insert(placementTpoTeamAway).values({
   collegeId:college.id,membershipId:member.id,awayUntil:until,updatedAt:now,
  }).onConflictDoUpdate({target:[placementTpoTeamAway.collegeId,placementTpoTeamAway.membershipId],
   set:{awayUntil:until,updatedAt:now}});
  else await tx.delete(placementTpoTeamAway).where(and(
   eq(placementTpoTeamAway.collegeId,college.id),
   eq(placementTpoTeamAway.membershipId,member.id),
  ));
  return {until:until?.toISOString()??null};
 });
}
