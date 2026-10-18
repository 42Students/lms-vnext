import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import type {ActiveMembership,RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";

const mocks=vi.hoisted(()=>({context:vi.fn(),persisted:vi.fn(),data:vi.fn(),redirect:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("next/navigation",()=>({
 redirect:(href:string)=>{mocks.redirect(href);throw new Error("REDIRECT_TO_"+href);},
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/modules/placements/tpo-persisted-actor-service",()=>({
 requirePersistedTpoMembership:mocks.persisted,
}));
vi.mock("@/modules/placements/tpo-calendar-export-service",()=>({
 getTpoCalendarRoundExport:mocks.data,
}));
vi.mock("@/components/ui/page-header",()=>({PageHeader:({title}:{title:string})=><h1>{title}</h1>}));
import TpoCalendarExportPage from "@/app/(authenticated)/tpo/calendar/export/page";

const COLLEGE="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const context=(roles:ActiveMembership["roles"]):RequestContext=>({
 user:{id:"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",identityUid:"tpo-calendar-export",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  collegeId:COLLEGE,organizationId:"dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  status:"ACTIVE",roles},
});
const load=(raw:Record<string,string|string[]>={})=>TpoCalendarExportPage({
 searchParams:Promise.resolve(raw),
});
describe("UX-tpo-calendar-export-01 scope, dates and honest CSV preview",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mocks.context.mockResolvedValue(context(["TPO"]));
  mocks.persisted.mockResolvedValue("current actor");
  mocks.data.mockResolvedValue({
   rows:[],from:"2099-01-01",to:"2099-01-07",truncated:false,
  });
 });
 it("a Learner role cannot disclose private calendar availability",async()=>{
  mocks.context.mockResolvedValueOnce(context(["LEARNER"]));
  await expect(load({from:"2099-01-01"})).rejects.toThrow("REDIRECT_TO_/dashboard");
  expect(mocks.persisted).not.toHaveBeenCalled();
  expect(mocks.data).not.toHaveBeenCalled();
 });
 it("persisted revocation denies stale TPO access before parsing any URL",async()=>{
  mocks.persisted.mockRejectedValueOnce(new AuthorizationError("placements.manage"));
  await expect(load({from:"2099-01-01"})).rejects.toBeInstanceOf(AuthorizationError);
  expect(mocks.data).not.toHaveBeenCalled();
 });
 it("refuses duplicate, impossible or oversized date ranges without calling export service",async()=>{
  const invalid=[
   {from:["2099-01-01","2099-01-02"],to:"2099-01-07"},
   {from:"2099-01-01",to:["2099-01-07","2099-01-08"]},
   {from:"2099-02-30",to:"2099-03-01"},
   {from:"2099-01-01",to:"2099-12-31"},
  ];
  for(const raw of invalid){
   const html=renderToStaticMarkup(await load(raw));
   expect(html).toContain("Invalid date range.");
   expect(html).toContain('role="alert"');
   expect(html).not.toContain("Download rounds CSV");
  }
  expect(mocks.data).not.toHaveBeenCalled();
 });
 it("displays genuinely empty scoped results without inventing a scheduled round",async()=>{
  const html=renderToStaticMarkup(await load({from:"2099-01-01",to:"2099-01-07"}));
  expect(mocks.data).toHaveBeenCalledWith(context(["TPO"]),{
   from:"2099-01-01",to:"2099-01-07",
  });
  expect(html).toContain("No future scheduled rounds were found in this college");
  expect(html).toContain("Unscheduled, cancelled, completed and non-published drives are not inferred.");
 });
});
