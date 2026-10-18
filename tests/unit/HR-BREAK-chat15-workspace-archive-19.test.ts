import {beforeEach,describe,expect,it,vi} from "vitest";
const mock=vi.hoisted(()=>({getDb:vi.fn(),select:vi.fn(),visible:vi.fn(),can:vi.fn(),scope:null as unknown}));
vi.mock("@/db/client",()=>({getDb:mock.getDb}));
vi.mock("@/modules/permissions/policy",()=>({can:mock.can}));
vi.mock("@/modules/placements/recruiter-job-visibility-model",()=>({
 isRecruiterJobVisible:mock.visible,
}));
vi.mock("@/modules/placements/recruiter-job-ownership",()=>({
 recruiterOwnJobPredicate:()=>undefined,
}));

import {getRecruiterPlacementWorkspace}
 from "@/modules/placements/recruiter-workspace-service";

const jobId="123e4567-e89b-42d3-a456-426614174001";
const actor="123e4567-e89b-42d3-a456-426614174002";
const context={user:{id:actor,platformStatus:"ACTIVE"},recruiter:{
 userId:actor,companyId:"employer-a",status:"ACTIVE",grants:[],
}};
function query(rows:unknown[]){
 return {from(){return this;},innerJoin(){return this;},where(){return this;},
  limit(){return Promise.resolve(rows);}};
}
const row=(status:"PUBLISHED"|"CLOSED"|"DRAFT",archivedAt:Date|null)=>({
 job:{id:jobId,status,archivedAt,collegeId:"college-a"},
 relationshipId:"relationship-a",companyId:"employer-a",collegeId:"college-a",
 collegeName:"College A",
});
describe("HR-WORKSPACE-ARCHIVE-19 employer can't read archived candidates or round metadata",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  mock.visible.mockReturnValue(false);
  mock.can.mockReturnValue(true);
  mock.select.mockImplementation(()=>query(mock.scope?[mock.scope]:[]));
  mock.getDb.mockReturnValue({select:mock.select});
 });
 it("rejects both archived live and archived closed drives before permission or candidate lookups",async()=>{
  for(const status of ["PUBLISHED","CLOSED"] as const){
   mock.scope=row(status,new Date("2099-01-01T00:00:00.000Z"));
   await expect(getRecruiterPlacementWorkspace(context as never,jobId))
    .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  }
  expect(mock.select).toHaveBeenCalledTimes(2);
  expect(mock.visible).not.toHaveBeenCalled();
  expect(mock.can).not.toHaveBeenCalled();
 });
 it("unpublished or missing drives are indistinguishable from archived jobs",async()=>{
  mock.scope=row("DRAFT",null);
  await expect(getRecruiterPlacementWorkspace(context as never,jobId))
   .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  mock.scope=null;
  await expect(getRecruiterPlacementWorkspace(context as never,jobId))
   .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  expect(mock.visible).not.toHaveBeenCalled();
  expect(mock.select).toHaveBeenCalledTimes(2);
 });
 it("non-archived PUBLISHED and CLOSED records advance to normal authorization checks",async()=>{
  for(const status of ["PUBLISHED","CLOSED"] as const){
   mock.scope=row(status,null);
   await expect(getRecruiterPlacementWorkspace(context as never,jobId))
    .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  }
  expect(mock.visible).toHaveBeenCalledTimes(2);
  expect(mock.select).toHaveBeenCalledTimes(2);
 });
});
