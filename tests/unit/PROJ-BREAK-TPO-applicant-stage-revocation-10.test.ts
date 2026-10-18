import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";

const mocks=vi.hoisted(()=>({
 college:vi.fn(),actor:vi.fn(),ready:vi.fn(),db:vi.fn(),transaction:vi.fn(),select:vi.fn(),
}));
vi.mock("server-only",()=>({}));
vi.mock("@/modules/placements/tpo-job-write-base",()=>({
 requireTpoJobCollege:mocks.college,requireTpoJobActor:mocks.actor,
}));
vi.mock("@/modules/placements/staged-tables",()=>({placementTableExists:mocks.ready}));
vi.mock("@/db/client",()=>({getDb:mocks.db}));
import {moveTpoBulkApplicationStage,loadTpoBulkApplicationStages,TpoBulkStageError}
 from "@/modules/placements/tpo-bulk-application-stage-service";

const COLLEGE="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const JOB="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const APP="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const context:RequestContext={
 user:{id:"dddddddd-dddd-4ddd-8ddd-dddddddddddd",identityUid:"tpo-test",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  collegeId:COLLEGE,organizationId:"ffffffff-ffff-4fff-8fff-ffffffffffff",
  roles:["TPO"],status:"ACTIVE"},
};

describe("PROJ-BREAK-TPO-10 bulk stage mutation rechecks persisted authorization before any student query",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mocks.college.mockResolvedValue(COLLEGE);
  mocks.actor.mockResolvedValue(undefined);
  mocks.ready.mockResolvedValue(true);
  mocks.select.mockImplementation(()=>({
   from(){return this;},innerJoin(){return this;},leftJoin(){return this;},
   where(){return this;},for(){return this;},limit(){return Promise.resolve([]);},
  }));
  const tx={select:mocks.select};
  mocks.transaction.mockImplementation(async(cb:(transaction:typeof tx)=>Promise<unknown>)=>cb(tx));
  mocks.db.mockReturnValue({transaction:mocks.transaction});
 });
 it("rejects a revoked TPO role within the transaction, before selecting any learner",async()=>{
  mocks.actor.mockRejectedValue(new Error("PERSISTED_TPO_ROLE_REMOVED"));
  await expect(moveTpoBulkApplicationStage(context,JOB,APP,"MOVE_TEST","none"))
   .rejects.toThrow("PERSISTED_TPO_ROLE_REMOVED");
  expect(mocks.actor).toHaveBeenCalledTimes(1);
  expect(mocks.select).not.toHaveBeenCalled();
 });
 it("rejects missing registered schema rather than claiming a successful move",async()=>{
  mocks.ready.mockResolvedValue(false);
  await expect(moveTpoBulkApplicationStage(context,JOB,APP,"MOVE_INTERVIEW","none"))
   .rejects.toMatchObject({code:"STAGE_STORAGE_PENDING"} satisfies Partial<TpoBulkStageError>);
  expect(mocks.actor).not.toHaveBeenCalled();
  expect(mocks.transaction).not.toHaveBeenCalled();
 });
 it("refuses nonexistent or foreign applications after verifying the current TPO actor",async()=>{
  await expect(moveTpoBulkApplicationStage(context,JOB,APP,"MOVE_TEST","none"))
   .rejects.toMatchObject({code:"STAGE_NOT_ALLOWED"});
  expect(mocks.actor).toHaveBeenCalledTimes(1);
  expect(mocks.select).toHaveBeenCalledTimes(1);
 });
 it("direct stage preview never discloses application stages after TPO role revocation",async()=>{
  mocks.actor.mockRejectedValue(new Error("PERSISTED_ROLE_REVOKED"));
  await expect(loadTpoBulkApplicationStages(context,JOB,[APP],"MOVE_TEST"))
   .rejects.toThrow("PERSISTED_ROLE_REVOKED");
  expect(mocks.actor).toHaveBeenCalledTimes(1);
  expect(mocks.ready).not.toHaveBeenCalled();
  expect(mocks.select).not.toHaveBeenCalled();
 });
});
