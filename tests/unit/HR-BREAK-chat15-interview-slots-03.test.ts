import {beforeEach,describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";

const mocks=vi.hoisted(()=>({
 getDb:vi.fn(),can:vi.fn(),notify:vi.fn(),insert:vi.fn(),update:vi.fn(),
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

import {writeHrInterviewSlot,listHrInterviewSlots} from "@/modules/placements/hr-interview-slot-service";

const jobId="123e4567-e89b-42d3-a456-426614174001";
const college="123e4567-e89b-42d3-a456-426614174002";
const relation="123e4567-e89b-42d3-a456-426614174003";
const roundId="123e4567-e89b-42d3-a456-426614174004";
const slotId="123e4567-e89b-42d3-a456-426614174005";
const actor="123e4567-e89b-42d3-a456-426614174006";
const job={id:jobId,collegeId:college,organizationId:"123e4567-e89b-42d3-a456-426614174007",
 companyRelationshipId:relation};
const context={user:{id:actor,platformStatus:"ACTIVE"},recruiter:{status:"ACTIVE",userId:actor}};
const future=new Date("2099-01-01T08:00:00.000Z");
const slot={id:slotId,roundId,status:"PROPOSED",version:4,bookedCount:0,capacity:2,
 createdByUserId:actor,startAt:future};
const builder=(rows:unknown[])=>({
 from(){return this;},innerJoin(){return this;},where(){return this;},
 for(){return this;},orderBy(){return this;},limit(){return Promise.resolve(rows);},
});
const tx={
 select:vi.fn(()=>builder(mocks.rows.shift()??[])),update:mocks.update,insert:mocks.insert,
};
const action=(action:"OFFER"|"BOOK"|"CANCEL",version=4)=>({
 action,slotId,expectedVersion:version,
});

describe("HR-SLOT-SERVICE-03 recruiter slot authorization and stale-window writes",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  mocks.rows=[[job],[slot]];
  mocks.getDb.mockReturnValue({transaction:(callback:(database:typeof tx)=>unknown)=>callback(tx)});
  mocks.can.mockReturnValue(true);
  mocks.notify.mockResolvedValue(undefined);
  mocks.insert.mockImplementation(()=>({values:()=>Promise.resolve([])}));
  mocks.update.mockImplementation(()=>({
   set(){return this;},where(){return this;},
   returning:()=>Promise.resolve([{id:slotId}]),
  }));
 });
 it("HR-SLOT-ARCHIVE-27 scopes both job authorization and the slot transaction to active tenant records",()=>{
  const source=readFileSync(join(process.cwd(),
   "src/modules/placements/hr-interview-slot-service.ts"),"utf8");
  const scope=source.slice(source.indexOf("async function verifyRecruiterSlotJob"),
   source.indexOf("export async function listHrInterviewSlots"));
  for(const requirement of [
   'isNull(placementJobs.archivedAt)',
   'eq(placementCompanies.status,"ACTIVE")',
   'eq(colleges.status,"ACTIVE")',
   'eq(placementCompanyRelationships.status,"ACTIVE")',
   'eq(placementRecruiterProfiles.status,"ACTIVE")',
   'eq(placementRecruiterCollegeGrants.status,"ACTIVE")',
  ])expect(scope).toContain(requirement);
  expect(source).toContain("const job=await verifyRecruiterSlotJob(tx,context,jobId)");
  expect(source.split("const job=await verifyRecruiterSlotJob(tx,context,jobId)").length-1).toBe(2);
 });
 it("HR-SLOT-SCOPE-01 rejects revoked recruiter and wrong college job before slot reads",async()=>{
  await expect(writeHrInterviewSlot(
   {...context,recruiter:{...context.recruiter,status:"REVOKED"}} as never,
   jobId,action("OFFER"),
  )).rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  expect(tx.select).not.toHaveBeenCalled();
  mocks.rows=[[]];
  await expect(writeHrInterviewSlot(context as never,jobId,action("OFFER")))
   .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  expect(tx.select).toHaveBeenCalledTimes(1);
  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.notify).not.toHaveBeenCalled();
 });
 it("HR-SLOT-SCOPE-02 rejects recruiter lacking centralized write permission",async()=>{
  mocks.can.mockImplementation((_ctx:unknown,capability:string)=>capability==="placements.recruiter.read");
  await expect(writeHrInterviewSlot(context as never,jobId,action("OFFER")))
   .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  expect(mocks.can).toHaveBeenCalledWith(context,"placements.recruiter.slot.manage",{
   collegeId:college,placementCompanyRelationshipId:relation,
  });
  expect(tx.select).toHaveBeenCalledTimes(1);
  expect(mocks.update).not.toHaveBeenCalled();
 });
 it("HR-SLOT-VERSION-01 rejects old tab token with zero writes or events",async()=>{
  await expect(writeHrInterviewSlot(context as never,jobId,action("OFFER",3)))
   .rejects.toThrow("SLOT_STALE");
  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.insert).not.toHaveBeenCalled();
  expect(mocks.notify).not.toHaveBeenCalled();
 });
 it("HR-SLOT-ACTOR-02 blocks another recruiter acting on this company's slot",async()=>{
  mocks.rows=[[job],[{...slot,createdByUserId:"123e4567-e89b-42d3-a456-426614174099"}]];
  await expect(writeHrInterviewSlot(context as never,jobId,action("OFFER")))
   .rejects.toMatchObject({code:"PLACEMENT_ROUND_NOT_FOUND"});
  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.notify).not.toHaveBeenCalled();
 });
 it("HR-SLOT-STATE-03 offers only a future proposed own slot, with one TPO alert",async()=>{
  await expect(writeHrInterviewSlot(context as never,jobId,action("OFFER")))
   .resolves.toEqual({id:slotId,status:"OFFERED"});
  expect(mocks.update).toHaveBeenCalledTimes(1);
  expect(mocks.notify).toHaveBeenCalledTimes(1);
  expect(mocks.insert).not.toHaveBeenCalled();
 });
 it("HR-SLOT-STATE-04 denies capacity full, terminal and past sessions",async()=>{
  for(const target of [
   {...slot,status:"OFFERED",bookedCount:2,capacity:2},
   {...slot,status:"CANCELLED"},
   {...slot,startAt:new Date("2000-01-01T00:00:00.000Z")},
  ]){
   mocks.rows=[[job],[target]];
   await expect(writeHrInterviewSlot(context as never,jobId,action("BOOK")))
    .rejects.toThrow("SLOT_STALE");
  }
  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.insert).not.toHaveBeenCalled();
  expect(mocks.notify).not.toHaveBeenCalled();
 });
 it("HR-SLOT-INPUT-01 rejects forged status, tenant or malformed version before starting SQL",async()=>{
  for(const bad of [
   {...action("OFFER"),collegeId:college},
   {...action("OFFER"),expectedVersion:0},
   {...action("OFFER"),expectedVersion:"x"},
   {...action("OFFER"),action:"DELETE"},
  ]){
   await expect(writeHrInterviewSlot(context as never,jobId,bad)).rejects.toThrow();
  }
  expect(mocks.getDb).not.toHaveBeenCalled();
 });
 it("HR-SLOT-READ-01 exposes read-only slot metadata without granting foreign actor mutation",async()=>{
  const view={...slot,startAt:future,endAt:new Date("2099-01-01T08:30:00.000Z"),
   mode:"VIRTUAL",panelLabel:null,meetingLocation:null};
  mocks.rows=[[job],[view]];
  await expect(listHrInterviewSlots(context as never,jobId)).resolves.toMatchObject({
   status:"READY",items:[{id:slotId,isOwn:true,canEdit:true}],
  });
  mocks.rows=[[job],[{...view,createdByUserId:"123e4567-e89b-42d3-a456-426614174099"}]];
  await expect(listHrInterviewSlots(context as never,jobId)).resolves.toMatchObject({
   status:"READY",items:[{id:slotId,isOwn:false,canEdit:false}],
  });
  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.notify).not.toHaveBeenCalled();
 });
 it("HR-SLOT-READ-02 denies cross-tenant or expired grants before returning scheduling metadata",async()=>{
  mocks.can.mockReturnValue(false);
  mocks.rows=[[job],[slot]];
  await expect(listHrInterviewSlots(context as never,jobId))
   .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  expect(tx.select).toHaveBeenCalledTimes(1);
  expect(mocks.update).not.toHaveBeenCalled();
 });

});
