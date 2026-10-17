import {hasPlacementTeamMembership} from "./placement-team-access-model";
import "server-only";
import {and,eq,or} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {placementTpoInternalReads,placementTpoInternalThreads} from "@/db/schema/tpo-internal";
import {type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {requirePlacementManageScope} from "./scope";
import {placementTableExists} from "./staged-tables";

export const tpoTeamPreferenceActionSchema=z.strictObject({
 threadId:z.string().uuid(),
 action:z.enum(["FOLLOW","UNFOLLOW","MUTE","UNMUTE"]),
});
async function scope(context:RequestContext,threadId:string){
 const member=context.membership;
 if(!member||member.status!=="ACTIVE"||context.user.platformStatus!=="ACTIVE"||
  !hasPlacementTeamMembership(context))throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(context,member.collegeId);
 return {member,college,threadId};
}
export async function getTpoTeamThreadPreferences(context:RequestContext,threadId:string){
 const input=z.string().uuid().parse(threadId);
 const {member,college}=await scope(context,input);
 const ready=await placementTableExists("placement_tpo_internal_reads");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId:college.id,organizationId:college.organizationId,
  });
  const [thread]=await tx.select({id:placementTpoInternalThreads.id})
   .from(placementTpoInternalThreads).where(and(
    eq(placementTpoInternalThreads.id,input),eq(placementTpoInternalThreads.collegeId,college.id),
    or(eq(placementTpoInternalThreads.startedByMembershipId,member.id),
       eq(placementTpoInternalThreads.invitedMembershipId,member.id)),
   )).limit(1);
  if(!thread)throw new Error("TEAM_THREAD_NOT_FOUND");
  if(!ready)return {status:"NOT_REGISTERED" as const,following:true,muted:false};
  const [prefs]=await tx.select({following:placementTpoInternalReads.following,
   mutedAt:placementTpoInternalReads.mutedAt}).from(placementTpoInternalReads)
   .where(and(eq(placementTpoInternalReads.threadId,thread.id),
    eq(placementTpoInternalReads.membershipId,member.id),
    eq(placementTpoInternalReads.collegeId,college.id))).limit(1);
  return {status:"READY" as const,following:prefs?.following??true,muted:!!prefs?.mutedAt};
 });
}
export async function updateTpoTeamThreadPreferences(context:RequestContext,raw:unknown){
 const input=tpoTeamPreferenceActionSchema.parse(raw);
 const {member,college}=await scope(context,input.threadId);
 if(!await placementTableExists("placement_tpo_internal_reads"))
  throw new Error("TEAM_PREFERENCES_PENDING");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId:college.id,organizationId:college.organizationId,
  });
  const [thread]=await tx.select({id:placementTpoInternalThreads.id})
   .from(placementTpoInternalThreads).where(and(
    eq(placementTpoInternalThreads.id,input.threadId),
    eq(placementTpoInternalThreads.collegeId,college.id),
    or(eq(placementTpoInternalThreads.startedByMembershipId,member.id),
       eq(placementTpoInternalThreads.invitedMembershipId,member.id)),
   )).for("share").limit(1);
  if(!thread)throw new Error("TEAM_THREAD_NOT_FOUND");
  const [current]=await tx.select().from(placementTpoInternalReads)
   .where(and(eq(placementTpoInternalReads.threadId,thread.id),
    eq(placementTpoInternalReads.collegeId,college.id),
    eq(placementTpoInternalReads.membershipId,member.id))).for("update").limit(1);
  const following=input.action==="FOLLOW"?true:input.action==="UNFOLLOW"?false:current?.following??true;
  const mutedAt=input.action==="MUTE"?new Date():input.action==="UNMUTE"?null:current?.mutedAt??null;
  await tx.insert(placementTpoInternalReads).values({
   collegeId:college.id,threadId:thread.id,membershipId:member.id,
   readThrough:current?.readThrough??new Date(0),following,mutedAt,
  }).onConflictDoUpdate({
   target:[placementTpoInternalReads.threadId,placementTpoInternalReads.membershipId],
   set:{following,mutedAt},
  });
  return {following,muted:!!mutedAt};
 });
}
