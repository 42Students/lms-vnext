import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import type {ReactNode} from "react";
import MentorTeamCoveragePage from "@/app/(authenticated)/mentor/team-coverage/page";

const state=vi.hoisted(()=>({
 role:true,enabled:true,reject:false,calls:0,projectCount:0,
 items:[] as Array<{projectId:string;title:string;status:string;learners:number;mentors:number;hasPrimaryMentor:boolean}>,
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
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:async()=>({user:{id:"mentor"}})}));
vi.mock("@/modules/identity/context",()=>({hasMembershipRole:()=>state.role}));
vi.mock("@/modules/projects/mentor-team-coverage-service",()=>({
 getMentorTeamCoverage:async(_:unknown,query:Record<string,unknown>)=>{
  state.calls++;
  if(state.reject)throw new Error("PROJECT_ACCESS_DENIED");
  return {enabled:state.enabled,query,projectCount:state.projectCount,
   summary:{zeroLearnerProjects:0,withoutPrimaryMentor:0},
   total:state.items.length,page:1,pageSize:20,totalPages:1,items:state.items};
 },
}));

const projectId="11111111-1111-4111-8111-111111111111";
const renderPage=async(raw:Record<string,string|string[]|undefined>={})=>
 renderToStaticMarkup(await MentorTeamCoveragePage({searchParams:Promise.resolve(raw)}));
beforeEach(()=>{state.role=true;state.enabled=true;state.reject=false;state.calls=0;state.projectCount=0;state.items=[];});

describe("PROJ-BREAK-MENTOR-70..75 rendered team coverage boundary and permission matrix",()=>{
 it("PROJ-BREAK-MENTOR-70 duplicated filters never reach team service",async()=>{
  for(const raw of [{filter:["ALL","ALL"]},{search:["name","name"]},
   {status:["ACTIVE","COMPLETED"]},{page:["1","2"]}]){
   const html=await renderPage(raw);
   expect(html).toContain('role="alert"');
   expect(html).toContain("Invalid team coverage filters");
  }
  expect(state.calls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-71 invalid search and page values receive recovery, no raw error",async()=>{
  for(const raw of [{filter:"ROOT"},{page:"-1"},{search:"x".repeat(121)}]){
   const html=await renderPage(raw);
   expect(html).toContain("Clear filters");
   expect(html).toContain("Invalid team coverage filters");
  }
  expect(state.calls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-72 wrong role redirects before querying any team",async()=>{
  state.role=false;
  await expect(renderPage({})).rejects.toThrow("REDIRECT:/dashboard");
  expect(state.calls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-73 disabled module never renders stale project people data",async()=>{
  state.enabled=false;
  const html=await renderPage({});
  expect(html).toContain("Projects access is disabled for this membership");
  expect(html).not.toContain("Active learners");
  expect(state.calls).toBe(1);
 });
 it("PROJ-BREAK-MENTOR-74 authorized empty and populated rosters distinguish real evidence",async()=>{
  const empty=await renderPage({});
  expect(empty).toContain("No currently assigned active projects");
  expect(empty).toContain("No historical team");
  state.items=[{projectId,title:"Atlas",status:"ACTIVE",learners:5,mentors:2,hasPrimaryMentor:false}];
  state.projectCount=1;
  const html=await renderPage({status:"ACTIVE"});
  expect(html).toContain("Atlas");
  expect(html).toContain("Active learners");
  expect(html).toContain("Not recorded");
  expect(html).toContain("Membership history");
  expect(html).toContain("Team meeting log");
  expect(html).toContain("/mentor/projects/"+projectId);
  expect(html).not.toContain("learnerEmail");
 });
 it("PROJ-BREAK-MENTOR-75 expired-session service denial never renders previous details",async()=>{
  state.reject=true;
  await expect(renderPage({})).rejects.toThrow("PROJECT_ACCESS_DENIED");
  expect(state.calls).toBe(1);
 });
});
