import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement,type ReactNode} from "react";
import type {RequestContext} from "@/modules/identity/context";
const m=vi.hoisted(()=>({ctx:vi.fn(),redirect:vi.fn(),notFound:vi.fn(),list:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.ctx}));
vi.mock("next/navigation",()=>({redirect:m.redirect,notFound:m.notFound}));
vi.mock("@/modules/placements/hr-drive-proposal-history-service",()=>({
 listHrDriveProposals:m.list,
}));
import RecruiterDriveProposalHistory from "@/app/(authenticated)/hr/drives/proposals/page";

const college="11111111-1111-4111-8111-111111111111";
const second="22222222-2222-4222-8222-222222222222";
const actor:RequestContext={
 user:{id:"recruiter",identityUid:"uid",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,recruiter:{userId:"recruiter",companyId:"employer",companyName:"Employer",title:null,
 status:"ACTIVE",grants:[{id:"grant",collegeId:college,collegeName:"College One",
  organizationId:"org",companyRelationshipId:"relationship"}]},
};
const view=(q:Record<string,string|string[]|undefined>={})=>
 RecruiterDriveProposalHistory({searchParams:Promise.resolve(q)});
function labels(node:ReactNode):string{
 if(Array.isArray(node))return node.map(labels).join(" ");
 if(typeof node==="string"||typeof node==="number")return String(node);
 if(!isValidElement(node))return "";
 const p=node.props as {children?:ReactNode;title?:string;description?:string};
 return [p.title??"",p.description??"",labels(p.children)].join(" ");
}
function links(node:ReactNode):string[]{
 if(Array.isArray(node))return node.flatMap(links);
 if(!isValidElement(node))return [];
 const p=node.props as {href?:unknown;children?:ReactNode};
 return [...(typeof p.href==="string"?[p.href]:[]),...links(p.children)];
}
describe("HR-RECRUITER-PAGE-80: persisted sent proposals are not approved drive requests",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.ctx.mockResolvedValue(actor);
  m.redirect.mockImplementation(()=>{throw new Error("REDIRECT");});
  m.notFound.mockImplementation(()=>{throw new Error("NOT_FOUND");});
  m.list.mockResolvedValue({status:"READY",collegeId:college,choices:actor.recruiter!.grants,
   items:[],total:0,page:1,pages:1,limited:false});
 });
 it("revoked and impersonated recruiter sessions stop before proposal history lookup",async()=>{
  for(const context of [
   {...actor,user:{...actor.user,platformStatus:"DISABLED" as const}},
   {...actor,recruiter:{...actor.recruiter!,userId:"other"}},
  ]){
   m.ctx.mockResolvedValueOnce(context);
   await expect(view()).rejects.toThrow("REDIRECT");
  }
  expect(m.list).not.toHaveBeenCalled();
 });
 it("duplicate or malformed query parameters fail before query execution",async()=>{
  for(const q of [{collegeId:[college,second]},{page:"0"},{sort:"UNSAFE"},{q:"x".repeat(101)}]){
   await expect(view(q)).rejects.toThrow("NOT_FOUND");
  }
  expect(m.list).not.toHaveBeenCalled();
 });
 it("no college access states do not render any private links",async()=>{
  m.list.mockResolvedValue({status:"NO_ACCESS",collegeId:null,choices:[],
   items:[],total:0,page:1,pages:1,limited:false});
  const rendered=await view();
  expect(labels(rendered)).toContain("No active recruiter college access.");
  expect(links(rendered).some(x=>x.startsWith("/hr/conversations/"))).toBe(false);
 });
 it("multi-college context requires a choice without combining two companies",async()=>{
  m.list.mockResolvedValue({status:"CHOOSE_COLLEGE",collegeId:null,choices:[
   ...actor.recruiter!.grants,{...actor.recruiter!.grants[0]!,id:"grant2",
    collegeId:second,collegeName:"College Two"},
  ],items:[],total:0,page:1,pages:1});
  const rendered=await view();
  expect(labels(rendered)).toContain("Choose a college");
  expect(links(rendered)).toContain("/hr/drives/proposals?collegeId="+college);
  expect(links(rendered)).toContain("/hr/drives/proposals?collegeId="+second);
 });
 it("empty history never pretends a TPO approval was submitted",async()=>{
  const rendered=await view({collegeId:college});
  expect(labels(rendered)).toContain("not submitted drive approval requests");
  expect(labels(rendered)).toContain("No persisted drive proposals");
  expect(links(rendered).some(x=>x.includes("/api/")&&x.includes("export"))).toBe(false);
 });
 it("persisted proposals open only authorized messages and export the shown page",async()=>{
  m.list.mockResolvedValue({status:"READY",collegeId:college,choices:actor.recruiter!.grants,
   items:[{id:"proposal",referenceId:"ref",threadId:"thread",title:"Engineer",
    createdAt:new Date("2099-03-01T05:00:00Z")}],
   total:21,page:1,pages:2,limited:true});
  const rendered=await view({collegeId:college,q:"Engineer"});
  expect(links(rendered)).toContain("/hr/conversations/thread");
  expect(links(rendered).some(x=>x.includes("export")&&x.includes("collegeId="))).toBe(true);
  expect(labels(rendered)).toContain("No approval or drive publication is implied.");
  expect(m.list).toHaveBeenCalledWith(actor,expect.objectContaining({collegeId:college,q:"Engineer"}));
 });
});