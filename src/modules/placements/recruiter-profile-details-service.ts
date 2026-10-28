import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {users,placementRecruiterProfiles,placementRecruiterPublicContacts} from "@/db/schema";
import {type RequestContext,hasActiveRecruiter} from "@/modules/identity/context";
import {requirePermission,AuthorizationError} from "@/modules/permissions/policy";
import {PlacementsServiceError} from "./errors";
import {joinHrRecruiterName,sameHrNameVersion} from "./hr-recruiter-name-fields-model";
import {sameRecruiterProfileVersion,normalizeRecruiterDesignation} from "./recruiter-designation-model";
import {normalizeLegacyRecruiterMobile,recruiterProfileDetailsPatchSchema} from "./recruiter-profile-details-model";
import {placementTableExists} from "./staged-tables";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";

export async function updateOwnRecruiterProfileDetails(context:RequestContext,raw:unknown){
 const input=recruiterProfileDetailsPatchSchema.parse(raw);
 requirePermission(context,"identity.self.manage");
 if(!hasActiveRecruiter(context)||context.recruiter?.userId!==context.user.id)
  throw new AuthorizationError("identity.self.manage");
 // The older employer form edited first and last names independently. The
 // canonical user row must retain both exact name parts, without truncation
 // instead of truncating either field (which would lose identity information).
 const name=joinHrRecruiterName(input.firstName,input.lastName);
 const title=normalizeRecruiterDesignation(input.title);
 const phone=normalizeLegacyRecruiterMobile(input.phone);
 if(phone===null)throw new PlacementsServiceError("PLACEMENT_RECRUITER_PROFILE_STALE");
 const contactReady=await placementTableExists("placement_recruiter_public_contacts");
 // Empty phone is a valid clear operation only when the contact table exists;
 // never accidentally overwrite identity provider phone_e164 login credentials.
 if(!contactReady&&phone)throw new PlacementsServiceError("PLACEMENT_RECRUITER_PROFILE_STALE");
 return getDb().transaction(async tx=>{
  const [person]=await tx.select({
   id:users.id,displayName:users.displayName,userUpdatedAt:users.updatedAt,
   givenName:users.givenName,familyName:users.familyName,
   title:placementRecruiterProfiles.title,profileUpdatedAt:placementRecruiterProfiles.updatedAt,
  }).from(users).innerJoin(placementRecruiterProfiles,eq(placementRecruiterProfiles.userId,users.id))
   .where(and(eq(users.id,context.user.id),eq(users.platformStatus,"ACTIVE"),
    eq(placementRecruiterProfiles.status,"ACTIVE"),
    eq(placementRecruiterProfiles.companyId,context.recruiter!.companyId)))
   .for("update").limit(1);
  if(!person)throw new AuthorizationError("identity.self.manage");
  if(!sameHrNameVersion(person.userUpdatedAt,input.expectedUserUpdatedAt)||
   !sameRecruiterProfileVersion(person.profileUpdatedAt,input.expectedProfileUpdatedAt))
   throw new PlacementsServiceError("PLACEMENT_RECRUITER_PROFILE_STALE");
  const [existing]=contactReady?await tx.select({phone:placementRecruiterPublicContacts.phoneDigits})
    .from(placementRecruiterPublicContacts).where(
     eq(placementRecruiterPublicContacts.recruiterUserId,context.user.id)).for("update").limit(1):[];
  const phoneChanged=(existing?.phone??"")!==phone;
  const nameChanged=(person.displayName??"")!==name;
  const canonicalNameChanged=person.givenName!==input.firstName||
    (person.familyName??"")!==input.lastName;
  const identityNameChanged=nameChanged||canonicalNameChanged;
  const titleChanged=person.title!==title;
  if(!phoneChanged&&!identityNameChanged&&!titleChanged)
   return {displayName:name,title,phone,changed:false,
    userUpdatedAt:person.userUpdatedAt.toISOString(),
    profileUpdatedAt:person.profileUpdatedAt.toISOString()};
  const now=new Date(Math.max(Date.now(),person.userUpdatedAt.getTime()+1,person.profileUpdatedAt.getTime()+1));
  if(identityNameChanged){
   const [updated]=await tx.update(users).set({
    displayName:name,givenName:input.firstName,familyName:input.lastName||null,
    identityProfileVersion:sql`${users.identityProfileVersion}+1`,updatedAt:now,
   })
    .where(and(eq(users.id,person.id),
     sql`date_trunc('milliseconds', ${users.updatedAt})=${input.expectedUserUpdatedAt}::timestamptz`))
    .returning({id:users.id});
   if(!updated)throw new PlacementsServiceError("PLACEMENT_RECRUITER_PROFILE_STALE");
  }
  if(titleChanged){
   const [updated]=await tx.update(placementRecruiterProfiles).set({title,updatedAt:now})
    .where(and(eq(placementRecruiterProfiles.userId,context.user.id),
     eq(placementRecruiterProfiles.companyId,context.recruiter!.companyId),
     sql`date_trunc('milliseconds', ${placementRecruiterProfiles.updatedAt})=${input.expectedProfileUpdatedAt}::timestamptz`))
    .returning({userId:placementRecruiterProfiles.userId});
   if(!updated)throw new PlacementsServiceError("PLACEMENT_RECRUITER_PROFILE_STALE");
  }
  if(phoneChanged&&contactReady){
   if(phone)await tx.insert(placementRecruiterPublicContacts).values({
    recruiterUserId:context.user.id,phoneDigits:phone,
   }).onConflictDoUpdate({target:placementRecruiterPublicContacts.recruiterUserId,
    set:{phoneDigits:phone,updatedAt:now}});
   else await tx.delete(placementRecruiterPublicContacts).where(
    eq(placementRecruiterPublicContacts.recruiterUserId,context.user.id));
  }
  await recordActivityEventInTransaction(tx,context,{
   eventType:ACTIVITY_EVENT_TYPES.PLACEMENTS_RECRUITER_PROFILE_UPDATED,
   subjectType:"recruiter_profile",subjectId:context.user.id,
   summary:"Recruiter profile details updated",
   metadata:{nameChanged,canonicalNameChanged,titleChanged,phoneChanged},
  });
  return {displayName:name,title,phone,changed:true,
   userUpdatedAt:(identityNameChanged?now:person.userUpdatedAt).toISOString(),
   profileUpdatedAt:(titleChanged?now:person.profileUpdatedAt).toISOString()};
 });
}
