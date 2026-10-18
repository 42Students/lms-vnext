import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {
 mapFacultyLiveWorkspacesInBatches,
} from "@/modules/courses/faculty-live-classes-model";

vi.mock("server-only",()=>({}));
const stubs=vi.hoisted(()=>({deliveries:vi.fn(),workspace:vi.fn()}));
vi.mock("@/modules/courses/faculty-course-service",()=>({
 listFacultyCourseDeliveries:stubs.deliveries,
 getFacultyCourseWorkspace:stubs.workspace,
}));
import {getFacultyLiveClasses} from "@/modules/courses/faculty-live-classes-service";
const own="11111111-1111-4111-8111-111111111111";
const other="22222222-2222-4222-8222-222222222222";
const organizationId="33333333-3333-4333-8333-333333333333";
const collegeId="44444444-4444-4444-8444-444444444444";
const faculty:RequestContext={
 user:{id:"teacher",identityUid:"teacher",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"faculty-member",collegeId,organizationId,status:"ACTIVE",roles:["FACULTY"]},
};
beforeEach(()=>{
 vi.resetAllMocks();
 stubs.deliveries.mockResolvedValue([
  {deliveryId:own,courseName:"History",sectionName:"A"},
 ]);
 stubs.workspace.mockResolvedValue({
  course:{deliveryId:own,courseName:"History",sectionName:"A"},
  lessons:[{id:"lesson",name:"Intro",contents:[{
   id:"session",title:"Meeting",contentType:"LIVE_CLASS",
   startsAt:new Date("2099-01-01T09:00:00Z"),endsAt:new Date("2099-01-01T10:00:00Z"),
   status:"PUBLISHED",externalUrl:"https://meet.example/lesson",
  }]}],
 });
});
describe("FAC-LIVE-SCALE-01 Faculty live classes bounded Section reads",()=>{
 it("shows only own teaching sessions and sanitized meeting links",async()=>{
  const result=await getFacultyLiveClasses(faculty,{view:"ALL",deliveryId:own});
  expect(result.items).toHaveLength(1);
  expect(result.items[0]).toMatchObject({
   id:"session",deliveryId:own,joinUrl:"https://meet.example/lesson",
  });
  expect(stubs.workspace).toHaveBeenCalledWith(faculty,own);
 });
 it("denies forged delivery filter before fetching any Section workspace",async()=>{
  await expect(getFacultyLiveClasses(faculty,{view:"ALL",deliveryId:other}))
   .rejects.toMatchObject({code:"FACULTY_TEACHING_SCOPE_REQUIRED"});
  expect(stubs.workspace).not.toHaveBeenCalled();
 });
 it("denies Mentor, Learner, College Admin and inactive Faculty before loading teaching choices",async()=>{
  const bad:RequestContext[]=[
   ...(["MENTOR","LEARNER","COLLEGE_ADMIN"] as const).map(role=>({
    ...faculty,membership:{...faculty.membership!,roles:[role]},
   })),
   {...faculty,membership:{...faculty.membership!,status:"SUSPENDED"}},
   {...faculty,user:{...faculty.user,platformStatus:"DISABLED"}},
  ];
  for(const actor of bad)await expect(getFacultyLiveClasses(actor,{view:"ALL"}))
   .rejects.toMatchObject({code:"FACULTY_TEACHING_SCOPE_REQUIRED"});
  expect(stubs.deliveries).not.toHaveBeenCalled();
  expect(stubs.workspace).not.toHaveBeenCalled();
 });
 it("rejects extra college selectors before querying roster choices",async()=>{
  for(const query of [
   {view:"ALL",collegeId:other},{view:"ALL",deliveryId:["a","b"]},
   {view:"UNKNOWN"},{view:"ALL",page:0},
  ])await expect(getFacultyLiveClasses(faculty,query)).rejects.toThrow();
  expect(stubs.deliveries).not.toHaveBeenCalled();
 });
 it("preserves ordering of 20 Sections while never opening more than 8 reads at once",async()=>{
  let active=0,maxActive=0;
  const vals=Array.from({length:20},(_,i)=>i);
  const result=await mapFacultyLiveWorkspacesInBatches(vals,async i=>{
   active++;
   maxActive=Math.max(maxActive,active);
   for(let j=0;j<i%3;j++)await Promise.resolve();
   active--;
   return i*2;
  });
  expect(result).toEqual(vals.map(i=>i*2));
  expect(maxActive).toBe(8);
  expect(active).toBe(0);
 });
 it("rejects unsafe concurrency and never launches later batches when earlier reads fail",async()=>{
  for(const concurrency of [0,-1,9,1.5,Number.NaN]){
   await expect(mapFacultyLiveWorkspacesInBatches([1],async x=>x,concurrency))
    .rejects.toThrow("INVALID_FACULTY_LIVE_WORKSPACE_CONCURRENCY");
  }
  const started:number[]=[];
  await expect(mapFacultyLiveWorkspacesInBatches([1,2,3,4],async n=>{
   started.push(n);
   if(n===2)throw new Error("Teaching grant revoked");
   return n;
  },2)).rejects.toThrow("Teaching grant revoked");
  expect(started).toEqual([1,2]);
 });
});