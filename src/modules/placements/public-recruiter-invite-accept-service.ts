import "server-only";
import {createHash} from "node:crypto";
import {and,desc,eq,isNull,sql} from "drizzle-orm";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {getDb} from "@/db/client";
import {
 activityEvents,collegeMemberships,colleges,membershipRoles,inAppNotifications,
 placementCompanies,placementCompanyRelationships,
 placementRecruiterCollegeGrants,placementRecruiterProfiles,
 placementTpoCollegeSettings,placementTpoLeadActivities,placementTpoLeads,
 recruiterInviteCodes,users,
} from "@/db/schema";
import {recruiterGrantValidUntil} from "./recruiter-grant-expiry-policy";
import {recruiterAccessMonthsOrDefault} from "./recruiter-access-defaults";
import {isRecruiterInviteTokenShape,recruiterInviteTokenHash,requireRecruiterInviteUsable}
 from "./tpo-recruiter-invite-policy";
import {recruiterOtpAttemptDecision,recruiterOtpMatches,recruiterInviteOtpSchema}
 from "./recruiter-invite-otp-policy";
import {TpoRecruiterInviteServiceError} from "./tpo-recruiter-invite-service";
import {publicRecruiterJoinedNotification} from "./public-join/join-notification-model";
import {recruiterInviteAcceptanceBodySchema} from "./recruiter-invite-otp-accept-model";

/** Public signup is authorized solely by an invite bound to a known work email
 * plus its latest DELIVERED OTP. Never accept claimed user, email, company or college IDs.
 */
