import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {users,placementRecruiterProfiles} from "@/db/schema";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {hasActiveRecruiter,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {PlacementsServiceError} from "./errors";
import {hrDisplayNamePatchSchema,normalizeHrDisplayName,sameHrNameVersion} from "./hr-display-name-model";

export async function updateOwnHrDisplayName(context:RequestContext,raw:unknown){
 const input=hrDisplayNamePatchSchema.parse(raw);
 requirePermission(context,"identity.self.manage");
 if(!hasActiveRecruiter(context)||!context.recruiter||context.recruiter.userId!==context.user.id)
  throw new AuthorizationError("identity.self.manage");
 const displayName=normalizeHrDisplayName(input.displayName);
 return getDb().transaction(async tx=>{
  const [person]=await tx.select({
   name:users.displayName,updatedAt:users.updatedAt,
  }).from(users).innerJoin(placementRecruiterProfiles,
   eq(placementRecruiterProfiles.userId,users.id))
   .where(and(eq(users.id,context.user.id),eq(users.platformStatus,"ACTIVE"),
    eq(placementRecruiterProfiles.companyId,context.recruiter!.companyId),
    eq(placementRecruiterProfiles.status,"ACTIVE")))
   .for("update").limit(1);
  if(!person)throw new AuthorizationError("identity.self.manage");
  if(!sameHrNameVersion(person.updatedAt,input.expectedUpdatedAt))
   throw new PlacementsServiceError("PLACEMENT_RECRUITER_PROFILE_STALE");
  if(person.name===displayName)return {displayName,updatedAt:person.updatedAt.toISOString(),changed:false};
  const newTime=new Date(Math.max(Date.now(),person.updatedAt.getTime()+1));
  // A free-form display-name edit has no trustworthy first/family boundary.
  // Clear canonical parts rather than leaving stale names from a previous
  // structured edit; the structured Recruiter editor can restore exact parts.
  const [updated]=await tx.update(users).set({
   displayName,givenName:null,familyName:null,
   identityProfileVersion:sql`${users.identityProfileVersion}+1`,
   updatedAt:newTime,
  })
   .where(and(eq(users.id,context.user.id),eq(users.platformStatus,"ACTIVE"),
    sql`date_trunc('milliseconds', ${users.updatedAt})=${input.expectedUpdatedAt}::timestamptz`))
   .returning({displayName:users.displayName,updatedAt:users.updatedAt});
  if(!updated)throw new PlacementsServiceError("PLACEMENT_RECRUITER_PROFILE_STALE");
  await recordActivityEventInTransaction(tx,context,{
   eventType:ACTIVITY_EVENT_TYPES.PLACEMENTS_RECRUITER_PROFILE_UPDATED,
   subjectType:"recruiter_profile",subjectId:context.user.id,
   summary:"Recruiter display name updated",metadata:{field:"displayName"},
  });
  return {displayName:updated.displayName,updatedAt:updated.updatedAt.toISOString(),changed:true};
 });
}
