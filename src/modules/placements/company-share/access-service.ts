import "server-only";
import {and,desc,eq,gte,gt,isNull,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,colleges,inAppNotifications,placementJobs,placementRecruiterCollegeGrants,users} from "@/db/schema";
import {placementCompanyApplicantShares as shares,placementCompanyApplicantShareViews as views} from "@/db/schema/placement-company-shares";
import {companyShareTablesReady} from "./readiness";
import {companyShareAccessProof,companyShareTokenSchema,hashCompanyShareToken,validCompanyShareAccessCode,issueCompanyShareAccessCode} from "./token-model";
import {sendZeptoMailTemplate,resolveZeptoMailTemplateId} from "@/modules/notifications/zeptomail-email";
import {hasActiveRecruiter,type RequestContext} from "@/modules/identity/context";
import {COMPANY_SHARE_EMAILS_PER_HOUR,companyShareEmailThrottle} from "./email-code-throttle-model";
/** Anonymous visitors never choose the delivery address. The recipient must
 * be an authenticated, live recruiter with the share's persisted company grant.
 * A separate configured template and durable per-share throttle guard sending.
 */
export const COMPANY_SHARE_CODE_DELIVERY="PLACEMENT_CELL_OR_AUTHORIZED_RECRUITER_EMAIL" as const;
const COMPANY_SHARE_EMAIL_KIND="placements.company_share.email_code_sent";
const COMPANY_SHARE_EMAIL_WINDOW_MS=60*60*1000;
const COMPANY_SHARE_EMAIL_CODE_TTL_MS=15*60*1000;

/** Determine whether the optional resend control is available to the current
 * signed-in recruiter. Never disclose the recipient address or grant details
 * to visitors with only the public share token. POST independently rechecks
 * every predicate under the share lock before rotating the access challenge. */
export async function canEmailAuthorizedCompanyShareCode(
 context:RequestContext,rawToken:unknown,
):Promise<boolean>{
 const token=companyShareTokenSchema.safeParse(rawToken);
 if(!token.success||!hasActiveRecruiter(context)||!context.recruiter||
    context.recruiter.userId!==context.user.id||!await companyShareTablesReady())return false;
 if(!resolveZeptoMailTemplateId({kind:"TPO",templateName:"company-share-access"}))return false;
 const [share]=await getDb().select({
  collegeId:shares.collegeId,relationshipId:placementJobs.companyRelationshipId,
 }).from(shares)
  .innerJoin(placementJobs,and(eq(placementJobs.id,shares.jobId),
    eq(placementJobs.collegeId,shares.collegeId)))
  .innerJoin(colleges,and(eq(colleges.id,shares.collegeId),eq(colleges.status,"ACTIVE")))
  .where(and(eq(shares.tokenHash,hashCompanyShareToken(token.data)),
    isNull(shares.revokedAt),gt(shares.expiresAt,sql`clock_timestamp()`))).limit(1);
 if(!share||!context.recruiter.grants.some(grant=>
  grant.collegeId===share.collegeId&&
  grant.companyRelationshipId===share.relationshipId))return false;
 // Session grants are only a selector: revocation and expiry may have changed
 // since session creation. Recheck the persisted relationship before offering
 // a code-delivery action to a recruiter.
 const [liveGrant]=await getDb().select({id:placementRecruiterCollegeGrants.id})
  .from(placementRecruiterCollegeGrants).where(and(
   eq(placementRecruiterCollegeGrants.recruiterUserId,context.user.id),
   eq(placementRecruiterCollegeGrants.companyRelationshipId,share.relationshipId),
   eq(placementRecruiterCollegeGrants.status,"ACTIVE"),
   isNull(placementRecruiterCollegeGrants.revokedAt),
   gt(placementRecruiterCollegeGrants.validUntil,sql`clock_timestamp()`),
  )).limit(1);
 if(!liveGrant)return false;
 const [recipient]=await getDb().select({
  email:users.email,status:users.platformStatus,
 }).from(users).where(eq(users.id,context.user.id)).limit(1);
 return recipient?.status==="ACTIVE"&&
   typeof recipient.email==="string"&&
   /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email);
}

/** Rotate the challenge ONLY after validating a currently active recruiter
 * grant in the same tenant. Serialize resend attempts with the share row lock.
 * The provider sees a short-lived six-digit challenge but neither the raw
 * bearer link nor applicant records. No public address selection is allowed. */
