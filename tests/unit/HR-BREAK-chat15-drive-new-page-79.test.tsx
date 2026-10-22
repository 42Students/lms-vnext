import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement,type ReactElement,type ReactNode} from "react";
import type {RequestContext} from "@/modules/identity/context";
const m=vi.hoisted(()=>({ctx:vi.fn(),redirect:vi.fn(),notFound:vi.fn(),
 workspace:vi.fn(),requests:vi.fn(),branches:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.ctx}));
vi.mock("next/navigation",()=>({redirect:m.redirect,notFound:m.notFound}));
vi.mock("@/modules/placements/recruiter-workspace-service",()=>({
 getRecruiterPlacementWorkspace:m.workspace,
}));
vi.mock("@/modules/placements/recruiter-drive-request-service",()=>({
 listOwnRecruiterDriveRequests:m.requests,
}));
vi.mock("@/modules/placements/recruiter-college-branch-service",()=>({
 listRecruiterCollegeBranches:m.branches,
}));
vi.mock("@/components/hr/hr-drive-draft-form",()=>({
 HrDriveDraftForm:()=>null,
}));
import RecruiterRequestDrivePage from "@/app/(authenticated)/hr/drives/new/page";
const own="11111111-1111-4111-8111-111111111111";
const other="22222222-2222-4222-8222-222222222222";
const requestId="33333333-3333-4333-8333-333333333333";
const actor:RequestContext={
 user:{id:"77777777-7777-4777-8777-777777777777",identityUid:"identity",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,recruiter:{userId:"77777777-7777-4777-8777-777777777777",companyId:"company-a",companyName:"Employer",
  status:"ACTIVE",title:null,grants:[{
   id:"grant-one",organizationId:"org-one",collegeId:own,collegeName:"College One",
   companyRelationshipId:"relationship-one",
  }]},
};
const view=(query:Record<string,string|string[]|undefined>={})=>
 RecruiterRequestDrivePage({searchParams:Promise.resolve(query)});
function elements(node:ReactNode):ReactElement[]{
 if(Array.isArray(node))return node.flatMap(elements);
 if(!isValidElement(node))return [];
 const props=node.props as {children?:ReactNode;actions?:ReactNode};
 return [node,...elements(props.children),...elements(props.actions)];
}
const titles=(node:ReactNode)=>elements(node).map(el=>
 (el.props as {title?:string}).title).filter(Boolean);
describe("HR-DRIVE-PAGE-79: actual recruiter request drive page role and stale-link journey",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.ctx.mockResolvedValue(actor);
  m.redirect.mockImplementation(()=>{throw new Error("REDIRECT");});
  m.notFound.mockImplementation(()=>{throw new Error("NOT_FOUND");});
  m.requests.mockResolvedValue([]);m.branches.mockResolvedValue(["Computer Science"]);
 });
 it("redirects an expired or swapped recruiter before touching private drafts",async()=>{
  for(const wrong of [
   {...actor,user:{...actor.user,platformStatus:"DISABLED" as const}},
   {...actor,recruiter:{...actor.recruiter!,userId:"other"}},
  ]){
   m.ctx.mockResolvedValueOnce(wrong);
   await expect(view()).rejects.toThrow("REDIRECT");
  }
  expect(m.workspace).not.toHaveBeenCalled();
  expect(m.requests).not.toHaveBeenCalled();
 });
 it("rejects duplicate college IDs and conflicting edit/fix links",async()=>{
  for(const query of [{collegeId:[own,other]},{collegeId:own,edit:requestId,fix:requestId}]){
   const rendered=await view(query);
   expect(titles(rendered)).toContain("We couldn't load that drive");
  }
  expect(m.requests).not.toHaveBeenCalled();
  expect(m.branches).not.toHaveBeenCalled();
 });
 it("rejects other-college direct URL before searching request history",async()=>{
  const rendered=await view({collegeId:other});
  expect(titles(rendered)).toContain("We couldn't load that drive");
  expect(m.requests).not.toHaveBeenCalled();
  expect(m.branches).not.toHaveBeenCalled();
 });
 it("no grants renders an access-recovery state without draft persistence",async()=>{
  m.ctx.mockResolvedValue({...actor,recruiter:{...actor.recruiter!,grants:[]}});
  const rendered=await view();
  expect(titles(rendered)).toContain("No college selected");
  const empty=elements(rendered).find(el=>(el.props as {title?:string}).title==="No college selected");
  expect((empty?.props as {description?:string}).description).toContain("grant recruiter access");
  expect(m.requests).not.toHaveBeenCalled();
  expect(m.branches).not.toHaveBeenCalled();
 });
 it("multi-college employer must pick college before any request or branch lookup",async()=>{
  const second={...actor.recruiter!.grants[0]!,id:"grant-two",collegeId:other,collegeName:"College Two"};
  m.ctx.mockResolvedValue({...actor,recruiter:{...actor.recruiter!,grants:[
   actor.recruiter!.grants[0]!,second,
  ]}});
  const rendered=await view();
  const chooser=elements(rendered).find(el=>(el.props as {label?:string}).label==="Authorized colleges:");
  const items=(chooser?.props as {items?:readonly {href?:string}[]}).items??[];
  expect(items.map(item=>item.href)).toEqual([
   "/hr/drives/new?collegeId="+own,
   "/hr/drives/new?collegeId="+other,
  ]);
  expect(m.requests).not.toHaveBeenCalled();
 });
 it("revoked or wrong-status request cannot be edited from a stale URL",async()=>{
  m.requests.mockResolvedValue([{id:requestId,status:"REJECTED"}]);
  const rendered=await view({collegeId:own,edit:requestId});
  expect(titles(rendered)).toContain("We couldn't load that drive");
  expect(m.requests).toHaveBeenCalledWith(actor,own);
 });
 it("authorized single-college request presents real editor input and preserved branch choices",async()=>{
  const rendered=await view({collegeId:own});
  expect(titles(rendered)).toContain("Request a drive");
  const form=elements(rendered).find(el=>"storageKey" in (el.props as object));
  expect(form).toBeDefined();
  expect(form?.props).toMatchObject({collegeId:own,branchSuggestions:["Computer Science"],
   sourceJobId:null,editMode:"RESUBMIT"});
  expect(m.branches).toHaveBeenCalledWith(actor,own);
 });
});