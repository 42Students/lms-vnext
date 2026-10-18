import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";

const mock=vi.hoisted(()=>({
 actor:vi.fn(),scope:vi.fn(),db:vi.fn(),select:vi.fn(),rows:[] as unknown[],
}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:mock.db}));
vi.mock("@/modules/placements/scope",()=>({requirePlacementManageScope:mock.scope}));
vi.mock("@/modules/placements/tpo-batch-workspace-read-service",()=>({requireTpoBatchActor:mock.actor}));
import {getTpoCompanyLifecycle,listArchivedTpoCompanyRelationships}
 from "@/modules/placements/tpo-company-lifecycle-service";

const COLLEGE="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const COMPANY="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const OTHER="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const ORG="dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const context:RequestContext={
 user:{id:"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",identityUid:"tpo-company-lifecycle",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"ffffffff-ffff-4fff-8fff-ffffffffffff",
  collegeId:COLLEGE,organizationId:ORG,status:"ACTIVE",roles:["TPO"]},
};

describe("TPO-BREAK-company-lifecycle-read-05 revocation-safe company history",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mock.rows=[];
  mock.scope.mockResolvedValue({id:COLLEGE,organizationId:ORG});
  mock.actor.mockResolvedValue(COLLEGE);
  mock.select.mockImplementation(()=>({
   from(){return this;},innerJoin(){return this;},where(){return this;},
   orderBy(){return this;},limit:()=>Promise.resolve(mock.rows),
  }));
  mock.db.mockReturnValue({select:mock.select});
 });
 it("a revoked placement role refuses both current and archived company reads before any business data query",async()=>{
  mock.actor.mockRejectedValue(new AuthorizationError("placements.manage"));
  await expect(getTpoCompanyLifecycle(context,COMPANY)).rejects.toBeInstanceOf(AuthorizationError);
  await expect(listArchivedTpoCompanyRelationships(context)).rejects.toBeInstanceOf(AuthorizationError);
  expect(mock.db).not.toHaveBeenCalled();
 });
 it("refuses a mismatched live college and a non-TPO actor before looking up a canonical company",async()=>{
  mock.actor.mockResolvedValue(OTHER);
  await expect(getTpoCompanyLifecycle(context,COMPANY)).rejects.toBeInstanceOf(AuthorizationError);
  expect(mock.db).not.toHaveBeenCalled();
  const invalid={...context,membership:{...context.membership!,roles:["LEARNER"] as const}};
  await expect(getTpoCompanyLifecycle(invalid,COMPANY)).rejects.toBeInstanceOf(AuthorizationError);
  expect(mock.db).not.toHaveBeenCalled();
 });
 it("rejects malformed deep-link IDs without a company query",async()=>{
  await expect(getTpoCompanyLifecycle(context,"../../other-tenant")).rejects.toBeDefined();
  expect(mock.db).not.toHaveBeenCalled();
 });
 it("keeps archived results college-scoped by service query and truthfully announces 100-row truncation",async()=>{
  mock.rows=Array.from({length:101},(_,i)=>({companyId:"record-"+i,name:"Employer "+i,archivedAt:null}));
  const result=await listArchivedTpoCompanyRelationships(context);
  expect(result.rows).toHaveLength(100);
  expect(result.truncated).toBe(true);
  expect(mock.actor).toHaveBeenCalledTimes(1);
  expect(mock.select).toHaveBeenCalledTimes(1);
 });
 it("does not invent archived relationships or a truncated result when the college has no records",async()=>{
  await expect(listArchivedTpoCompanyRelationships(context)).resolves.toEqual({rows:[],truncated:false});
  expect(mock.select).toHaveBeenCalledTimes(1);
 });
});
