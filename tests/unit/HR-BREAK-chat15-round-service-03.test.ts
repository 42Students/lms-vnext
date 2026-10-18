import {beforeEach,describe,expect,it,vi} from "vitest";
const mocks=vi.hoisted(()=>({
 getDb:vi.fn(),can:vi.fn(),notify:vi.fn(),update:vi.fn(),insert:vi.fn(),
 rows:[] as unknown[][],
}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:mocks.getDb}));
vi.mock("@/modules/permissions/policy",()=>({can:mocks.can}));
vi.mock("@/modules/placements/recruiter-job-ownership",()=>({
 recruiterOwnJobPredicate:()=>undefined,
}));
vi.mock("@/modules/placements/hr-tpo-notification-service",()=>({
 notifyTpoOfRecruiterAction:mocks.notify,
}));

import {editHrJobRound} from "@/modules/placements/hr-round-editor-service";

const id="123e4567-e89b-42d3-a456-426614174001";
const roundId="123e4567-e89b-42d3-a456-426614174002";
const creator="123e4567-e89b-42d3-a456-426614174003";
const college="123e4567-e89b-42d3-a456-426614174004";
const relation="123e4567-e89b-42d3-a456-426614174005";
const version=new Date("2026-10-18T10:00:00.123Z");
const context={user:{id:creator},recruiter:{status:"ACTIVE",userId:creator}};
const job={id,collegeId:college,companyRelationshipId:relation,
 organizationId:"123e4567-e89b-42d3-a456-426614174006",status:"DRAFT"};
const ownRound={id:roundId,name:"Technical",sequence:1,status:"PENDING",
 createdByUserId:creator,updatedAt:version};
const builder=(items:unknown[])=>({
 from(){return this;},innerJoin(){return this;},where(){return this;},
 for(){return this;},orderBy(){return Promise.resolve(items);},
 limit(){return Promise.resolve(items);},
});
const tx={
 select:vi.fn(()=>builder(mocks.rows.shift()??[])),
 update:mocks.update,
 insert:mocks.insert,
};

const input=(expectedUpdatedAt:string)=>({
 action:"UPDATE" as const,roundId,expectedUpdatedAt,name:"Technical interview",
});

describe("HR-BREAK-chat15-round-service-03: transactional recruiter round changes",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  mocks.rows=[[job],[ownRound],[],[]];
  mocks.getDb.mockReturnValue({transaction:(fn:(database:typeof tx)=>unknown)=>fn(tx)});
  mocks.can.mockReturnValue(true);
  mocks.notify.mockResolvedValue(undefined);
  mocks.update.mockImplementation(()=>({
   set(){return this;},where(){return this;},
   returning:()=>Promise.resolve([{id:roundId}]),
  }));
  mocks.insert.mockImplementation(()=>({values:()=>Promise.resolve([])}));
 });
 it("accepts an IST token representing the same version and appends exactly one event and TPO notification",async()=>{
  await expect(editHrJobRound(context as never,id,input("2026-10-18T15:30:00.123+05:30")))
   .resolves.toEqual({id:roundId,action:"UPDATED"});
  expect(mocks.update).toHaveBeenCalledTimes(1);
  expect(mocks.insert).toHaveBeenCalledTimes(1);
  expect(mocks.notify).toHaveBeenCalledTimes(1);
 });
 it("rejects stale browser versions without mutating or notifying",async()=>{
  await expect(editHrJobRound(context as never,id,input("2026-10-18T10:00:00.122Z")))
   .rejects.toMatchObject({code:"PLACEMENT_ROUND_STALE"});
  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.insert).not.toHaveBeenCalled();
  expect(mocks.notify).not.toHaveBeenCalled();
 });
 it("denies suspended recruiter before even constructing a transaction",async()=>{
  await expect(editHrJobRound({...context,recruiter:{...context.recruiter,status:"SUSPENDED"}} as never,
   id,input(version.toISOString()))).rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  expect(mocks.getDb).not.toHaveBeenCalled();
 });
 it("rejects foreign college, employer or TPO-only roles using live authorization",async()=>{
  mocks.can.mockReturnValue(false);
  await expect(editHrJobRound(context as never,id,input(version.toISOString())))
   .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.notify).not.toHaveBeenCalled();
 });
 it("rejects a missing scoped job before inspecting or changing rounds",async()=>{
  mocks.rows=[[]];
  await expect(editHrJobRound(context as never,id,input(version.toISOString())))
   .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  expect(tx.select).toHaveBeenCalledTimes(1);
  expect(mocks.update).not.toHaveBeenCalled();
 });
 it("cannot edit rounds with results, confirmed slots, wrong creator or non-pending status",async()=>{
  for(const scenario of [
   [[job],[ownRound],[{id}],[]],
   [[job],[ownRound],[],[{id}]],
   [[job],[{...ownRound,createdByUserId:college}],[],[]],
   [[job],[{...ownRound,status:"SCHEDULED"}],[],[]],
  ]){
   mocks.rows=scenario;
   await expect(editHrJobRound(context as never,id,input(version.toISOString())))
    .rejects.toMatchObject({code:"PLACEMENT_ROUND_STALE"});
   expect(mocks.update).not.toHaveBeenCalled();
   expect(mocks.notify).not.toHaveBeenCalled();
  }
 });
 it("passes database CAS failure back as a version conflict, not a successful write",async()=>{
  mocks.update.mockImplementation(()=>({
   set(){return this;},where(){return this;},
   returning:()=>Promise.resolve([]),
  }));
  await expect(editHrJobRound(context as never,id,input(version.toISOString())))
   .rejects.toMatchObject({code:"PLACEMENT_ROUND_STALE"});
  expect(mocks.insert).not.toHaveBeenCalled();
  expect(mocks.notify).not.toHaveBeenCalled();
 });
});

