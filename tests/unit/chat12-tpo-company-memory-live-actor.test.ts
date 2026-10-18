import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
const mock=vi.hoisted(()=>({scope:vi.fn(),actor:vi.fn(),db:vi.fn()}));
vi.mock("@/modules/placements/scope",()=>({requirePlacementManageScope:mock.scope}));
vi.mock("@/modules/placements/tpo-batch-workspace-read-service",()=>({requireTpoBatchActor:mock.actor}));
vi.mock("@/db/client",()=>({getDb:mock.db}));
import {getTpoCompanyMemory,getTpoRecruiterLeadStages,listTpoCompanies}
 from "@/modules/placements/tpo-company-memory-service";

const COLLEGE="11111111-1111-4111-8111-111111111111";
const FOREIGN="22222222-2222-4222-8222-222222222222";
const ORG="33333333-3333-4333-8333-333333333333";
const ctx:RequestContext={
 user:{id:"44444444-4444-4444-8444-444444444444",identityUid:"tpo-memory",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"55555555-5555-4555-8555-555555555555",
  collegeId:COLLEGE,organizationId:ORG,status:"ACTIVE",roles:["TPO"]},
};

describe("TPO-BREAK-company-memory-actor-04 placement CRM and lead history",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mock.scope.mockResolvedValue({id:COLLEGE,organizationId:ORG,status:"ACTIVE"});
  mock.actor.mockResolvedValue(COLLEGE);
 });
 const privateReads=()=>[
  ()=>getTpoRecruiterLeadStages(ctx,COLLEGE),
  ()=>listTpoCompanies(ctx,COLLEGE),
  ()=>getTpoCompanyMemory(ctx,COLLEGE,"Example"),
 ];
 it("rejects role-revoked sessions for each exported private CRM reader before touching records",async()=>{
  mock.actor.mockRejectedValue(new AuthorizationError("placements.manage"));
  for(const read of privateReads())await expect(read()).rejects.toBeInstanceOf(AuthorizationError);
  expect(mock.db).not.toHaveBeenCalled();
  expect(mock.actor).toHaveBeenCalledTimes(3);
 });
 it("rejects live college drift and forged URL college without returning lead or company data",async()=>{
  mock.actor.mockResolvedValue(FOREIGN);
  for(const read of privateReads())await expect(read()).rejects.toBeInstanceOf(AuthorizationError);
  expect(mock.db).not.toHaveBeenCalled();
  mock.actor.mockResolvedValue(COLLEGE);
  await expect(getTpoCompanyMemory(ctx,FOREIGN,"Example")).rejects.toBeInstanceOf(AuthorizationError);
  expect(mock.db).not.toHaveBeenCalled();
 });
});
