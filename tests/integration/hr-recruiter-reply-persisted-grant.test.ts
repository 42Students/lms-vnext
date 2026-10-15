import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {sendRecruiterThreadMessage,TpoMessagingError} from "@/modules/placements/tpo-messaging-service";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const id=randomUUID();
const ctx:RequestContext={user:{id,identityUid:"reply-denial",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,recruiter:{userId:id,companyId:randomUUID(),companyName:"Test",title:null,status:"ACTIVE",grants:[]}};
describe.skipIf(!enabled)("recruiter-only reply persisted ownership",()=>{
 afterAll(async()=>{await closeDatabaseConnection();});
 it("denies a missing or other-owner thread without creating an outgoing message",async()=>{
  await expect(sendRecruiterThreadMessage(ctx,randomUUID(),"Hello"))
    .rejects.toBeInstanceOf(TpoMessagingError);
 });
});
