import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import type {ActiveMembership,RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";

const mock=vi.hoisted(()=>({context:vi.fn(),actor:vi.fn(),batches:vi.fn(),
 unassigned:vi.fn(),eligibility:vi.fn(),redirect:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("next/navigation",()=>({
 redirect:(href:string)=>{mock.redirect(href);throw new Error("REDIRECT_TO_"+href);},
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mock.context}));
vi.mock("@/modules/placements/tpo-batch-workspace-read-service",()=>({
 listTpoBatches:mock.batches,requireTpoBatchActor:mock.actor,
}));
vi.mock("@/modules/placements/tpo-batch-unassigned-students-service",()=>({
 countTpoLearnersWithoutClass:mock.unassigned,
}));
vi.mock("@/modules/placements/tpo-batch-directory-counts-service",()=>({
 listTpoBatchCardEligibility:mock.eligibility,
}));
import TpoBatchesPage from "@/app/(authenticated)/tpo/batches/page";

const COLLEGE="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ORG="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const context=(roles:ActiveMembership["roles"]):RequestContext=>({
 user:{id:"cccccccc-cccc-4ccc-8ccc-cccccccccccc",identityUid:"tpo-batches",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  collegeId:COLLEGE,organizationId:ORG,status:"ACTIVE",roles},
});
const load=(params:Record<string,string|string[]>={})=>TpoBatchesPage({
 searchParams:Promise.resolve(params),
});
describe("UX-tpo-batches-01 server page live role and unambiguous URL filters",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mock.context.mockResolvedValue(context(["TPO"]));
  mock.actor.mockResolvedValue(COLLEGE);
 });
 it("a learner cannot see even validation results from the private TPO batch page",async()=>{
  mock.context.mockResolvedValueOnce(context(["LEARNER"]));
  await expect(load({page:["1","2"]})).rejects.toThrow("REDIRECT_TO_/dashboard");
  expect(mock.actor).not.toHaveBeenCalled();
  expect(mock.batches).not.toHaveBeenCalled();
 });
 it("a revoked TPO is rejected before parsing filters or fetching any batch data",async()=>{
  mock.actor.mockRejectedValueOnce(new AuthorizationError("placements.manage"));
  await expect(load({q:"secret student"})).rejects.toBeInstanceOf(AuthorizationError);
  expect(mock.batches).not.toHaveBeenCalled();
  expect(mock.unassigned).not.toHaveBeenCalled();
 });
 it("refuses repeated scalar search, page, sorting or program filters with actionable recovery",async()=>{
  for(const params of [
   {q:["alice","bob"]},{page:["1","2"]},{sort:["NAME","PRIORITY"]},
   {program:["program-a","program-b"]},{pageSize:["10","100"]},
  ]){
   const html=renderToStaticMarkup(await load(params));
   expect(html).toContain("Invalid batch filters.");
   expect(html).toContain("Clear filters");
   expect(html).toContain('role="alert"');
  }
  expect(mock.actor).toHaveBeenCalledTimes(5);
  expect(mock.batches).not.toHaveBeenCalled();
  expect(mock.eligibility).not.toHaveBeenCalled();
 });
});
