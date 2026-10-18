import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import type {ActiveMembership,RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
const mocks=vi.hoisted(()=>({
 context:vi.fn(),persisted:vi.fn(),list:vi.fn(),count:vi.fn(),
 redirect:vi.fn(),
}));
vi.mock("server-only",()=>({}));
vi.mock("next/navigation",()=>({
 redirect:(url:string)=>{mocks.redirect(url);throw new Error("REDIRECT_TO_"+url);},
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/modules/placements/tpo-persisted-actor-service",()=>({
 requirePersistedTpoMembership:mocks.persisted,
}));
vi.mock("@/modules/announcements/tpo-placement-read-service",()=>({
 listTpoPlacementAnnouncements:mocks.list,countUnreadTpo42Announcements:mocks.count,
}));
import TpoAnnouncements from "@/app/(authenticated)/tpo/announcements/page";
const COLLEGE="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const context=(roles:ActiveMembership["roles"]):RequestContext=>({
 user:{id:"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",identityUid:"tpo-announcement",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"cccccccc-cccc-4ccc-8ccc-cccccccccccc",collegeId:COLLEGE,
  organizationId:"dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  status:"ACTIVE",roles},
});
const load=(raw:Record<string,string|string[]>={})=>
 TpoAnnouncements({searchParams:Promise.resolve(raw)});
describe("UX-tpo-announcements-01 role, private audience and repeated filter denial",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mocks.context.mockResolvedValue(context(["TPO"]));
  mocks.persisted.mockResolvedValue(context(["TPO"]).membership!.id);
 });
 it("wrong account denies access before looking at student/college notice audiences",async()=>{
  mocks.context.mockResolvedValueOnce(context(["LEARNER"]));
  await expect(load({tab:"yours"})).rejects.toThrow("REDIRECT_TO_/dashboard");
  expect(mocks.persisted).not.toHaveBeenCalled();
  expect(mocks.list).not.toHaveBeenCalled();
 });
 it("persisted team revocation denies before private audience or notice query",async()=>{
  mocks.persisted.mockRejectedValueOnce(new AuthorizationError("placements.manage"));
  await expect(load({tab:"from42"})).rejects.toBeInstanceOf(AuthorizationError);
  expect(mocks.list).not.toHaveBeenCalled();
  expect(mocks.count).not.toHaveBeenCalled();
 });
 it("rejects duplicate scalar filters, but does not reject legitimate multi-recipient arrays",async()=>{
  const invalid=[
   {tab:["yours","from42"]},{page:["1","20"]},
   {mine:["1","0"]},{audience:["COHORT","COLLEGE"]},
   {targetId:["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"]},
  ];
  for(const raw of invalid){
   const html=renderToStaticMarkup(await load(raw));
   expect(html).toContain("Invalid announcement filters.");
   expect(html).toContain("Return to announcements");
   expect(html).toContain('role="alert"');
  }
  expect(mocks.list).not.toHaveBeenCalled();
  expect(mocks.count).not.toHaveBeenCalled();
 });
});
