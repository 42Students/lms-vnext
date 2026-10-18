import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import type {ActiveMembership,RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";

const mocks=vi.hoisted(()=>({
 context:vi.fn(),actor:vi.fn(),batches:vi.fn(),operations:vi.fn(),people:vi.fn(),
 redirect:vi.fn(),
}));
vi.mock("next/navigation",()=>({
 redirect:(href:string)=>{mocks.redirect(href);throw new Error("REDIRECT_TO_"+href);},
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/modules/placements/tpo-batch-workspace-read-service",()=>({
 requireTpoBatchActor:mocks.actor,listTpoBatches:mocks.batches,
}));
vi.mock("@/modules/placements/tpo-operations-service",()=>({
 getPlacementTpoOperations:mocks.operations,
}));
vi.mock("@/modules/placements/tpo-find-people-service",()=>({
 findTpoPeopleAndCompanies:mocks.people,
}));
vi.mock("@/components/ui/page-header",()=>({PageHeader:({title}:{title:string})=><h1>{title}</h1>}));
import TpoRecordFinder from "@/app/(authenticated)/tpo/find/page";

const COLLEGE="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ORG="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const context=(roles:ActiveMembership["roles"]):RequestContext=>({
 user:{id:"cccccccc-cccc-4ccc-8ccc-cccccccccccc",identityUid:"tpo-finder",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  collegeId:COLLEGE,organizationId:ORG,status:"ACTIVE",roles},
});
const open=(q?:string|string[])=>
 TpoRecordFinder({searchParams:Promise.resolve(q===undefined?{}:{q})});
describe("UX-tpo-find-role-01 first-third TPO global finder authorization and recovery",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mocks.context.mockResolvedValue(context(["TPO"]));
  mocks.actor.mockResolvedValue(COLLEGE);
  mocks.batches.mockResolvedValue({batches:[]});
  mocks.operations.mockResolvedValue({jobs:[]});
  mocks.people.mockResolvedValue({students:[],recruiters:[],companies:[]});
 });
 it("never queries student identities for a Learner, Faculty or revoked placement member",async()=>{
  mocks.context.mockResolvedValueOnce(context(["LEARNER"]));
  await expect(open("Alice")).rejects.toThrow("REDIRECT_TO_/dashboard");
  mocks.context.mockResolvedValueOnce(context(["FACULTY"]));
  await expect(open("Alice")).rejects.toThrow("REDIRECT_TO_/dashboard");
  mocks.actor.mockRejectedValueOnce(new AuthorizationError("placements.manage"));
  await expect(open("Alice")).rejects.toBeInstanceOf(AuthorizationError);
  expect(mocks.batches).not.toHaveBeenCalled();
  expect(mocks.people).not.toHaveBeenCalled();
  expect(mocks.operations).not.toHaveBeenCalled();
 });
 it("does not fetch private roster data for an empty, too-short or repeated search query",async()=>{
  for(const input of [undefined,"A",["Alice","Bob"]]){
   const html=renderToStaticMarkup(await open(input));
   expect(html).toContain("Find a student, recruiter or company");
   expect(html).not.toContain("No matching students.");
  }
  expect(mocks.batches).not.toHaveBeenCalled();
  expect(mocks.people).not.toHaveBeenCalled();
  expect(mocks.operations).not.toHaveBeenCalled();
 });
 it("returns an explicit repeat-query validation alert rather than silently taking the first value",async()=>{
  const html=renderToStaticMarkup(await open(["Alice","Bob"]));
  expect(html).toContain("Search must contain 2");
  expect(html).toContain('role="alert"');
  expect(html).not.toContain("Bob");
 });
 it("limits authorized company/student/drive results to the current college finder services",async()=>{
  mocks.batches.mockResolvedValueOnce({batches:[{
   id:"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
   name:"Alice Batch",code:"A01",program:"B.Tech",department:"Computer",
  }]});
  mocks.people.mockResolvedValueOnce({students:[{
   id:"ffffffff-ffff-4fff-8fff-ffffffffffff",name:"Alice",rollNumber:"CS99",branch:"Computer",
  }],recruiters:[],companies:[]});
  const html=renderToStaticMarkup(await open("Alice"));
  expect(html).toContain("Alice Batch");
  expect(html).toContain("CS99");
  expect(html).toContain("/tpo/students?q=CS99");
  expect(mocks.batches).toHaveBeenCalledTimes(1);
  expect(mocks.people).toHaveBeenCalledWith(context(["TPO"]),COLLEGE,"alice");
  expect(mocks.actor).toHaveBeenCalledWith(context(["TPO"]));
 });
});
