import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import type {ReactNode} from "react";
import LandingPage from "@/app/(authenticated)/mentor/page";
import ProjectsPage from "@/app/(authenticated)/mentor/projects/page";
import WorkspacePage from "@/app/(authenticated)/mentor/projects/[projectId]/page";
import CalendarPage from "@/app/(authenticated)/mentor/calendar/page";

const state=vi.hoisted(()=>({
 active:true,mentor:true,moduleEnabled:true,policyFailure:false,
 projectAccess:"MENTOR",scopeCalls:0,workspaceCalls:0,
 listCalls:0,calendarCalls:0,calendarFailure:false,
}));
const projectId="11111111-1111-4111-8111-111111111111";
vi.mock("next/link",()=>({
 default:({href,children}:{href:string;children:ReactNode})=><a href={href}>{children}</a>,
}));
vi.mock("next/navigation",()=>({
 redirect:(path:string)=>{throw new Error("REDIRECT:"+path);},
}));
vi.mock("@/auth/request-context",()=>({
 getCurrentRequestContext:async()=>({user:{id:"mentor"},membership:{id:"member"}}),
}));
vi.mock("@/modules/identity/context",()=>({
 hasActiveMembership:()=>state.active,hasMembershipRole:()=>state.mentor,
}));
vi.mock("@/modules/module-access/service",()=>({
 resolveOptionalModuleAccess:async()=>{
  if(state.policyFailure)throw new Error("Policy lookup failed");
  return {projects:{enabled:state.moduleEnabled}};
 },
}));
vi.mock("@/components/projects/mentor-projects-unavailable",()=>({
 MentorProjectsUnavailable:({loadFailed}:{loadFailed:boolean})=>
  <section role="status">{loadFailed?"Projects load failed":"Projects are disabled"}</section>,
}));
vi.mock("@/components/projects/mentor-calendar-load-failure",()=>({
 MentorCalendarLoadFailure:()=> <section role="status">Unable to load meetings. Try again.</section>,
}));
vi.mock("@/components/ui/page-header",()=>({
 PageHeader:({title,description}:{title:string;description:string})=>
  <header><h1>{title}</h1><p>{description}</p></header>,
}));
vi.mock("@/components/ui/button",()=>({
 Button:({children}:{children:ReactNode})=><button>{children}</button>,
}));
vi.mock("@/components/ui/input",()=>({Input:()=> <input aria-label="Search"/>}));
vi.mock("@/components/ui/select",()=>({
 Select:({children}:{children:ReactNode})=><select>{children}</select>,
}));
vi.mock("@/components/ui/filter-bar",()=>({
 FilterBar:({children}:{children:ReactNode})=><section>{children}</section>,
}));
vi.mock("@/components/projects/mentor-meetings-calendar",()=>({
 MentorMeetingsCalendar:()=> <section role="status">No scheduled meetings</section>,
}));
vi.mock("@/modules/projects/mentor-calendar-service",()=>({
 listMyMentorCalendarMeetings:async()=>{
  state.calendarCalls++;
  if(state.calendarFailure)throw new Error("private DB timeout");
  return [];
 },
}));
vi.mock("@/modules/projects/access",()=>({
 requireProjectReadAccess:async()=>{
  state.scopeCalls++;
  return {access:state.projectAccess,member:{role:state.projectAccess},
   project:{id:projectId,title:"Atlas"}};
 },
}));
vi.mock("@/modules/projects/workspace-view-service",()=>({
 getProjectWorkspaceView:async()=>{
  state.workspaceCalls++;
  throw new Error("WORKSPACE_FETCH_FAILED");
 },
}));
vi.mock("@/modules/projects/mentor-paged-project-list-service",()=>({
 listPagedMentorProjects:async()=>{
  state.listCalls++;
  throw new Error("Unexpected project DB lookup");
 },
}));
const renderLanding=async()=>renderToStaticMarkup(await LandingPage());
const renderProjects=async(q:Record<string,string|string[]|undefined>={})=>
 renderToStaticMarkup(await ProjectsPage({searchParams:Promise.resolve(q)}));
