import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import type {ReactNode} from "react";
import MentorReviewsPage from "@/app/(authenticated)/mentor/reviews/page";
import MentorTaskReviewsPage from "@/app/(authenticated)/mentor/task-reviews/page";

const state=vi.hoisted(()=>({
 role:true,enabled:true,reject:false,reviewCalls:0,taskCalls:0,
 reviewItems:[] as Array<{key:string;projectId:string;title:string;description:string;href:string;occurredAt:string}>,
 taskItems:[] as Array<{id:string;projectId:string;taskId:string;projectTitle:string;taskTitle:string;priority:string;version:number;submittedAt:Date}>,
}));
vi.mock("next/link",()=>({
 default:({href,children}:{href:string;children:ReactNode})=><a href={href}>{children}</a>,
}));
vi.mock("next/navigation",()=>({redirect:(href:string)=>{throw new Error("REDIRECT:"+href);}}));
vi.mock("@/components/ui/button",()=>({Button:({children}:{children:ReactNode})=><button>{children}</button>}));
vi.mock("@/components/ui/page-header",()=>({
 PageHeader:({title,actions}:{title:string;actions:ReactNode})=><header><h1>{title}</h1>{actions}</header>,
}));
vi.mock("@/components/ui/empty-state",()=>({
 EmptyState:({title,description}:{title:string;description:string})=>
  <section role="status"><h2>{title}</h2><p>{description}</p></section>,
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:async()=>({user:{id:"mentor"}})}));
vi.mock("@/modules/identity/context",()=>({hasMembershipRole:()=>state.role}));
vi.mock("@/modules/projects/mentor-portfolio-service",()=>({
 getMentorReviewQueue:async(_:unknown,query:Record<string,unknown>)=>{
  state.reviewCalls++;
  if(state.reject)throw new Error("PROJECT_ACCESS_DENIED");
  return {enabled:state.enabled,query,projects:[{id:"11111111-1111-4111-8111-111111111111",title:"Atlas"}],
   items:state.reviewItems,total:state.reviewItems.length,page:1,
   pageSize:20,totalPages:1};
 },
}));
vi.mock("@/modules/projects/mentor-task-review-service",()=>({
 getMentorTaskReviews:async(_:unknown,query:Record<string,unknown>)=>{
  state.taskCalls++;
  if(state.reject)throw new Error("PROJECT_ACCESS_DENIED");
  return {enabled:state.enabled,query,projects:[{id:"11111111-1111-4111-8111-111111111111",title:"Atlas"}],
   items:state.taskItems,total:state.taskItems.length,page:1,
   pageSize:20,totalPages:1,first:state.taskItems.length?1:0,last:state.taskItems.length};
 },
}));
const projectId="11111111-1111-4111-8111-111111111111";
const taskId="22222222-2222-4222-8222-222222222222";
const renderReviews=async(raw:Record<string,string|string[]|undefined>={})=>
 renderToStaticMarkup(await MentorReviewsPage({searchParams:Promise.resolve(raw)}));
const renderTasks=async(raw:Record<string,string|string[]|undefined>={})=>
 renderToStaticMarkup(await MentorTaskReviewsPage({searchParams:Promise.resolve(raw)}));
beforeEach(()=>{state.role=true;state.enabled=true;state.reject=false;state.reviewCalls=0;state.taskCalls=0;state.reviewItems=[];state.taskItems=[];});

describe("PROJ-BREAK-MENTOR-83..90 rendered review inbox parity and role journeys",()=>{
 it("PROJ-BREAK-MENTOR-83 invalid and duplicated filters do not query services",async()=>{
  for(const raw of [{page:["1","2"]},{assignment:["ALL","PRIMARY"]},
   {search:["abc","def"]},{projectId:"../other"}]){
   const r=await renderReviews(raw);
   const t=await renderTasks(raw);
   expect(r).toContain("Invalid review filters");
   expect(t).toContain("Invalid task review filters");
  }
  expect(state.reviewCalls).toBe(0);
  expect(state.taskCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-84 wrong role redirects both inbox pages before any data request",async()=>{
  state.role=false;
  await expect(renderReviews()).rejects.toThrow("REDIRECT:/dashboard");
  await expect(renderTasks()).rejects.toThrow("REDIRECT:/dashboard");
  expect(state.reviewCalls).toBe(0);
  expect(state.taskCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-85 disabled modules render no stale review data",async()=>{
  state.enabled=false;
  const r=await renderReviews(),t=await renderTasks();
  expect(r).toContain("Projects access is disabled");
  expect(t).toContain("Projects access is disabled for this membership");
  expect(r).not.toContain("Open delivery review");
  expect(t).not.toContain("Open exact task review");
 });
 it("PROJ-BREAK-MENTOR-86 empty queues do not invent pending work",async()=>{
  const r=await renderReviews(),t=await renderTasks();
  expect(r).toContain("No deliveries awaiting review");
  expect(t).toContain("No pending task reviews");
  expect(r).toContain("No submitted delivery needs review");
  expect(t).toContain("No submitted tasks currently need review");
  expect(r).toContain("Export filtered delivery review metadata CSV (max 200)");
  expect(t).toContain("Export pending task review metadata CSV (max 200)");
 });
 it("PROJ-BREAK-MENTOR-87 registered final review renders exact Mentor navigation",async()=>{
  state.reviewItems=[{key:"final",projectId,title:"Review",description:"Atlas awaits review",
   href:"/mentor/projects/"+projectId+"?tab=delivery",occurredAt:"2026-10-18T10:00:00Z"}];
  const r=await renderReviews({assignment:"PRIMARY"});
  expect(r).toContain("Atlas awaits review");
  expect(r).toContain("Open delivery review");
  expect(r).toContain("/mentor/projects/"+projectId+"?tab=delivery");
  expect(r).toContain("Submitted:");
  expect(r).toContain("IST");
 });
 it("PROJ-BREAK-MENTOR-88 pending task review renders only exact task URL",async()=>{
  state.taskItems=[{id:"submission",projectId,taskId,projectTitle:"Atlas",taskTitle:"Test writeup",
   version:3,priority:"HIGH",submittedAt:new Date("2026-10-18T10:00:00Z")}];
  const t=await renderTasks({priority:"HIGH"});
  expect(t).toContain("Test writeup");
  expect(t).toContain("Version 3");
  expect(t).toContain("Priority HIGH");
  expect(t).toContain("/mentor/projects/"+projectId+"?tab=board#mentor-task-"+taskId);
  expect(t).toContain("Open exact task review");
  expect(t).not.toContain("learner_email");
 });
 it("PROJ-BREAK-MENTOR-89 malformed task version and priority fail before any data service",async()=>{
  for(const raw of [{version:"-1"},{version:"100001"},{priority:"UNTRUSTED"}]){
   expect(await renderTasks(raw)).toContain("Invalid task review filters");
  }
  expect(state.taskCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-90 session denial propagates without leaking prior private review cards",async()=>{
  state.reject=true;
  await expect(renderReviews()).rejects.toThrow("PROJECT_ACCESS_DENIED");
  await expect(renderTasks()).rejects.toThrow("PROJECT_ACCESS_DENIED");
 });
});