export async function acceptPublicTpoRecruiterInviteOtp(rawToken:unknown,rawCode:unknown,rawDetails:unknown={}):
 Promise<{accepted:true;outcome:"JOINED"|"PENDING_CONSENT";signInEmail:string}> {
 const invalid=()=>new TpoRecruiterInviteServiceError("TPO_RECRUITER_INVITE_NOT_FOUND");
 const secret=process.env.TPO_RECRUITER_OTP_HMAC_SECRET??"";
 if(process.env.TPO_RECRUITER_OTP_READY!=="VERIFIED"||
  Buffer.byteLength(secret,"utf8")<32||
  typeof rawToken!=="string"||!isRecruiterInviteTokenShape(rawToken)||
  !recruiterInviteOtpSchema.safeParse(rawCode).success)throw invalid();
 const details=recruiterInviteAcceptanceBodySchema.parse({...(typeof rawDetails==="object"&&rawDetails!==null?rawDetails:{}),code:rawCode});
 const token=rawToken,code=rawCode as string,hash=recruiterInviteTokenHash(token);
 const decision=await getDb().transaction(async tx=>{
  const now=new Date();
  const [lead]=await tx.select().from(placementTpoLeads)
   .where(eq(placementTpoLeads.inviteTokenHash,hash)).for("update").limit(1);
  if(!lead||!lead.emailNorm||!lead.companyRelationshipId)return {result:"DENIED" as const};
  try{requireRecruiterInviteUsable(token,lead,now);}catch{return {result:"DENIED" as const};}
  const [challenge]=await tx.select().from(recruiterInviteCodes).where(and(
   eq(recruiterInviteCodes.leadId,lead.id),eq(recruiterInviteCodes.collegeId,lead.collegeId),
   eq(recruiterInviteCodes.tokenHash,hash),
  )).orderBy(desc(recruiterInviteCodes.sentAt),desc(recruiterInviteCodes.id))
    .for("update").limit(1);
  if(!challenge)return {result:"DENIED" as const};
  const attempt=recruiterOtpAttemptDecision(challenge,now,
   recruiterOtpMatches(challenge.codeHash,hash,code,secret));
  if(attempt==="LOCKED")return {result:"DENIED" as const};
  if(attempt==="REJECT"){
   await tx.update(recruiterInviteCodes).set({
    failedAttempts:challenge.failedAttempts+1,
   }).where(eq(recruiterInviteCodes.id,challenge.id));
   return {result:"DENIED" as const};
  }
  const [relationship]=await tx.select({
   companyId:placementCompanyRelationships.companyId,
   companyName:placementCompanies.name,
   status:placementCompanyRelationships.status,
   companyStatus:placementCompanies.status,
   collegeStatus:colleges.status,
   organizationId:colleges.organizationId,
   collegeName:colleges.name,
  }).from(placementCompanyRelationships)
   .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
   .innerJoin(colleges,eq(colleges.id,placementCompanyRelationships.collegeId))
   .where(and(eq(placementCompanyRelationships.id,lead.companyRelationshipId),
    eq(placementCompanyRelationships.collegeId,lead.collegeId)))
   .for("share").limit(1);
  if(!relationship||relationship.status!=="ACTIVE"||relationship.companyStatus!=="ACTIVE"||
   relationship.collegeStatus!=="ACTIVE")return {result:"DENIED" as const};
  const [duration]=await tx.select({months:placementTpoCollegeSettings.recruiterAccessMonths})
   .from(placementTpoCollegeSettings).where(eq(placementTpoCollegeSettings.collegeId,lead.collegeId))
   .for("share").limit(1);
  const months=recruiterAccessMonthsOrDefault(duration?.months);
  const updatedName=details.name??lead.name;
  const updatedDesignation=details.designation??lead.designation;
  const updatedPhone=details.mobile===undefined?lead.phoneNorm:
    (details.mobile.replace(/\D/g,"").slice(-10)||null);
  const email=lead.emailNorm.trim().toLowerCase();
  // Must not create or relabel a second identity for a verified email.
  const [previousIdentity]=await tx.select({id:users.id})
   .from(users).where(sql`lower(${users.email})=${email}`).limit(1);
  const pendingConsent=Boolean(previousIdentity);
  await tx.insert(users).values({
   identityUid:"public-recruiter-email:"+createHash("sha256").update(email).digest("hex"),
   email,displayName:updatedName,
  }).onConflictDoNothing();
  const [user]=await tx.select({id:users.id,status:users.platformStatus})
   .from(users).where(sql`lower(${users.email})=${email}`).for("update").limit(1);
  if(!user||user.status!=="ACTIVE")throw invalid();
  // Do not create a recruiter profile on behalf of an existing account.
  if(!known)await tx.insert(placementRecruiterProfiles).values({
   userId:user.id,companyId:relationship.companyId,createdByUserId:user.id,
   title:updatedDesignation,
  }).onConflictDoNothing();
  const [profile]=await tx.select().from(placementRecruiterProfiles)
    .where(eq(placementRecruiterProfiles.userId,user.id)).for("update").limit(1);
  if(!known&&(!profile||profile.companyId!==relationship.companyId||
    profile.status!=="ACTIVE"))throw invalid();
  if(known&&profile&&(profile.companyId!==relationship.companyId||
    profile.status!=="ACTIVE"))throw invalid();
  const [existing]=await tx.select({id:placementRecruiterCollegeGrants.id})
   .from(placementRecruiterCollegeGrants).where(and(
    eq(placementRecruiterCollegeGrants.recruiterUserId,user.id),
    eq(placementRecruiterCollegeGrants.companyRelationshipId,lead.companyRelationshipId),
    eq(placementRecruiterCollegeGrants.status,"ACTIVE"),
   )).limit(1);
  if(existing)throw invalid();
  if(known){
   // The existing schema deliberately has only ACTIVE/REVOKED grants.
   // Represent pending consent by a consumed challenge + scoped lead marker,
   // NOT by an ACTIVE grant, which would authorize the recruiter prematurely.
   const [consumed]=await tx.update(recruiterInviteCodes).set({consumedAt:now})
    .where(and(eq(recruiterInviteCodes.id,challenge.id),
      isNull(recruiterInviteCodes.consumedAt))).returning({id:recruiterInviteCodes.id});
   if(!consumed)throw invalid();
   const [pending]=await tx.update(placementTpoLeads).set({
    recruiterUserId:user.id,inviteTokenHash:null,updatedAt:now,
    name:updatedName,designation:updatedDesignation,phoneNorm:updatedPhone,
   }).where(and(eq(placementTpoLeads.id,lead.id),
    eq(placementTpoLeads.collegeId,lead.collegeId),
    eq(placementTpoLeads.inviteTokenHash,hash),
    isNull(placementTpoLeads.recruiterUserId))).returning({id:placementTpoLeads.id});
   if(!pending)throw invalid();
   await tx.insert(placementTpoLeadActivities).values({
    collegeId:lead.collegeId,leadId:lead.id,type:"SYSTEM",isSystem:true,
    note:"Recruiter invite awaiting signed-in consent",createdAt:now,
   });
   return {result:"PENDING_HR" as const,email,collegeName:relationship.collegeName};
  }
  const [grant]=await tx.insert(placementRecruiterCollegeGrants).values({
   recruiterUserId:user.id,companyRelationshipId:lead.companyRelationshipId,
   grantedByUserId:user.id,
   pendingRecruiterLeadId:pendingConsent?lead.id:null,
   validUntil:pendingConsent?null:recruiterGrantValidUntil(now,months),
   status:pendingConsent?"PENDING_RECRUITER":"ACTIVE",
   capabilities:["DRIVES","MESSAGES"],
   verificationStatus:pendingConsent?"PENDING":"VERIFIED",
  }).onConflictDoNothing().returning({id:placementRecruiterCollegeGrants.id});
  if(!grant)throw invalid();
  const [consumed]=await tx.update(recruiterInviteCodes).set({consumedAt:now})
   .where(and(eq(recruiterInviteCodes.id,challenge.id),
     isNull(recruiterInviteCodes.consumedAt))).returning({id:recruiterInviteCodes.id});
  if(!consumed)throw invalid();
  const [accepted]=await tx.update(placementTpoLeads).set({
   recruiterUserId:pendingConsent?null:user.id,inviteTokenHash:null,updatedAt:now,
   name:updatedName,designation:updatedDesignation,phoneNorm:updatedPhone,
  }).where(and(eq(placementTpoLeads.id,lead.id),
   eq(placementTpoLeads.collegeId,lead.collegeId),
   eq(placementTpoLeads.inviteTokenHash,hash),
   isNull(placementTpoLeads.recruiterUserId))).returning({id:placementTpoLeads.id});
  if(!accepted)throw invalid();
  if(!pendingConsent){
  await tx.insert(placementTpoLeadActivities).values({
   collegeId:lead.collegeId,leadId:lead.id,type:"SYSTEM",isSystem:true,
   note:"Joined as a recruiter",createdAt:now,
  });
  const [event]=await tx.insert(activityEvents).values({
   organizationId:relationship.organizationId,collegeId:lead.collegeId,
   module:"PLACEMENTS",eventType:"PLACEMENTS_RECRUITER_JOINED",
   subjectType:"placement_tpo_lead",subjectId:lead.id,
   summary:"Recruiter joined by invitation",subjectLabel:updatedName,
   metadata:{recruiterUserId:user.id,companyRelationshipId:lead.companyRelationshipId},
  }).returning({id:activityEvents.id});
  if(!event)throw invalid();
  const officers=await tx.selectDistinct({userId:collegeMemberships.userId})
   .from(collegeMemberships).innerJoin(membershipRoles,
    eq(membershipRoles.membershipId,collegeMemberships.id))
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .where(and(eq(collegeMemberships.collegeId,lead.collegeId),
    eq(collegeMemberships.status,"ACTIVE"),eq(membershipRoles.role,"TPO"),
    eq(users.platformStatus,"ACTIVE")));
  const notification=publicRecruiterJoinedNotification({
   name:updatedName,companyName:relationship.companyName,scope:"COLLEGE",
  });
  if(officers.length)await tx.insert(inAppNotifications).values(officers.map(officer=>({
    eventId:event.id,userId:officer.userId,...notification,
  }))).onConflictDoNothing();
  }
  return {result:pendingConsent?"PENDING_CONSENT" as const:"JOINED" as const,email};
 });
 if(decision.result==="DENIED")throw invalid();
 return {accepted:true,outcome:decision.result,signInEmail:decision.email};
}

