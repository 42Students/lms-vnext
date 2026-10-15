import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {listHrDriveProposals} from "@/modules/placements/hr-drive-proposal-history-service";
import {TpoMessagingError} from "@/modules/placements/tpo-messaging-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const id=randomUUID();
const forged:RequestContext={
 user:{id,identityUid:"proposal-history-denial",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,
 recruiter:{userId:id,companyId:randomUUID(),companyName:"No grant",
  title:null,status:"ACTIVE",grants:[{
   id:randomUUID(),organizationId:SEED_IDS.organization,
   collegeId:SEED_IDS.collegeA,collegeName:"College A",
   companyRelationshipId:randomUUID(),
  }]},
};
describe.skipIf(!enabled)("Recruiter proposal history isolated PostgreSQL denial",()=>{
 afterAll(async()=>{await closeDatabaseConnection();});
 it("does not trust a forged in-memory college grant for proposal summaries",async()=>{
  await expect(listHrDriveProposals(forged,{collegeId:SEED_IDS.collegeA,page:1}))
   .rejects.toBeInstanceOf(TpoMessagingError);
 });
 it("rejects selecting a different college before scanning proposal messages",async()=>{
  await expect(listHrDriveProposals(forged,{collegeId:SEED_IDS.collegeB,page:1}))
   .rejects.toBeDefined();
 });
});
