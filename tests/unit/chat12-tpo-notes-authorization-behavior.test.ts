import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";

const mocks=vi.hoisted(()=>({
 getDb:vi.fn(),scope:vi.fn(),actor:vi.fn(),permission:vi.fn(),
 transaction:vi.fn(),select:vi.fn(),insert:vi.fn(),
}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:mocks.getDb}));
vi.mock("@/modules/placements/tpo-batch-workspace-read-service",
 ()=>({requireTpoBatchActor:mocks.actor}));
vi.mock("@/modules/placements/scope",
 ()=>({requirePlacementManageScope:mocks.scope}));
vi.mock("@/modules/permissions/persisted-actor",
 ()=>({assertPersistedPlatformPermission:mocks.permission}));
import {addTpoStudentNotes,listTpoStudentNotes}
 from "@/modules/placements/tpo-student-notes-service";

const COLLEGE="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ORG="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const LEARNER="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const FOREIGN="dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const ctx:RequestContext={
 user:{id:"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",identityUid:"tpo.fixture",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"ffffffff-ffff-4fff-8fff-ffffffffffff",
  collegeId:COLLEGE,organizationId:ORG,status:"ACTIVE",roles:["TPO"]},
};

describe("TPO-BREAK-notes-01 authenticated writer and foreign-ID isolation",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mocks.actor.mockResolvedValue(COLLEGE);
  mocks.scope.mockResolvedValue({id:COLLEGE,organizationId:ORG});
  mocks.permission.mockResolvedValue(undefined);
  mocks.select.mockReturnValue({
   from(){return this;},innerJoin(){return this;},
   where(){return Promise.resolve([{id:LEARNER}]);},
   limit(){return Promise.resolve([{id:LEARNER}]);},
  });
  mocks.insert.mockReturnValue({
   values(){return this;},
   returning(){return Promise.resolve([{id:FOREIGN}]);},
   then(onFulfilled:(value:unknown)=>unknown){
    return Promise.resolve(undefined).then(onFulfilled);
   },
  });
  const tx={select:mocks.select,insert:mocks.insert};
  mocks.transaction.mockImplementation(async(cb:(tx:typeof tx)=>Promise<unknown>)=>cb(tx));
  mocks.getDb.mockReturnValue({transaction:mocks.transaction,select:mocks.select});
 });
 it("checks persisted authority before selecting eligible students or inserting any audit record",async()=>{
  mocks.permission.mockRejectedValue(new Error("PERSISTED_MEMBERSHIP_REVOKED"));
  await expect(addTpoStudentNotes(ctx,{membershipIds:[LEARNER],note:"Private team context"}))
   .rejects.toThrow("PERSISTED_MEMBERSHIP_REVOKED");
  expect(mocks.select).not.toHaveBeenCalled();
  expect(mocks.insert).not.toHaveBeenCalled();
 });
 it("skips foreign student IDs even if forged in JSON and audits only active college rows",async()=>{
  mocks.select.mockReturnValue({
   from(){return this;},innerJoin(){return this;},
   where(){return Promise.resolve([{id:LEARNER}]);},
  });
  const result=await addTpoStudentNotes(ctx,{
   membershipIds:[LEARNER,FOREIGN],note:"  Confirmed meeting  ",
  });
  expect(result).toEqual({
   added:1,skipped:1,savedMembershipIds:[LEARNER],
  });
  expect(mocks.insert).toHaveBeenCalledTimes(2);
  expect(mocks.permission).toHaveBeenCalledWith(expect.anything(),ctx,"placements.manage",{
   collegeId:COLLEGE,organizationId:ORG,
  });
 });
 it("an audit insert failure does not claim successful note writes",async()=>{
  mocks.insert.mockImplementationOnce(()=>({
   values(){return this;},returning(){return Promise.resolve([{id:FOREIGN}]);},
  })).mockImplementationOnce(()=>({
   values(){return Promise.reject(new Error("AUDIT_WRITE_FAILED"));},
  }));
  await expect(addTpoStudentNotes(ctx,{
   membershipIds:[LEARNER],note:"Recorded privately",
  })).rejects.toThrow("AUDIT_WRITE_FAILED");
 });
 it("a disappeared student cannot be read through previously saved note URLs",async()=>{
  mocks.select.mockReturnValue({
   from(){return this;},innerJoin(){return this;},
   where(){return this;},limit(){return Promise.resolve([]);},
  });
  await expect(listTpoStudentNotes(ctx,LEARNER)).resolves.toBeNull();
  expect(mocks.select).toHaveBeenCalledTimes(1);
 });
});