/** Pending grants are explicitly outside the active recruiter authorization scope.
 * A signed-in profile owns the invitation; a client-college ID never selects a
 * different recruiter or an unassociated employer. */
export async function listSignedInRecruiterPendingInvites(context:RequestContext){
 if(context.user.platformStatus!=="ACTIVE")throw new AuthorizationError("placements.recruiter.read");
 const rows=await getDb().select({
  collegeId:colleges.id,collegeName:colleges.name,
  company:placementCompanies.name,
  invitedContact:placementTpoLeads.emailNorm,
  invitedAt:placementRecruiterCollegeGrants.createdAt,
 }).from(placementRecruiterCollegeGrants)
 .innerJoin(placementRecruiterProfiles,eq(placementRecruiterProfiles.userId,placementRecruiterCollegeGrants.recruiterUserId))
 .innerJoin(placementCompanyRelationships,eq(placementCompanyRelationships.id,placementRecruiterCollegeGrants.companyRelationshipId))
 .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
 .innerJoin(colleges,eq(colleges.id,placementCompanyRelationships.collegeId))
 .leftJoin(placementTpoLeads,eq(placementTpoLeads.id,placementRecruiterCollegeGrants.pendingRecruiterLeadId))
 .where(and(
  eq(placementRecruiterCollegeGrants.recruiterUserId,context.user.id),
  eq(placementRecruiterCollegeGrants.status,"PENDING_RECRUITER"),
  eq(placementRecruiterProfiles.status,"ACTIVE"),
  eq(placementRecruiterProfiles.companyId,placementCompanyRelationships.companyId),
  eq(placementCompanyRelationships.status,"ACTIVE"),
  eq(placementCompanies.status,"ACTIVE"),eq(colleges.status,"ACTIVE"),
 )).orderBy(desc(placementRecruiterCollegeGrants.createdAt),desc(placementRecruiterCollegeGrants.id));
 return rows;
}

