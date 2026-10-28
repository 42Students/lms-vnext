import "server-only";
import {randomUUID} from "node:crypto";
import {sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {codeMac,contactFingerprint,generateCode,safeEqualHex} from "@/modules/auth/crypto";

/**
 * Historical faculty_acct_verification / learner_acct_verification replacement:
 * a separate, scoped, one-time account proof, NEVER a LOGIN/device credential.
 * Caller must authenticate or supply verified directory entitlement before
 * requesting issuance; this server-only module intentionally exports no public
 * issuing route. Roll numbers are matched to persisted LEARNER profiles and
 * never stored in the challenge, or used as a password/role principal.
 */
type Role="LEARNER"|"FACULTY";
type Channel="EMAIL"|"PHONE";
export type ScopedAccountProofRequest={
 userId:string;membershipId:string;role:Role;channel:Channel;
 expectedRollNumber?:string|null;
};
export type ScopedAccountProofSender=(input:{channel:Channel;to:string;code:string})=>Promise<void>;
type DbRows=Record<string,unknown>[];
function rows(result:unknown):DbRows{return (result as {rows:DbRows}).rows??[];}
/** Raw driver SQL may return timestamptz as ISO strings rather than Date. */
function timestamp(value:unknown){
 const date=value instanceof Date?value:typeof value==="string"?new Date(value):null;
 if(!date||!Number.isFinite(date.getTime()))throw new Error("VERIFICATION_TIMESTAMP_INVALID");
 return date;
}
function secret(){
 const s=process.env["AUTH_ROLE_PROOF_SECRET"]??"";
 if(s.length<32)throw new Error("ROLE_PROOF_PROVIDER_NOT_CONFIGURED");
 return s;
}
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function valid(input:ScopedAccountProofRequest){
 if(!uuid.test(input.userId)||!uuid.test(input.membershipId))
  throw new Error("ROLE_PROOF_SCOPE_INVALID");
 if(!["LEARNER","FACULTY"].includes(input.role)||!["EMAIL","PHONE"].includes(input.channel))
  throw new Error("ROLE_PROOF_SCOPE_INVALID");
 if(input.role!=="LEARNER"&&input.expectedRollNumber!=null)
  throw new Error("ROLE_PROOF_SCOPE_INVALID");
 if(input.expectedRollNumber!=null&&
   (!input.expectedRollNumber.trim()||input.expectedRollNumber.length>128))
  throw new Error("ROLE_PROOF_SCOPE_INVALID");
}
function fingerprint(secretKey:string,channel:Channel,contact:string){
 return contactFingerprint(secretKey,channel==="EMAIL"?"email":"phone",
  contact.trim().toLowerCase());
}
async function loadOwner(tx:{execute:(query:ReturnType<typeof sql>)=>Promise<unknown>},
 request:ScopedAccountProofRequest){
 const result=rows(await tx.execute(sql`
  SELECT u.id,u.email,u.phone_e164,m.college_id,
         p.roll_number
  FROM users u JOIN college_memberships m ON m.user_id=u.id
  JOIN membership_roles r ON r.membership_id=m.id
     AND r.role=${request.role}::membership_role
  JOIN colleges c ON c.id=m.college_id
  JOIN organizations o ON o.id=c.organization_id
  LEFT JOIN learner_profiles p ON p.membership_id=m.id
  WHERE u.id=${request.userId} AND m.id=${request.membershipId}
   AND u.platform_status='ACTIVE'
   AND m.status='ACTIVE' AND m.suspended_at IS NULL
   AND c.status='ACTIVE' AND o.status='ACTIVE'
  FOR UPDATE OF u,m`));
 const owner=result[0];
 if(!owner)return null;
 if(request.expectedRollNumber!=null &&
   (request.role!=="LEARNER"||
    owner["roll_number"]!==request.expectedRollNumber.trim()))return null;
 const selected=request.channel==="EMAIL"?owner["email"]:owner["phone_e164"];
 if(typeof selected!=="string"||!selected.trim())return null;
 return {contact:selected.trim(),collegeId:owner["college_id"] as string};
}
export async function issueScopedAccountProof(
 request:ScopedAccountProofRequest,send:ScopedAccountProofSender
){
 valid(request);
 const key=secret(),id=randomUUID(),code=generateCode();
 const targetRole=request.role+"_PROOF";
 const issued=await getDb().transaction(async tx=>{
  const owner=await loadOwner(tx,request);
  if(!owner)throw new Error("ROLE_PROOF_SCOPE_INVALID");
  const contactFp=fingerprint(key,request.channel,owner.contact);
  // The canonical user/membership lock serializes concurrent starts.
  const attempts=rows(await tx.execute(sql`
   SELECT created_at FROM identity_auth_attempts
   WHERE user_id=${request.userId}
    AND contact_fingerprint=${contactFp}
    AND created_at>clock_timestamp()-interval '10 minutes'
   ORDER BY created_at DESC LIMIT 5`));
  if(attempts.length>=5||
     (attempts[0]?.["created_at"]!=null &&
      Date.now()-timestamp(attempts[0]["created_at"]).getTime()<30_000))
   throw new Error("ROLE_PROOF_RATE_LIMIT");
  await tx.execute(sql`
   UPDATE identity_auth_attempts SET
    superseded_at=GREATEST(created_at,clock_timestamp()),
    expires_at=GREATEST(created_at+interval '1 millisecond',
      LEAST(expires_at,clock_timestamp())),
    sms_code_mac=NULL,sms_code_expires_at=NULL,
    email_code_mac=NULL,email_code_expires_at=NULL,
    version=version+1
   WHERE user_id=${request.userId} AND membership_id=${request.membershipId}
    AND target_role=${targetRole}
    AND used_at IS NULL AND expires_at>clock_timestamp()`);
  const sms=request.channel==="PHONE";
  const otp=codeMac(key,sms?"sms":"email",id,code);
  const inserted=rows(await tx.execute(sql`
   WITH tick AS (SELECT clock_timestamp() AS t)
   INSERT INTO identity_auth_attempts(
    id,user_id,college_id,membership_id,target_role,contact_fingerprint,
    sms_code_mac,sms_code_expires_at,email_code_mac,email_code_expires_at,
    email_code_sent_at,created_at,expires_at)
   SELECT ${id},${request.userId},${owner.collegeId},${request.membershipId},
    ${targetRole},${contactFp},${sms?otp:null},
    CASE WHEN ${sms} THEN tick.t+interval '5 minutes' END,
    ${sms?null:otp},
    CASE WHEN NOT ${sms} THEN tick.t+interval '5 minutes' END,
    CASE WHEN NOT ${sms} THEN tick.t END,
    tick.t,tick.t+interval '5 minutes'
   FROM tick RETURNING id,expires_at`));
  if(inserted.length!==1)throw new Error("ROLE_PROOF_ISSUE_FAILED");
  return {to:owner.contact,expiresAt:timestamp(inserted[0]?.["expires_at"])};
 });
 try{await send({channel:request.channel,to:issued.to,code});}
 catch(error){
  await getDb().execute(sql`
   UPDATE identity_auth_attempts SET
    superseded_at=GREATEST(created_at,clock_timestamp()),
    expires_at=GREATEST(created_at+interval '1 millisecond',
      LEAST(expires_at,clock_timestamp())),
    sms_code_mac=NULL,sms_code_expires_at=NULL,
    email_code_mac=NULL,email_code_expires_at=NULL,version=version+1
   WHERE id=${id} AND used_at IS NULL AND superseded_at IS NULL`);
  throw error;
 }
 return {challengeId:id,expiresAt:issued.expiresAt.toISOString()};
}
export async function redeemScopedAccountProof(
 input:{challengeId:string;code:string;userId:string;membershipId:string;role:Role}
):Promise<boolean>{
 if(!uuid.test(input.challengeId)||!uuid.test(input.userId)||
    !uuid.test(input.membershipId)||!/^\d{6}$/.test(input.code)||
    !["LEARNER","FACULTY"].includes(input.role))return false;
 const key=secret(),role=input.role+"_PROOF";
 return getDb().transaction(async tx=>{
  const preliminary=rows(await tx.execute(sql`SELECT sms_code_mac FROM identity_auth_attempts WHERE id=${input.challengeId} AND user_id=${input.userId} AND membership_id=${input.membershipId}`))[0];
  if(!preliminary)return false;
  const channelHint=preliminary["sms_code_mac"]?"PHONE":"EMAIL";
  const owner=await loadOwner(tx,{userId:input.userId,membershipId:input.membershipId,role:input.role,channel:channelHint});
  const matched=rows(await tx.execute(sql`
   SELECT target_role,college_id,sms_code_mac,email_code_mac,contact_fingerprint,
     verification_attempts,blocked_until,superseded_at,used_at,expires_at
   FROM identity_auth_attempts WHERE id=${input.challengeId}
    AND user_id=${input.userId} AND membership_id=${input.membershipId}
   FOR UPDATE`))[0];
  if(!matched||matched["target_role"]!==role||
   matched["superseded_at"]||matched["used_at"]||
   matched["expires_at"]==null||
   timestamp(matched["expires_at"]).getTime()<=Date.now()||
   (matched["blocked_until"]!=null &&
    timestamp(matched["blocked_until"]).getTime()>Date.now())||
   Number(matched["verification_attempts"])>=5)return false;
  const channel=matched["sms_code_mac"]?"PHONE":"EMAIL";
  if(!owner||channel!==channelHint||owner.collegeId!==matched["college_id"]||
   fingerprint(key,channel,owner.contact)!==matched["contact_fingerprint"]){
   await tx.execute(sql`
    UPDATE identity_auth_attempts SET
     superseded_at=GREATEST(created_at,clock_timestamp()),
     expires_at=GREATEST(created_at+interval '1 millisecond',
      LEAST(expires_at,clock_timestamp())),
     sms_code_mac=NULL,sms_code_expires_at=NULL,
     email_code_mac=NULL,email_code_expires_at=NULL,version=version+1
    WHERE id=${input.challengeId} AND used_at IS NULL
     AND superseded_at IS NULL`);
   return false;
  }
  // Never allow a failed attempt to avoid the shared five-try budget.
  const reserved=rows(await tx.execute(sql`
   UPDATE identity_auth_attempts
   SET verification_attempts=verification_attempts+1,version=version+1
   WHERE id=${input.challengeId} AND used_at IS NULL
    AND superseded_at IS NULL AND expires_at>clock_timestamp()
    AND verification_attempts<5 RETURNING id`));
  if(reserved.length!==1)return false;
  const actual=channel==="PHONE"?matched["sms_code_mac"]:matched["email_code_mac"];
  const expected=codeMac(key,channel==="PHONE"?"sms":"email",
   input.challengeId,input.code);
  if(typeof actual!=="string"||!safeEqualHex(actual,expected))return false;
  const finished=rows(await tx.execute(sql`
   WITH tick AS (SELECT clock_timestamp() AS t)
   UPDATE identity_auth_attempts AS a
   SET verified_at=tick.t,used_at=tick.t,
    sms_code_mac=NULL,sms_code_expires_at=NULL,
    email_code_mac=NULL,email_code_expires_at=NULL,
    version=version+1
   FROM tick WHERE a.id=${input.challengeId} AND a.used_at IS NULL
    AND a.superseded_at IS NULL AND a.expires_at>tick.t
   RETURNING a.id`));
  return finished.length===1;
 });
}
