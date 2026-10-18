import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import type {ReactNode} from "react";
import BoardPage from "@/app/(authenticated)/mentor/projects/[projectId]/board-review/page";
import TeamHistoryPage from "@/app/(authenticated)/mentor/projects/[projectId]/team-history/page";
import TeamMeetingsPage from "@/app/(authenticated)/mentor/projects/[projectId]/team-meetings/page";
import TimelinePage from "@/app/(authenticated)/mentor/projects/[projectId]/timeline/page";
import ActivityPage from "@/app/(authenticated)/mentor/projects/[projectId]/activity-history/page";

const state=vi.hoisted(()=>({
 reject:false,board:0,history:0,meetings:0,timeline:0,activity:0,
}));
const projectId="11111111-1111-4111-8111-111111111111";
vi.mock("next/link",()=>({
 default:({href,children}:{href:string;children:ReactNode})=><a href={href}>{children}</a>,
}));
vi.mock("@/components/ui/page-header",()=>({
 PageHeader:({title,description,actions}:{title:string;description?:string;actions?:ReactNode})=>
  <header><h1>{title}</h1><p>{description}</p>{actions}</header>,
}));
vi.mock("@/components/ui/empty-state",()=>({
 EmptyState:({title,description}:{title:string;description:string})=>
  <section role="status"><h2>{title}</h2><p>{description}</p></section>,
}));
vi.mock("@/components/ui/button",()=>({Button:({children}:{children:ReactNode})=><button>{children}</button>}));
vi.mock("@/components/projects/mentor-meeting-reschedule",()=>({
 MentorMeetingReschedule:()=>null,
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:async()=>({user:{id:"mentor"}})}));
vi.mock("@/modules/projects/mentor-board-review-service",()=>({
 getMentorBoardReview:async(_:unknown,query:unknown)=>{
  state.board++;if(state.reject)throw new Error("PROJECT_ACCESS_DENIED");
  return {enabled:false,query,projectTitle:""};
 },
}));
vi.mock("@/modules/projects/mentor-team-history-service",()=>({
 getMentorTeamHistory:async(_:unknown,query:unknown)=>{
  state.history++;if(state.reject)throw new Error("PROJECT_ACCESS_DENIED");
  return {enabled:false,query,title:""};
 },
}));
vi.mock("@/modules/projects/mentor-team-meetings-service",()=>({
 getMentorTeamMeetings:async(_:unknown,query:unknown)=>{
  state.meetings++;if(state.reject)throw new Error("PROJECT_ACCESS_DENIED");
  return {enabled:false,query,projectTitle:""};
 },
}));
vi.mock("@/modules/projects/mentor-project-timeline-service",()=>({
 getMentorProjectTimeline:async(_:unknown,query:unknown)=>{
  state.timeline++;if(state.reject)throw new Error("PROJECT_ACCESS_DENIED");
  return {enabled:false,query,projectTitle:""};
 },
}));
vi.mock("@/modules/projects/mentor-project-activity-service",()=>({
 getMentorProjectActivityHistory:async(_:unknown,query:unknown)=>{
  state.activity++;if(state.reject)throw new Error("PROJECT_ACCESS_DENIED");
  return {enabled:false,query,title:"",items:[],page:1,total:0,totalPages:1};
 },
}));
const params=Promise.resolve({projectId});
type Filters=Record<string,string|string[]|undefined>;
const cases=[
 {id:"285",title:"board",invalid:{status:["ALL","ALL"]},alert:"Invalid board filters",
  disabled:"Projects access is disabled; no tasks were loaded.",
  fn:BoardPage,calls:()=>state.board},
 {id:"286",title:"team history",invalid:{view:["ALL","ALL"]},alert:"Invalid team history filters",
  disabled:"Projects access is disabled. Team history cannot be displayed.",
  fn:TeamHistoryPage,calls:()=>state.history},
 {id:"287",title:"team meetings",invalid:{status:["ALL","ALL"]},alert:"Invalid meeting history filters",
  disabled:"Projects access is disabled. No private team or meeting data was loaded.",
  fn:TeamMeetingsPage,calls:()=>state.meetings},
 {id:"288",title:"timeline",invalid:{releaseStatus:["ALL","ALL"]},alert:"Invalid timeline selector",
  disabled:"Projects access is disabled; no timeline was loaded.",
  fn:TimelinePage,calls:()=>state.timeline},
 {id:"289",title:"activity",invalid:{importance:["HIGH","HIGH"]},alert:"Invalid activity filters",
  disabled:"Projects access is disabled. No private project activity was loaded.",
  fn:ActivityPage,calls:()=>state.activity},
];
const render=async(page:typeof cases[number],query:Filters={})=>
 renderToStaticMarkup(await page.fn({params,searchParams:Promise.resolve(query)}));
beforeEach(()=>{
 state.reject=false;state.board=0;state.history=0;state.meetings=0;
 state.timeline=0;state.activity=0;
});
describe("IIT Dharwad Mentor drill-in page role and invalid-filter states",()=>{
 for(const testCase of cases){
  it("PROJ-BREAK-MENTOR-"+testCase.id+" "+testCase.title+" never collapses duplicated filters",async()=>{
   const html=await render(testCase,testCase.invalid);
   expect(html).toContain(testCase.alert);
   expect(html).toContain('role="alert"');
   expect(testCase.calls()).toBe(0);
  });
  it("PROJ-BREAK-MENTOR-"+testCase.id+" disabled "+testCase.title+" is non-disclosing",async()=>{
   const html=await render(testCase);
   expect(html).toContain(testCase.disabled);
   expect(html).not.toContain("PRIVATE OTHER COLLEGE");
   expect(testCase.calls()).toBe(1);
  });
  it("PROJ-BREAK-MENTOR-"+testCase.id+" rejected "+testCase.title+" propagates denial",async()=>{
   state.reject=true;
   await expect(render(testCase)).rejects.toThrow("PROJECT_ACCESS_DENIED");
   expect(testCase.calls()).toBe(1);
  });
 }
});
