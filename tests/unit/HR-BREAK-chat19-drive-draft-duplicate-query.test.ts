import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";

const d=vi.hoisted(()=>({
 ctx:vi.fn(),notFound:vi.fn(),redirect:vi.fn(),workspace:vi.fn(),requests:vi.fn(),
 branches:vi.fn(),
}));
vi.mock("server-only",()=>({}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:d.ctx}));
vi.mock("next/navigation",()=>({notFound:d.notFound,redirect:d.redirect}));
vi.mock("@/modules/placements/recruiter-workspace-service",()=>({
 getRecruiterPlacementWorkspace:d.workspace,
}));
vi.mock("@/modules/placements/recruiter-drive-request-service",()=>({
 listOwnRecruiterDriveRequests:d.requests,
}));
vi.mock("@/modules/placements/recruiter-college-branch-service",()=>({
 listRecruiterCollegeBranches:d.branches,
}));
import RecruiterRequestDrivePage from "@/app/(authenticated)/hr/drives/new/page";

const a="11111111-1111-4111-8111-111111111111";
const b="22222222-2222-4222-8222-222222222222";
const actor:RequestContext={
 user:{id:"recruiter",identityUid:"identity",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,recruiter:{userId:"recruiter",companyId:"company",companyName:"Employer",
 title:null,status:"ACTIVE",grants:[{
  id:"grant",organizationId:"org",collegeId:a,collegeName:"College",
  companyRelationshipId:"rel",
 }]},
};
const page=(raw:Record<string,unknown>={})=>
 RecruiterRequestDrivePage({searchParams:Promise.resolve(raw) as never});

describe("HR-BREAK-DRIVE-DRAFT-QUERY-23: secure recruiter draft source URL",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  d.ctx.mockResolvedValue(actor);
  d.redirect.mockImplementation(()=>{throw new Error("REDIRECT");});
  d.notFound.mockImplementation(()=>{throw new Error("NOT_FOUND");});
 });
 it.each([
  {collegeId:[a,b]},{collegeId:[a,a]},
  {from:[a,b]},{edit:[a,b]},{fix:[a,b]},{copy:[a,b]},
  {from:a,fix:b},
 ])("does not pick one of contradictory grant/request/source links %j",async raw=>{
  await expect(page(raw)).rejects.toThrow("NOT_FOUND");
  expect(d.workspace).not.toHaveBeenCalled();
  expect(d.requests).not.toHaveBeenCalled();
  expect(d.branches).not.toHaveBeenCalled();
 });
 it("rejects a mismatched recruiter account before any draft state reader",async()=>{
  d.ctx.mockResolvedValue({...actor,recruiter:{...actor.recruiter!,userId:"other-person"}});
  await expect(page()).rejects.toThrow("REDIRECT");
  expect(d.workspace).not.toHaveBeenCalled();
  expect(d.requests).not.toHaveBeenCalled();
  expect(d.branches).not.toHaveBeenCalled();
 });
 it("expired session denies entry independent of valid source UUID",async()=>{
  d.ctx.mockResolvedValue({...actor,user:{...actor.user,platformStatus:"DISABLED"}});
  await expect(page({from:a})).rejects.toThrow("REDIRECT");
  expect(d.workspace).not.toHaveBeenCalled();
 });
});
