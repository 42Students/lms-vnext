import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement,type ReactNode} from "react";
import type {RequestContext} from "@/modules/identity/context";
const m=vi.hoisted(()=>({context:vi.fn(),reports:vi.fn(),redirect:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.context}));
vi.mock("@/modules/placements/recruiter-company-reports-service",()=>({getRecruiterCompanyReports:m.reports}));
vi.mock("next/navigation",()=>({redirect:m.redirect}));
import RecruiterCompanyReportsPage from "@/app/(authenticated)/hr/company/reports/page";
const actor:RequestContext={
 user:{id:"recruiter-a",identityUid:"identity-a",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,recruiter:{userId:"recruiter-a",companyId:"employer-a",companyName:"Employer",
  status:"ACTIVE",title:null,grants:[]},
};
function words(node:ReactNode):string{
 if(Array.isArray(node))return node.map(words).join(" ");
 if(typeof node==="string"||typeof node==="number")return String(node);
 if(!isValidElement(node))return "";
 const p=node.props as {title?:string;description?:string;children?:ReactNode;action?:ReactNode};
 return [p.title??"",p.description??"",words(p.action),words(p.children)].join(" ");
}
const render=(filters:Record<string,unknown>={})=>
 RecruiterCompanyReportsPage({searchParams:Promise.resolve(filters) as never});
describe("HR-BREAK-REPORT-PRINCIPAL-27 reporting authorization and recovery",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.context.mockResolvedValue(actor);
  m.redirect.mockImplementation(()=>{throw new Error("REDIRECT");});
  m.reports.mockResolvedValue({status:"NO_ACCESS"});
 });
 it("denies wrong-user recruiter before reading company metrics",async()=>{
  m.context.mockResolvedValue({...actor,recruiter:{...actor.recruiter!,userId:"other"}});
  await expect(render()).rejects.toThrow("REDIRECT");
  expect(m.redirect).toHaveBeenCalledWith("/dashboard");
  expect(m.reports).not.toHaveBeenCalled();
 });
 it("denies disabled recruiter before a report query",async()=>{
  m.context.mockResolvedValue({...actor,user:{...actor.user,platformStatus:"DISABLED"}});
  await expect(render()).rejects.toThrow("REDIRECT");
  expect(m.reports).not.toHaveBeenCalled();
 });
 it.each([
  {collegeId:["11111111-1111-4111-8111-111111111111","22222222-2222-4222-8222-222222222222"]},
  {status:["OPEN","CLOSED"]},{page:["1","9999"]},{pageSize:["10","50"]},
 ])("rejects duplicate report filters %j without reading private data",async filters=>{
  const output=await render(filters);
  expect(words(output)).toContain("Invalid report filters");
  expect(words(output)).toContain("Clear filters");
  expect(m.reports).not.toHaveBeenCalled();
 });
 it("shows honest no-access state for authorized empty recruiter",async()=>{
  const output=await render();
  expect(m.reports).toHaveBeenCalledOnce();
  expect(words(output)).toContain("No active college access");
 });
});
