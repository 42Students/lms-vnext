import {beforeEach,describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";

const mock=vi.hoisted(()=>({scope:vi.fn(),actor:vi.fn(),db:vi.fn(),select:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/modules/placements/scope",()=>({requirePlacementManageScope:mock.scope}));
vi.mock("@/modules/placements/tpo-batch-workspace-read-service",()=>({requireTpoBatchActor:mock.actor}));
vi.mock("@/db/client",()=>({getDb:mock.db}));
import {getTpoActorAudit} from "@/modules/placements/tpo-actor-audit-service";

const COLLEGE="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OTHER="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ORG="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const context:RequestContext={
 user:{id:"dddddddd-dddd-4ddd-8ddd-dddddddddddd",identityUid:"tpo-actor-audit",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  collegeId:COLLEGE,organizationId:ORG,status:"ACTIVE",roles:["TPO"]},
};

describe("TPO-BREAK-actor-audit-revoked-07 canonical activity, actor and entity scope",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mock.scope.mockResolvedValue({id:COLLEGE,organizationId:ORG,status:"ACTIVE"});
  mock.actor.mockResolvedValue(COLLEGE);
  mock.select.mockImplementation((projection:Record<string,unknown>)=>{
   const counting=Object.hasOwn(projection,"total");
   const rows=counting?[{total:0}]:[];
   return {
    from(){return this;},leftJoin(){return this;},where(){return this;},
    orderBy(){return this;},limit(){return this;},offset:()=>Promise.resolve(rows),
    then:(fn:(value:unknown)=>unknown)=>Promise.resolve(rows).then(fn),
   };
  });
  mock.db.mockReturnValue({select:mock.select});
 });
 it("a revoked actor cannot probe exact user and entity activity identifiers",async()=>{
  mock.actor.mockRejectedValue(new AuthorizationError("placements.manage"));
  await expect(getTpoActorAudit(context,{
   actorId:context.user.id,entityType:"placement_offer",entityId:OTHER,
  })).rejects.toBeInstanceOf(AuthorizationError);
  expect(mock.db).not.toHaveBeenCalled();
 });
 it("wrong-college persisted actor and wrong session role stop before any event query",async()=>{
  mock.actor.mockResolvedValue(OTHER);
  await expect(getTpoActorAudit(context,{})).rejects.toBeInstanceOf(AuthorizationError);
  expect(mock.db).not.toHaveBeenCalled();
  const learner={...context,membership:{...context.membership!,roles:["LEARNER"] as const}};
  await expect(getTpoActorAudit(learner,{})).rejects.toBeInstanceOf(AuthorizationError);
  expect(mock.db).not.toHaveBeenCalled();
 });
 it("does not query for malformed filters and returns a truthful scoped empty history",async()=>{
  await expect(getTpoActorAudit(context,{page:0})).rejects.toBeDefined();
  expect(mock.db).not.toHaveBeenCalled();
  const result=await getTpoActorAudit(context,{page:1,pageSize:25});
  expect(result.rows).toEqual([]);
  expect(result.total).toBe(0);
  expect(result.totalPages).toBe(1);
  expect(mock.actor).toHaveBeenCalledTimes(2);
 });
 it("the page verifies the live TPO before opening actor/entity filters",()=>{
  const src=readFileSync(new URL("../../src/app/(authenticated)/tpo/audit/actors/page.tsx",import.meta.url),"utf8");
  const gate=src.indexOf("await requireTpoBatchActor(context);");
  expect(gate).toBeGreaterThan(0);
  expect(gate).toBeLessThan(src.indexOf("const raw = await searchParams;"));
  expect(gate).toBeLessThan(src.indexOf("getTpoActorAudit("));
 });
});
