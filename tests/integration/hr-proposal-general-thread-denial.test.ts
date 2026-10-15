import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {verifyRecruiterGeneralThreadAccess} from "@/modules/placements/tpo-messaging-service";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const id=randomUUID();
const actor:RequestContext={user:{id,identityUid:"proposal-thread-guard",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,recruiter:{userId:id,companyId:randomUUID(),companyName:"No active grant",
  status:"ACTIVE",title:null,grants:[]}};
describe.skipIf(!enabled)("proposal history minimal authorization",()=>{
 afterAll(async()=>{await closeDatabaseConnection();});
 it("does not enumerate an unknown general conversation or fetch its messages",async()=>{
  await expect(verifyRecruiterGeneralThreadAccess(actor,randomUUID(),randomUUID()))
   .rejects.toMatchObject({code:"TPO_MESSAGE_THREAD_NOT_FOUND"});
 });
});
