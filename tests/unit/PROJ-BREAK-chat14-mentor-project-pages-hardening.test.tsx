import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import type {ReactNode} from "react";
import ReviewPage from "@/app/(authenticated)/mentor/projects/[projectId]/review-overview/page";
import RiskPage from "@/app/(authenticated)/mentor/projects/[projectId]/risk-readiness/page";
import ResourcePage from "@/app/(authenticated)/mentor/projects/[projectId]/resources-directory/page";
import CloseoutPage from "@/app/(authenticated)/mentor/projects/[projectId]/closeout/page";

const state=vi.hoisted(()=>({
 reviewCalls:0,riskCalls:0,resourceCalls:0,closeoutCalls:0,
 reject:false,resourcesEnabled:false,riskEnabled:false,complete:false,
}));
const projectId="11111111-1111-4111-8111-111111111111";
const context={user:{id:"mentor",platformStatus:"ACTIVE"}};
vi.mock("next/link",()=>({
 default:({href,children}:{href:string;children:ReactNode})=><a href={href}>{children}</a>,
}));
vi.mock("@/components/ui/button",()=>({
 Button:({children}:{children:ReactNode})=><button>{children}</button>,
}));
vi.mock("@/components/ui/page-header",()=>({
 PageHeader:({title,description,actions}:{title:string;description?:string;actions?:ReactNode})=>
  <header><h1>{title}</h1><p>{description}</p>{actions}</header>,
}));
vi.mock("@/components/ui/empty-state",()=>({
 EmptyState:({title,description}:{title:string;description:string})=>
  <section role="status"><h2>{title}</h2><p>{description}</p></section>,
}));
vi.mock("@/components/projects/mentor-project-closeout-control",()=>({
 MentorProjectCloseoutControl:()=> <button>Complete project now</button>,
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:async()=>context}));
vi.mock("@/modules/projects/mentor-review-overview-service",()=>({
 getMentorDeliveryReviewOverview:async(_:unknown,query:Record<string,unknown>)=>{
  state.reviewCalls++;
  if(state.reject)throw new Error("PROJECT_ACCESS_DENIED");
  return {query,project:{title:"Atlas",status:"ACTIVE"},
   total:0,page:1,totalPages:1,counts:{reviewed:0,withFeedback:0},items:[]};
 },
}));
vi.mock("@/modules/projects/mentor-risk-readiness-service",()=>({
 getMentorRiskReadiness:async(_:unknown,query:Record<string,unknown>)=>{
  state.riskCalls++;
  if(state.reject)throw new Error("PROJECT_ACCESS_DENIED");
  return {enabled:state.riskEnabled,query,projectTitle:"Atlas",projectStatus:"ACTIVE",
   counts:{blockedTasks:0,reviewTasks:0,pendingMeetings:0,scheduledPastDay:0,incompleteTasks:0},
   riskCount:0,readinessGapCount:0,total:0,page:1,totalPages:1,items:[]};
 },
}));
vi.mock("@/modules/projects/mentor-resource-directory-service",()=>({
 getMentorResourceDirectory:async(_:unknown,query:Record<string,unknown>)=>{
  state.resourceCalls++;
  if(state.reject)throw new Error("PROJECT_ACCESS_DENIED");
  return {enabled:state.resourcesEnabled,query,projectTitle:state.resourcesEnabled?"Atlas":"",
   registered:0,requiredCount:0,linkableCount:0,exportOmitted:0,
   total:0,page:1,totalPages:1,items:[]};
 },
}));
vi.mock("@/modules/projects/mentor-closeout-service",()=>({
 getMentorProjectCloseout:async()=>{
  state.closeoutCalls++;
  if(state.reject)throw new Error("PROJECT_ACCESS_DENIED");
  return {id:projectId,title:"Atlas",status:"ACTIVE",
   expectedUpdatedAt:"2099-01-01T00:00:00.000Z",
   checklist:{approvedDelivery:state.complete,tasksDone:state.complete,
    sprintsComplete:state.complete,releasesShipped:state.complete,
    canComplete:state.complete}};
 },
}));
const params=Promise.resolve({projectId});
const renderReview=async(raw:Record<string,string|string[]|undefined>={})=>
 renderToStaticMarkup(await ReviewPage({params,searchParams:Promise.resolve(raw)}));
