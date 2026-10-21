import "server-only";
import {createHash} from "node:crypto";
import {and,desc,eq,inArray,isNull,sql} from "drizzle-orm";
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
import type {RequestContext} from "@/modules/identity/context";

/** Public signup is authorized solely by an invite bound to a known work email
 * plus its latest DELIVERED OTP. Never accept claimed user, email, company or college IDs.
 */
export async function acceptPublicTpoRecruiterInviteOtp(rawToken:unknown,rawCode:unknown,rawDetails:unknown={}):
 Promise<{accepted:true;outcome:"JOINED"|"PENDING_HR";signInEmail:string;collegeName?:string}> {
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
  // Existing work-email owners MUST sign in and accept the college grant;
  // proving mailbox control via a public invite OTP is not account consent.
  const [known]=await tx.select({id:users.id,status:users.platformStatus})
   .from(users).where(sql`lower(${users.email})=${email}`).for("update").limit(1);
  if(known?.status!=="ACTIVE"&&known)throw invalid();
  if(!known)await tx.insert(users).values({
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
   grantedByUserId:user.id,validUntil:recruiterGrantValidUntil(now,months),
   capabilities:["DRIVES","MESSAGES"],verificationStatus:"VERIFIED",
  }).onConflictDoNothing().returning({id:placementRecruiterCollegeGrants.id});
  if(!grant)throw invalid();
  const [consumed]=await tx.update(recruiterInviteCodes).set({consumedAt:now})
   .where(and(eq(recruiterInviteCodes.id,challenge.id),
     isNull(recruiterInviteCodes.consumedAt))).returning({id:recruiterInviteCodes.id});
  if(!consumed)throw invalid();
  const [accepted]=await tx.update(placementTpoLeads).set({
   recruiterUserId:user.id,inviteTokenHash:null,updatedAt:now,
   name:updatedName,designation:updatedDesignation,phoneNorm:updatedPhone,
  }).where(and(eq(placementTpoLeads.id,lead.id),
   eq(placementTpoLeads.collegeId,lead.collegeId),
   eq(placementTpoLeads.inviteTokenHash,hash),
   isNull(placementTpoLeads.recruiterUserId))).returning({id:placementTpoLeads.id});
  if(!accepted)throw invalid();
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
  return {result:"JOINED" as const,email};
 });
 if(decision.result==="DENIED")throw invalid();
 if(decision.result==="PENDING_HR")
  return {accepted:true,outcome:"PENDING_HR",signInEmail:decision.email,collegeName:decision.collegeName};
 return {accepted:true,outcome:"JOINED",signInEmail:decision.email};
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
