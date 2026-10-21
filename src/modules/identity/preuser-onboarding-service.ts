import "server-only";
import {createHmac,randomInt,timingSafeEqual} from "node:crypto";
import {and,desc,eq,gt,gte,isNull,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {identityPreuserChallenges} from "@/db/schema/identity-auth-attempts";
import {collegeMemberships,membershipRoles,colleges} from "@/db/schema";

const uuid=z.string().uuid();
const input=z.strictObject({
 collegeId:uuid,channel:z.enum(["EMAIL","PHONE"]),
 source:z.enum(["CONTACT","ROLL"]),
 contact:z.string().trim().min(4).max(320),
 roll:z.string().trim().min(1).max(128).optional(),
});
const MAX_PER_30_MIN=5;
function secret(){
 const value=process.env.AUTH_ONBOARDING_PEPPER??"";
 if(value.length<32)throw new Error("ONBOARDING_PROVIDER_NOT_CONFIGURED");
 return value;
}
function mac(...parts:string[]){
 return createHmac("sha256",secret()).update(parts.join("\u0000")).digest("hex");
}
function fingerprint(type:string,value:string){
 return mac(type,value.trim().toLowerCase());
}
/** Trusted enrollment/roll lookup must precede this call. The sender must
 * use the registered provider (Exotel/SMS DLT or verified email transport). */
export async function issuePreuserChallenge(raw:unknown,
 verifiedDirectory:{collegeId:string;roll:string|null;active:boolean},
 send:(target:{channel:"EMAIL"|"PHONE";contact:string;code:string})=>Promise<void>,
){
 const data=input.parse(raw);
 if(!verifiedDirectory.active||verifiedDirectory.collegeId!==data.collegeId||
   (data.source==="ROLL"&&(!data.roll||verifiedDirectory.roll!==data.roll)))
  throw new Error("ONBOARDING_ENROLLMENT_NOT_VERIFIED");
 if((data.source==="ROLL")!==Boolean(data.roll))
  throw new Error("ONBOARDING_INVALID_ROLL");
 const college=await getDb().select({id:colleges.id,status:colleges.status})
   .from(colleges).where(eq(colleges.id,data.collegeId)).limit(1);
 if(college[0]?.status!=="ACTIVE")throw new Error("ONBOARDING_COLLEGE_NOT_FOUND");
 const contactFingerprint=fingerprint("contact",data.contact);
 const rollFingerprint=data.roll?fingerprint("roll",data.roll):null;
 const now=new Date(),code=String(randomInt(0,1_000_000)).padStart(6,"0");
 const codeMac=mac("code",data.collegeId,contactFingerprint,code);
 const result=await getDb().transaction(async tx=>{
  // Per-contact advisory lock prevents concurrent resend budget races.
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${contactFingerprint}))`);
  const recent=await tx.select({id:identityPreuserChallenges.id,createdAt:identityPreuserChallenges.createdAt})
    .from(identityPreuserChallenges).where(and(
      eq(identityPreuserChallenges.collegeId,data.collegeId),
      eq(identityPreuserChallenges.contactFingerprint,contactFingerprint),
      gte(identityPreuserChallenges.createdAt,new Date(now.getTime()-30*60*1000)),
    )).orderBy(desc(identityPreuserChallenges.createdAt)).limit(MAX_PER_30_MIN);
  if(recent.length>=MAX_PER_30_MIN||
     (recent[0]&&now.getTime()-recent[0].createdAt.getTime()<60_000))
    throw new Error("ONBOARDING_RATE_LIMIT");
  await tx.update(identityPreuserChallenges).set({revokedAt:now}).where(and(
    eq(identityPreuserChallenges.collegeId,data.collegeId),
    eq(identityPreuserChallenges.contactFingerprint,contactFingerprint),
    isNull(identityPreuserChallenges.revokedAt),
    isNull(identityPreuserChallenges.verifiedAt),
    gt(identityPreuserChallenges.expiresAt,now),
  ));
  const [row]=await tx.insert(identityPreuserChallenges).values({
    collegeId:data.collegeId,source:data.source,channel:data.channel,
    contactFingerprint,rollFingerprint,codeMac,createdAt:now,
    expiresAt:new Date(now.getTime()+300_000),
  }).returning({id:identityPreuserChallenges.id,expiresAt:identityPreuserChallenges.expiresAt});
  if(!row)throw new Error("ONBOARDING_CHALLENGE_NOT_ISSUED");
  return row;
 });
 try{await send({channel:data.channel,contact:data.contact,code});}
 catch(error){
  await getDb().update(identityPreuserChallenges).set({revokedAt:new Date()})
    .where(eq(identityPreuserChallenges.id,result.id));
  throw error;
 }
 return {challengeId:result.id,expiresAt:result.expiresAt.toISOString()};
}
export async function verifyPreuserChallenge(raw:unknown){
 const data=z.strictObject({challengeId:uuid,collegeId:uuid,code:z.string().regex(/^\d{6}$/)}).parse(raw);
 const now=new Date();
 return getDb().transaction(async tx=>{
  const [row]=await tx.select().from(identityPreuserChallenges).where(and(
    eq(identityPreuserChallenges.id,data.challengeId),
    eq(identityPreuserChallenges.collegeId,data.collegeId))).for("update").limit(1);
  if(!row||row.revokedAt||row.consumedAt||row.expiresAt<=now||row.attempts>=5)
   throw new Error("ONBOARDING_CHALLENGE_EXPIRED");
  if(row.verifiedAt)return {verified:true,challengeId:row.id};
  const expected=Buffer.from(row.codeMac,"hex");
  const supplied=Buffer.from(mac("code",row.collegeId,row.contactFingerprint,data.code),"hex");
  const verified=expected.length===supplied.length&&timingSafeEqual(expected,supplied);
  await tx.update(identityPreuserChallenges).set({
    attempts:row.attempts+1,...(verified?{verifiedAt:now}:{})
  }).where(eq(identityPreuserChallenges.id,row.id));
  if(!verified)throw new Error("ONBOARDING_CODE_INVALID");
  return {verified:true,challengeId:row.id};
 });
}
/** Verified contact proof is consumed only after real learner membership is
 * created and validated under the same college. No login grant is returned. */
export async function consumePreuserProof(challengeId:string,membershipId:string){
 uuid.parse(challengeId);uuid.parse(membershipId);
 return getDb().transaction(async tx=>{
  const [row]=await tx.select().from(identityPreuserChallenges)
    .where(eq(identityPreuserChallenges.id,challengeId)).for("update").limit(1);
  if(!row||!row.verifiedAt||row.revokedAt||row.consumedAt||
     row.expiresAt<=new Date())throw new Error("ONBOARDING_PROOF_EXPIRED");
  const [member]=await tx.select({id:collegeMemberships.id}).from(collegeMemberships)
    .innerJoin(membershipRoles,and(
      eq(membershipRoles.membershipId,collegeMemberships.id),
      eq(membershipRoles.role,"LEARNER")))
    .where(and(eq(collegeMemberships.id,membershipId),
      eq(collegeMemberships.collegeId,row.collegeId),
      eq(collegeMemberships.status,"ACTIVE"))).limit(1);
  if(!member)throw new Error("ONBOARDING_MEMBERSHIP_NOT_VERIFIED");
  await tx.update(identityPreuserChallenges).set({consumedAt:new Date()})
    .where(eq(identityPreuserChallenges.id,row.id));
  return {membershipId:member.id,verifiedContactFingerprint:row.contactFingerprint,
    collegeId:row.collegeId};
 });
}
