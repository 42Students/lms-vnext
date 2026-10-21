import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,facultyProfiles} from "@/db/schema";
import {facultyAvatarCleanupQueue} from "@/db/schema/profiles";
import type {RequestContext} from "@/modules/identity/context";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {createPrivateUploadGrant,readPrivateObjectAttestation,createPrivateReadGrant} from "@/modules/storage/private-object-storage";

const allowed=["image/png","image/jpeg","image/webp"] as const;
const input=z.strictObject({
 contentType:z.enum(allowed),
 sizeBytes:z.number().int().positive().max(5*1024*1024),
});
const confirm=z.strictObject({
 objectKey:z.string().min(20).max(1024),
 expectedVersion:z.number().int().nonnegative(),
});
function scope(context:RequestContext){
 const member=context.membership;
 if(!member||member.status!=="ACTIVE"||!member.roles.includes("FACULTY")||
    context.user.platformStatus!=="ACTIVE")
  throw new Error("FACULTY_ROLE_REQUIRED");
 return member;
}
export async function beginOwnFacultyAvatarUpload(context:RequestContext,raw:unknown){
 const member=scope(context),data=input.parse(raw);
 await getDb().transaction(tx=>assertPersistedPlatformPermission(tx,context,
   "profile.self.manage",{collegeId:member.collegeId,organizationId:member.organizationId}));
 const grant=await createPrivateUploadGrant({
  collegeId:member.collegeId,ownerMembershipId:member.id,
  namespace:"profile-verification",contentType:data.contentType,
  expectedSizeBytes:data.sizeBytes,maxSizeBytes:5*1024*1024,
  expiresInMs:10*60*1000,
 });
 return {grant};
}
export async function confirmOwnFacultyAvatar(context:RequestContext,raw:unknown){
 const member=scope(context),data=confirm.parse(raw);
 const object=await readPrivateObjectAttestation(data.objectKey,{
   collegeId:member.collegeId,ownerMembershipId:member.id,
 });
 if(!allowed.includes(object.contentType as typeof allowed[number])||
    object.sizeBytes>5*1024*1024)throw new Error("FACULTY_AVATAR_INVALID_FILE");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,
    "profile.self.manage",{collegeId:member.collegeId,organizationId:member.organizationId});
  await tx.insert(facultyProfiles).values({membershipId:member.id})
    .onConflictDoNothing();
  const [current]=await tx.select({
    avatarObjectPath:facultyProfiles.avatarObjectPath,
    version:facultyProfiles.profileDocumentVersion,
  }).from(facultyProfiles).where(eq(facultyProfiles.membershipId,member.id))
   .for("update").limit(1);
  if(!current)throw new Error("FACULTY_PROFILE_NOT_FOUND");
  if(current.avatarObjectPath===data.objectKey)
   return {saved:true,version:current.version,replayed:true,cleanupPending:false};
  if(current.version!==data.expectedVersion)
   throw new Error("FACULTY_PROFILE_VERSION_CONFLICT");
  const [updated]=await tx.update(facultyProfiles).set({
    avatarObjectPath:data.objectKey,
    profileDocumentVersion:sql`${facultyProfiles.profileDocumentVersion}+1`,
    updatedAt:new Date(),
  }).where(and(eq(facultyProfiles.membershipId,member.id),
    eq(facultyProfiles.profileDocumentVersion,data.expectedVersion)))
   .returning({version:facultyProfiles.profileDocumentVersion});
  if(!updated)throw new Error("FACULTY_PROFILE_VERSION_CONFLICT");
  const previous=current.avatarObjectPath;
  const privateOld=previous?.startsWith(
    "private/"+member.collegeId+"/"+member.id+"/profile-verification/")??false;
  if(privateOld&&previous){
    await tx.insert(facultyAvatarCleanupQueue).values({
     membershipId:member.id,collegeId:member.collegeId,oldObjectKey:previous,
    });
  }
  await tx.insert(activityEvents).values({
    organizationId:member.organizationId,collegeId:member.collegeId,
    actorUserId:context.user.id,actorMembershipId:member.id,
    module:"PEOPLE",eventType:"people.faculty_avatar.updated",
    subjectType:"faculty_profile",subjectId:member.id,
    summary:"Faculty profile image updated",
    metadata:{replaced:Boolean(previous),cleanupQueued:privateOld},
  });
  return {saved:true,version:updated.version,replayed:false,cleanupPending:privateOld};
 });
}
export async function readOwnFacultyAvatar(context:RequestContext){
 const member=scope(context);
 await getDb().transaction(tx=>assertPersistedPlatformPermission(tx,context,
  "profile.self.manage",{collegeId:member.collegeId,organizationId:member.organizationId}));
 const [profile]=await getDb().select({key:facultyProfiles.avatarObjectPath,
  version:facultyProfiles.profileDocumentVersion}).from(facultyProfiles)
  .where(eq(facultyProfiles.membershipId,member.id)).limit(1);
 if(!profile?.key)return {preview:null,version:profile?.version??0};
 const grant=await createPrivateReadGrant({
  objectKey:profile.key,collegeId:member.collegeId,
  ownerMembershipId:member.id,expiresInMs:5*60*1000,
 });
 return {preview:grant.readUrl,version:profile.version};
}
