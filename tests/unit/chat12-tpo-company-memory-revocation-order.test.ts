import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
const mocked=vi.hoisted(()=>({actor:vi.fn(),scope:vi.fn(),db:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/modules/placements/tpo-batch-workspace-read-service",()=>({
 requireTpoBatchActor:mocked.actor,
}));
vi.mock("@/modules/placements/scope",()=>({requirePlacementManageScope:mocked.scope}));
vi.mock("@/db/client",()=>({getDb:mocked.db}));
import {listTpoCompanies,getTpoCompanyMemory}
 from "@/modules/placements/tpo-company-memory-service";
const COLLEGE="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const FOREIGN="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ctx:RequestContext={
 user:{id:"cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  identityUid:"tpo-company-memory",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  collegeId:COLLEGE,organizationId:"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  status:"ACTIVE",roles:["TPO"]},
};
describe("TPO-companies-persisted-role-first-01 direct private Company Memory reader",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mocked.actor.mockResolvedValue(COLLEGE);
  mocked.scope.mockResolvedValue({id:COLLEGE});
 });
 it("rejects revoked officer before private tenant existence or company source queries",async()=>{
  mocked.actor.mockRejectedValue(new AuthorizationError("placements.manage"));
  await expect(listTpoCompanies(ctx,COLLEGE)).rejects.toBeInstanceOf(AuthorizationError);
  await expect(getTpoCompanyMemory(ctx,COLLEGE,"Employer Pvt Ltd"))
   .rejects.toBeInstanceOf(AuthorizationError);
  expect(mocked.scope).not.toHaveBeenCalled();
  expect(mocked.db).not.toHaveBeenCalled();
 });
 it("denies foreign college IDs before resolving that college's business presence",async()=>{
  await expect(listTpoCompanies(ctx,FOREIGN)).rejects.toBeInstanceOf(AuthorizationError);
  await expect(getTpoCompanyMemory(ctx,FOREIGN,"Employer Pvt Ltd"))
   .rejects.toBeInstanceOf(AuthorizationError);
  expect(mocked.scope).not.toHaveBeenCalled();
  expect(mocked.db).not.toHaveBeenCalled();
 });
 it("rejects oversized direct Company Memory names before any SQL or tenant lookup",async()=>{
  await expect(getTpoCompanyMemory(ctx,COLLEGE,"Employer".repeat(100)))
   .rejects.toMatchObject({code:"TPO_COMPANY_NAME_REQUIRED"});
  expect(mocked.db).not.toHaveBeenCalled();
  expect(mocked.scope).not.toHaveBeenCalled();
 });
});