export async function resolveSignedInRecruiterPendingInvite(
 context:RequestContext,rawCollegeId:string,action:"accept"|"decline",
):Promise<{ok:true}>{
 const invalid=()=>new TpoRecruiterInviteServiceError("TPO_RECRUITER_INVITE_NOT_FOUND");
 if(context.user.platformStatus!=="ACTIVE"||
  !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawCollegeId))throw invalid();
 const done=await getDb().transaction(async tx=>{
  const [record]=await tx.select({
    grant:placementRecruiterCollegeGrants,
    leadId:placementRecruiterCollegeGrants.pendingRecruiterLeadId,
    relationship:placementCompanyRelationships,
    college:colleges,
    company:placementCompanies,
    profile:placementRecruiterProfiles,
  }).from(placementRecruiterCollegeGrants)
   .innerJoin(placementRecruiterProfiles,eq(placementRecruiterProfiles.userId,placementRecruiterCollegeGrants.recruiterUserId))
   .innerJoin(placementCompanyRelationships,eq(placementCompanyRelationships.id,placementRecruiterCollegeGrants.companyRelationshipId))
   .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
   .innerJoin(colleges,eq(colleges.id,placementCompanyRelationships.collegeId))
   .where(and(
     eq(placementRecruiterCollegeGrants.recruiterUserId,context.user.id),
     eq(placementRecruiterCollegeGrants.status,"PENDING_RECRUITER"),
     eq(colleges.id,rawCollegeId),eq(colleges.status,"ACTIVE"),
     eq(placementCompanyRelationships.status,"ACTIVE"),
     eq(placementCompanies.status,"ACTIVE"),
     eq(placementRecruiterProfiles.status,"ACTIVE"),
     eq(placementRecruiterProfiles.companyId,placementCompanyRelationships.companyId),
   )).for("update").limit(1);
  if(!record)return false;
  const now=new Date();
  let validUntil:Date|null=null;
  if(action==="accept"){
   const [setting]=await tx.select({months:placementTpoCollegeSettings.recruiterAccessMonths})
    .from(placementTpoCollegeSettings).where(eq(placementTpoCollegeSettings.collegeId,record.college.id)).limit(1);
   validUntil=recruiterGrantValidUntil(now,recruiterAccessMonthsOrDefault(setting?.months));
  }
  const [changed]=await tx.update(placementRecruiterCollegeGrants)
   .set(action==="accept"?{
     status:"ACTIVE",verificationStatus:"VERIFIED",validUntil,
     createdAt:now,updatedAt:now,version:record.grant.version+1,
     pendingRecruiterLeadId:null,
   }:{
     status:"REVOKED",revokedAt:now,revokedByUserId:context.user.id,
     revokeReason:"Declined by the recruiter",revokedByType:"RECRUITER",
     updatedAt:now,version:record.grant.version+1,pendingRecruiterLeadId:null,
   }).where(and(eq(placementRecruiterCollegeGrants.id,record.grant.id),
    eq(placementRecruiterCollegeGrants.recruiterUserId,context.user.id),
    eq(placementRecruiterCollegeGrants.status,"PENDING_RECRUITER")))
   .returning({id:placementRecruiterCollegeGrants.id});
  if(!changed)return false;
  if(action==="accept" && record.leadId){
   await tx.update(placementTpoLeads).set({recruiterUserId:context.user.id,updatedAt:now})
    .where(and(eq(placementTpoLeads.id,record.leadId),eq(placementTpoLeads.collegeId,record.college.id),isNull(placementTpoLeads.recruiterUserId)));
   await tx.insert(placementTpoLeadActivities).values({collegeId:record.college.id,
    leadId:record.leadId,type:"SYSTEM",isSystem:true,note:"Joined as a recruiter",createdAt:now});
   const [event]=await tx.insert(activityEvents).values({
     organizationId:record.college.organizationId,collegeId:record.college.id,
     module:"PLACEMENTS",eventType:"PLACEMENTS_RECRUITER_JOINED",
     subjectType:"placement_tpo_lead",subjectId:record.leadId,
     summary:"Recruiter joined by invitation",subjectLabel:record.profile.title??record.company.name,
     metadata:{recruiterUserId:context.user.id,companyRelationshipId:record.relationship.id},
   }).returning({id:activityEvents.id});
   const team=await tx.selectDistinct({userId:collegeMemberships.userId}).from(collegeMemberships)
    .innerJoin(membershipRoles,eq(membershipRoles.membershipId,collegeMemberships.id))
    .where(and(eq(collegeMemberships.collegeId,record.college.id),
     eq(collegeMemberships.status,"ACTIVE"),eq(membershipRoles.role,"TPO")));
   const notice=publicRecruiterJoinedNotification({
    name:record.profile.title??record.company.name,companyName:record.company.name,scope:"COLLEGE"});
   if(team.length)await tx.insert(inAppNotifications).values(team.map(member=>({
    eventId:event.id,userId:member.userId,...notice,
   }))).onConflictDoNothing();
  }
  return true;
 });
 if(!done)throw invalid();
 return {ok:true};
}

