import {beforeEach,describe,expect,it,vi} from "vitest";
const m=vi.hoisted(()=>({
 getDb:vi.fn(),select:vi.fn(),can:vi.fn(),rows:[] as unknown[][],
}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:m.getDb}));
vi.mock("@/modules/permissions/policy",()=>({can:m.can}));
vi.mock("@/modules/placements/recruiter-job-ownership",()=>({
 recruiterOwnJobPredicate:()=>undefined,
}));
vi.mock("@/modules/placements/hr-tpo-notification-service",()=>({
 notifyTpoOfRecruiterAction:vi.fn(),
}));

import {listHrRoundEditorRows} from "@/modules/placements/hr-round-editor-service";
const jobId="123e4567-e89b-42d3-a456-426614174001";
const collegeId="123e4567-e89b-42d3-a456-426614174002";
const relationshipId="123e4567-e89b-42d3-a456-426614174003";
const actor="123e4567-e89b-42d3-a456-426614174004";
const owner={user:{id:actor,platformStatus:"ACTIVE"},
 recruiter:{userId:actor,status:"ACTIVE"}};
const job={id:jobId,collegeId,companyRelationshipId:relationshipId};
const round=(id:string,patch:Record<string,unknown>={})=>({
 id,kind:"INTERVIEW",name:"Interview",mode:"VIRTUAL",status:"PENDING",
 durationMinutes:30,createdByUserId:actor,updatedAt:new Date("2099-01-01T00:00:00.000Z"),
 sequence:1,...patch,
});
const first="123e4567-e89b-42d3-a456-426614174010";
const second="123e4567-e89b-42d3-a456-426614174011";
const third="123e4567-e89b-42d3-a456-426614174012";
function query(items:unknown[]){
 return {
  from(){return this;},innerJoin(){return this;},where(){return this;},
  orderBy(){return Promise.resolve(items);},
  groupBy(){return Promise.resolve(items);},
  limit(){return Promise.resolve(items);},
 };
}
describe("HR-ROUND-LIST-05 scoped recruiter round editor reads",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  m.rows=[[job],[],[],[]];
  m.select.mockImplementation(()=>query(m.rows.shift()??[]));
  m.getDb.mockReturnValue({select:m.select});
  m.can.mockReturnValue(true);
 });
 it("rejects expired or disabled recruiter identity before any DB read",async()=>{
  for(const input of [
   {...owner,recruiter:{...owner.recruiter,status:"REVOKED"}},
   {...owner,recruiter:{...owner.recruiter,userId:"another-user"}},
   {...owner,recruiter:null},
  ]){
   await expect(listHrRoundEditorRows(input as never,jobId))
    .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  }
  expect(m.getDb).not.toHaveBeenCalled();
 });
 it("does not list foreign-tenant jobs when row is absent or authorization is revoked",async()=>{
  m.rows=[[]];
  await expect(listHrRoundEditorRows(owner as never,jobId))
   .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  expect(m.select).toHaveBeenCalledTimes(1);
  m.select.mockClear();
  m.can.mockReturnValue(false);
  m.rows=[[job]];
  await expect(listHrRoundEditorRows(owner as never,jobId))
   .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  expect(m.select).toHaveBeenCalledTimes(1);
  expect(m.can).toHaveBeenCalledWith(owner,"placements.recruiter.round.manage",{
   collegeId,placementCompanyRelationshipId:relationshipId,
  });
 });
 it("never reveals canceled rounds and makes another creator's rounds read-only",async()=>{
  m.rows=[[job],[
   round(first),
   round(second,{createdByUserId:"other-recruiter"}),
   round(third,{status:"CANCELLED"}),
  ],[],[]];
  const rows=await listHrRoundEditorRows(owner as never,jobId);
  expect(rows.map(row=>row.id)).toEqual([first,second]);
  expect(rows.map(row=>row.editable)).toEqual([true,false]);
  expect(rows.every(row=>row.hasResults===false&&row.hasSlots===false)).toBe(true);
 });
 it("locks owned rounds after a recorded result or interview slot",async()=>{
  m.rows=[[job],[round(first),round(second)], [{roundId:first}], [{roundId:second}]];
  const rows=await listHrRoundEditorRows(owner as never,jobId);
  expect(rows.map(row=>({id:row.id,editable:row.editable,results:row.hasResults,slots:row.hasSlots})))
   .toEqual([
    {id:first,editable:false,results:true,slots:false},
    {id:second,editable:false,results:false,slots:true},
   ]);
 });
 it("rejects arbitrary job identifiers before any database query",async()=>{
  await expect(listHrRoundEditorRows(owner as never,"not-a-uuid")).rejects.toThrow();
  expect(m.getDb).not.toHaveBeenCalled();
 });
});
