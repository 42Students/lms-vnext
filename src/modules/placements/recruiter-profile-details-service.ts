import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {users,placementRecruiterProfiles} from "@/db/schema";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {hasActiveRecruiter,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {PlacementsServiceError} from "./errors";
import {joinHrRecruiterName} from "./hr-recruiter-name-fields-model";
import {sameHrNameVersion} from "./hr-display-name-model";
import {sameRecruiterProfileVersion} from "./recruiter-designation-model";

/** REC-calendar-messages-profile-25/-27: one atomic form for recruiter
 * identity, designation and optional contact-only mobile. Never edits email. */
export const recruiterProfileDetailsPatchSchema=z.strictObject({
 firstName:z.string().trim().min(1,"First name is required").max(100),
 lastName:z.string().trim().max(100),
 designation:z.string().trim().max(160),
 mobile:z.string().trim().max(30),
 expectedUserUpdatedAt:z.string().datetime({offset:true}),
 expectedProfileUpdatedAt:z.string().datetime({offset:true}),
}).superRefine((input,ctx)=>{
 const name=[input.firstName,input.lastName].filter(Boolean).join(" ");
 if(name.length<2||name.length>160)ctx.addIssue({code:"custom",path:["firstName"],
  message:"Full name must be between 2 and 160 characters"});
 if(!recruiterMobileNumberValid(input.mobile))ctx.addIssue({code:"custom",path:["mobile"],
  message:"Enter a valid 10-digit mobile number, or leave it blank"});
});
export function recruiterMobileNumberValid(input:string):boolean {
 if(!input.trim())return true;
 const normal=input.trim().replace(/[\s()-]/g,"");
 const national=normal.startsWith("+91")?normal.slice(3):normal.startsWith("91")?normal.slice(2):normal;
 return /^\d{10}$/.test(national);
}
export function normalizeRecruiterMobile(input:string):string|null {
 if(!input.trim())return null;
 const normal=input.trim().replace(/[\s()-]/g,"");
 const national=normal.startsWith("+91")?normal.slice(3):normal.startsWith("91")?normal.slice(2):normal;
 return "+91"+national;
}

export async function updateOwnRecruiterProfileDetails(context:RequestContext,raw:unknown){
 const input=recruiterProfileDetailsPatchSchema.parse(raw);
 requirePermission(context,"identity.self.manage");
 if(!hasActiveRecruiter(context)||!context.recruiter||context.recruiter.userId!==context.user.id)
  throw new AuthorizationError("identity.self.manage");
 const displayName=joinHrRecruiterName(input.firstName,input.lastName);
 const phoneE164=normalizeRecruiterMobile(input.mobile);
 const title=input.designation||null;
 return getDb().transaction(async tx=>{
  const [current]=await tx.select({
   displayName:users.displayName,phoneE164:users.phoneE164,userUpdatedAt:users.updatedAt,
   title:placementRecruiterProfiles.title,profileUpdatedAt:placementRecruiterProfiles.updatedAt,
  }).from(users).innerJoin(placementRecruiterProfiles,eq(placementRecruiterProfiles.userId,users.id))
   .where(and(eq(users.id,context.user.id),eq(users.platformStatus,"ACTIVE"),
    eq(placementRecruiterProfiles.companyId,context.recruiter!.companyId),
    eq(placementRecruiterProfiles.status,"ACTIVE"))).for("update").limit(1);
  if(!current)throw new AuthorizationError("identity.self.manage");
  if(!sameHrNameVersion(current.userUpdatedAt,input.expectedUserUpdatedAt)||
     !sameRecruiterProfileVersion(current.profileUpdatedAt,input.expectedProfileUpdatedAt))
    throw new PlacementsServiceError("PLACEMENT_RECRUITER_PROFILE_STALE");
  const userChanged=current.displayName!==displayName||current.phoneE164!==phoneE164;
  const titleChanged=current.title!==title;
  let nextUserAt=current.userUpdatedAt,nextProfileAt=current.profileUpdatedAt;
  if(userChanged){
   const next=new Date(Math.max(Date.now(),current.userUpdatedAt.getTime()+1));
   const [updated]=await tx.update(users).set({displayName,phoneE164,updatedAt:next})
    .where(and(eq(users.id,context.user.id),eq(users.platformStatus,"ACTIVE"),
     sql`date_trunc('milliseconds', ${users.updatedAt})=${input.expectedUserUpdatedAt}::timestamptz`))
    .returning({updatedAt:users.updatedAt});
   if(!updated)throw new PlacementsServiceError("PLACEMENT_RECRUITER_PROFILE_STALE");
   nextUserAt=updated.updatedAt;
  }
  if(titleChanged){
   const next=new Date(Math.max(Date.now(),current.profileUpdatedAt.getTime()+1));
   const [updated]=await tx.update(placementRecruiterProfiles).set({title,updatedAt:next})
    .where(and(eq(placementRecruiterProfiles.userId,context.user.id),
     eq(placementRecruiterProfiles.companyId,context.recruiter!.companyId),
     eq(placementRecruiterProfiles.status,"ACTIVE"),
     sql`date_trunc('milliseconds', ${placementRecruiterProfiles.updatedAt})=${input.expectedProfileUpdatedAt}::timestamptz`))
    .returning({updatedAt:placementRecruiterProfiles.updatedAt});
   if(!updated)throw new PlacementsServiceError("PLACEMENT_RECRUITER_PROFILE_STALE");
   nextProfileAt=updated.updatedAt;
  }
  if(userChanged||titleChanged)await recordActivityEventInTransaction(tx,context,{
   eventType:ACTIVITY_EVENT_TYPES.PLACEMENTS_RECRUITER_PROFILE_UPDATED,
   subjectType:"recruiter_profile",subjectId:context.user.id,
   summary:"Recruiter profile details updated",metadata:{fields:[
    ...(current.displayName!==displayName?["displayName"]:[]),
    ...(current.phoneE164!==phoneE164?["phone"]:[]),
    ...(titleChanged?["title"]:[]),
   ]},
  });
  return {displayName,phoneE164,title,
   userUpdatedAt:nextUserAt.toISOString(),profileUpdatedAt:nextProfileAt.toISOString(),
   changed:userChanged||titleChanged};
 });
}
