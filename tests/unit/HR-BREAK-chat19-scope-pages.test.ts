import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement,type ReactNode} from "react";
import type {RequestContext} from "@/modules/identity/context";
const m=vi.hoisted(()=>({ctx:vi.fn(),reports:vi.fn(),choices:vi.fn(),
 verify:vi.fn(),redirect:vi.fn(),notFound:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.ctx}));
vi.mock("@/modules/placements/recruiter-company-reports-service",()=>({getRecruiterCompanyReports:m.reports}));
vi.mock("@/modules/placements/recorded-outside-service",()=>({
 recordedOutsideChoices:m.choices,verifyRecordedOutsideConfirmation:m.verify,
}));
vi.mock("next/navigation",()=>({redirect:m.redirect,notFound:m.notFound}));
import CompanyReportsPage from "@/app/(authenticated)/hr/company/reports/page";
import RecordedOutsidePage from "@/app/(authenticated)/hr/drives/recorded-outside/page";
const college="11111111-1111-4111-8111-111111111111";
const other="22222222-2222-4222-8222-222222222222";
const actor:RequestContext={
 user:{id:"recruiter",identityUid:"identity",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,
 recruiter:{userId:"recruiter",companyId:"employer",companyName:"Employer",title:null,status:"ACTIVE",
  grants:[{id:"g",organizationId:"org",collegeId:college,collegeName:"College A",
   companyRelationshipId:"relation"}]},
};
function contents(node:ReactNode):string{
 if(Array.isArray(node))return node.map(contents).join(" ");
 if(typeof node==="string"||typeof node==="number")return String(node);
 if(!isValidElement(node))return "";
 const p=node.props as {children?:ReactNode;title?:string;description?:string};
 return [p.title??"",p.description??"",contents(p.children)].join(" ");
}
const reports=(filters:Record<string,unknown>={})=>CompanyReportsPage({
 searchParams:Promise.resolve(filters) as never,
});
const outside=(filters:Record<string,unknown>={})=>RecordedOutsidePage({
 searchParams:Promise.resolve(filters) as never,
});
describe("HR-BREAK-chat19-report-external-pages: college choice, forgery, no-access",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.ctx.mockResolvedValue(actor);
  m.redirect.mockImplementation(()=>{throw new Error("REDIRECT");});
  m.notFound.mockImplementation(()=>{throw new Error("NOT_FOUND");});
  m.reports.mockResolvedValue({status:"NO_ACCESS",choices:[]});
  m.choices.mockResolvedValue({status:"READY",choices:[]});
  m.verify.mockResolvedValue(false);
 });
 it("expired sessions deny both report and external-drive entry before database calls",async()=>{
  m.ctx.mockResolvedValue({...actor,user:{...actor.user,platformStatus:"DISABLED"}});
  await expect(reports()).rejects.toThrow("REDIRECT");
  await expect(outside()).rejects.toThrow("REDIRECT");
  expect(m.reports).not.toHaveBeenCalled();
  expect(m.choices).not.toHaveBeenCalled();
 });
 it.each([{collegeId:"../other"},{page:"0"},{pageSize:"100"},{status:"SECRET"}])(
  "invalid report filters %j never request privileged aggregates",async invalid=>{
   const rendered=await reports(invalid);
   expect(contents(rendered)).toContain("Invalid report filters");
   expect(m.reports).not.toHaveBeenCalled();
 });
 it("report no-access is explicit and does not fall back to another college",async()=>{
  const result=await reports({collegeId:college});
  expect(m.reports).toHaveBeenCalledWith(actor,expect.objectContaining({collegeId:college}));
  expect(contents(result)).toContain("No active college access");
 });
 it("multi-college reports demand an explicit authorized college rather than aggregating",async()=>{
  m.reports.mockResolvedValue({status:"CHOOSE_COLLEGE",choices:[
   {id:"g",collegeId:college,collegeName:"College A"},
   {id:"g2",collegeId:other,collegeName:"College B"},
  ]});
  const result=await reports();
  expect(contents(result)).toContain("Choose a college");
  expect(contents(result)).toContain("College A");
  expect(contents(result)).toContain("College B");
 });
 it("external drive rejects forged or invalid college before looking up company choices",async()=>{
  await expect(outside({collegeId:other})).rejects.toThrow("NOT_FOUND");
  await expect(outside({collegeId:"../admin"})).rejects.toThrow("NOT_FOUND");
  expect(m.choices).not.toHaveBeenCalled();
  expect(m.verify).not.toHaveBeenCalled();
 });
 it("a forged saved ID does not show a false-success banner",async()=>{
  const result=await outside({collegeId:college,saved:other});
  expect(m.verify).toHaveBeenCalledWith(actor,college,other);
  expect(contents(result)).not.toContain("External drive record saved.");
  expect(m.choices).toHaveBeenCalledWith(actor,college);
 });
 it("confirmed saved record does not claim a student-visible job was published",async()=>{
  m.verify.mockResolvedValue(true);
  const result=await outside({collegeId:college,saved:other});
  expect(contents(result)).toContain("External drive record saved.");
  expect(contents(result)).toContain("It was not published as a job.");
 });
});
