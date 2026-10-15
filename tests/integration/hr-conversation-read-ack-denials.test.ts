import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {acknowledgeRecruiterThread} from "@/modules/placements/tpo-messaging-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const userId=randomUUID();
const spoofed:RequestContext={
 user:{id:userId,identityUid:"hr-read-ack-denial",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,
 recruiter:{userId,companyId:randomUUID(),companyName:"Not Granted",
  title:null,status:"ACTIVE",grants:[]},
};
describe.skipIf(!enabled)("Recruiter explicit read acknowledgement PostgreSQL denials",()=>{
 afterAll(async()=>{await closeDatabaseConnection();});
 it("cannot mark nonexistent or someone else's thread read",async()=>{
  await expect(acknowledgeRecruiterThread(spoofed,randomUUID()))
    .rejects.toMatchObject({code:"TPO_MESSAGE_THREAD_NOT_FOUND"});
 });
 it("cannot acknowledge malformed thread ids",async()=>{
  await expect(acknowledgeRecruiterThread(spoofed,"not-a-uuid"))
    .rejects.toBeDefined();
 });
 it("rejects a fabricated foreign-college recruiter grant for an unknown thread",async()=>{
  const attacker:RequestContext={...spoofed,recruiter:{
   ...spoofed.recruiter!,grants:[{id:randomUUID(),collegeId:SEED_IDS.collegeB,
    organizationId:SEED_IDS.organization,collegeName:"Other",companyRelationshipId:randomUUID()}],
  }};
  await expect(acknowledgeRecruiterThread(attacker,randomUUID()))
    .rejects.toMatchObject({code:"TPO_MESSAGE_THREAD_NOT_FOUND"});
 });
});
