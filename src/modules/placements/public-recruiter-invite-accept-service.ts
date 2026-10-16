import "server-only";
import {createHash} from "node:crypto";
import {and,desc,eq,isNull,sql} from "drizzle-orm";
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

/** Public signup is authorized solely by an invite bound to a known work email
 * plus its latest DELIVERED OTP. Never accept claimed user, email, company or college IDs.
 */
export async function acceptPublicTpoRecruiterInviteOtp(rawToken:unknown,rawCode:unknown):
 Promise<{accepted:true;outcome:"JOINED";signInEmail:string}> {
 const invalid=()=>new TpoRecruiterInviteServiceError("TPO_RECRUITER_INVITE_NOT_FOUND");
 const secret=process.env.TPO_RECRUITER_OTP_HMAC_SECRET??"";
 if(process.env.TPO_RECRUITER_OTP_READY!=="VERIFIED"||
  Buffer.byteLength(secret,"utf8")<32||
  typeof rawToken!=="string"||!isRecruiterInviteTokenShape(rawToken)||
  !recruiterInviteOtpSchema.safeParse(rawCode).success)throw invalid();
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
   status:placementCompanyRelationships.status,
   companyStatus:placementCompanies.status,
   collegeStatus:colleges.status,
   organizationId:colleges.organizationId,
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
  const email=lead.emailNorm.trim().toLowerCase();
  // Must not create or relabel a second identity for a verified email.
  await tx.insert(users).values({
   identityUid:"public-recruiter-email:"+createHash("sha256").update(email).digest("hex"),
   email,displayName:lead.name,
  }).onConflictDoNothing();
  const [user]=await tx.select({id:users.id,status:users.platformStatus})
   .from(users).where(sql`lower(${users.email})=${email}`).for("update").limit(1);
  if(!user||user.status!=="ACTIVE")return {result:"DENIED" as const};
  await tx.insert(placementRecruiterProfiles).values({
   userId:user.id,companyId:relationship.companyId,createdByUserId:user.id,
   title:lead.designation,
  }).onConflictDoNothing();
  const [profile]=await tx.select().from(placementRecruiterProfiles)
    .where(eq(placementRecruiterProfiles.userId,user.id)).for("update").limit(1);
  if(!profile||profile.companyId!==relationship.companyId||profile.status!=="ACTIVE")
    return {result:"DENIED" as const};
  const [existing]=await tx.select({id:placementRecruiterCollegeGrants.id})
   .from(placementRecruiterCollegeGrants).where(and(
    eq(placementRecruiterCollegeGrants.recruiterUserId,user.id),
    eq(placementRecruiterCollegeGrants.companyRelationshipId,lead.companyRelationshipId),
    eq(placementRecruiterCollegeGrants.status,"ACTIVE"),
   )).limit(1);
  if(existing)return {result:"DENIED" as const};
  const [grant]=await tx.insert(placementRecruiterCollegeGrants).values({
   recruiterUserId:user.id,companyRelationshipId:lead.companyRelationshipId,
   grantedByUserId:user.id,validUntil:recruiterGrantValidUntil(now,months),
   capabilities:["DRIVES","MESSAGES"],verificationStatus:"VERIFIED",
  }).onConflictDoNothing().returning({id:placementRecruiterCollegeGrants.id});
  if(!grant)return {result:"DENIED" as const};
  const [consumed]=await tx.update(recruiterInviteCodes).set({consumedAt:now})
   .where(and(eq(recruiterInviteCodes.id,challenge.id),
     isNull(recruiterInviteCodes.consumedAt))).returning({id:recruiterInviteCodes.id});
  if(!consumed)throw invalid();
  const [accepted]=await tx.update(placementTpoLeads).set({
   recruiterUserId:user.id,inviteTokenHash:null,updatedAt:now,
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
   summary:"Recruiter joined by invitation",subjectLabel:lead.name,
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
  if(officers.length)await tx.insert(inAppNotifications).values(officers.map(officer=>({
    eventId:event.id,userId:officer.userId,category:"PLACEMENTS",
    title:lead.name+" joined from "+(lead.companyName??"their company"),
    body:"A recruiter joined your placement cell through an invitation.",
  }))).onConflictDoNothing();
  return {result:"JOINED" as const,email};
 });
 if(decision.result!=="JOINED")throw invalid();
 return {accepted:true,outcome:"JOINED",signInEmail:decision.email};
}
