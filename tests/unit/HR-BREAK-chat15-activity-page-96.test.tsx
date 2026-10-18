import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement,type ReactNode} from "react";
const m=vi.hoisted(()=>({ctx:vi.fn(),redirect:vi.fn(),list:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.ctx}));
vi.mock("next/navigation",()=>({redirect:m.redirect}));
vi.mock("@/modules/placements/hr-job-activity-service",()=>({listRecruiterJobActivity:m.list}));
import HrJobActivityPage from "@/app/(authenticated)/hr/activity/page";

const collegeId="123e4567-e89b-42d3-a456-426614174001";
const actor={user:{id:"recruiter",platformStatus:"ACTIVE",systemRoles:[]},
 recruiter:{userId:"recruiter",status:"ACTIVE",companyId:"employer",grants:[
  {id:"grant",collegeId,collegeName:"College",companyRelationshipId:"relationship"},
 ]}};
const view=(search:Record<string,string|string[]|undefined>={})=>
 HrJobActivityPage({searchParams:Promise.resolve(search)});
function text(node:ReactNode):string{
 if(Array.isArray(node))return node.map(text).join(" ");
 if(typeof node==="string"||typeof node==="number")return String(node);
 if(!isValidElement(node))return "";
 const p=node.props as {title?:string;description?:string;children?:ReactNode};
 return [p.title??"",p.description??"",text(p.children)].join(" ");
}
function links(node:ReactNode):string[]{
 if(Array.isArray(node))return node.flatMap(links);
 if(!isValidElement(node))return [];
 const p=node.props as {href?:string;children?:ReactNode};
 return [...(p.href?[p.href]:[]),...links(p.children)];
}
describe("HR-ACTIVITY-PAGE-96 recruiter history role and state coverage",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  m.ctx.mockResolvedValue(actor);m.redirect.mockImplementation(()=>{throw Error("REDIRECT");});
  m.list.mockResolvedValue({status:"READY",choices:actor.recruiter.grants,
   collegeId,events:[],page:1,hasNext:false});
 });
 it("rejects disabled and swapped recruiter sessions before scoped service reads",async()=>{
  for(const context of [
   {...actor,user:{...actor.user,platformStatus:"DISABLED"}},
   {...actor,recruiter:{...actor.recruiter,userId:"other"}},
  ]){
   m.ctx.mockResolvedValueOnce(context);
   await expect(view()).rejects.toThrow("REDIRECT");
  }
  expect(m.list).not.toHaveBeenCalled();
 });
 it("bad duplicate filters and unsupported kinds fail with a retry link and no SQL",async()=>{
  for(const query of [{collegeId:[collegeId,collegeId]},{kind:"PRIVATE"},{page:"-2"}]){
   const output=await view(query);
   expect(text(output)).toContain("Invalid activity filters.");
   expect(links(output)).toContain("/hr/activity");
  }
  expect(m.list).not.toHaveBeenCalled();
 });
 it("an employer without grants receives college-access recovery, not job history",async()=>{
  m.list.mockResolvedValue({status:"NO_ACCESS",choices:[],events:[]});
  const result=await view();
  expect(text(result)).toContain("No active college access.");
  expect(links(result).some(x=>x.startsWith("/hr/placements/jobs/"))).toBe(false);
 });
 it("authorized empty state advertises a read-only history rather than inventing activity",async()=>{
  const result=await view({kind:"PUBLISHED",q:"Engineer"});
  expect(text(result)).toContain("No visible publication or closure activity");
  expect(text(result)).toContain("Read-only hiring history");
  expect(m.list).toHaveBeenCalledWith(actor,expect.objectContaining({kind:"PUBLISHED",q:"Engineer"}));
 });
 it("persisted employer event is linked to its own authorized hiring drive",async()=>{
  m.list.mockResolvedValue({status:"READY",choices:actor.recruiter.grants,
   collegeId,events:[{id:"event",jobId:"job-owned",title:"Engineer",
    status:"Published",occurredAt:new Date("2099-02-01T00:00:00Z")}],
   page:1,hasNext:false});
  const result=await view();
  expect(text(result)).toContain("Published");
  expect(links(result)).toContain("/hr/placements/jobs/job-owned");
 });
});