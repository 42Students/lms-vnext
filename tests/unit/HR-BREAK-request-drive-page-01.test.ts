import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement,type ReactNode} from "react";
const m=vi.hoisted(()=>({
 ctx:vi.fn(),active:vi.fn(),workspace:vi.fn(),branches:vi.fn(),requests:vi.fn(),
 redirect:vi.fn(),notFound:vi.fn(),
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.ctx}));
vi.mock("@/modules/identity/context",()=>({hasActiveRecruiter:m.active}));
vi.mock("@/modules/placements/recruiter-workspace-service",()=>({getRecruiterPlacementWorkspace:m.workspace}));
vi.mock("@/modules/placements/recruiter-college-branch-service",()=>({listRecruiterCollegeBranches:m.branches}));
vi.mock("@/modules/placements/recruiter-drive-request-service",()=>({listOwnRecruiterDriveRequests:m.requests}));
vi.mock("next/navigation",()=>({redirect:m.redirect,notFound:m.notFound}));
import RecruiterRequestDrivePage from "@/app/(authenticated)/hr/drives/new/page";

const actor="123e4567-e89b-42d3-a456-426614174000";
const collegeA="123e4567-e89b-42d3-a456-426614174001";
const collegeB="123e4567-e89b-42d3-a456-426614174002";
const request="123e4567-e89b-42d3-a456-426614174003";
const grant=(collegeId:string)=>({id:collegeId,collegeId,collegeName:collegeId===collegeA?"College A":"College B"});
const user=(grants:ReturnType<typeof grant>[])=>({
 user:{id:actor},recruiter:{grants,companyName:"Authorized Company",status:"ACTIVE",userId:actor},
});
const page=(query:Record<string,unknown>={})=>
 RecruiterRequestDrivePage({searchParams:Promise.resolve(query) as never});
function rendered(node:ReactNode):string{
 if(Array.isArray(node))return node.map(rendered).join(" ");
 if(typeof node==="string"||typeof node==="number")return String(node);
 if(!isValidElement(node))return "";
 const props=node.props as {children?:ReactNode;title?:string;description?:string};
 return [props.title??"",props.description??"",rendered(props.children)].join(" ");
}
function hrefs(node:ReactNode):string[]{
 if(Array.isArray(node))return node.flatMap(hrefs);
 if(!isValidElement(node))return [];
 const props=node.props as {children?:ReactNode;href?:unknown;items?:readonly {href?:string}[]};
 return [...(typeof props.href==="string"?[props.href]:[]),...(props.items??[]).flatMap(item=>item.href?[item.href]:[]),...hrefs(props.children)];
}

describe("HR-BREAK-request-drive-page-01: no-grant, wrong college and stale draft",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  m.ctx.mockResolvedValue(user([grant(collegeA)]));
  m.active.mockReturnValue(true);
  m.branches.mockResolvedValue(["Computer Science"]);
  m.requests.mockResolvedValue([]);
  m.workspace.mockResolvedValue({college:{id:collegeA},job:{id:request,title:"Engineer"},rounds:[]});
  m.redirect.mockImplementation(()=>{throw new Error("REDIRECT");});
  m.notFound.mockImplementation(()=>{throw new Error("NOT_FOUND");});
 });
 it("wrong role, inactive session or no recruiter profile never loads branch suggestions",async()=>{
  m.active.mockReturnValue(false);
  await expect(page()).rejects.toThrow("REDIRECT");
  expect(m.redirect).toHaveBeenCalledWith("/dashboard");
  expect(m.branches).not.toHaveBeenCalled();
 });
 it("invalid college/query combinations and guessed college IDs are rejected before a DB read",async()=>{
  for(const query of [{collegeId:"../college-b"},{collegeId:collegeB},
    {collegeId:collegeA,edit:request,fix:request}]){
   const result=await page(query);
   expect(rendered(result)).toContain("We couldn't load that drive");
  }
  expect(m.branches).not.toHaveBeenCalled();
  expect(m.requests).not.toHaveBeenCalled();
 });
 it("zero grants shows explicit no-active-college recovery, not arbitrary default college",async()=>{
  m.ctx.mockResolvedValue(user([]));
  const result=await page();
  expect(rendered(result)).toContain("No college selected");
  expect(rendered(result)).toContain("Ask the placement cell to grant recruiter access");
  expect(m.branches).not.toHaveBeenCalled();
 });
 it("multiple grants require explicit college; chooser has only authorized college links",async()=>{
  m.ctx.mockResolvedValue(user([grant(collegeA),grant(collegeB)]));
  const result=await page();
  expect(rendered(result)).toContain("Choose an authorized college");
  expect(hrefs(result)).toContain("/hr/drives/new?collegeId="+collegeA);
  expect(hrefs(result)).toContain("/hr/drives/new?collegeId="+collegeB);
  expect(m.branches).not.toHaveBeenCalled();
 });
 it("a stale or cancelled request cannot be treated as a valid edit or sent-back revision",async()=>{
  m.requests.mockResolvedValue([{id:request,status:"CANCELLED",draft:{},updatedAt:new Date()}]);
  for(const action of ["edit","fix"] as const){
   const result=await page({collegeId:collegeA,[action]:request});
   expect(rendered(result)).toContain("We couldn't load that drive");
  }
  expect(m.requests).toHaveBeenCalledWith(expect.anything(),collegeA);
 });
 it("a valid new request remains scoped to its college and uses authorized branch suggestions",async()=>{
  const result=await page({collegeId:collegeA});
  expect(rendered(result)).toContain("Request a drive");
  expect(rendered(result)).toContain("Request is scoped to");
  expect(rendered(result)).toContain("College A");
  expect(hrefs(result)).toContain("/hr/drives?collegeId="+collegeA);
  expect(m.branches).toHaveBeenCalledWith(expect.anything(),collegeA);
  expect(m.requests).not.toHaveBeenCalled();
 });
});