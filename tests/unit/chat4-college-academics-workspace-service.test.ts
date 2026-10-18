import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RequestContext } from "@/modules/identity/context";

const mocks=vi.hoisted(()=>({
 departments:vi.fn(),periods:vi.fn(),programs:vi.fn(),cohorts:vi.fn(),sections:vi.fn(),
}));
vi.mock("@/modules/departments/service",()=>({listDepartments:mocks.departments}));
vi.mock("@/modules/academics/period-service",()=>({listAcademicPeriods:mocks.periods}));
vi.mock("@/modules/academics/program-service",()=>({listPrograms:mocks.programs}));
vi.mock("@/modules/academics/cohort-service",()=>({listCohorts:mocks.cohorts}));
vi.mock("@/modules/academics/section-service",()=>({listSections:mocks.sections}));

import {
  mapAcademicWorkspaceInBatches, getAcademicsWorkspace,
} from "@/modules/academics/workspace";

const collegeId="11111111-1111-4111-8111-111111111111";
const actor:RequestContext={
 user:{id:"admin",identityUid:"admin",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"member",collegeId,organizationId:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};

beforeEach(()=>{
 for(const fn of Object.values(mocks))fn.mockReset();
});

describe("COL-academics-workspace-01 bounded academic workspace composition",()=>{
 it("respects at most eight concurrent reads and preserves input order despite await points",async()=>{
  let active=0,maximum=0;
  const input=Array.from({length:85},(_,i)=>i);
  const result=await mapAcademicWorkspaceInBatches(input,async value=>{
   active++;
   maximum=Math.max(maximum,active);
   await Promise.resolve();
   await Promise.resolve();
   active--;
   return value*2;
  });
  expect(result).toEqual(input.map(i=>i*2));
  expect(maximum).toBeLessThanOrEqual(8);
  expect(maximum).toBe(8);
  expect(active).toBe(0);
 });
 it("fails closed for unsafe concurrency values before calling the mapper",async()=>{
  const mapper=vi.fn(async (value:number)=>value);
  for(const concurrency of [0,-1,1.5,33,Infinity,NaN]){
   await expect(mapAcademicWorkspaceInBatches([1],mapper,concurrency)).rejects.toThrow(RangeError);
  }
  expect(mapper).not.toHaveBeenCalled();
 });
 it("does not schedule later batches after a failed read",async()=>{
  const called:number[]=[];
  await expect(mapAcademicWorkspaceInBatches([1,2,3,4],async value=>{
   called.push(value);
   if(value===2)throw new Error("READ_FAILED");
   return value;
  },2)).rejects.toThrow("READ_FAILED");
  expect(called).toEqual([1,2]);
 });
 it("passes the acting context through each dependent service and joins sections by their own academic period",async()=>{
  const periodA="20000000-0000-4000-8000-000000000001";
  const periodB="20000000-0000-4000-8000-000000000002";
  mocks.departments.mockResolvedValue([{id:"d1",name:"Engineering"}]);
  mocks.periods.mockResolvedValue([
   {id:periodA,name:"2029 Autumn",code:"AUT29"},
   {id:periodB,name:"2030 Spring",code:"SPR30"},
  ]);
  mocks.programs.mockResolvedValue([
   {id:"p1",name:"Computing",code:"CSE"},
   {id:"p2",name:"Mechanical",code:"ME"},
  ]);
  mocks.cohorts.mockImplementation(async (_context:RequestContext,id:string)=>
   [{id:id+"-cohort",name:"Batch",code:id+"C"}]);
  mocks.sections.mockImplementation(async (_context:RequestContext,id:string)=>
   [{id:id+"-section",name:"Section A",code:"A",
     academicPeriodId:id.startsWith("p1")?periodB:periodA}]);
  const result=await getAcademicsWorkspace(actor,collegeId);
  expect(result.departments).toEqual([{id:"d1",name:"Engineering"}]);
  expect(result.sections).toHaveLength(2);
  expect(result.sections[0]).toMatchObject({
   id:"p1-cohort-section",programId:"p1",programName:"Computing",
   academicPeriodName:"2030 Spring",academicPeriodCode:"SPR30",
  });
  expect(result.sections[1]).toMatchObject({
   id:"p2-cohort-section",programId:"p2",programName:"Mechanical",
   academicPeriodName:"2029 Autumn",academicPeriodCode:"AUT29",
  });
  for(const fn of [mocks.departments,mocks.periods,mocks.programs]){
   expect(fn).toHaveBeenCalledWith(actor,collegeId);
  }
  expect(mocks.cohorts).toHaveBeenCalledWith(actor,"p1");
  expect(mocks.cohorts).toHaveBeenCalledWith(actor,"p2");
  expect(mocks.sections).toHaveBeenCalledWith(actor,"p1-cohort");
  expect(mocks.sections).toHaveBeenCalledWith(actor,"p2-cohort");
 });
 it("labels orphaned foreign period IDs unknown instead of inventing a period name",async()=>{
  mocks.departments.mockResolvedValue([]);
  mocks.periods.mockResolvedValue([]);
  mocks.programs.mockResolvedValue([{id:"p1",name:"Computing",code:"CSE"}]);
  mocks.cohorts.mockResolvedValue([{id:"c1",name:"Batch",code:"C"}]);
  mocks.sections.mockResolvedValue([{id:"s1",academicPeriodId:"foreign-id"}]);
  const result=await getAcademicsWorkspace(actor,collegeId);
  expect(result.sections[0]).toMatchObject({
   academicPeriodName:"Unknown period",academicPeriodCode:"—",
  });
 });
});