const renderRisk=async(raw:Record<string,string|string[]|undefined>={})=>
 renderToStaticMarkup(await RiskPage({params,searchParams:Promise.resolve(raw)}));
const renderResource=async(raw:Record<string,string|string[]|undefined>={})=>
 renderToStaticMarkup(await ResourcePage({params,searchParams:Promise.resolve(raw)}));
const renderCloseout=async()=>renderToStaticMarkup(await CloseoutPage({params}));
beforeEach(()=>{
 state.reviewCalls=0;state.riskCalls=0;state.resourceCalls=0;state.closeoutCalls=0;
 state.reject=false;state.resourcesEnabled=false;state.riskEnabled=false;state.complete=false;
});
describe("Mentor project page-level failure and permission boundaries",()=>{
 it("PROJ-BREAK-MENTOR-243 duplicated review filters never reach data service",async()=>{
  for(const raw of [{status:["APPROVED","DRAFT"]},{status:["ALL","ALL"]},
   {version:["1","1"]},{page:["1","2"]},{feedback:["WITH","WITHOUT"]}]){
   const html=await renderReview(raw);
   expect(html).toContain("Invalid project review filters");
   expect(html).toContain('role="alert"');
  }
  expect(state.reviewCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-244 duplicate and invalid risk filters deny before private reads",async()=>{
  for(const raw of [{focus:["ALL","RISK"]},{taskPriority:["HIGH","HIGH"]},
   {page:["1","1"]},{focus:"UNKNOWN"},{page:"10001"}]){
   const html=await renderRisk(raw);
   expect(html).toContain("Invalid risk/readiness filters");
   expect(html).toContain('role="alert"');
  }
  expect(state.riskCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-245 resource page rejects repeated and invalid links without query",async()=>{
  for(const raw of [{required:["ALL","REQUIRED"]},{link:"HTTP"},
   {page:"10001"},{search:"x".repeat(101)}]){
   const html=await renderResource(raw);
   expect(html).toContain("Invalid resource filters");
  }
  expect(state.resourceCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-246 disabled resources and risk pages show no fabricated private evidence",async()=>{
  const resource=await renderResource();
  const risk=await renderRisk();
  expect(resource).toContain("Projects access is disabled; resource metadata was not loaded");
  expect(resource).not.toContain("No matching resources");
  expect(risk).toContain("Projects are disabled. No private task, meeting or delivery evidence was loaded.");
  expect(risk).not.toContain("No recorded items for this filter");
  expect(state.resourceCalls).toBe(1);
  expect(state.riskCalls).toBe(1);
 });
 it("PROJ-BREAK-MENTOR-247 closeout page hides destructive control until persisted prerequisites pass",async()=>{
  let html=await renderCloseout();
  expect(html).toContain("Persisted completion checklist");
  expect(html).toContain("Not satisfied");
  expect(html).not.toContain("Complete project now");
  state.complete=true;
  html=await renderCloseout();
  expect(html).toContain("Recorded");
  expect(html).toContain("Complete project now");
  expect(state.closeoutCalls).toBe(2);
 });
 it("PROJ-BREAK-MENTOR-248 denied pages propagate rather than rendering prior private data",async()=>{
  state.reject=true;
  await expect(renderReview()).rejects.toThrow("PROJECT_ACCESS_DENIED");
  await expect(renderRisk()).rejects.toThrow("PROJECT_ACCESS_DENIED");
  await expect(renderResource()).rejects.toThrow("PROJECT_ACCESS_DENIED");
  await expect(renderCloseout()).rejects.toThrow("PROJECT_ACCESS_DENIED");
 });
 it("PROJ-BREAK-MENTOR-249 authorized empty review does not invent approved delivery",async()=>{
  const html=await renderReview();
  expect(html).toContain("Delivery review overview");
  expect(html).toContain("No registered final delivery");
  expect(html).toContain("0 reviewed versions");
  expect(html).not.toContain("Approved — feedback recorded");
  expect(html).toContain("/mentor/projects/"+projectId);
  expect(state.reviewCalls).toBe(1);
 });
});
