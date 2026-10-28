import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import { SEED_IDS } from "../../scripts/db-seed-data";
import {
 issuePreuserChallenge,verifyPreuserChallenge,consumePreuserProof,
} from "@/modules/identity/preuser-onboarding-service";

const url=process.env.TEST_DATABASE_URL;
if(!url||process.env.DATABASE_URL!==url)
 throw new Error("DB004 preuser identity binding requires isolated TEST_DATABASE_URL === DATABASE_URL");
const pool=new Pool({connectionString:url,max:2});
const oldPepper=process.env.AUTH_ONBOARDING_PEPPER;
const learnerA=randomUUID(),learnerB=randomUUID(),memberA=randomUUID(),memberB=randomUUID();
const emailA="preuser-"+learnerA+"@example.test",emailB="preuser-"+learnerB+"@example.test";
const challenges:string[]=[];

beforeAll(async()=>{
 process.env.AUTH_ONBOARDING_PEPPER="db004-disposable-preuser-"+randomUUID();
 for(const [id,email] of [[learnerA,emailA],[learnerB,emailB]]){
  await pool.query("insert into users (id,identity_uid,email,platform_status) values ($1,$2,$3,'ACTIVE')",
   [id,"db004-preuser-"+id,email]);
 }
 for(const [id,userId] of [[memberA,learnerA],[memberB,learnerB]]){
  await pool.query(
   "insert into college_memberships (id,user_id,college_id,status) values ($1,$2,$3,'ACTIVE')",
   [id,userId,SEED_IDS.collegeA]);
  await pool.query("insert into membership_roles (membership_id,role) values ($1,'LEARNER')",[id]);
 }
});
afterAll(async()=>{
 for(const id of challenges)await pool.query("delete from identity_preuser_challenges where id=$1",[id]);
 await pool.query("delete from membership_roles where membership_id=any($1::uuid[])",[[memberA,memberB]]);
 await pool.query("delete from college_memberships where id=any($1::uuid[])",[[memberA,memberB]]);
 await pool.query("delete from users where id=any($1::uuid[])",[[learnerA,learnerB]]);
 if(oldPepper===undefined)delete process.env.AUTH_ONBOARDING_PEPPER;
 else process.env.AUTH_ONBOARDING_PEPPER=oldPepper;
 await pool.end();
 await closeDatabaseConnection();
});
async function verifiedChallenge(){
 // Keep each independent case outside the per-contact 60-second issue
 // cooldown; do not clear a production challenge or weaken its rate limit.
 for(const id of challenges)
  await pool.query("delete from identity_preuser_challenges where id=$1",[id]);
 challenges.length=0;
 let code="";
 const issue=await issuePreuserChallenge({
  collegeId:SEED_IDS.collegeA,channel:"EMAIL",source:"CONTACT",contact:emailA,
 },{collegeId:SEED_IDS.collegeA,roll:null,active:true,contact:emailA},
 async target=>{code=target.code;});
 challenges.push(issue.challengeId);
 const verified=await verifyPreuserChallenge({
  challengeId:issue.challengeId,collegeId:SEED_IDS.collegeA,code,
 });
 expect(verified.verified).toBe(true);
 return issue.challengeId;
}
describe("DB-004 preuser proof is bound to verified contact AND membership",()=>{
 it("rejects directory proof for a different destination contact without sending",async()=>{
  let sends=0;
  await expect(issuePreuserChallenge({
   collegeId:SEED_IDS.collegeA,channel:"EMAIL",source:"CONTACT",contact:emailB,
  },{collegeId:SEED_IDS.collegeA,roll:null,active:true,contact:emailA},
  async()=>{sends++;})).rejects.toThrow("ONBOARDING_CONTACT_NOT_VERIFIED");
  expect(sends).toBe(0);
 });
 it("rejects attaching a valid OTP for learner A to learner B in the same college",async()=>{
  const challengeId=await verifiedChallenge();
  await expect(consumePreuserProof(challengeId,memberB))
   .rejects.toThrow("ONBOARDING_CONTACT_NOT_VERIFIED");
  await expect(consumePreuserProof(challengeId,memberA))
   .resolves.toMatchObject({membershipId:memberA,collegeId:SEED_IDS.collegeA});
  await expect(consumePreuserProof(challengeId,memberA))
   .rejects.toThrow("ONBOARDING_PROOF_EXPIRED");
 });
 it("rejects a disabled learner even with valid prior email proof",async()=>{
  const challengeId=await verifiedChallenge();
  await pool.query("update users set platform_status='DISABLED' where id=$1",[learnerA]);
  try{
   await expect(consumePreuserProof(challengeId,memberA))
    .rejects.toThrow("ONBOARDING_MEMBERSHIP_NOT_VERIFIED");
  }finally{
   await pool.query("update users set platform_status='ACTIVE' where id=$1",[learnerA]);
  }
 });
 it("rejects proof if the target learner changed their email after OTP verification",async()=>{
  const challengeId=await verifiedChallenge();
  await pool.query("update users set email=$1 where id=$2",
   ["changed-"+learnerA+"@example.test",learnerA]);
  try{
   await expect(consumePreuserProof(challengeId,memberA))
    .rejects.toThrow("ONBOARDING_CONTACT_NOT_VERIFIED");
  }finally{
   await pool.query("update users set email=$1 where id=$2",[emailA,learnerA]);
  }
 });
});
