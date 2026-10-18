import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

const mocks=vi.hoisted(()=>({
 actor:vi.fn(),scope:vi.fn(),getDb:vi.fn(),select:vi.fn(),
 persisted:vi.fn(),ready:vi.fn(),
}));
vi.mock("server-only",()=>({}));
vi.mock("@/modules/placements/tpo-batch-workspace-read-service",
 ()=>({requireTpoBatchActor:mocks.actor}));
vi.mock("@/modules/placements/scope",
 ()=>({requirePlacementManageScope:mocks.scope}));
vi.mock("@/modules/permissions/persisted-actor",
 ()=>({assertPersistedPlatformPermission:mocks.persisted}));
vi.mock("@/db/client",()=>({getDb:mocks.getDb}));
vi.mock("@/modules/placements/staged-tables",()=>({placementTableExists:mocks.ready}));
import {getTpoLearnerParticipation,decideTpoLearnerParticipation}
 from "@/modules/placements/tpo-participation-service";

const COLLEGE="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ORG="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const LEARNER="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const context:RequestContext={
 user:{id:"dddddddd-dddd-4ddd-8ddd-dddddddddddd",identityUid:"tpo-auth-test",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  collegeId:COLLEGE,organizationId:ORG,status:"ACTIVE",roles:["TPO"]},
};
const change={status:"ELIGIBLE",expected:{
 status:null,reason:null,note:null,updatedAt:null,
}};
const moduleSource=()=>readFileSync(resolve(process.cwd(),
 "src/modules/placements/tpo-participation-service.ts"),"utf8");

describe("TPO-BREAK-participation-session-06 role removal, stale cookie, txn revocation",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mocks.actor.mockResolvedValue(COLLEGE);
  mocks.scope.mockResolvedValue({id:COLLEGE,organizationId:ORG});
  mocks.ready.mockResolvedValue(true);
  mocks.getDb.mockReturnValue({select:mocks.select});
  mocks.select.mockReturnValue({
   from(){return this;},innerJoin(){return this;},where(){return this;},
   limit(){return Promise.resolve([]);},
  });
 });
 it("does not load learner eligibility after the actor's persisted role was removed",async()=>{
  mocks.actor.mockRejectedValue(new Error("PERSISTED_TPO_REMOVED"));
  await expect(getTpoLearnerParticipation(context,LEARNER))
   .rejects.toThrow("PERSISTED_TPO_REMOVED");
  expect(mocks.getDb).not.toHaveBeenCalled();
  expect(mocks.scope).not.toHaveBeenCalled();
 });
 it("suspended membership, disabled platform status and wrong role fail before any database read",async()=>{
  const altered:RequestContext[]=[
   {...context,membership:{...context.membership!,status:"SUSPENDED"}},
   {...context,user:{...context.user,platformStatus:"DISABLED"}},
   {...context,membership:{...context.membership!,roles:["LEARNER"]}},
  ];
  for(const actor of altered)
   await expect(getTpoLearnerParticipation(actor,LEARNER)).rejects.toBeDefined();
  expect(mocks.actor).not.toHaveBeenCalled();
  expect(mocks.getDb).not.toHaveBeenCalled();
 });
 it("a current TPO does not learn if an unassigned cross-tenant membership exists",async()=>{
  await expect(getTpoLearnerParticipation(context,LEARNER)).rejects.toBeDefined();
  expect(mocks.select).toHaveBeenCalledTimes(1);
 });
 it("a stale actor may not begin an eligibility mutation",async()=>{
  mocks.actor.mockRejectedValue(new Error("PERSISTED_TPO_REMOVED"));
  await expect(decideTpoLearnerParticipation(context,LEARNER,change))
   .rejects.toThrow("PERSISTED_TPO_REMOVED");
  expect(mocks.getDb).not.toHaveBeenCalled();
 });
 it("transaction locks persisted actor and role before touching student eligibility",()=>{
  const src=moduleSource();
  expect(src).toContain('requireTpoBatchActor(context)');
  expect(src).toContain('const persistedActor=await assertPersistedPlatformPermission(');
  expect(src).toContain('tx,context,"placements.manage"');
  expect(src).toContain('persistedActor.membership?.roles.includes("TPO")');
  expect(src.indexOf("const persistedActor=await assertPersistedPlatformPermission"))
   .toBeLessThan(src.indexOf("const [member] = await tx.select({"));
  expect(src).toContain('await tx.insert(activityEvents).values');
 });
});
