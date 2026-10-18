import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
const state=vi.hoisted(()=>({college:vi.fn(),db:vi.fn(),confirm:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:state.db}));
vi.mock("@/modules/placements/tpo-job-write-base",()=>({requireTpoJobCollege:state.college}));
vi.mock("@/modules/placements/tpo-confirmed-round-result-service",()=>({
 confirmTpoRoundResult:state.confirm,
}));
import {previewTpoRoundImport,stageTpoRoundImport}
 from "@/modules/placements/tpo-round-import-service";
const jobId="00000000-0000-4000-8000-000000000001";
const roundId="00000000-0000-4000-8000-000000000002";
const learnerId="00000000-0000-4000-8000-000000000003";
const actor={user:{id:"tpo",identityUid:"id",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"member",collegeId:"college-a",organizationId:"org-a",status:"ACTIVE",roles:["TPO"]},
} as unknown as RequestContext;
const bytes=Buffer.from("Application ID,Result\n"+learnerId+",PASS\n","utf8");
const valid={action:"STAGE_IMPORT",confirmed:true,previewToken:"a".repeat(64),
 missingPolicy:"LEAVE_PENDING",overrides:[],skippedLines:[]};
beforeEach(()=>{
 for(const mock of Object.values(state))mock.mockReset();
});
describe("TPO-BREAK-round-import-service-14 bad input, revoked access and forged identities",()=>{
 it("preview refuses a foreign college or expired session before reading application roster",async()=>{
  state.college.mockRejectedValueOnce(new Error("COLLEGE_SCOPE_DENIED"));
  await expect(previewTpoRoundImport(actor,jobId,roundId,bytes,"results.csv"))
   .rejects.toThrow("COLLEGE_SCOPE_DENIED");
  expect(state.db).not.toHaveBeenCalled();
  expect(state.confirm).not.toHaveBeenCalled();
 });
 it("stage never writes if authenticated TPO identity does not have the college grant",async()=>{
  state.college.mockRejectedValueOnce(new Error("COLLEGE_SCOPE_DENIED"));
  await expect(stageTpoRoundImport(actor,jobId,roundId,bytes,"results.csv",valid))
   .rejects.toThrow("COLLEGE_SCOPE_DENIED");
  expect(state.db).not.toHaveBeenCalled();
  expect(state.confirm).not.toHaveBeenCalled();
 });
 it("rejects malformed route IDs before a database query, for both preview and staging",async()=>{
  state.college.mockResolvedValue("college-a");
  await expect(previewTpoRoundImport(actor,"../../other",roundId,bytes,"results.csv")).rejects.toThrow();
  await expect(stageTpoRoundImport(actor,jobId,"not-a-round",bytes,"results.csv",valid))
   .rejects.toThrow();
  expect(state.db).not.toHaveBeenCalled();
  expect(state.confirm).not.toHaveBeenCalled();
 });
 it("rejects forged tenant/body fields, conflicting row overrides and missing confirmation",async()=>{
  for(const bad of [
   {...valid,confirmed:false},{...valid,companyId:jobId},
   {...valid,overrides:[{line:2,applicationId:learnerId}],skippedLines:[2]},
   {...valid,overrides:[{line:2,applicationId:learnerId},{line:2,applicationId:roundId}]},
   {...valid,previewToken:"stale-tab"},
  ]){
   await expect(stageTpoRoundImport(actor,jobId,roundId,bytes,"results.csv",bad)).rejects.toThrow();
   expect(state.college).not.toHaveBeenCalled();
   expect(state.db).not.toHaveBeenCalled();
   expect(state.confirm).not.toHaveBeenCalled();
  }
 });
});
