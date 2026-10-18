import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";

const mocks=vi.hoisted(()=>({
 actor:vi.fn(),scope:vi.fn(),db:vi.fn(),select:vi.fn(),notes:vi.fn(),
}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:mocks.db}));
vi.mock("@/modules/placements/scope",()=>({requirePlacementManageScope:mocks.scope}));
vi.mock("@/modules/placements/tpo-batch-workspace-read-service",
 ()=>({requireTpoBatchActor:mocks.actor}));
vi.mock("@/modules/placements/tpo-student-notes-service",
 ()=>({listTpoStudentNotes:mocks.notes}));
import {getTpoStudentPanelDetail} from "@/modules/placements/tpo-student-panel-detail-service";

const COLLEGE="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ORG="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const STUDENT="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const active:RequestContext={
 user:{id:"dddddddd-dddd-4ddd-8ddd-dddddddddddd",identityUid:"tpo",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",collegeId:COLLEGE,organizationId:ORG,
  status:"ACTIVE",roles:["TPO"]},
};
describe("PROJ-BREAK-TPO-PANEL-05 persisted membership recheck before student private data",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mocks.actor.mockResolvedValue(COLLEGE);
  mocks.scope.mockResolvedValue({id:COLLEGE,organizationId:ORG});
  mocks.select.mockReturnValue({
   from(){return this;},innerJoin(){return this;},
   where(){return this;},limit(){return Promise.resolve([]);},
  });
  mocks.db.mockReturnValue({select:mocks.select});
 });
 it("denies revoked persisted TPO membership before selecting any student data",async()=>{
  mocks.actor.mockRejectedValue(new Error("PERSISTED_TPO_ROLE_REMOVED"));
  await expect(getTpoStudentPanelDetail(active,STUDENT))
   .rejects.toThrow("PERSISTED_TPO_ROLE_REMOVED");
  expect(mocks.db).not.toHaveBeenCalled();
  expect(mocks.scope).not.toHaveBeenCalled();
 });
 it("denies expired selected membership and disabled user before any DB lookup",async()=>{
  for(const ctx of [
   {...active,membership:null},
   {...active,membership:{...active.membership!,status:"SUSPENDED" as const}},
   {...active,user:{...active.user,platformStatus:"DISABLED" as const}},
  ]){
   await expect(getTpoStudentPanelDetail(ctx,STUDENT))
    .rejects.toBeDefined();
  }
  expect(mocks.actor).not.toHaveBeenCalled();
  expect(mocks.db).not.toHaveBeenCalled();
 });
 it("denies wrong role even when college matches and user has a valid session",async()=>{
  await expect(getTpoStudentPanelDetail({
   ...active,membership:{...active.membership!,roles:["LEARNER"]},
  },STUDENT)).rejects.toBeDefined();
  expect(mocks.actor).not.toHaveBeenCalled();
 });
 it("nonexistent membership returns null without loading notes, jobs or team histories",async()=>{
  await expect(getTpoStudentPanelDetail(active,STUDENT)).resolves.toBeNull();
  expect(mocks.actor).toHaveBeenCalledTimes(1);
  expect(mocks.scope).toHaveBeenCalledWith(active,COLLEGE);
  expect(mocks.notes).not.toHaveBeenCalled();
 });
 it("malformed UUID fails validation before checking user data",async()=>{
  await expect(getTpoStudentPanelDetail(active,"../../other-college")).rejects.toBeDefined();
  expect(mocks.actor).not.toHaveBeenCalled();
 });
});
