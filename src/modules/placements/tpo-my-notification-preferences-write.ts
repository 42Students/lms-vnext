import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {tpoNotificationPreferenceSaveSchema,tpoNotificationPreferenceValues,tpoNotificationPreferencesMatch} from "./tpo-my-notification-preferences-model";
import {getDb} from "@/db/client";
import {activityEvents,colleges} from "@/db/schema";
import {placementTpoUserPreferences} from "@/db/schema/tpo-collaboration";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {requirePlacementManageScope} from "./scope";
import {placementTableExists} from "./staged-tables";
import {TPO_NOTIFICATION_PREFERENCE_DEFAULTS} from "./tpo-my-notifications-model";

export class TpoPreferenceSaveError extends Error{
 constructor(readonly code:"NOT_READY"|"STALE"){super(code);}
}
export async function saveMyTpoNotificationPreferences(context:RequestContext,raw:unknown){
 const input=tpoNotificationPreferenceSaveSchema.parse(raw);
 if(!context.membership||context.membership.status!=="ACTIVE"||
    context.user.platformStatus!=="ACTIVE"||!hasMembershipRole(context,"TPO"))
  throw new AuthorizationError("placements.manage");
 const collegeId=context.membership.collegeId,userId=context.user.id;
 const college=await requirePlacementManageScope(context,collegeId);
 if(!await placementTableExists("placement_tpo_user_preferences"))
  throw new TpoPreferenceSaveError("NOT_READY");
 return getDb().transaction(async tx=>{
  // A row lock on the college serializes concurrent first writes as well as updates.
  const [locked]=await tx.select({id:colleges.id,status:colleges.status}).from(colleges)
   .where(eq(colleges.id,collegeId)).for("update").limit(1);
  if(!locked||locked.status!=="ACTIVE")throw new TpoPreferenceSaveError("NOT_READY");
  // Lock and reconstruct the actor's real roles inside the transaction so
  // a suspended/reassigned TPO cannot update preferences from a stale tab.
  const persisted=await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId,organizationId:college.organizationId,
  });
  if(!hasMembershipRole(persisted,"TPO"))throw new AuthorizationError("placements.manage");
  const [current]=await tx.select().from(placementTpoUserPreferences)
   .where(and(eq(placementTpoUserPreferences.collegeId,collegeId),
    eq(placementTpoUserPreferences.userId,userId))).limit(1);
  const values=tpoNotificationPreferenceValues(input);
  const prior=current??TPO_NOTIFICATION_PREFERENCE_DEFAULTS;
  // Match before CAS so identical retries never rewrite the row or duplicate
  // activity. Creating a first row from defaults remains an explicit write.
  if(current&&tpoNotificationPreferencesMatch(current,values))
   return {saved:true,version:current.updatedAt.toISOString()};
  if((current?.updatedAt.toISOString()??null)!==input.expectedVersion)
   throw new TpoPreferenceSaveError("STALE");
  const changedKeys=(Object.keys(values) as (keyof typeof values)[])
   .filter(key=>prior[key]!==values[key]);
  const [saved]=await tx.insert(placementTpoUserPreferences).values({
   collegeId,userId,...values,updatedAt:new Date(),
  }).onConflictDoUpdate({
   target:[placementTpoUserPreferences.collegeId,placementTpoUserPreferences.userId],
   set:{...values,updatedAt:sql`greatest(clock_timestamp(),date_trunc('milliseconds',${placementTpoUserPreferences.updatedAt}) + interval '1 millisecond')`},
  }).returning({updatedAt:placementTpoUserPreferences.updatedAt});
  if(!saved)throw new TpoPreferenceSaveError("NOT_READY");
  await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId,actorUserId:userId,
   actorMembershipId:context.membership!.id,module:"PLACEMENTS",
   eventType:"placements.tpo_notification_preferences.updated",
   subjectType:"USER",subjectId:userId,
   summary:"Placement officer updated personal notification preferences",
   metadata:{fieldsChanged:changedKeys},
  });
  return {saved:true,version:saved.updatedAt.toISOString()};
 });
}
