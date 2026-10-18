import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import type {ReactNode} from "react";
import MentorReviewHistoryPage from "@/app/(authenticated)/mentor/review-history/page";
import MentorSprintProgressPage from "@/app/(authenticated)/mentor/sprint-progress/page";
import MentorTaskReviewHistoryPage from "@/app/(authenticated)/mentor/task-review-history/page";
import MentorReviewCompletenessPage from "@/app/(authenticated)/mentor/projects/[projectId]/review-completeness/page";

const state=vi.hoisted(()=>({
 memberRole:true,denied:false,reviewCalls:0,sprintCalls:0,
 taskCalls:0,completenessCalls:0,
}));
const projectId="11111111-1111-4111-8111-111111111111";
vi.mock("next/link",()=>({
 default:({href,children}:{href:string;children:ReactNode})=><a href={href}>{children}</a>,
}));
vi.mock("next/navigation",()=>({redirect:(url:string)=>{throw new Error("REDIRECT:"+url);}}));
vi.mock("@/components/ui/page-header",()=>({
 PageHeader:({title,description,actions}:{title:string;description?:string;actions?:ReactNode})=>
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
 getCurrentRequestContext:async()=>({user:{id:"mentor",platformStatus:"ACTIVE"}}),
}));
vi.mock("@/modules/identity/context",()=>({
 hasMembershipRole:()=>state.memberRole,
}));
vi.mock("@/modules/projects/mentor-review-history-service",()=>({
 getMentorReviewHistory:async(_:unknown,query:Record<string,unknown>)=>{
  state.reviewCalls++;
  if(state.denied)throw new Error("PROJECT_ACCESS_DENIED");
  return {enabled:false,query,projects:[],total:0,page:1,pageSize:20,totalPages:1,items:[]};
 },
}));
vi.mock("@/modules/projects/mentor-sprint-progress-service",()=>({
 getMentorSprintProgress:async(_:unknown,query:Record<string,unknown>)=>{
  state.sprintCalls++;
  if(state.denied)throw new Error("PROJECT_ACCESS_DENIED");
  return {enabled:false,query,projects:[],total:0,page:1,pageSize:20,totalPages:1,items:[]};
 },
}));
vi.mock("@/modules/projects/mentor-task-history-service",()=>({
 getMentorTaskReviewHistory:async(_:unknown,query:Record<string,unknown>)=>{
  state.taskCalls++;
  if(state.denied)throw new Error("PROJECT_ACCESS_DENIED");
  return {enabled:false,query,total:0,page:1,pageSize:20,totalPages:1,items:[]};
 },
}));
vi.mock("@/modules/projects/mentor-review-completeness-service",()=>({
 getMentorProjectReviewCompleteness:async(_:unknown,query:Record<string,unknown>)=>{
  state.completenessCalls++;
  if(state.denied)throw new Error("PROJECT_ACCESS_DENIED");
  return {enabled:false,query,projectTitle:null,projectStatus:null,
   total:0,page:1,pageSize:20,totalPages:1,items:[]};
 },
}));
const renderReview=async(q:Record<string,string|string[]|undefined>={})=>
 renderToStaticMarkup(await MentorReviewHistoryPage({searchParams:Promise.resolve(q)}));
const renderSprint=async(q:Record<string,string|string[]|undefined>={})=>
 renderToStaticMarkup(await MentorSprintProgressPage({searchParams:Promise.resolve(q)}));
const renderTask=async(q:Record<string,string|string[]|undefined>={})=>
 renderToStaticMarkup(await MentorTaskReviewHistoryPage({searchParams:Promise.resolve(q)}));
const renderCompleteness=async(q:Record<string,string|string[]|undefined>={})=>
 renderToStaticMarkup(await MentorReviewCompletenessPage({
  params:Promise.resolve({projectId}),searchParams:Promise.resolve(q),
 }));
beforeEach(()=>{
 state.memberRole=true;state.denied=false;state.reviewCalls=0;
 state.sprintCalls=0;state.taskCalls=0;state.completenessCalls=0;
});
describe("Mentor history pages reject ambiguous filters before data access",()=>{
 it("PROJ-BREAK-MENTOR-261 review history rejects repeated and invalid filters",async()=>{
  for(const q of [
   {decision:["APPROVED","APPROVED"]},{projectId:[projectId,projectId]},
   {search:["Atlas","Other"]},{page:["1","2"]},{decision:"INVALID"},
  ]){
   const html=await renderReview(q);
   expect(html).toContain("Invalid review history filters");
   expect(html).toContain('role="alert"');
  }
  expect(state.reviewCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-262 sprint progress rejects duplicate and invalid selector",async()=>{
  for(const q of [
   {state:["ACTIVE","ACTIVE"]},{projectId:[projectId,projectId]},
   {search:["Atlas","Other"]},{page:["1","1"]},{page:"10001"},
  ]){
   const html=await renderSprint(q);
   expect(html).toContain("Invalid sprint progress filters");
   expect(html).toContain('role="alert"');
  }
  expect(state.sprintCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-263 task review history rejects ambiguous filters",async()=>{
  for(const q of [
   {decision:["ALL","ALL"]},{priority:["HIGH","LOW"]},
   {search:["A","B"]},{page:["1","2"]},{decision:"INVALID"},
  ]){
   const html=await renderTask(q);
   expect(html).toContain("Invalid review history filters");
   expect(html).toContain('role="alert"');
  }
  expect(state.taskCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-264 review completeness rejects duplicate page selectors",async()=>{
  const html=await renderCompleteness({page:["1","1"]});
  expect(html).toContain("Invalid review history selector");
  expect(html).toContain('role="alert"');
  expect(state.completenessCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-265 disabled pages render no private review, sprint or task history",async()=>{
  expect(await renderReview()).toContain("No review history was loaded");
  expect(await renderSprint()).toContain("Sprint progress was not loaded");
  expect(await renderTask()).toContain("Reviewed task history is unavailable");
  expect(await renderCompleteness()).toContain("Delivery history was not loaded");
  expect(state.reviewCalls).toBe(1);
  expect(state.sprintCalls).toBe(1);
  expect(state.taskCalls).toBe(1);
  expect(state.completenessCalls).toBe(1);
 });
 it("PROJ-BREAK-MENTOR-266 disabled Mentor role redirects before global history lookups",async()=>{
  state.memberRole=false;
  await expect(renderReview()).rejects.toThrow("REDIRECT:/dashboard");
  await expect(renderSprint()).rejects.toThrow("REDIRECT:/dashboard");
  await expect(renderTask()).rejects.toThrow("REDIRECT:/dashboard");
  expect(state.reviewCalls+state.sprintCalls+state.taskCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-267 permission errors never fall back to prior private cards",async()=>{
  state.denied=true;
  await expect(renderReview()).rejects.toThrow("PROJECT_ACCESS_DENIED");
  await expect(renderSprint()).rejects.toThrow("PROJECT_ACCESS_DENIED");
  await expect(renderTask()).rejects.toThrow("PROJECT_ACCESS_DENIED");
  await expect(renderCompleteness()).rejects.toThrow("PROJECT_ACCESS_DENIED");
 });
});
