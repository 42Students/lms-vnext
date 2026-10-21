import "server-only";
import {and,eq,gt,isNull,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,colleges,inAppNotifications} from "@/db/schema";
import {placementCompanyApplicantShares as shares,placementCompanyApplicantShareViews as views} from "@/db/schema/placement-company-shares";
import {companyShareTablesReady} from "./readiness";
import {companyShareAccessProof,companyShareTokenSchema,hashCompanyShareToken,validCompanyShareAccessCode} from "./token-model";
/** Company share access challenge delivery policy:
 * The placement cell receives the one-time code on issue and delivers it via
 * its existing authenticated channel. Anonymous visitors may not request a
 * new code by email: that would permit enumeration and unaudited mail abuse.
 * The old Spring "Email me a code" requires a separately configured sender
 * and per-share durable rate limits before it can be enabled. */
export const COMPANY_SHARE_CODE_DELIVERY="PLACEMENT_CELL_MANUAL" as const;
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
