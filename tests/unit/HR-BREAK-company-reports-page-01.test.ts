import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement,type ReactNode} from "react";
const mocks=vi.hoisted(()=>({
 context:vi.fn(),active:vi.fn(),read:vi.fn(),redirect:vi.fn(),
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/modules/identity/context",()=>({hasActiveRecruiter:mocks.active}));
vi.mock("@/modules/placements/recruiter-company-reports-service",()=>({
 getRecruiterCompanyReports:mocks.read,
}));
vi.mock("next/navigation",()=>({redirect:mocks.redirect}));
import RecruiterCompanyReportsPage from "@/app/(authenticated)/hr/company/reports/page";

function contents(node:ReactNode):string{
 if(Array.isArray(node))return node.map(contents).join(" ");
 if(typeof node==="string"||typeof node==="number")return String(node);
 if(!isValidElement(node))return "";
 const props=node.props as {children?:ReactNode;title?:unknown;description?:unknown};
 return [typeof props.title==="string"?props.title:"",
  typeof props.description==="string"?props.description:"",contents(props.children)].join(" ");
}
function urls(node:ReactNode):string[]{
 if(Array.isArray(node))return node.flatMap(urls);
 if(!isValidElement(node))return [];
 const props=node.props as {children?:ReactNode;href?:unknown;action?:ReactNode;actions?:ReactNode};
 return [...(typeof props.href==="string"?[props.href]:[]),...urls(props.children),...urls(props.action),...urls(props.actions)];
}
const read=(searchParams:Record<string,unknown>={})=>
 RecruiterCompanyReportsPage({searchParams:Promise.resolve(searchParams) as never});
const college="123e4567-e89b-42d3-a456-426614174001";

describe("HR-BREAK-company-reports-page-01: unauthorized, invalid, multiple college and retry",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  mocks.context.mockResolvedValue({user:{id:"hr-user"}});
  mocks.active.mockReturnValue(true);
  mocks.read.mockResolvedValue({status:"NO_ACCESS",choices:[]});
  mocks.redirect.mockImplementation(()=>{throw new Error("REDIRECT");});
 });
 it("inactive/wrong-role HR identity cannot run any company report query",async()=>{
  mocks.active.mockReturnValue(false);
  await expect(read()).rejects.toThrow("REDIRECT");
  expect(mocks.redirect).toHaveBeenCalledWith("/dashboard");
  expect(mocks.read).not.toHaveBeenCalled();
 });
 it("invalid college, stage or page params produce friendly reset without hitting service",async()=>{
  const invalids=[{collegeId:"../../../another-college"},{status:"PRIVATE"},
   {page:"-1"},{page:"bad"},{pageSize:"99999"}];
  for(const query of invalids){
   const page=await read(query);
   expect(contents(page)).toContain("Invalid report filters");
   expect(urls(page)).toContain("/hr/company/reports");
  }
  expect(mocks.read).not.toHaveBeenCalled();
 });
 it("no active grant shows denial rather than a cross-college aggregate",async()=>{
  const page=await read();
  expect(contents(page)).toContain("No active college access");
  expect(contents(page)).toContain("no active college relationship");
  expect(mocks.read).toHaveBeenCalledTimes(1);
 });
 it("multiple grants prompt explicit college selection; links contain only scoped IDs",async()=>{
  mocks.read.mockResolvedValue({status:"CHOOSE_COLLEGE",choices:[
   {id:"a",collegeId:college,collegeName:"College A"},
  ]});
  const page=await read();
  expect(contents(page)).toContain("Choose a college");
  expect(contents(page)).toContain("College A");
  expect(urls(page).some(url=>url.includes("collegeId="+college))).toBe(true);
  expect(urls(page).some(url=>url.includes("all-colleges"))).toBe(false);
 });
});