export async function emailAuthorizedCompanyShareCode(
 context:RequestContext,rawToken:unknown,
):Promise<"SENT"|"DENIED"|"TOO_SOON"|"LIMITED"|"UNAVAILABLE">{
 const token=companyShareTokenSchema.safeParse(rawToken);
 if(!token.success||!await companyShareTablesReady()||!hasActiveRecruiter(context)||
    !context.recruiter||context.recruiter.userId!==context.user.id)return "DENIED";
 // A dedicated non-login template must be provisioned; never send a share
 // challenge through the authentication OTP template.
 if(!resolveZeptoMailTemplateId({kind:"TPO",templateName:"company-share-access"}))
  return "UNAVAILABLE";
 return getDb().transaction(async tx=>{
  const [share]=await tx.select({
   id:shares.id,tokenHash:shares.tokenHash,collegeId:shares.collegeId,
   expiresAt:shares.expiresAt,jobId:shares.jobId,
   relationshipId:placementJobs.companyRelationshipId,
   organizationId:colleges.organizationId,
  }).from(shares)
   .innerJoin(placementJobs,and(eq(placementJobs.id,shares.jobId),
     eq(placementJobs.collegeId,shares.collegeId)))
   .innerJoin(colleges,and(eq(colleges.id,shares.collegeId),eq(colleges.status,"ACTIVE")))
   .where(and(eq(shares.tokenHash,hashCompanyShareToken(token.data)),
     isNull(shares.revokedAt),gt(shares.expiresAt,sql`clock_timestamp()`)))
   .for("update",{of:shares}).limit(1);
  if(!share||!context.recruiter?.grants.some(grant=>
    grant.collegeId===share.collegeId &&
    grant.companyRelationshipId===share.relationshipId))return "DENIED" as const;
  // Hold a shared lock on the persisted grant while the code is dispatched,
  // preventing a concurrent revoke from racing an authorized send.
  const [liveGrant]=await tx.select({id:placementRecruiterCollegeGrants.id})
   .from(placementRecruiterCollegeGrants).where(and(
    eq(placementRecruiterCollegeGrants.recruiterUserId,context.user.id),
    eq(placementRecruiterCollegeGrants.companyRelationshipId,share.relationshipId),
    eq(placementRecruiterCollegeGrants.status,"ACTIVE"),
    isNull(placementRecruiterCollegeGrants.revokedAt),
    gt(placementRecruiterCollegeGrants.validUntil,sql`clock_timestamp()`),
   )).for("share").limit(1);
  if(!liveGrant)return "DENIED" as const;
  const [recipient]=await tx.select({
   email:users.email,name:users.displayName,status:users.platformStatus,
  }).from(users).where(eq(users.id,context.user.id)).limit(1);
  if(!recipient?.email||recipient.status!=="ACTIVE"||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email))return "DENIED" as const;
  const now=new Date();
  const sent=await tx.select({id:activityEvents.id,occurredAt:activityEvents.occurredAt}).from(activityEvents)
   .where(and(eq(activityEvents.collegeId,share.collegeId),
    eq(activityEvents.subjectType,"company_applicant_share"),
    eq(activityEvents.subjectId,share.id),
    eq(activityEvents.eventType,COMPANY_SHARE_EMAIL_KIND),
    gte(activityEvents.occurredAt,new Date(now.getTime()-COMPANY_SHARE_EMAIL_WINDOW_MS))))
   .orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id))
   .limit(COMPANY_SHARE_EMAILS_PER_HOUR);
  const throttle=companyShareEmailThrottle(sent.map(row=>row.occurredAt),now);
  if(throttle)return throttle;
  const challenge=issueCompanyShareAccessCode();
  // The provider call is inside the locked transaction so a rejected mail
  // cannot silently invalidate the manual code. Do not retry ambiguous sends.
  const delivered=await sendZeptoMailTemplate({
   purpose:{kind:"TPO",templateName:"company-share-access"},
   toEmail:recipient.email,...(recipient.name == null ? {} : {recipientName:recipient.name}),
   mergeInfo:{otp:challenge.code,accessCode:challenge.code,expiresInMinutes:"15"},
  });
  if(!delivered.accepted)return "UNAVAILABLE" as const;
  await tx.update(shares).set({
   codeHash:challenge.hash,codeSalt:challenge.salt,
   wrongCodeCount:0,wrongCodeWindowStart:null,lockedUntil:null,
  }).where(eq(shares.id,share.id));
  await tx.insert(activityEvents).values({
   module:"PLACEMENTS",eventType:COMPANY_SHARE_EMAIL_KIND,
   organizationId:share.organizationId,collegeId:share.collegeId,
   actorUserId:context.user.id,
   subjectType:"company_applicant_share",subjectId:share.id,
   summary:"Access code delivered to an authorized recruiter account",
   metadata:{jobId:share.jobId,delivery:"RECRUITER_ACCOUNT",ttlMinutes:15},
  });
  return "SENT" as const;
 });
}

