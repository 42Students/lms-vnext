import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import type {ReactNode} from "react";
import MentorReportsPage from "@/app/(authenticated)/mentor/reports/page";

const state=vi.hoisted(()=>({
 calls:0,enabled:true,reject:false,items:[] as Array<{
  id:string;title:string;status:string;isPrimaryMentor:boolean;updatedAt:Date;attention:string[];
 }>,
 projectCount:0,exportOmitted:0,
}));
vi.mock("next/link",()=>({
 default:({href,children}:{href:string;children:ReactNode})=><a href={href}>{children}</a>,
}));
vi.mock("@/components/ui/page-header",()=>({
 PageHeader:({title,description,actions}:{title:string;description:string;actions:ReactNode})=>
  <header><h1>{title}</h1><p>{description}</p>{actions}</header>,
}));
vi.mock("@/components/ui/empty-state",()=>({
 EmptyState:({title,description}:{title:string;description:string})=>
  <section role="status"><h2>{title}</h2><p>{description}</p></section>,
}));
vi.mock("@/components/ui/button",()=>({
 Button:({children}:{children:ReactNode})=><button>{children}</button>,
}));
vi.mock("@/auth/request-context",()=>({
 getCurrentRequestContext:async()=>({user:{id:"mentor"}}),
}));
vi.mock("@/modules/projects/mentor-reports-service",()=>({
 getMentorReports:async(_:unknown,query:Record<string,unknown>)=>{
  state.calls++;
  if(state.reject)throw new Error("PROJECT_ACCESS_DENIED");
  return {enabled:state.enabled,query,projectCount:state.projectCount,
   primaryMentorCount:1,
   statusCounts:{PLANNED:0,ACTIVE:state.projectCount,COMPLETED:0,ARCHIVED:0},
   attentionCounts:{REVIEW:state.items.length,STALLED:0,REQUESTED:0,MEETING_SOON:0},
   total:state.items.length,page:1,pageSize:20,totalPages:1,items:state.items,
   exportItems:state.items,exportOmitted:state.exportOmitted};
 },
}));
const projectId="11111111-1111-4111-8111-111111111111";
const renderPage=async(raw:Record<string,string|string[]|undefined>={})=>
 renderToStaticMarkup(await MentorReportsPage({searchParams:Promise.resolve(raw)}));
beforeEach(()=>{
 state.calls=0;state.enabled=true;state.reject=false;state.items=[];
 state.projectCount=0;state.exportOmitted=0;
});

describe("PROJ-BREAK-MENTOR-64..69 rendered report page boundary and failure states",()=>{
 it("PROJ-BREAK-MENTOR-64 duplicated same-value search parameters are not silently collapsed",async()=>{
  for(const params of [{search:["Atlas","Other"]},{search:["Atlas","Atlas"]},
   {status:["ACTIVE","ACTIVE"]},{page:["1","2"]}]){
   const html=await renderPage(params);
   expect(html).toContain("Invalid Mentor report filters");
   expect(html).toContain("Clear filters");
   expect(html).toContain('role="alert"');
  }
  expect(state.calls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-65 invalid enum, forged status and excessive page reject before service",async()=>{
  for(const params of [{status:"OTHER"},{page:"10001"},{search:"x".repeat(121)}]){
   expect(await renderPage(params)).toContain("Invalid Mentor report filters");
  }
  expect(state.calls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-66 empty authorized report never invents success or learner outcome data",async()=>{
  const html=await renderPage({});
  expect(html).toContain("Assigned Project reports");
  expect(html).toContain("No assigned projects match");
  expect(html).toContain("No current Mentor assignments");
  expect(html).toContain("Report counts use registered current assignments");
  expect(html).toContain("Export filtered project report CSV (max 100)");
  expect(state.calls).toBe(1);
 });
 it("PROJ-BREAK-MENTOR-67 disabled project module shows plain access-denied state",async()=>{
  state.enabled=false;
  const html=await renderPage({});
  expect(html).toContain("Projects are disabled for this membership");
  expect(html).not.toContain("No assigned projects match");
  expect(html).not.toContain("Project record updated");
  expect(state.calls).toBe(1);
 });
 it("PROJ-BREAK-MENTOR-68 authorized partial data retains active scoped project navigation",async()=>{
  state.items=[{id:projectId,title:"Atlas",status:"ACTIVE",isPrimaryMentor:true,
   updatedAt:new Date("2026-10-18T10:00:00.000Z"),attention:["REVIEW"]}];
  state.projectCount=1;state.exportOmitted=5;
  const html=await renderPage({status:"ACTIVE"});
  expect(html).toContain("Atlas");
  expect(html).toContain("Primary Mentor");
  expect(html).toContain("Open project");
  expect(html).toContain("Risk / readiness");
  expect(html).toContain("CSV omits 5 matching assigned projects");
  expect(html).toContain("/mentor/projects/"+projectId);
  expect(html).toContain("IST");
 });
 it("PROJ-BREAK-MENTOR-69 server authorization failure does not turn into partial public report",async()=>{
  state.reject=true;
  await expect(renderPage({})).rejects.toThrow("PROJECT_ACCESS_DENIED");
  expect(state.calls).toBe(1);
 });
});
