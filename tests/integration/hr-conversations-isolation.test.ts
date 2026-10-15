import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {listHrConversations} from "@/modules/placements/hr-conversation-inbox-service";
import {readRecruiterThreadMessages} from "@/modules/placements/tpo-messaging-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const fakeId=randomUUID();
const spoofed:RequestContext={
 user:{id:fakeId,identityUid:"recruiter-message-denial",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,
 recruiter:{userId:fakeId,companyId:randomUUID(),companyName:"Not Granted",
  title:null,status:"ACTIVE",grants:[{id:randomUUID(),organizationId:SEED_IDS.organization,
   collegeId:SEED_IDS.collegeA,collegeName:"College A",companyRelationshipId:randomUUID()}]},
};
describe.skipIf(!enabled)("HR conversation real PostgreSQL scope denials",()=>{
 afterAll(async()=>{await closeDatabaseConnection();});
 it("denies a fabricated employer grant before returning private thread identifiers",async()=>{
  await expect(listHrConversations(spoofed,{collegeId:SEED_IDS.collegeA}))
   .rejects.toMatchObject({code:"TPO_MESSAGE_FORBIDDEN"});
 });
 it("masks unknown thread ids even with an apparently active recruiter context",async()=>{
  await expect(readRecruiterThreadMessages(spoofed,randomUUID(),1))
   .rejects.toMatchObject({code:"TPO_MESSAGE_THREAD_NOT_FOUND"});
 });
 it("rejects a caller-supplied college outside its session grant",async()=>{
  await expect(listHrConversations(spoofed,{collegeId:SEED_IDS.collegeB}))
   .rejects.toBeDefined();
 });
});
