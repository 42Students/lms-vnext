import "server-only";

import {randomUUID} from "node:crypto";
import {sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {generateToken,mac} from "@/modules/auth/crypto";

/**
 * First-party replacement for legacy email_verification_token.
 * Authenticated callers must supply the server-resolved user ID; never use
 * a client-supplied user or membership as permission to issue a link.
 * The send callback MUST use an authorized email provider. This service does
 * not enable any public token-issuing API or automatically import old tokens.
 * No token or email is stored in plaintext in the verification tables.
 */
export type EmailLinkScope={
 userId:string;collegeId?:string|null;membershipId?:string|null;
 applicationId?:string|null;
};
export type EmailLinkSend=(message:{to:string;token:string;expiresAt:Date})=>Promise<void>;
type Executor={execute:ReturnType<typeof getDb>["execute"]};
type DbRow=Record<string,unknown>;
function rows(result:unknown):DbRow[]{
 return (result as {rows:DbRow[]}).rows??[];
}
/** Raw driver SQL may return timestamptz as ISO strings rather than Date. */
function timestamp(value:unknown){
 const date=value instanceof Date?value:typeof value==="string"?new Date(value):null;
 if(!date||!Number.isFinite(date.getTime()))throw new Error("VERIFICATION_TIMESTAMP_INVALID");
 return date;
}
function getSecret(){
 const value=process.env["AUTH_EMAIL_VERIFICATION_SECRET"]??"";
 if(value.length<32)throw new Error("EMAIL_LINK_PROVIDER_NOT_CONFIGURED");
 return value;
}
function keyVersion(){
 const value=process.env["AUTH_EMAIL_VERIFICATION_KEY_VERSION"]??"v1";
 if(!/^[a-zA-Z0-9_-]{1,16}$/.test(value))
  throw new Error("EMAIL_LINK_KEY_VERSION_INVALID");
 return value;
}
function emailFingerprint(secret:string,email:string){
 return mac(secret,"email-link-contact",email.trim().toLowerCase());
}
function bearerDigest(secret:string,bearer:string){
 return mac(secret,"email-link-bearer",bearer);
}
function validUuid(id:string){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);}
function validateScope({userId,collegeId,membershipId,applicationId}:EmailLinkScope){
 if(!validUuid(userId)||[collegeId,membershipId,applicationId].some(x=>x!=null&&!validUuid(x)))
  throw new Error("EMAIL_LINK_SCOPE_INVALID");
 if(membershipId&&!collegeId||applicationId&&!membershipId)
  throw new Error("EMAIL_LINK_SCOPE_INVALID");
}
async function ensureActiveScope(tx:Executor,scope:EmailLinkScope):Promise<boolean>{
 const {userId,collegeId,membershipId,applicationId}=scope;
 if(collegeId){
  const college=rows(await tx.execute(sql`
   SELECT c.id FROM colleges c JOIN organizations o ON o.id=c.organization_id
   WHERE c.id=${collegeId} AND c.status='ACTIVE' AND o.status='ACTIVE'
   FOR SHARE OF c,o`));
  if(college.length!==1)return false;
 }
 if(membershipId){
  const member=rows(await tx.execute(sql`
   SELECT m.id FROM college_memberships m
   WHERE m.id=${membershipId} AND m.user_id=${userId}
    AND m.college_id=${collegeId} AND m.status='ACTIVE'
    AND m.suspended_at IS NULL FOR SHARE OF m`));
  if(member.length!==1)return false;
 }
 if(applicationId){
  const application=rows(await tx.execute(sql`
   SELECT a.id FROM placement_applications a
    JOIN placement_jobs j ON j.id=a.job_id
    JOIN membership_roles r ON r.membership_id=a.membership_id AND r.role='LEARNER'
   WHERE a.id=${applicationId} AND a.membership_id=${membershipId}
    AND j.college_id=${collegeId} AND a.status<>'WITHDRAWN'
   FOR SHARE OF a,j,r`));
  if(application.length!==1)return false;
 }
 return true;
}

