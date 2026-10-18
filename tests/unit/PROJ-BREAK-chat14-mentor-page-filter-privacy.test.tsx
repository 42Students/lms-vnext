import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import type {ReactNode} from "react";
import MentorBoardReviewPage from "@/app/(authenticated)/mentor/projects/[projectId]/board-review/page";
import MentorProjectTimelinePage from "@/app/(authenticated)/mentor/projects/[projectId]/timeline/page";
import MentorTeamHistoryPage from "@/app/(authenticated)/mentor/projects/[projectId]/team-history/page";

const state=vi.hoisted(()=>({board:0,timeline:0,history:0}));
vi.mock("next/link",()=>({
 default:({href,children}:{href:string;children:ReactNode})=><a href={href}>{children}</a>,
}));
vi.mock("@/components/ui/button",()=>({
 Button:({children}:{children:ReactNode})=><button>{children}</button>,
}));
vi.mock("@/components/ui/page-header",()=>({
 PageHeader:({title,description,actions}:{title:string;description:string;actions?:ReactNode})=>
  <header><h1>{title}</h1><p>{description}</p>{actions}</header>,
}));
vi.mock("@/components/ui/empty-state",()=>({
 EmptyState:({title}:{title:string})=><section>{title}</section>,
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:async()=>({user:{id:"mentor"}})}));
vi.mock("@/modules/projects/mentor-board-review-service",()=>({
 getMentorBoardReview:async()=>{
  state.board++;
  return {enabled:false,projectTitle:"SECRET_PROJECT_NAME",items:[]};
 },
}));
vi.mock("@/modules/projects/mentor-project-timeline-service",()=>({
 getMentorProjectTimeline:async()=>{
  state.timeline++;
  return {enabled:false,projectTitle:"SECRET_PROJECT_NAME",projectStatus:"ACTIVE",items:[]};
 },
}));
vi.mock("@/modules/projects/mentor-team-history-service",()=>({
 getMentorTeamHistory:async()=>{
  state.history++;
  return {enabled:false,title:"SECRET_PROJECT_NAME",items:[]};
 },
}));
const projectId="11111111-1111-4111-8111-111111111111";
type QueryField=string|string[]|undefined;
type BoardFilters={status?:QueryField;priority?:QueryField;sprintId?:QueryField;
 search?:QueryField;page?:QueryField};
type TimelineFilters={releaseStatus?:QueryField;sprintStatus?:QueryField;page?:QueryField};
type TeamFilters={view?:QueryField;role?:QueryField;primary?:QueryField;order?:QueryField;page?:QueryField};
const renderBoard=async(query:BoardFilters)=>renderToStaticMarkup(
 await MentorBoardReviewPage({params:Promise.resolve({projectId}),searchParams:Promise.resolve(query)}));
const renderTimeline=async(query:TimelineFilters)=>renderToStaticMarkup(
 await MentorProjectTimelinePage({params:Promise.resolve({projectId}),searchParams:Promise.resolve(query)}));
const renderTeam=async(query:TeamFilters)=>renderToStaticMarkup(
 await MentorTeamHistoryPage({params:Promise.resolve({projectId}),searchParams:Promise.resolve(query)}));
beforeEach(()=>{state.board=0;state.timeline=0;state.history=0;});

describe("PROJ-BREAK-MENTOR-192..194 server-rendered project filters and disabled headings",()=>{
 it("PROJ-BREAK-MENTOR-192 repeated filter values reject before resolving any private service",async()=>{
  const a=await renderBoard({sprintId:["ALL",projectId]});
  const b=await renderTimeline({releaseStatus:["PLANNED","SHIPPED"]});
  const c=await renderTeam({role:["LEARNER","MENTOR"]});
  expect(a).toContain("Invalid board filters");
  expect(b).toContain("Invalid timeline selector");
  expect(c).toContain("Invalid team history filters");
  expect(state.board+state.timeline+state.history).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-193 forged project selectors fail closed without service access",async()=>{
  const a=renderToStaticMarkup(await MentorBoardReviewPage({
   params:Promise.resolve({projectId:"../../foreign"}),searchParams:Promise.resolve({}),
  }));
  const b=renderToStaticMarkup(await MentorProjectTimelinePage({
   params:Promise.resolve({projectId:"not-a-uuid"}),searchParams:Promise.resolve({}),
  }));
  const c=renderToStaticMarkup(await MentorTeamHistoryPage({
   params:Promise.resolve({projectId:"foreign"}),searchParams:Promise.resolve({}),
  }));
  expect(a).toContain("Invalid board filters");
  expect(b).toContain("Invalid timeline selector");
  expect(c).toContain("Invalid team history filters");
  expect(state.board+state.timeline+state.history).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-194 disabled headings never display stale project names or statuses",async()=>{
  const a=await renderBoard({});
  const b=await renderTimeline({});
  const c=await renderTeam({});
  expect(a).toContain("Projects access is disabled; no tasks were loaded.");
  expect(b).toContain("Projects access is disabled; no timeline was loaded.");
  expect(c).toContain("Projects access is disabled. Team history cannot be displayed.");
  for(const html of [a,b,c]){
   expect(html).not.toContain("SECRET_PROJECT_NAME");
   expect(html).not.toContain("ACTIVE");
  }
  expect([state.board,state.timeline,state.history]).toEqual([1,1,1]);
 });
});
