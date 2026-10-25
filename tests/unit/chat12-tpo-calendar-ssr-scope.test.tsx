import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {readFileSync} from "node:fs";
import type {ActiveMembership,RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";

const mock=vi.hoisted(()=>({context:vi.fn(),persisted:vi.fn(),calendar:vi.fn(),redirect:vi.fn()}));
vi.mock("next/navigation",()=>({redirect:(href:string)=>{
 mock.redirect(href);throw new Error("REDIRECT_TO_"+href);
}}));
vi.mock("next/headers",()=>({headers:async()=>new Headers({"user-agent":"Desktop Chrome"})}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mock.context}));
vi.mock("@/modules/placements/tpo-persisted-actor-service",()=>({
 requirePersistedTpoMembership:mock.persisted,
}));
vi.mock("@/components/placements/placement-calendar-workspace",()=>({
 PlacementCalendarWorkspace:({audience,searchParams}:{audience:string;searchParams:{date?:string;view?:string}})=><div>
  <p>Authorized calendar: {audience}</p>
  <p>Selected day: {searchParams.date??"default"}</p>
  <p>Selected view: {searchParams.view??"default"}</p>
 </div>,
}));
import TpoCalendarPage from "@/app/(authenticated)/tpo/calendar/page";

const COLLEGE="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ORG="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const context=(roles:ActiveMembership["roles"]):RequestContext=>({
 user:{id:"cccccccc-cccc-4ccc-8ccc-cccccccccccc",identityUid:"tpo-calendar",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  collegeId:COLLEGE,organizationId:ORG,status:"ACTIVE",roles},
});
const page=(query:Record<string,string|string[]>={})=>
 TpoCalendarPage({searchParams:Promise.resolve(query)});

describe("UX-tpo-first-third-calendar-02 SSR scope, invalid filters and navigation",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mock.context.mockResolvedValue(context(["TPO"]));
  mock.persisted.mockResolvedValue(COLLEGE);
 });
 it("wrong role never reaches private calendar and redirects to account dashboard",async()=>{
  mock.context.mockResolvedValueOnce(context(["FACULTY"]));
  await expect(page()).rejects.toThrow("REDIRECT_TO_/dashboard");
  expect(mock.persisted).not.toHaveBeenCalled();
 });
 it("a removed TPO role is rejected before URL parsing and the calendar workspace renders",async()=>{
  mock.persisted.mockRejectedValueOnce(new AuthorizationError("placements.manage"));
  await expect(page({view:"week"})).rejects.toBeInstanceOf(AuthorizationError);
  expect(mock.persisted).toHaveBeenCalledWith(context(["TPO"]),COLLEGE);
 });
 it("malformed dates and event kinds show friendly scoped recovery without calendar records",async()=>{
  for(const bad of [{date:"2099-02-30"},{kind:"PRIVATE_OTHER_COLLEGE"}]){
   const html=renderToStaticMarkup(await page(bad));
   expect(html).toContain("Invalid calendar filters");
   expect(html).toContain("No events were queried.");
   expect(html).toContain("Reset calendar filters");
   expect(html).toContain('role="alert"');
   expect(html).not.toContain("PRIVATE_OTHER_COLLEGE");
  }
 });
 it("valid IST date and explicit week view preserve authorized calendar/export navigation",async()=>{
  const html=renderToStaticMarkup(await page({date:"2099-01-31",view:"week",kind:"ROUND"}));
  expect(html).toContain("Authorized calendar: TPO");
  expect(html).toContain("Selected day: 2099-01-31");
  expect(html).toContain("Selected view: week");
  const route=readFileSync("src/app/(authenticated)/tpo/calendar/page.tsx","utf8");
  const workspace=readFileSync("src/components/placements/placement-calendar-workspace.tsx","utf8");
  expect(route).toContain("<PlacementCalendarWorkspace");
  expect(route).toContain('audience="TPO"');
  expect(route).toContain('searchParams={{...parsed.data,...(first(raw.kinds) === undefined ? {} : { kinds: first(raw.kinds) })}}');
  expect(workspace).toContain("calendarHref(basePath,audience,state,");
  expect(workspace).toContain("Rounds and talks");
  expect(workspace).toContain("View interviews");
  expect(mock.persisted).toHaveBeenCalledWith(context(["TPO"]),COLLEGE);
 });
});
