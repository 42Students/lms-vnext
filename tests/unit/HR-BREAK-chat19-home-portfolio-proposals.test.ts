import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement,type ReactNode} from "react";
import type {RequestContext} from "@/modules/identity/context";
const m=vi.hoisted(()=>({ctx:vi.fn(),grants:vi.fn(),proposals:vi.fn(),
 jobs:vi.fn(),redirect:vi.fn(),notFound:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.ctx}));
vi.mock("@/modules/placements/recruiter-self-grants-service",()=>({getRecruiterSelfGrantOverview:m.grants}));
vi.mock("@/modules/placements/hr-drive-proposal-history-service",()=>({listHrDriveProposals:m.proposals}));
vi.mock("@/modules/placements/recruiter-service",()=>({listOwnRecruiterPlacementJobs:m.jobs}));
vi.mock("next/navigation",()=>({redirect:m.redirect,notFound:m.notFound}));
import HrHomePage from "@/app/(authenticated)/hr/home/page";
import HrPlacementsPage from "@/app/(authenticated)/hr/placements/page";
import HrProposalsPage from "@/app/(authenticated)/hr/drives/proposals/page";
const college="11111111-1111-4111-8111-111111111111";
const other="22222222-2222-4222-8222-222222222222";
const actor:RequestContext={
 user:{id:"recruiter",identityUid:"identity",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,recruiter:{userId:"recruiter",companyId:"employer",companyName:"Employer",
  title:null,status:"ACTIVE",grants:[{id:"g",organizationId:"org",collegeId:college,
   collegeName:"College",companyRelationshipId:"rel"}]},
};
const home=(q:Record<string,unknown>={})=>HrHomePage({searchParams:Promise.resolve(q) as never});
const proposals=(q:Record<string,unknown>={})=>HrProposalsPage({searchParams:Promise.resolve(q) as never});
function textOf(node:ReactNode):string{
 if(Array.isArray(node))return node.map(textOf).join(" ");
 if(typeof node==="string"||typeof node==="number")return String(node);
 if(!isValidElement(node))return "";
 const p=node.props as {title?:string;description?:string;children?:ReactNode};
 return [p.title??"",p.description??"",textOf(p.children)].join(" ");
}
describe("HR-BREAK-chat19-home-portfolio-proposals: no inferred tenant or false sent claims",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.ctx.mockResolvedValue(actor);
  m.redirect.mockImplementation(()=>{throw new Error("REDIRECT");});
  m.notFound.mockImplementation(()=>{throw new Error("NOT_FOUND");});
  m.jobs.mockResolvedValue([]);
  m.grants.mockResolvedValue({grants:[]});
  m.proposals.mockResolvedValue({status:"NO_ACCESS",choices:[]});
 });
 it("expired sessions cannot open dashboard, portfolio or sent proposal history",async()=>{
  m.ctx.mockResolvedValue({...actor,user:{...actor.user,platformStatus:"DISABLED"}});
  await expect(home()).rejects.toThrow("REDIRECT");
  await expect(HrPlacementsPage()).rejects.toThrow("REDIRECT");
  await expect(proposals()).rejects.toThrow("REDIRECT");
  expect(m.jobs).not.toHaveBeenCalled();
  expect(m.proposals).not.toHaveBeenCalled();
  expect(m.grants).not.toHaveBeenCalled();
 });
 it("wrong-tenant selection is rejected on Today before portfolio, calendar or profile reads",async()=>{
  await expect(home({collegeId:other})).rejects.toThrow("NOT_FOUND");
  expect(m.jobs).not.toHaveBeenCalled();
  expect(m.grants).not.toHaveBeenCalled();
 });
 it("invalid selection shows a reset action, not a raw UUID exception",async()=>{
  const result=await home({collegeId:"../admin"});
  expect(textOf(result)).toContain("Invalid college selection");
  expect(m.jobs).not.toHaveBeenCalled();
 });
 it.each([
  {collegeId:[college,other]},
  {collegeId:[other,college]},
  {collegeId:[college,college]},
 ])("rejects duplicate collegeId query parameter %j before tenant reads",async query=>{
  const result=await home(query);
  expect(textOf(result)).toContain("Invalid college selection");
  expect(m.jobs).not.toHaveBeenCalled();
  expect(m.grants).not.toHaveBeenCalled();
  expect(m.proposals).not.toHaveBeenCalled();
 });
 it("zero-grant dashboard displays a recovery action instead of querying a global job list",async()=>{
  m.ctx.mockResolvedValue({...actor,recruiter:{...actor.recruiter!,grants:[]}});
  const result=await home();
  expect(m.grants).toHaveBeenCalled();
  expect(textOf(result)).toContain("Open this on your college");
  expect(m.jobs).not.toHaveBeenCalled();
 });
 it.each([{collegeId:"admin"},{page:"0"},{page:"1.5"},{q:"x".repeat(101)},{sort:"PRIVATE"}])(
  "proposal filters %j reject before any persisted discussion is read",async bad=>{
   await expect(proposals(bad)).rejects.toThrow("NOT_FOUND");
   expect(m.proposals).not.toHaveBeenCalled();
 });
 it("proposal no-access never claims requests were sent or approved",async()=>{
  const result=await proposals();
  expect(m.proposals).toHaveBeenCalledOnce();
  expect(textOf(result)).toContain("No active recruiter college access.");
  expect(textOf(result)).not.toContain("Published");
 });
 it("legacy placement portfolio only renders its own service-projected jobs",async()=>{
  const result=await HrPlacementsPage();
  expect(m.jobs).toHaveBeenCalledWith(actor);
  expect(textOf(result)).toContain("Only opportunities belonging to your employer");
 });
});
