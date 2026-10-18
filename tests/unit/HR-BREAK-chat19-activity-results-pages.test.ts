import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement,type ReactNode} from "react";
import type {RequestContext} from "@/modules/identity/context";

const m=vi.hoisted(()=>({ctx:vi.fn(),activity:vi.fn(),jobs:vi.fn(),
 workspace:vi.fn(),redirect:vi.fn(),notFound:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.ctx}));
vi.mock("@/modules/placements/hr-job-activity-service",()=>({listRecruiterJobActivity:m.activity}));
vi.mock("@/modules/placements/recruiter-service",()=>({listOwnRecruiterPlacementJobs:m.jobs}));
vi.mock("@/modules/placements/recruiter-workspace-service",()=>({getRecruiterPlacementWorkspace:m.workspace}));
vi.mock("next/navigation",()=>({redirect:m.redirect,notFound:m.notFound}));
import HrActivityPage from "@/app/(authenticated)/hr/activity/page";
import HrRoundResultsPage from "@/app/(authenticated)/hr/round-results/page";

const college="11111111-1111-4111-8111-111111111111";
const job="22222222-2222-4222-8222-222222222222";
const actor:RequestContext={
 user:{id:"user",identityUid:"identity",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,
 recruiter:{userId:"user",companyId:"company",companyName:"Employer",title:null,status:"ACTIVE",
  grants:[{id:"grant",organizationId:"org",collegeId:college,collegeName:"College",
   companyRelationshipId:"relation"}]},
};
function textOf(node:ReactNode):string {
 if(Array.isArray(node))return node.map(textOf).join(" ");
 if(typeof node==="string"||typeof node==="number")return String(node);
 if(!isValidElement(node))return "";
 const p=node.props as {title?:string;description?:string;children?:ReactNode};
 return [p.title??"",p.description??"",textOf(p.children)].join(" ");
}
const activity=(params:Record<string,unknown>={})=>HrActivityPage({searchParams:Promise.resolve(params) as never});
const round=(params:Record<string,unknown>={})=>HrRoundResultsPage({searchParams:Promise.resolve(params) as never});
describe("HR-BREAK-chat19-activity-results: release-scoped source and abnormal inputs",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.ctx.mockResolvedValue(actor);
  m.redirect.mockImplementation(()=>{throw new Error("REDIRECT");});
  m.notFound.mockImplementation(()=>{throw new Error("NOT_FOUND");});
  m.jobs.mockResolvedValue([]);
  m.activity.mockResolvedValue({status:"NO_ACCESS",choices:[]});
  m.workspace.mockResolvedValue({job:{id:job},company:{name:"Employer"},
   college:{id:college,name:"College"},rounds:[]});
 });
 it("expired session denies both pages without touching activity or student results",async()=>{
  m.ctx.mockResolvedValue({...actor,user:{...actor.user,platformStatus:"DISABLED"}});
  await expect(activity()).rejects.toThrow("REDIRECT");
  await expect(round()).rejects.toThrow("REDIRECT");
  expect(m.activity).not.toHaveBeenCalled();
  expect(m.jobs).not.toHaveBeenCalled();
  expect(m.workspace).not.toHaveBeenCalled();
 });
 it.each([{collegeId:"other"},{page:"0"},{page:"1.5"},{kind:"PRIVATE"},{q:"x".repeat(121)},
  {collegeId:[college,"22222222-2222-4222-8222-222222222222"]},
  {page:["1","2"]},{q:["a","b"]}])(
  "rejects invalid activity filters %j before querying history",async input=>{
   expect(textOf(await activity(input))).toContain("Invalid activity filters.");
   expect(m.activity).not.toHaveBeenCalled();
 });
 it("handles no-access activity with a safe scoped message",async()=>{
  const result=await activity({collegeId:college,kind:"PUBLISHED"});
  expect(m.activity).toHaveBeenCalledWith(actor,expect.objectContaining({
   collegeId:college,kind:"PUBLISHED",
  }));
  expect(textOf(result)).toContain("No active college access.");
 });
 it.each([{jobId:"../other"},{roundId:"bad"},{outcome:"LEAK"},{jobId:job,roundId:"no"}])(
  "rejects malformed results filters %j before loading applicant results",async input=>{
   expect(textOf(await round(input))).toContain("Invalid round filters");
   expect(m.workspace).not.toHaveBeenCalled();
 });
 it("without selected drive shows only scoped recruiter choices and no private applicants",async()=>{
  const result=await round();
  expect(m.jobs).toHaveBeenCalledWith(actor);
  expect(m.workspace).not.toHaveBeenCalled();
  expect(textOf(result)).toContain("No hiring drives");
 });
 it("wrong or stale round ID cannot show a different round's result",async()=>{
  await expect(round({jobId:job,roundId:"33333333-3333-4333-8333-333333333333"}))
   .rejects.toThrow("NOT_FOUND");
  expect(m.workspace).toHaveBeenCalledWith(actor,job);
 });
 it("authorized job with no configured round has an explicit empty result",async()=>{
  const result=await round({jobId:job});
  expect(textOf(result)).toContain("No rounds yet");
  expect(textOf(result)).not.toContain("candidate email");
 });
 it("HR-BREAK-ACTIVITY-PRINCIPAL-28 rejects mismatched recruiter before activity history",async()=>{
  m.ctx.mockResolvedValue({...actor,recruiter:{...actor.recruiter!,userId:"other-user"}});
  await expect(activity()).rejects.toThrow("REDIRECT");
  expect(m.activity).not.toHaveBeenCalled();
  expect(m.jobs).not.toHaveBeenCalled();
  expect(m.workspace).not.toHaveBeenCalled();
 });
});
