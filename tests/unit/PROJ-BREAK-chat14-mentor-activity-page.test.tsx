import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import type {ReactNode} from "react";
import MentorActivityPage from "@/app/(authenticated)/mentor/activity/page";

const state=vi.hoisted(()=>({
 mentor:true,enabled:true,denied:false,calls:0,
 events:[] as Array<{id:string;projectId:string;projectTitle:string;label:string;
  importance:string;occurredAt:Date}>,
}));
const projectId="11111111-1111-4111-8111-111111111111";
vi.mock("next/link",()=>({
 default:({href,children}:{href:string;children:ReactNode})=><a href={href}>{children}</a>,
}));
vi.mock("next/navigation",()=>({redirect:(href:string)=>{throw new Error("REDIRECT:"+href);}}));
vi.mock("@/components/ui/page-header",()=>({
 PageHeader:({title,description,actions}:{title:string;description:string;actions:ReactNode})=>
  <header><h1>{title}</h1><p>{description}</p>{actions}</header>,
}));
vi.mock("@/components/ui/empty-state",()=>({
 EmptyState:({title,description}:{title:string;description:string})=>
  <section role="status"><h2>{title}</h2><p>{description}</p></section>,
}));
vi.mock("@/components/ui/button",()=>({Button:({children}:{children:ReactNode})=><button>{children}</button>}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:async()=>({user:{id:"mentor"}})}));
vi.mock("@/modules/identity/context",()=>({hasMembershipRole:()=>state.mentor}));
vi.mock("@/modules/projects/mentor-portfolio-service",()=>({
 getMentorPortfolioActivity:async(_:unknown,query:Record<string,unknown>)=>{
  state.calls++;
  if(state.denied)throw new Error("PROJECT_ACCESS_DENIED");
  return {enabled:state.enabled,query,projects:[],page:1,pageSize:20,totalPages:1,
   total:state.events.length,items:state.events};
 },
}));
const render=async(raw:Record<string,string|string[]|undefined>={})=>
 renderToStaticMarkup(await MentorActivityPage({searchParams:Promise.resolve(raw)}));
beforeEach(()=>{
 state.mentor=true;state.enabled=true;state.denied=false;state.calls=0;state.events=[];
});
describe("Mentor activity page exact scope and state handling",()=>{
 it("PROJ-BREAK-MENTOR-302 wrong role cannot reach activity service",async()=>{
  state.mentor=false;
  await expect(render()).rejects.toThrow("REDIRECT:/dashboard");
  expect(state.calls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-303 duplicated or malformed project filters fail before service",async()=>{
  for(const q of [{projectId:[projectId,projectId]},{search:["A","A"]},
   {importance:["HIGH","LOW"]},{page:["1","2"]},{page:"10001"}]){
   const html=await render(q);
   expect(html).toContain("Invalid activity filters");
   expect(html).toContain('role="alert"');
  }
  expect(state.calls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-304 disabled Projects does not render private activity rows",async()=>{
  state.enabled=false;
  state.events=[{id:"event-1",projectId,projectTitle:"PRIVATE OTHER COLLEGE",
   label:"Private",importance:"HIGH",occurredAt:new Date("2026-10-18T10:00:00Z")}];
  const html=await render();
  expect(html).toContain("Projects access is disabled. No activity was loaded.");
  expect(html).not.toContain("PRIVATE OTHER COLLEGE");
  expect(html).not.toContain("Private</p>");
  expect(state.calls).toBe(1);
 });
 it("PROJ-BREAK-MENTOR-305 authorized empty activity does not imply zero work",async()=>{
  const html=await render();
  expect(html).toContain("Project activity");
  expect(html).toContain("No recorded activity");
  expect(html).toContain("Missing events do not imply no work occurred");
  expect(html).toContain("Export filtered activity CSV (max 200)");
 });
 it("PROJ-BREAK-MENTOR-306 activity renders only escaped events and links to exact project",async()=>{
  state.events=[{id:"event-1",projectId,projectTitle:"Atlas",
   label:"<script>bad</script>",importance:"HIGH",
   occurredAt:new Date("2026-10-18T10:00:00Z")}];
  const html=await render();
  expect(html).toContain("&lt;script&gt;bad&lt;/script&gt;");
  expect(html).not.toContain("<script>");
  expect(html).toContain("/mentor/projects/"+projectId+"?tab=activity");
  expect(html).toContain("IST");
  expect(html).not.toContain("actor_email");
 });
 it("PROJ-BREAK-MENTOR-307 permission expiry is never converted into public activity",async()=>{
  state.denied=true;
  await expect(render()).rejects.toThrow("PROJECT_ACCESS_DENIED");
  expect(state.calls).toBe(1);
 });
});
