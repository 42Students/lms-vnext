import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {readRecruiterThreadMessages,acknowledgeRecruiterThread} from "@/modules/placements/tpo-messaging-service";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const id=randomUUID();
const context:RequestContext={
 user:{id,identityUid:"recruiter-grant-negative",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,
 recruiter:{userId:id,companyId:randomUUID(),companyName:"Unverified",
  title:null,status:"ACTIVE",grants:[]},
};
describe.skipIf(!enabled)("Persisted recruiter messages reject a non-owned thread",()=>{
 afterAll(async()=>{await closeDatabaseConnection();});
 it("denies thread reads rather than using a fictional recruiter grant",async()=>{
  await expect(readRecruiterThreadMessages(context,randomUUID()))
    .rejects.toMatchObject({code:"TPO_MESSAGE_THREAD_NOT_FOUND"});
 });
 it("denies mark-read without a persisted exact owner thread",async()=>{
  await expect(acknowledgeRecruiterThread(context,randomUUID()))
    .rejects.toMatchObject({code:"TPO_MESSAGE_THREAD_NOT_FOUND"});
 });
});
