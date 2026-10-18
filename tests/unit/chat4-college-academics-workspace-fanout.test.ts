import {afterEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {
 getAcademicsWorkspace,mapAcademicWorkspaceInBatches,
} from "@/modules/academics/workspace";

const mocks=vi.hoisted(()=>({
 departments:vi.fn(),periods:vi.fn(),programs:vi.fn(),cohorts:vi.fn(),sections:vi.fn(),
}));
vi.mock("@/modules/departments/service",()=>({listDepartments:mocks.departments}));
vi.mock("@/modules/academics/period-service",()=>({listAcademicPeriods:mocks.periods}));
vi.mock("@/modules/academics/program-service",()=>({listPrograms:mocks.programs}));
vi.mock("@/modules/academics/cohort-service",()=>({listCohorts:mocks.cohorts}));
vi.mock("@/modules/academics/section-service",()=>({listSections:mocks.sections}));

const college="11111111-1111-4111-8111-111111111111";
const org="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const actor:RequestContext={
 user:{id:"admin",identityUid:"admin",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"membership",collegeId:college,organizationId:org,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
afterEach(()=>{for(const fn of Object.values(mocks))fn.mockReset()});

describe("College Academics workspace exhaustive navigation and bounded fanout",()=>{
 it("COL-academics-workspace-PERF-01 handles 25 cohorts at most eight queries in flight, without truncation or reordering",async()=>{
  const input=Array.from({length:25},(_,i)=>i);
  let inFlight=0,peak=0;
  const result=await mapAcademicWorkspaceInBatches(input,async item=>{
   inFlight++;peak=Math.max(peak,inFlight);
   await Promise.resolve();
   inFlight--;
   return item*2;
  });
  expect(result).toEqual(input.map(x=>x*2));
  expect(inFlight).toBe(0);
  expect(peak).toBe(8);
 });
 it("COL-academics-workspace-PERF-02 rejects unbounded fanout and propagates real query failures",async()=>{
  for(const concurrency of [0,-1,1.5,33,Infinity,NaN]){
   await expect(mapAcademicWorkspaceInBatches([1],async n=>n,concurrency))
    .rejects.toThrow("INVALID_ACADEMIC_WORKSPACE_CONCURRENCY");
  }
  const visit:number[]=[];
  await expect(mapAcademicWorkspaceInBatches([1,2,3,4],async value=>{
   visit.push(value);
   if(value===2)throw new Error("DATABASE_UNAVAILABLE");
   return value;
  },2)).rejects.toThrow("DATABASE_UNAVAILABLE");
  expect(visit).toEqual([1,2]);
 });
 it("COL-academics-workspace-01 fetches program/batch/section groups with the same current actor and preserves period labels",async()=>{
  mocks.departments.mockResolvedValue([{id:"dept"}]);
  mocks.periods.mockResolvedValue([{id:"period-1",name:"July term",code:"26A"}]);
  mocks.programs.mockResolvedValue([
   {id:"p-1",name:"B.Tech CS",code:"CS"},
   {id:"p-2",name:"B.Tech EC",code:"EC"},
  ]);
  mocks.cohorts.mockImplementation(async (_:RequestContext,p:string)=>p==="p-1"
   ?[{id:"c-1",programId:p,name:"CS 2026",code:"26CS"}]
   :[{id:"c-2",programId:p,name:"EC 2026",code:"26EC"}]);
  mocks.sections.mockImplementation(async (_:RequestContext,c:string)=>
   [{id:"s-"+c,academicPeriodId:c==="c-1"?"period-1":"unknown",name:"Class A",code:"A"}]);
  const result=await getAcademicsWorkspace(actor,college);
  expect(result.departments).toEqual([{id:"dept"}]);
  expect(result.periods).toHaveLength(1);
  expect(result.programs).toHaveLength(2);
  expect(result.cohorts.map(row=>row.programName)).toEqual(["B.Tech CS","B.Tech EC"]);
  expect(result.sections).toMatchObject([
   {id:"s-c-1",cohortName:"CS 2026",programName:"B.Tech CS",academicPeriodName:"July term",academicPeriodCode:"26A"},
   {id:"s-c-2",cohortName:"EC 2026",programName:"B.Tech EC",academicPeriodName:"Unknown period",academicPeriodCode:"—"},
  ]);
  expect(mocks.departments).toHaveBeenCalledWith(actor,college);
  expect(mocks.periods).toHaveBeenCalledWith(actor,college);
  expect(mocks.programs).toHaveBeenCalledWith(actor,college);
  expect(mocks.cohorts).toHaveBeenCalledWith(actor,"p-1");
  expect(mocks.cohorts).toHaveBeenCalledWith(actor,"p-2");
  expect(mocks.sections).toHaveBeenCalledWith(actor,"c-1");
  expect(mocks.sections).toHaveBeenCalledWith(actor,"c-2");
 });
});