/** Rate-capped issue, atomically superseding outstanding links. */
export async function issueEmailOwnershipLink(scope:EmailLinkScope,send:EmailLinkSend){
 validateScope(scope);
 const secret=getSecret(),version=keyVersion(), token=generateToken();
 const digest=bearerDigest(secret,token);
 const result=await getDb().transaction(async tx=>{
  // One user lock serializes issuance, redemption and email mutations.
  const user=rows(await tx.execute(sql`
   SELECT id,email FROM users
   WHERE id=${scope.userId} AND platform_status='ACTIVE' FOR UPDATE`))[0];
  const email=user?.["email"];
  if(typeof email!=="string"||!email.trim())
   throw new Error("EMAIL_LINK_SCOPE_INVALID");
  if(!await ensureActiveScope(tx,scope))throw new Error("EMAIL_LINK_SCOPE_INVALID");
  const fingerprint=emailFingerprint(secret,email);
  const past=rows(await tx.execute(sql`
   SELECT created_at FROM identity_email_verification_links
   WHERE user_id=${scope.userId} AND email_fingerprint=${fingerprint}
    AND created_at>clock_timestamp()-interval '24 hours'
   ORDER BY created_at DESC LIMIT 5`));
  if(past.length>=5||
   (past[0]?.["created_at"]!=null &&
    Date.now()-timestamp(past[0]["created_at"]).getTime()<60_000))
   throw new Error("EMAIL_LINK_RATE_LIMIT");
  await tx.execute(sql`
   UPDATE identity_email_verification_links SET revoked_at=clock_timestamp()
   WHERE user_id=${scope.userId} AND verified_at IS NULL AND revoked_at IS NULL
     AND expires_at>clock_timestamp()`);
  const id=randomUUID();
  const inserted=rows(await tx.execute(sql`
   WITH tick AS (SELECT clock_timestamp() AS t)
   INSERT INTO identity_email_verification_links
    (id,user_id,college_id,membership_id,application_id,
     email_fingerprint,email_key_version,token_digest,created_at,expires_at)
   SELECT ${id},${scope.userId},${scope.collegeId??null},
     ${scope.membershipId??null},${scope.applicationId??null},
     ${fingerprint},${version},${digest},tick.t,tick.t+interval '24 hours'
   FROM tick RETURNING id,expires_at`));
  if(inserted.length!==1)throw new Error("EMAIL_LINK_ISSUE_FAILED");
  return {id,expiresAt:timestamp(inserted[0]?.["expires_at"]),email};
 });
 try{await send({to:result.email,token,expiresAt:result.expiresAt});}
 catch(error){
  await getDb().execute(sql`
   UPDATE identity_email_verification_links SET revoked_at=clock_timestamp()
   WHERE id=${result.id} AND revoked_at IS NULL AND verified_at IS NULL`);
  throw error;
 }
 return {id:result.id,expiresAt:result.expiresAt.toISOString()};
}

/** Redeem exactly once, comparing persisted current contact and active scope.
 * A changed email or revoked membership permanently invalidates the link.
 * This is an ownership proof, not a login/device session or role grant.
 */
export async function redeemEmailOwnershipLink(token:string):Promise<boolean>{
 if(!/^[a-zA-Z0-9_-]{43}$/.test(token))return false;
 const secret=getSecret(),version=keyVersion(),digest=bearerDigest(secret,token);
 return getDb().transaction(async tx=>{
  const preliminary=rows(await tx.execute(sql`
   SELECT user_id FROM identity_email_verification_links
    WHERE token_digest=${digest}`))[0];
  const userId=preliminary?.["user_id"];
  if(typeof userId!=="string")return false;
  const user=rows(await tx.execute(sql`
   SELECT id,email FROM users WHERE id=${userId}
    AND platform_status='ACTIVE' FOR UPDATE`))[0];
  if(!user)return false;
  const link=rows(await tx.execute(sql`
   SELECT id,college_id,membership_id,application_id,email_fingerprint,
    email_key_version,expires_at,verified_at,revoked_at
   FROM identity_email_verification_links
   WHERE token_digest=${digest} AND user_id=${userId}
   FOR UPDATE`))[0];
  if(!link||link["revoked_at"]||link["verified_at"]||
    link["expires_at"]==null||
    timestamp(link["expires_at"]).getTime()<=Date.now()||
    link["email_key_version"]!==version)return false;
  const contact=user["email"];
  const validContact=typeof contact==="string"&&
   emailFingerprint(secret,contact)===link["email_fingerprint"];
  const validScope=validContact&&await ensureActiveScope(tx,{
   userId,collegeId:link["college_id"] as string|null,
   membershipId:link["membership_id"] as string|null,
   applicationId:link["application_id"] as string|null,
  });
  if(!validScope){
   await tx.execute(sql`
    UPDATE identity_email_verification_links SET revoked_at=clock_timestamp()
    WHERE id=${link["id"]} AND revoked_at IS NULL AND verified_at IS NULL`);
   return false;
  }
  const redeemed=rows(await tx.execute(sql`
   UPDATE identity_email_verification_links SET verified_at=clock_timestamp()
   WHERE id=${link["id"]} AND verified_at IS NULL AND revoked_at IS NULL
    AND expires_at>clock_timestamp()
   RETURNING id,verified_at`))[0];
  if(!redeemed)return false;
  // A previous successful proof remains durable. All reissues remain
  // replay-protected, but they do not overwrite the original audit receipt.
  const existing=rows(await tx.execute(sql`
   SELECT id FROM identity_email_ownership_proofs
   WHERE user_id=${userId} AND email_fingerprint=${link["email_fingerprint"]}
    AND revoked_at IS NULL LIMIT 1`));
  if(existing.length===0){
   await tx.execute(sql`
    INSERT INTO identity_email_ownership_proofs
     (user_id,email_fingerprint,email_key_version,verification_link_id,verified_at)
    VALUES (${userId},${link["email_fingerprint"]},${version},
     ${link["id"]},${redeemed["verified_at"]})`);
  }
  return true;
 });
}