/** PUB-auth-public-50/52: the code gate is serialized by the link row lock;
 * even parallel bad attempts cannot skip the ten-per-hour lockout. No bearer,
 * code, code hash, visitor address or applicant data enters the audit.
 */
export async function verifyPublicCompanyShareCode(rawToken:unknown,rawCode:unknown):
 Promise<{kind:"DENIED"}|{kind:"VERIFIED";proof:string;maxAge:number}>{
 const parsed=companyShareTokenSchema.safeParse(rawToken);
 if(!parsed.success||!await companyShareTablesReady())return {kind:"DENIED"};
 return getDb().transaction(async tx=>{
  const [row]=await tx.select({
   id:shares.id,tokenHash:shares.tokenHash,codeHash:shares.codeHash,codeSalt:shares.codeSalt,
   count:shares.wrongCodeCount,windowStart:shares.wrongCodeWindowStart,
   lockedUntil:shares.lockedUntil,expiresAt:shares.expiresAt,
   collegeId:shares.collegeId,jobId:shares.jobId,
   organizationId:colleges.organizationId,issuedByUserId:collegeMemberships.userId,
  }).from(shares)
    .innerJoin(colleges,eq(colleges.id,shares.collegeId))
    .innerJoin(collegeMemberships,eq(collegeMemberships.id,shares.createdByMembershipId))
    .where(and(eq(shares.tokenHash,hashCompanyShareToken(parsed.data)),
      isNull(shares.revokedAt),gt(shares.expiresAt,sql`clock_timestamp()`),
      eq(colleges.status,"ACTIVE")))
    .for("update",{of:shares}).limit(1);
  if(!row)return {kind:"DENIED" as const};
  const now=new Date();
  if(row.lockedUntil&&row.lockedUntil.getTime()>now.getTime())return {kind:"DENIED" as const};
  // Code rotations created by authenticated email delivery expire in 15
  // minutes. Original placement-cell codes retain the share's normal expiry.
  const [mailed]=await tx.select({sentAt:activityEvents.occurredAt})
   .from(activityEvents).where(and(eq(activityEvents.collegeId,row.collegeId),
    eq(activityEvents.subjectType,"company_applicant_share"),
    eq(activityEvents.subjectId,row.id),
    eq(activityEvents.eventType,COMPANY_SHARE_EMAIL_KIND)))
   .orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id)).limit(1);
  if(mailed && now.getTime()-mailed.sentAt.getTime()>COMPANY_SHARE_EMAIL_CODE_TTL_MS)
   return {kind:"DENIED" as const};
  const verified=validCompanyShareAccessCode(rawCode,row.codeSalt,row.codeHash);
  if(!verified){
   const currentWindow=row.windowStart&&now.getTime()-row.windowStart.getTime()<3600000;
   const nextCount=Math.min(10,(currentWindow?row.count:0)+1);
   const becameLocked=nextCount>=10;
   const lockedUntil=becameLocked?new Date(now.getTime()+3600000):null;
   await tx.update(shares).set({wrongCodeCount:nextCount,
    wrongCodeWindowStart:currentWindow?row.windowStart:now,lockedUntil})
    .where(eq(shares.id,row.id));
   if(becameLocked){
    await tx.insert(views).values({shareId:row.id,collegeId:row.collegeId,eventKind:"LOCKED"});
    const [event]=await tx.insert(activityEvents).values({
     module:"PLACEMENTS",eventType:"placements.company_share.locked",
     organizationId:row.organizationId,collegeId:row.collegeId,
     subjectType:"company_applicant_share",subjectId:row.id,
     importance:"HIGH",summary:"Company share locked after ten wrong access codes",
     metadata:{jobId:row.jobId,attempts:nextCount,lockedForMinutes:60},
    }).returning({id:activityEvents.id});
    if(event)await tx.insert(inAppNotifications).values({
     userId:row.issuedByUserId,eventId:event.id,title:"SHARE_LOCKED",
     body:"A company applicant share was locked after too many incorrect codes.",
     actionHref:"/tpo/placements/jobs/"+row.jobId+"/share-audit",
    }).onConflictDoNothing();
   }
   return {kind:"DENIED" as const};
  }
  const proof=companyShareAccessProof(row.id,row.tokenHash,row.codeHash);
  if(!proof)return {kind:"DENIED" as const};
  await tx.update(shares).set({wrongCodeCount:0,wrongCodeWindowStart:null,lockedUntil:null})
    .where(eq(shares.id,row.id));
  return {kind:"VERIFIED" as const,proof,
   maxAge:Math.max(1,Math.min(3600,Math.floor((row.expiresAt.getTime()-now.getTime())/1000)))};
 });
}