const renderWorkspace=async(q:{tab?:string}={})=>
 renderToStaticMarkup(await WorkspacePage({
  params:Promise.resolve({projectId}),searchParams:Promise.resolve(q),
 }));
const renderCalendar=async(q:Record<string,string|string[]|undefined>={})=>
 renderToStaticMarkup(await CalendarPage({searchParams:Promise.resolve(q)}));
beforeEach(()=>{
 state.active=true;state.mentor=true;state.moduleEnabled=true;state.policyFailure=false;
 state.projectAccess="MENTOR";state.scopeCalls=0;state.workspaceCalls=0;
 state.listCalls=0;state.calendarCalls=0;state.calendarFailure=false;
});
describe("Mentor landing, project directory/workspace and calendar role journeys",()=>{
 it("PROJ-BREAK-MENTOR-290 inactive or wrong-role Mentor cannot navigate from the landing",async()=>{
  state.active=false;
  await expect(renderLanding()).rejects.toThrow("REDIRECT:/dashboard");
  state.active=true;state.mentor=false;
  await expect(renderLanding()).rejects.toThrow("REDIRECT:/dashboard");
 });
 it("PROJ-BREAK-MENTOR-291 permitted Mentor landing goes straight to Projects",async()=>{
  await expect(renderLanding()).rejects.toThrow("REDIRECT:/mentor/projects");
 });
 it("PROJ-BREAK-MENTOR-292 disabled project landing preserves notifications as recovery",async()=>{
  state.moduleEnabled=false;
  const html=await renderLanding();
  expect(html).toContain("Projects is currently unavailable");
  expect(html).toContain("View notifications");
  expect(html).toContain("college administrator");
 });
 it("PROJ-BREAK-MENTOR-293 policy outage shows retry rather than pretending feature disabled",async()=>{
  state.policyFailure=true;
  const html=await renderLanding();
  expect(html).toContain("Projects could not be loaded");
  expect(html).toContain("Retry access check");
  expect(html).not.toContain("Projects is disabled for this account");
 });
 it("PROJ-BREAK-MENTOR-294 wrong role cannot call project directory service",async()=>{
  state.mentor=false;
  await expect(renderProjects()).rejects.toThrow("REDIRECT:/dashboard");
  expect(state.listCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-295 disabled project directory never queries project roster",async()=>{
  state.moduleEnabled=false;
  const html=await renderProjects();
  expect(html).toContain("Projects are disabled");
  expect(state.listCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-296 disabled workspace cannot enumerate a project ID",async()=>{
  state.moduleEnabled=false;
  const html=await renderWorkspace();
  expect(html).toContain("Projects are disabled");
  expect(state.scopeCalls).toBe(0);
  expect(state.workspaceCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-297 foreign or non-Mentor project grant redirects before workspace read",async()=>{
  state.projectAccess="LEARNER";
  await expect(renderWorkspace()).rejects.toThrow("REDIRECT:/mentor/projects");
  expect(state.scopeCalls).toBe(1);
  expect(state.workspaceCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-298 authorized project scope still propagates DB errors",async()=>{
  await expect(renderWorkspace({tab:"board"})).rejects.toThrow("WORKSPACE_FETCH_FAILED");
  expect(state.scopeCalls).toBe(1);
  expect(state.workspaceCalls).toBe(1);
 });
 it("PROJ-BREAK-MENTOR-299 duplicated Mentor calendar filters deny before module policy or meeting reads",async()=>{
  const html=await renderCalendar({status:["ALL","ALL"]});
  expect(html).toContain("Invalid meeting filters");
  expect(html).toContain('role="alert"');
  expect(state.calendarCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-300 calendar module-disabled state skips all meeting reads",async()=>{
  state.moduleEnabled=false;
  const html=await renderCalendar();
  expect(html).toContain("Projects are disabled");
  expect(state.calendarCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-301 calendar DB outage renders a safe recovery state",async()=>{
  state.calendarFailure=true;
  const html=await renderCalendar();
  expect(html).toContain("Meetings");
  expect(html).toContain("Unable to load meetings. Try again.");
  expect(html).not.toContain("private DB timeout");
  expect(state.calendarCalls).toBe(1);
 });
});
