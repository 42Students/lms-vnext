import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {openRecruiterMessageThread,TpoMessagingError} from "@/modules/placements/tpo-messaging-service";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const id=randomUUID();
const context:RequestContext={
 user:{id,identityUid:"ungranted-recruiter-thread",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,
 recruiter:{userId:id,companyId:randomUUID(),companyName:"Company",
   status:"ACTIVE",title:null,grants:[]},
};
describe.skipIf(!enabled)("recruiter college conversation persisted permission",()=>{
 afterAll(async()=>{await closeDatabaseConnection();});
 it("never creates a thread from a forged unpersisted recruiter grant",async()=>{
  await expect(openRecruiterMessageThread(context,{collegeId:randomUUID()}))
   .rejects.toBeInstanceOf(TpoMessagingError);
 });
});