const CONSENT_ACTIVITY_NOTES=[
 "Recruiter invite awaiting signed-in consent",
 "Recruiter invite declined",
 "Joined as a recruiter",
] as const;

/** Called only by an authenticated recruiter action, NEVER from the public
 * OTP route. Both yes/no choices consume the pending lead exactly once. */
export async function decidePendingTpoRecruiterInvite(
 context:RequestContext,leadIdInput:unknown,choice:"ACCEPT"|"DECLINE",
):Promise<{outcome:"JOINED"|"DECLINED";leadId:string}> {
 const invalid=()=>new TpoRecruiterInviteServiceError("TPO_RECRUITER_INVITE_NOT_ALLOWED");
 if(typeof leadIdInput!=="string"||
  !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(leadIdInput)||
  !["ACCEPT","DECLINE"].includes(choice)||
  context.user.platformStatus!=="ACTIVE")throw invalid();
 return getDb().transaction(async tx=>{
  const now=new Date();
  const [lead]=await tx.select().from(placementTpoLeads).where(and(
   eq(placementTpoLeads.id,leadIdInput),eq(placementTpoLeads.recruiterUserId,context.user.id),
  )).for("update").limit(1);
  if(!lead||!lead.companyRelationshipId||!lead.emailNorm||lead.inviteTokenHash)throw invalid();
  const [last]=await tx.select({note:placementTpoLeadActivities.note})
   .from(placementTpoLeadActivities).where(and(
    eq(placementTpoLeadActivities.leadId,lead.id),
    eq(placementTpoLeadActivities.collegeId,lead.collegeId),
    inArray(placementTpoLeadActivities.note,[...CONSENT_ACTIVITY_NOTES]),
   )).orderBy(desc(placementTpoLeadActivities.createdAt),
    desc(placementTpoLeadActivities.id)).limit(1);
  if(last?.note!=="Recruiter invite awaiting signed-in consent")throw invalid();
  const [identity]=await tx.select({id:users.id,email:users.email})
   .from(users).where(and(eq(users.id,context.user.id),
    eq(users.platformStatus,"ACTIVE"))).limit(1);
  if(!identity||identity.email?.trim().toLowerCase()!==lead.emailNorm)throw invalid();
  const [relationship]=await tx.select({
   companyId:placementCompanyRelationships.companyId,
   companyName:placementCompanies.name,
   companyStatus:placementCompanies.status,
   status:placementCompanyRelationships.status,
   collegeStatus:colleges.status,
   organizationId:colleges.organizationId,
  }).from(placementCompanyRelationships)
   .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
   .innerJoin(colleges,eq(colleges.id,placementCompanyRelationships.collegeId))
   .where(and(eq(placementCompanyRelationships.id,lead.companyRelationshipId),
    eq(placementCompanyRelationships.collegeId,lead.collegeId))).limit(1);
  if(!relationship||relationship.companyStatus!=="ACTIVE"||
   relationship.status!=="ACTIVE"||relationship.collegeStatus!=="ACTIVE")throw invalid();
  if(choice==="DECLINE"){
   await tx.insert(placementTpoLeadActivities).values({
    collegeId:lead.collegeId,leadId:lead.id,type:"SYSTEM",isSystem:true,
    note:"Recruiter invite declined",createdAt:now,
   });
   return {outcome:"DECLINED" as const,leadId:lead.id};
  }
  const [profile]=await tx.select().from(placementRecruiterProfiles)
   .where(eq(placementRecruiterProfiles.userId,context.user.id)).for("update").limit(1);
  if(profile&&(profile.companyId!==relationship.companyId||
   profile.status!=="ACTIVE"))throw invalid();
  if(!profile)await tx.insert(placementRecruiterProfiles).values({
   userId:context.user.id,companyId:relationship.companyId,
   createdByUserId:context.user.id,title:lead.designation,
  });
  const [active]=await tx.select({id:placementRecruiterCollegeGrants.id})
   .from(placementRecruiterCollegeGrants).where(and(
    eq(placementRecruiterCollegeGrants.recruiterUserId,context.user.id),
    eq(placementRecruiterCollegeGrants.companyRelationshipId,lead.companyRelationshipId),
    eq(placementRecruiterCollegeGrants.status,"ACTIVE"))).limit(1);
  if(active)throw invalid();
  const [duration]=await tx.select({months:placementTpoCollegeSettings.recruiterAccessMonths})
   .from(placementTpoCollegeSettings).where(eq(placementTpoCollegeSettings.collegeId,lead.collegeId)).limit(1);
  const [grant]=await tx.insert(placementRecruiterCollegeGrants).values({
   recruiterUserId:context.user.id,companyRelationshipId:lead.companyRelationshipId,
   grantedByUserId:context.user.id,validUntil:recruiterGrantValidUntil(now,
    recruiterAccessMonthsOrDefault(duration?.months)),
   capabilities:["DRIVES","MESSAGES"],verificationStatus:"VERIFIED",
  }).onConflictDoNothing().returning({id:placementRecruiterCollegeGrants.id});
  if(!grant)throw invalid();
  await tx.insert(placementTpoLeadActivities).values({
   collegeId:lead.collegeId,leadId:lead.id,type:"SYSTEM",isSystem:true,
   note:"Joined as a recruiter",createdAt:now,
  });
  const [event]=await tx.insert(activityEvents).values({
   organizationId:relationship.organizationId,collegeId:lead.collegeId,
   actorUserId:context.user.id,module:"PLACEMENTS",
   eventType:"PLACEMENTS_RECRUITER_JOINED",subjectType:"placement_tpo_lead",
   subjectId:lead.id,summary:"Recruiter joined by invitation",subjectLabel:lead.name,
   metadata:{recruiterUserId:context.user.id,companyRelationshipId:lead.companyRelationshipId,
    consent:"SIGNED_IN"},
  }).returning({id:activityEvents.id});
  if(!event)throw invalid();
  const officers=await tx.selectDistinct({userId:collegeMemberships.userId})
   .from(collegeMemberships).innerJoin(membershipRoles,
    eq(membershipRoles.membershipId,collegeMemberships.id))
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .where(and(eq(collegeMemberships.collegeId,lead.collegeId),
    eq(collegeMemberships.status,"ACTIVE"),eq(membershipRoles.role,"TPO"),
    eq(users.platformStatus,"ACTIVE")));
  const notification=publicRecruiterJoinedNotification({
   name:lead.name,companyName:relationship.companyName,scope:"COLLEGE",
  });
  if(officers.length)await tx.insert(inAppNotifications).values(officers.map(officer=>({
   eventId:event.id,userId:officer.userId,...notification,
  }))).onConflictDoNothing();
  return {outcome:"JOINED" as const,leadId:lead.id};
 });
}
