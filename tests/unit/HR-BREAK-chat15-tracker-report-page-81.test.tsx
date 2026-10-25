import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement,type ReactElement,type ReactNode} from "react";
import type {RequestContext} from "@/modules/identity/context";
const m=vi.hoisted(()=>({ctx:vi.fn(),redirect:vi.fn(),ready:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.ctx}));
vi.mock("next/navigation",()=>({redirect:m.redirect}));
vi.mock("@/modules/bug-tracker/readiness",()=>({trackerAdminRuntimeEnabled:m.ready}));
vi.mock("@/components/tracker/tracker-report-form",()=>({TrackerReportForm:()=>null}));
import TrackerReportPage from "@/app/(authenticated)/tracker/page";

const admin:RequestContext={
 user:{id:"root",identityUid:"root",systemRoles:["SUPER_ADMIN"],platformStatus:"ACTIVE"},
 membership:null,adminScope:null,
};
const recruiter:RequestContext={
 user:{id:"hr",identityUid:"hr",systemRoles:[],platformStatus:"ACTIVE"},
 membership:null,recruiter:{userId:"hr",status:"ACTIVE",companyId:"company",
  companyName:"Company",title:null,grants:[]},
};
const known="123e4567-e89b-42d3-a456-426614174001";
const view=(q:Record<string,string|string[]|undefined>={})=>
 TrackerReportPage({searchParams:Promise.resolve(q)});
function nodes(node:ReactNode):ReactElement[]{
 if(Array.isArray(node))return node.flatMap(nodes);
 if(!isValidElement(node))return [];
 const p=node.props as {children?:ReactNode};
 return [node,...nodes(p.children)];
}
function text(node:ReactNode):string{
 if(Array.isArray(node))return node.map(text).join(" ");
 if(typeof node==="string"||typeof node==="number")return String(node);
 if(!isValidElement(node))return "";
 const p=node.props as {children?:ReactNode;title?:string;description?:string};
 return [p.title??"",p.description??"",text(p.children)].join(" ");
}
describe("HR-TRACKER-PAGE-81: authenticated reporter intake and HR privacy",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.ctx.mockResolvedValue(recruiter);m.ready.mockReturnValue(true);
  m.redirect.mockImplementation(()=>{throw new Error("REDIRECT");});
 });
 it("denies expired identity before reading runtime or rendering a form",async()=>{
  m.ctx.mockResolvedValue({...recruiter,user:{...recruiter.user,platformStatus:"DISABLED"}});
  const output=await view();
  expect(text(output)).toContain("Sign in to report an issue");
  expect(nodes(output).some(node=>"contextPrefill" in (node.props as object))).toBe(false);
  expect(m.redirect).not.toHaveBeenCalled();
  expect(m.ready).not.toHaveBeenCalled();
 });
 it("readiness off shows a non-committal no-submission state, not a success",async()=>{
  m.ready.mockReturnValue(false);
  const output=await view({context:"Important report"});
  expect(text(output)).toContain("Reports are temporarily unavailable.");
  expect(text(output)).toContain("Your report has not been submitted.");
  expect(nodes(output).some(n=>"contextPrefill" in (n.props as object))).toBe(false);
 });
 it("a recruiter cannot inject a Super Admin known-error link by guessed URL",async()=>{
  const output=await view({context:"Cannot submit a drive",knownErrorId:known});
  const form=nodes(output).find(n=>"contextPrefill" in (n.props as object));
  expect(form).toBeDefined();
  expect(form?.props).toMatchObject({contextPrefill:"Cannot submit a drive",
   canSearchSimilar:false});
  expect(form?.props).not.toHaveProperty("knownErrorId");
 });
 it("admin can link a well-formed known error, but never an unvalidated arbitrary identifier",async()=>{
  m.ctx.mockResolvedValue(admin);
  const valid=await view({knownErrorId:known});
  const validForm=nodes(valid).find(n=>"contextPrefill" in (n.props as object));
  expect(validForm?.props).toMatchObject({canSearchSimilar:true,knownErrorId:known});
  const invalid=await view({knownErrorId:"../../admin"});
  const invalidForm=nodes(invalid).find(n=>"contextPrefill" in (n.props as object));
  expect((invalidForm?.props as {knownErrorId?:string}).knownErrorId).toBeUndefined();
 });
 it("duplicate or oversized URL context cannot poison private form state",async()=>{
  const duplicated=await view({context:["one","two"],knownErrorId:[known,known]});
  const duplicateForm=nodes(duplicated).find(n=>"contextPrefill" in (n.props as object));
  expect(duplicateForm?.props).toMatchObject({contextPrefill:"",canSearchSimilar:false});
  const long=await view({context:"z".repeat(2000)});
  const form=nodes(long).find(n=>"contextPrefill" in (n.props as object));
  expect((form?.props as {contextPrefill:string}).contextPrefill).toHaveLength(450);
 });
});