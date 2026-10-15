import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {emptyHrDriveDraft} from "@/modules/placements/hr-drive-draft-model";
import {sendRecruiterDriveProposal,TpoMessagingError} from "@/modules/placements/tpo-messaging-service";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const id=randomUUID();
const actor:RequestContext={user:{id,identityUid:"no-recruiter-grant",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,recruiter:{userId:id,companyId:randomUUID(),companyName:"Unverified",status:"ACTIVE",title:null,grants:[]}};
describe.skipIf(!enabled)("Employer proposal college grant requirement",()=>{
 afterAll(async()=>{await closeDatabaseConnection();});
 it("cannot persist a proposal for a college without a registered ACTIVE grant",async()=>{
  const draft={...emptyHrDriveDraft(),title:"Analyst",location:"Hyderabad",description:"Describe a genuine full-time job."};
  await expect(sendRecruiterDriveProposal(actor,{
   collegeId:randomUUID(),submissionId:randomUUID(),draft,
  })).rejects.toBeInstanceOf(TpoMessagingError);
 });
});
