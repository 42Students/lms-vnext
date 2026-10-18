import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";

const mock=vi.hoisted(()=>({
 persisted:vi.fn(),scope:vi.fn(),jobActor:vi.fn(),db:vi.fn(),table:vi.fn(),
}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:mock.db}));
vi.mock("@/modules/placements/scope",()=>({requirePlacementManageScope:mock.scope}));
vi.mock("@/modules/placements/tpo-persisted-actor-service",()=>({
 requirePersistedTpoMembership:mock.persisted,
}));
vi.mock("@/modules/placements/tpo-job-write-base",()=>({requireTpoJobActor:mock.jobActor}));
vi.mock("@/modules/placements/staged-tables",()=>({placementTableExists:mock.table}));
import {listTpoGeneralRequests,decideTpoGeneralRequest}
 from "@/modules/placements/tpo-general-request-service";

const COLLEGE="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ORG="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const REQUEST="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const ctx:RequestContext={
 user:{id:"dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  identityUid:"general-reviewer",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  collegeId:COLLEGE,organizationId:ORG,status:"ACTIVE",roles:["TPO"]},
};

describe("TPO-requests-verification-01 persisted role on private general request service",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mock.persisted.mockResolvedValue(ctx.membership!.id);
  mock.scope.mockResolvedValue({id:COLLEGE,organizationId:ORG});
  mock.table.mockResolvedValue(true);
 });
 it("denies revoked officers before listing students, requested proof and personal reasons",async()=>{
  mock.persisted.mockRejectedValue(new AuthorizationError("placements.manage"));
  await expect(listTpoGeneralRequests(ctx)).rejects.toBeInstanceOf(AuthorizationError);
  expect(mock.scope).not.toHaveBeenCalled();
  expect(mock.table).not.toHaveBeenCalled();
  expect(mock.db).not.toHaveBeenCalled();
 });
 it("denies revoked officers before revealing whether a targeted request still exists",async()=>{
  mock.persisted.mockRejectedValue(new AuthorizationError("placements.manage"));
  await expect(decideTpoGeneralRequest(ctx,REQUEST,{
   confirmed:true,version:REQUEST,action:"REJECT",note:"Evidence is missing",
  })).rejects.toBeInstanceOf(AuthorizationError);
  expect(mock.db).not.toHaveBeenCalled();
  expect(mock.table).not.toHaveBeenCalled();
 });
 it("rejects a stale persisted role inside an in-flight decision transaction",async()=>{
  mock.db.mockReturnValue({transaction:async(fn:(tx:unknown)=>Promise<unknown>)=>fn({})});
  mock.jobActor.mockRejectedValue(new AuthorizationError("placements.manage"));
  await expect(decideTpoGeneralRequest(ctx,REQUEST,{
   confirmed:true,version:REQUEST,action:"APPROVE",note:"",
  })).rejects.toBeInstanceOf(AuthorizationError);
  expect(mock.jobActor).toHaveBeenCalledTimes(1);
 });
 it("does not allow a cached non-TPO actor to query sensitive request history",async()=>{
  const learner={...ctx,membership:{...ctx.membership!,roles:["LEARNER"] as const}};
  await expect(listTpoGeneralRequests(learner)).rejects.toBeInstanceOf(AuthorizationError);
  expect(mock.persisted).not.toHaveBeenCalled();
  expect(mock.db).not.toHaveBeenCalled();
 });
});
