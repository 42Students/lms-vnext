import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement,type ReactNode} from "react";
import type {RequestContext} from "@/modules/identity/context";
const m=vi.hoisted(()=>({ctx:vi.fn(),notFound:vi.fn(),redirect:vi.fn(),
 requests:vi.fn(),drives:vi.fn(),counts:vi.fn(),changeCounts:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.ctx}));
vi.mock("next/navigation",()=>({redirect:m.redirect,notFound:m.notFound}));
vi.mock("@/modules/placements/recruiter-drive-request-service",()=>({listOwnRecruiterDriveRequests:m.requests}));
vi.mock("@/modules/placements/recruiter-drive-search-service",()=>({searchOwnRecruiterDrives:m.drives}));
vi.mock("@/modules/placements/recruiter-portfolio-counts-service",()=>({recruiterVisiblePortfolioCounts:m.counts}));
vi.mock("@/modules/placements/hr-recruiter-open-change-counts-service",()=>({countRecruiterAnswerableDriveRequests:m.changeCounts}));
import HrDrivesPage from "@/app/(authenticated)/hr/drives/page";

const a="11111111-1111-4111-8111-111111111111";
const b="22222222-2222-4222-8222-222222222222";
const base:RequestContext={
 user:{id:"recruiter",identityUid:"identity",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,
 recruiter:{userId:"recruiter",companyId:"employer",companyName:"Employer",title:null,status:"ACTIVE",
  grants:[{id:"grant-a",organizationId:"org",collegeId:a,collegeName:"College A",
   companyRelationshipId:"relation-a"}]},
};
const page=(query:Record<string,unknown>={})=>HrDrivesPage({searchParams:Promise.resolve(query) as never});
function copy(node:ReactNode):string{
 if(Array.isArray(node))return node.map(copy).join(" ");
 if(typeof node==="string"||typeof node==="number")return String(node);
 if(!isValidElement(node))return "";
 const p=node.props as {children?:ReactNode;title?:string;description?:string};
 return [p.title??"",p.description??"",copy(p.children)].join(" ");
}
describe("HR-BREAK-chat19-drive-list: selected college may never widen account data",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  m.ctx.mockResolvedValue(base);
  m.redirect.mockImplementation(()=>{throw new Error("REDIRECT");});
  m.notFound.mockImplementation(()=>{throw new Error("NOT_FOUND");});
 });
 it("expired or deleted recruiter cannot initiate a job, request or count query",async()=>{
  m.ctx.mockResolvedValue({...base,user:{...base.user,platformStatus:"DISABLED"}});
  await expect(page()).rejects.toThrow("REDIRECT");
  m.ctx.mockResolvedValue({...base,recruiter:null});
  await expect(page()).rejects.toThrow("REDIRECT");
  expect(m.drives).not.toHaveBeenCalled();
  expect(m.requests).not.toHaveBeenCalled();
  expect(m.counts).not.toHaveBeenCalled();
 });
 it.each([{collegeId:"other"},{view:"ALL-COLLEGES"},{page:"0"},
  {page:"1.5"},{q:"x".repeat(121)},{sort:"DROP TABLE"}])(
  "rejects forged list filter %j before any list service",async input=>{
   const result=await page(input);
   expect(copy(result)).toContain("Invalid drive filters");
   expect(m.drives).not.toHaveBeenCalled();
   expect(m.requests).not.toHaveBeenCalled();
  });
 it.each([
  {collegeId:[a,b]},{collegeId:[b,a]},
  {q:["safe","private"]},{view:["LIVE","CLOSED"]},
  {tab:["live","closed"]},{page:["1","10"]},
 ])("denies duplicated drive filter %j rather than choosing one value",async query=>{
  const result=await page(query);
  expect(copy(result)).toContain("Invalid drive filters");
  expect(m.drives).not.toHaveBeenCalled();
  expect(m.requests).not.toHaveBeenCalled();
 });
 it("refuses a recruiter context from a different signed-in person before drive reads",async()=>{
  m.ctx.mockResolvedValue({...base,recruiter:{...base.recruiter!,userId:"another-user"}});
  await expect(page()).rejects.toThrow("REDIRECT");
  expect(m.drives).not.toHaveBeenCalled();
  expect(m.requests).not.toHaveBeenCalled();
 });
 it("wrong college UUID is not permission even when syntactically valid",async()=>{
  await expect(page({collegeId:b})).rejects.toThrow("NOT_FOUND");
  expect(m.notFound).toHaveBeenCalled();
  expect(m.drives).not.toHaveBeenCalled();
  expect(m.requests).not.toHaveBeenCalled();
 });
 it("multiple grants never auto-select the first college and query cross-college results",async()=>{
  m.ctx.mockResolvedValue({...base,recruiter:{...base.recruiter!,grants:[
   ...base.recruiter!.grants,{...base.recruiter!.grants[0]!,id:"grant-b",collegeId:b,collegeName:"College B"},
  ]}});
  const result=await page();
  expect(copy(result)).toContain("Choose an authorized college");
  expect(copy(result)).toContain("College A");
  expect(copy(result)).toContain("College B");
  expect(m.drives).not.toHaveBeenCalled();
  expect(m.requests).not.toHaveBeenCalled();
 });
 it("zero grants offers placement-cell recovery, not platform-wide recruiter inventory",async()=>{
  m.ctx.mockResolvedValue({...base,recruiter:{...base.recruiter!,grants:[]}});
  const result=await page();
  expect(copy(result)).toContain("No active college access");
  expect(m.drives).not.toHaveBeenCalled();
  expect(m.requests).not.toHaveBeenCalled();
 });
});