describe("HR-ROUND-AUTH-04: denied, duplicate and replay-resistant recruiter stages",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  mocks.rows=[[job],[ownRound],[],[]];
  mocks.getDb.mockReturnValue({transaction:(fn:(db:typeof tx)=>unknown)=>fn(tx)});
  mocks.can.mockReturnValue(true);
  mocks.notify.mockResolvedValue(undefined);
  mocks.insert.mockImplementation(()=>({values:()=>Promise.resolve([])}));
  mocks.update.mockImplementation(()=>({
   set(){return this;},where(){return this;},
   returning:()=>Promise.resolve([{id:roundId}]),
  }));
 });
 it("HR-ROUND-INPUT-01 rejects malformed job IDs and cross-scope payload fields before SQL",async()=>{
  for(const [jobId,payload] of [
   ["not-a-uuid",input(version.toISOString())],
   [id,{...input(version.toISOString()),collegeId:college}],
   [id,{action:"CREATE",kind:"INTERVIEW",name:" " }],
   [id,{action:"REMOVE",roundId,expectedUpdatedAt:version.toISOString(),name:"sneaky"}],
   [id,{action:"UPDATE",roundId,expectedUpdatedAt:"stale",name:"Changed"}],
  ] as const){
   await expect(editHrJobRound(context as never,jobId,payload)).rejects.toThrow();
  }
  expect(mocks.getDb).not.toHaveBeenCalled();
  expect(mocks.insert).not.toHaveBeenCalled();
  expect(mocks.update).not.toHaveBeenCalled();
 });
 it("HR-ROUND-CREATE-01 adds only a recruiter-owned round, one event and one TPO notification",async()=>{
  mocks.rows=[[job],[]];
  mocks.insert.mockImplementationOnce(()=>({values:()=>({
   returning:()=>Promise.resolve([{id:roundId}]),
  })})).mockImplementationOnce(()=>({values:()=>Promise.resolve([])}));
  await expect(editHrJobRound(context as never,id,{
   action:"CREATE",kind:"INTERVIEW",name:"Technical panel",
   mode:"VIRTUAL",durationMinutes:30,
  })).resolves.toEqual({id:roundId,action:"CREATED"});
  expect(mocks.insert).toHaveBeenCalledTimes(2);
  expect(mocks.notify).toHaveBeenCalledTimes(1);
  expect(mocks.update).not.toHaveBeenCalled();
 });
 it("HR-ROUND-CREATE-02 rejects canonical duplicate names and the 12-stage limit without side effects",async()=>{
  mocks.rows=[[job],[{...ownRound,name:"Technical"}]];
  await expect(editHrJobRound(context as never,id,{
   action:"CREATE",kind:"INTERVIEW",name:"  TECHNICAL  ",
  })).rejects.toMatchObject({code:"PLACEMENT_ROUND_NOT_EDITABLE"});
  expect(mocks.insert).not.toHaveBeenCalled();
  expect(mocks.notify).not.toHaveBeenCalled();
  const rows=Array.from({length:12},(_,index)=>({
   ...ownRound,id:String(index),name:"Round "+index,sequence:index+1,
  }));
  mocks.rows=[[job],rows];
  await expect(editHrJobRound(context as never,id,{
   action:"CREATE",kind:"INTERVIEW",name:"Extra",
  })).rejects.toMatchObject({code:"PLACEMENT_ROUND_NOT_EDITABLE"});
  expect(mocks.insert).not.toHaveBeenCalled();
  expect(mocks.notify).not.toHaveBeenCalled();
 });
 it("HR-ROUND-REMOVE-01 cancels a pending owned round and emits one notification",async()=>{
  await expect(editHrJobRound(context as never,id,{
   action:"REMOVE",roundId,expectedUpdatedAt:version.toISOString(),
  })).resolves.toEqual({id:roundId,action:"REMOVED"});
  expect(mocks.update).toHaveBeenCalledTimes(1);
  expect(mocks.insert).toHaveBeenCalledTimes(1);
  expect(mocks.notify).toHaveBeenCalledTimes(1);
 });
 it("HR-ROUND-REMOVE-02 refuses cancellation after a slot or result attaches",async()=>{
  for(const rows of [
   [[job],[ownRound],[{id:roundId}],[]],
   [[job],[ownRound],[],[{id:roundId}]],
  ]){
   mocks.rows=rows;
   await expect(editHrJobRound(context as never,id,{
    action:"REMOVE",roundId,expectedUpdatedAt:version.toISOString(),
   })).rejects.toMatchObject({code:"PLACEMENT_ROUND_STALE"});
  }
  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.insert).not.toHaveBeenCalled();
  expect(mocks.notify).not.toHaveBeenCalled();
 });
});
