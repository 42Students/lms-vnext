import {describe,it,expect,afterAll} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import {sendTpoBulkApplicationMessage} from "@/modules/placements/tpo-bulk-applicant-message-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import type {RequestContext} from "@/modules/identity/context";
const ctx:RequestContext={user:{id:SEED_IDS.collegeAdminUser,identityUid:"tpo-bulk-message-pg",
 platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.collegeAdminMembership,organizationId:SEED_IDS.organization,
 collegeId:SEED_IDS.collegeA,status:"ACTIVE",roles:["TPO"]}};
describe.skipIf(!process.env.TEST_DATABASE_URL)("TPO-drive-workspace-25 in-app message write scope",()=>{
 afterAll(async()=>{await closeDatabaseConnection();});
 it("never sends to a foreign or nonexistent application",async()=>{
  await expect(sendTpoBulkApplicationMessage(ctx,{
   jobId:"11111111-1111-4111-8111-111111111111",
   applicationId:"22222222-2222-4222-8222-222222222222",
   expectedVersion:"2026-10-15T12:00:00.000Z",body:"Invitation for test review.",
  })).rejects.toBeDefined();
 });
 it("rejects invalid body and fake version before any delivery",async()=>{
  await expect(sendTpoBulkApplicationMessage(ctx,{
   jobId:"11111111-1111-4111-8111-111111111111",
   applicationId:"22222222-2222-4222-8222-222222222222",
   expectedVersion:"broken",body:"short",
  })).rejects.toBeDefined();
 });
});
