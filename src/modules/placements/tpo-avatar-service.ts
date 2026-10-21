import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,facultyProfiles} from "@/db/schema";
import {facultyAvatarCleanupQueue} from "@/db/schema/profiles";
import type {RequestContext} from "@/modules/identity/context";
import {hasMembershipRole} from "@/modules/identity/context";
import {requirePlacementManageScope} from "@/modules/placements/scope";
import {createPrivateUploadGrant,readPrivateObjectAttestation,createPrivateReadGrant} from "@/modules/storage/private-object-storage";

const types=["image/png","image/jpeg","image/webp"] as const;
const startSchema=z.strictObject({contentType:z.enum(types),
 sizeBytes:z.number().int().positive().max(5*1024*1024)});
const finishSchema=z.strictObject({objectKey:z.string().min(20).max(1024),
 expectedVersion:z.number().int().nonnegative()});

async function ownMembership(context:RequestContext){
 const member=context.membership;
 if(!member||!hasMembershipRole(context,"TPO")||member.status!=="ACTIVE")
  throw new Error("TPO_ROLE_REQUIRED");
 await requirePlacementManageScope(context,member.collegeId);
 return member;
}
export async function beginOwnTpoAvatarUpload(context:RequestContext,input:unknown){
 const member=await ownMembership(context),data=startSchema.parse(input);
 const grant=await createPrivateUploadGrant({
  collegeId:member.collegeId,ownerMembershipId:member.id,namespace:"profile-verification",
  contentType:data.contentType,expectedSizeBytes:data.sizeBytes,
  maxSizeBytes:5*1024*1024,expiresInMs:10*60*1000,
 });
 return {grant};
}
export async function confirmOwnTpoAvatar(context:RequestContext,input:unknown){
 const member=await ownMembership(context),data=finishSchema.parse(input);
 const evidence=await readPrivateObjectAttestation(data.objectKey,{
  collegeId:member.collegeId,ownerMembershipId:member.id});
 if(!types.includes(evidence.contentType as typeof types[number])||
   evidence.sizeBytes<1||evidence.sizeBytes>5*1024*1024)
  throw new Error("TPO_AVATAR_INVALID_FILE");
 return getDb().transaction(async tx=>{
  await tx.insert(facultyProfiles).values({membershipId:member.id}).onConflictDoNothing();
  const [current]=await tx.select({path:facultyProfiles.avatarObjectPath,
   version:facultyProfiles.profileDocumentVersion}).from(facultyProfiles)
   .where(eq(facultyProfiles.membershipId,member.id)).for("update").limit(1);
  if(!current)throw new Error("PROFILE_NOT_FOUND");
  if(current.path===data.objectKey)return {saved:true,version:current.version,replayed:true};
  if(current.version!==data.expectedVersion)throw new Error("PROFILE_VERSION_CONFLICT");
  const [updated]=await tx.update(facultyProfiles).set({
   avatarObjectPath:data.objectKey,updatedAt:new Date(),
   profileDocumentVersion:sql`${facultyProfiles.profileDocumentVersion}+1`,
  }).where(and(eq(facultyProfiles.membershipId,member.id),
    eq(facultyProfiles.profileDocumentVersion,data.expectedVersion)))
   .returning({version:facultyProfiles.profileDocumentVersion});
  if(!updated)throw new Error("PROFILE_VERSION_CONFLICT");
  const old=current.path;
  const managed=old?.startsWith("private/"+member.collegeId+"/"+member.id+"/profile-verification/")??false;
  if(managed&&old)await tx.insert(facultyAvatarCleanupQueue).values({
   membershipId:member.id,collegeId:member.collegeId,oldObjectKey:old});
  await tx.insert(activityEvents).values({
   organizationId:member.organizationId,collegeId:member.collegeId,
   actorUserId:context.user.id,actorMembershipId:member.id,
   module:"PEOPLE",eventType:"people.tpo_avatar.updated",subjectType:"faculty_profile",
   subjectId:member.id,summary:"Placement officer photo updated",
   metadata:{replaced:Boolean(old),cleanupQueued:managed},
  });
  return {saved:true,version:updated.version};
 });
}
export async function readOwnTpoAvatar(context:RequestContext){
 const member=await ownMembership(context);
 const [profile]=await getDb().select({path:facultyProfiles.avatarObjectPath,
  version:facultyProfiles.profileDocumentVersion}).from(facultyProfiles)
  .where(eq(facultyProfiles.membershipId,member.id)).limit(1);
 if(!profile?.path)return {preview:null,version:profile?.version??0};
 const grant=await createPrivateReadGrant({
  objectKey:profile.path,collegeId:member.collegeId,
  ownerMembershipId:member.id,expiresInMs:5*60*1000});
 return {preview:grant.readUrl,version:profile.version};
}
