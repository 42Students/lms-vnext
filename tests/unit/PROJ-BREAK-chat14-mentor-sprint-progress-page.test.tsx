import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import type {ReactNode} from "react";
import MentorSprintProgressPage from "@/app/(authenticated)/mentor/sprint-progress/page";
import SprintProgressLoading from "@/app/(authenticated)/mentor/sprint-progress/loading";
import SprintProgressError from "@/app/(authenticated)/mentor/sprint-progress/error";

const projectId="11111111-1111-4111-8111-111111111111";
const sprintId="22222222-2222-4222-8222-222222222222";
const state=vi.hoisted(()=>({
 role:true,enabled:true,reject:false,calls:0,total:0,
 items:[] as Array<{
  id:string;title:string;status:string;projectId:string;projectTitle:string;
  releaseTitle:string;releaseStatus:string;
  tasks:{total:number;completed:number;inReview:number;blocked:number;completionPercent:number|null};
 }>,
}));
vi.mock("next/link",()=>({
 default:({href,children}:{href:string;children:ReactNode})=><a href={href}>{children}</a>,
}));
vi.mock("next/navigation",()=>({redirect:(destination:string)=>{
 throw new Error("REDIRECT:"+destination);
}}));
vi.mock("@/components/ui/page-header",()=>({
 PageHeader:({title,actions}:{title:string;actions:ReactNode})=>
  <header><h1>{title}</h1>{actions}</header>,
}));
vi.mock("@/components/ui/empty-state",()=>({
 EmptyState:({title,description}:{title:string;description:string})=>
  <section role="status"><h2>{title}</h2><p>{description}</p></section>,
}));
vi.mock("@/components/ui/button",()=>({
 Button:({children}:{children:ReactNode})=><button>{children}</button>,
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:async()=>({
 user:{id:"mentor"},membership:{id:"member"},
})}));
vi.mock("@/modules/identity/context",()=>({
 hasMembershipRole:()=>state.role,
}));
vi.mock("@/modules/projects/mentor-sprint-progress-service",()=>({
 getMentorSprintProgress:async(_:unknown,query:Record<string,unknown>)=>{
  state.calls++;
  if(state.reject)throw new Error("PROJECT_ACCESS_DENIED");
  return {enabled:state.enabled,query,projects:state.enabled?[{
   id:projectId,title:"Assigned Project",
  }]:[],
   total:state.total,page:Number(query.page),pageSize:20,
   totalPages:Math.max(1,Math.ceil(state.total/20)),items:state.items};
 },
}));
const renderPage=async(raw:Record<string,string|string[]|undefined>={})=>
 renderToStaticMarkup(await MentorSprintProgressPage({searchParams:Promise.resolve(raw)}));
beforeEach(()=>{
 state.role=true;state.enabled=true;state.reject=false;state.calls=0;state.total=0;state.items=[];
});

describe("Mentor sprint progress role/page journey",()=>{
 it("PROJ-BREAK-MENTOR-365 repeated or forged filters deny before sprint service",async()=>{
  for(const raw of [{state:["ACTIVE","COMPLETED"]},{page:["1","1"]},
   {taskAttention:["BLOCKED","DONE"]},{order:["PROJECT","ACTIVE_FIRST"]},
   {projectId:["",projectId]}]){
   const html=await renderPage(raw);
   expect(html).toContain("Invalid sprint progress filters");
   expect(html).toContain('role="alert"');
   expect(html).toContain("Clear filters");
  }
  expect(state.calls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-366 invalid page and query values cannot reach backend",async()=>{
  for(const raw of [{state:"FORGED"},{page:"10001"},{page:"-1"},
   {release:"DELETED"},{taskAttention:"UNKNOWN"},{search:"x".repeat(121)},
   {projectId:"../../another-college"}]){
   const html=await renderPage(raw);
   expect(html).toContain("Invalid sprint progress filters");
  }
  expect(state.calls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-367 wrong role redirects before loading persisted sprint rows",async()=>{
  state.role=false;
  await expect(renderPage({state:"ACTIVE"})).rejects.toThrow("REDIRECT:/dashboard");
  expect(state.calls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-368 disabled Projects never shows stale sprint titles or exports",async()=>{
  state.enabled=false;
  state.items=[{id:sprintId,title:"PRIVATE SPRINT",projectId,projectTitle:"PRIVATE PROJECT",
   status:"ACTIVE",releaseTitle:"R1",releaseStatus:"IN_PROGRESS",
   tasks:{total:1,completed:1,inReview:0,blocked:0,completionPercent:100}}];
  const html=await renderPage({});
  expect(html).toContain("Projects access is disabled. Sprint progress was not loaded.");
  expect(html).not.toContain("PRIVATE SPRINT");
  expect(html).not.toContain("Export filtered sprint CSV");
 });
 it("PROJ-BREAK-MENTOR-369 authorized empty and partial states preserve counts and scoped links",async()=>{
  const empty=await renderPage({});
  expect(empty).toContain("No persisted sprint progress");
  expect(empty).toContain("No sprints matched the selected state");
  state.total=105;
  state.items=[{id:sprintId,title:"Iteration <script>",projectId,projectTitle:"Atlas",
   status:"ACTIVE",releaseTitle:"Release A",releaseStatus:"IN_PROGRESS",
   tasks:{total:4,completed:2,inReview:1,blocked:1,completionPercent:50}}];
  const html=await renderPage({state:"ACTIVE",page:"1"});
  expect(html).toContain("Iteration &lt;script&gt;");
  expect(html).not.toContain("<script>");
  expect(html).toContain("Completion: 50%");
  expect(html).toContain("Export omits 5 sprints beyond the 100-row cap");
  expect(html).toContain("/mentor/projects/"+projectId+"?tab=sprints");
  expect(html).toContain("Next");
  expect(html).toContain("state=ACTIVE");
  expect(html).toContain("Page 1 of 6");
 });
 it("PROJ-BREAK-MENTOR-370 revoked permission propagates without returning a partial project list",async()=>{
  state.reject=true;
  await expect(renderPage({})).rejects.toThrow("PROJECT_ACCESS_DENIED");
  expect(state.calls).toBe(1);
 });
 it("PROJ-BREAK-MENTOR-371 loading state is busy, labeled and does not reveal private projects",()=>{
  const html=renderToStaticMarkup(<SprintProgressLoading />);
  expect(html).toContain('aria-busy="true"');
  expect(html).toContain("Loading Mentor sprint progress");
  expect(html).not.toContain(projectId);
 });
 it("PROJ-BREAK-MENTOR-372 error state gives a retry without exposing SQL or exception details",()=>{
  const html=renderToStaticMarkup(<SprintProgressError
   error={new Error("SQLSTATE 23505: PRIVATE_TENANT_RECORD")}
   reset={()=>{}} />);
  expect(html).toContain('role="alert"');
  expect(html).toContain("Unable to load Mentor sprint progress");
  expect(html).toContain("Retry");
  expect(html).not.toContain("SQLSTATE");
  expect(html).not.toContain("PRIVATE_TENANT_RECORD");
 });

});
