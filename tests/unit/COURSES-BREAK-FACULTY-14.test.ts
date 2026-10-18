import {beforeEach,describe,expect,it,vi} from "vitest";
import {commandFacultyAttendanceSchedule}
 from "@/modules/attendance/faculty-schedule-mutation-service";
import type {RequestContext} from "@/modules/identity/context";

const deliveryId="11111111-1111-4111-8111-111111111111";
const collegeId="22222222-2222-4222-8222-222222222222";
const organizationId="33333333-3333-4333-8333-333333333333";
const sectionId="44444444-4444-4444-8444-444444444444";
const state=vi.hoisted(()=>({
 persistedDenied:false,authChecks:0,locks:0,selects:0,inserts:0,
 writes:0,events:0,offerings:0,
}));
vi.mock("server-only",()=>({}));
vi.mock("@/modules/permissions/policy",()=>({can:()=>true}));
vi.mock("@/modules/courses/faculty-course-service",()=>({
 listFacultyCourseDeliveries:async()=>{
  state.offerings++;
  return [{deliveryId,sectionId,academicPeriodStatus:"ACTIVE",
   periodStartDate:"2026-10-01",periodEndDate:"2026-12-31"}];
 },
}));
vi.mock("@/modules/courses/faculty-persisted-teaching-guard",()=>({
 assertPersistedFacultyTeachingMutation:async()=>{
  state.authChecks++;
  if(state.persistedDenied)
   throw Object.assign(new Error("revoked"),{code:"FACULTY_TEACHING_SCOPE_REQUIRED"});
 },
}));
vi.mock("@/modules/activity/service",()=>({
 recordActivityEventInTransaction:async()=>{state.events++;return {id:"event"};},
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({transaction:async(cb:(tx:unknown)=>Promise<unknown>)=>{
  const tx={
   execute:async()=>{state.locks++;},
   select:()=>({from:()=>({where:()=>({
    limit:async()=>{state.selects++;return [];},
   })})}),
   insert:()=>({values:()=>({
    returning:async()=>{
     state.inserts++;state.writes++;
     return [{id:"session",status:"SCHEDULED",
      updatedAt:new Date("2026-11-04T12:00:00Z"),
      title:"Lecture"}];
    },
    then:(resolve:(x:unknown)=>unknown)=>{state.inserts++;state.writes++;return Promise.resolve(resolve([]));},
   })}),
  };
  return cb(tx);
 }}),
}));
const context:RequestContext={
 user:{id:"55555555-5555-4555-8555-555555555555",
  platformStatus:"ACTIVE",identityUid:"faculty",systemRoles:[]},
 membership:{id:"66666666-6666-4666-8666-666666666666",
  collegeId,organizationId,status:"ACTIVE",roles:["FACULTY"]},
};
const command=(actor:RequestContext=context,raw:unknown={
 action:"CREATE",confirm:true,title:"Lecture",description:null,location:null,
 startsAt:"2026-11-05T05:00:00Z",endsAt:"2026-11-05T06:00:00Z",
})=>commandFacultyAttendanceSchedule(actor,{deliveryId},raw);

describe("COURSES-BREAK-FACULTY-14 persisted Faculty schedule privilege at write time",()=>{
 beforeEach(()=>{
  state.persistedDenied=false;state.authChecks=0;state.locks=0;
  state.selects=0;state.inserts=0;state.writes=0;state.events=0;
  state.offerings=0;
 });
 it("FAC-attendance-grades-03 revoked teaching grant after UI load prevents insert and activity",async()=>{
  state.persistedDenied=true;
  await expect(command()).rejects.toMatchObject({code:"FACULTY_TEACHING_SCOPE_REQUIRED"});
  expect(state).toMatchObject({locks:2,authChecks:1,selects:0,
   inserts:0,writes:0,events:0});
 });
 it("FAC-attendance-grades-03 valid author reaches the guarded conflict read before any insert",async()=>{
  const result=await command();
  expect(result).toMatchObject({id:"session",status:"SCHEDULED"});
  expect(state).toMatchObject({locks:2,authChecks:1,selects:1,events:1});
  expect(state.inserts).toBe(2);
 });
 it("FAC-attendance-grades-03 suspended, disabled and non-Faculty account fail before transaction",async()=>{
  const actors=[
   {...context,membership:{...context.membership!,status:"ENDED" as const}},
   {...context,membership:{...context.membership!,roles:["LEARNER"] as const}},
   {...context,user:{...context.user,platformStatus:"DISABLED" as const}},
  ];
  for(const actor of actors){
   await expect(command(actor)).rejects.toThrow();
  }
  expect(state).toMatchObject({authChecks:0,selects:0,inserts:0,events:0});
 });
 it("FAC-attendance-grades-03 malformed and unconfirmed payload cannot hold schedule locks",async()=>{
  for(const bad of [
   {action:"CREATE",confirm:false,title:"Lecture",description:null,location:null,
    startsAt:"2026-11-05T05:00:00Z",endsAt:"2026-11-05T06:00:00Z"},
   {action:"CREATE",confirm:true,title:"Lecture",description:null,location:null,
    startsAt:"2026-11-05T06:00:00Z",endsAt:"2026-11-05T05:00:00Z"},
   {action:"CREATE",confirm:true,title:"Lecture",description:null,location:null,
    startsAt:"2026-11-05T05:00:00Z",endsAt:"2026-11-05T06:00:00Z",
    forgedCollegeId:collegeId},
  ])await expect(command(context,bad)).rejects.toThrow();
  expect(state).toMatchObject({authChecks:0,locks:0,inserts:0,events:0});
 });
});
