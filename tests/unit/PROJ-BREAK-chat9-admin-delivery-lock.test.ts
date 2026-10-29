import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {lockAdminProjectSubmission} from "@/modules/projects/admin-submission-review-service";

const projectId="11111111-1111-4111-8111-111111111111";
const submissionId="22222222-2222-4222-8222-222222222222";
const collegeId="33333333-3333-4333-8333-333333333333";
const organizationId="44444444-4444-4444-8444-444444444444";
const state=vi.hoisted(()=>({
 projectStatus:"ACTIVE",projectDeletedAt:null as Date|null,submissionStatus:"SUBMITTED",
 lockedAt:null as Date|null,found:true,checks:0,allowed:true,
 updates:0,deliveryEvents:0,activityEvents:0,
 previousReason:null as string|null,previousActor:null as string|null,
 latestId:"22222222-2222-4222-8222-222222222222",
}));
vi.mock("@/modules/projects/access",()=>({
 requireProjectManageAccess:async()=>({
  project:{id:projectId},collegeId,organizationId,
 }),
}));
vi.mock("@/modules/permissions/persisted-actor",()=>({
 assertPersistedPlatformPermission:async(_tx:unknown,ctx:RequestContext)=>{
  state.checks+=1;
  if(!state.allowed)throw new Error("Missing permission: projects.manage");
  return ctx;
 },
}));
vi.mock("@/modules/activity/service",()=>({
 recordActivityEventInTransaction:async()=>{state.activityEvents+=1;return {id:"event"};},
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  transaction:async(run:(tx:unknown)=>Promise<unknown>)=>{
   let reads=0;
   const tx={
    select:()=>{
     const step=reads++;
     const rows=step===0?[{status:state.projectStatus,deletedAt:state.projectDeletedAt}]:
      step===1?(state.found?[{id:submissionId,projectId,status:state.submissionStatus,
       lockedAt:state.lockedAt,version:2}]:[]):
      step===2?[{id:state.latestId}]:
      state.previousReason?[{reason:state.previousReason,actorMembershipId:state.previousActor}]:[];
     const q={from:()=>q,where:()=>q,for:()=>q,orderBy:()=>q,limit:async()=>rows};
     return q;
    },
    update:()=>({set:(value:{lockedAt:Date})=>({
     where:()=>({returning:async()=>{
      state.updates+=1;state.lockedAt=value.lockedAt;
      return [{id:submissionId,projectId,status:state.submissionStatus,
       lockedAt:state.lockedAt,version:2}];
     }}),
    })}),
    insert:()=>({values:async(v:{reason:string;actorMembershipId:string})=>{
     state.previousReason=v.reason;state.previousActor=v.actorMembershipId;
     state.deliveryEvents+=1;
    }}),
   };
   return run(tx);
  },
 }),
}));
const actor=():RequestContext=>({
 user:{id:"55555555-5555-4555-8555-555555555555",identityUid:"admin",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"66666666-6666-4666-8666-666666666666",
  collegeId,organizationId,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
 adminScope:null,
});
beforeEach(()=>{
 state.projectStatus="ACTIVE";state.projectDeletedAt=null;state.submissionStatus="SUBMITTED";state.lockedAt=null;
 state.found=true;state.checks=0;state.allowed=true;
 state.updates=0;state.deliveryEvents=0;state.activityEvents=0;
 state.previousReason=null;state.previousActor=null;
 state.latestId=submissionId;
});
describe("IIT Dharwad College Admin delivery final lock transaction",()=>{
 it("PROJ-BREAK-races-18 duplicate lock returns the winner without another delivery/activity event",async()=>{
  const initial=await lockAdminProjectSubmission(actor(),projectId,submissionId,{reason:"Final review"});
  expect(initial.lockedAt).toBeInstanceOf(Date);
  const stamp=initial.lockedAt?.getTime();
  const retry=await lockAdminProjectSubmission(actor(),projectId,submissionId,{reason:"Final review"});
  expect(retry.lockedAt?.getTime()).toBe(stamp);
  expect(state.updates).toBe(1);
  expect(state.deliveryEvents).toBe(1);
  expect(state.activityEvents).toBe(1);
  expect(state.checks).toBe(2);
 });
 it("PROJ-BREAK-races-19 altered reason or different College Admin cannot claim an earlier lock",async()=>{
  await lockAdminProjectSubmission(actor(),projectId,submissionId,{reason:"Final review"});
  await expect(lockAdminProjectSubmission(actor(),projectId,submissionId,{reason:"Different reason"}))
   .rejects.toThrow("PROJECT_SUBMISSION_CONFLICT");
  const other=actor();
  await expect(lockAdminProjectSubmission({...other,membership:{...other.membership!,
   id:"77777777-7777-4777-8777-777777777777"}},projectId,submissionId,{reason:"Final review"}))
   .rejects.toThrow("PROJECT_SUBMISSION_CONFLICT");
  expect(state.updates).toBe(1);
  expect(state.deliveryEvents).toBe(1);
  expect(state.activityEvents).toBe(1);
 });
 it("DB074 denies both a new lock and an idempotent retry after project deletion",async()=>{
  state.projectDeletedAt=new Date("2026-10-20T12:00:00.000Z");
  await expect(lockAdminProjectSubmission(actor(),projectId,submissionId,{reason:"Stale lock"}))
   .rejects.toThrow("PROJECT_SUBMISSION_INVALID_STATE");
  state.lockedAt=new Date("2026-10-19T12:00:00.000Z");
  state.previousReason="Existing lock";state.previousActor=actor().membership!.id;
  await expect(lockAdminProjectSubmission(actor(),projectId,submissionId,{reason:"Existing lock"}))
   .rejects.toThrow("PROJECT_SUBMISSION_INVALID_STATE");
  expect(state.updates).toBe(0);
  expect(state.deliveryEvents).toBe(0);
  expect(state.activityEvents).toBe(0);
 });
 it("PROJ-BREAK-state-26 archived project cannot lock or retry an existing final lock",async()=>{
  state.projectStatus="ARCHIVED";
  await expect(lockAdminProjectSubmission(actor(),projectId,submissionId,{reason:"Bad archive lock"}))
   .rejects.toThrow("PROJECT_SUBMISSION_INVALID_STATE");
  state.lockedAt=new Date();
  await expect(lockAdminProjectSubmission(actor(),projectId,submissionId,{reason:"Bad archive retry"}))
   .rejects.toThrow("PROJECT_SUBMISSION_INVALID_STATE");
  expect(state.updates).toBe(0);
  expect(state.activityEvents).toBe(0);
 });
 it("PROJ-BREAK-idor-49 stale persisted role cannot return even a previously locked row",async()=>{
  state.lockedAt=new Date();state.allowed=false;
  await expect(lockAdminProjectSubmission(actor(),projectId,submissionId,{reason:"Stale actor"}))
   .rejects.toThrow("Missing permission: projects.manage");
  expect(state.updates).toBe(0);
  expect(state.deliveryEvents).toBe(0);
 });
 it("PROJ-BREAK-races-81 stale tab cannot lock an earlier version after a newer delivery is submitted",async()=>{
  state.latestId="88888888-8888-4888-8888-888888888888";
  await expect(lockAdminProjectSubmission(actor(),projectId,submissionId,{reason:"Old review"}))
   .rejects.toThrow("PROJECT_SUBMISSION_CONFLICT");
  expect(state.updates).toBe(0);
  expect(state.deliveryEvents).toBe(0);
  expect(state.activityEvents).toBe(0);
 });
 it("PROJ-BREAK-races-82 stale tab cannot return success for an old idempotent lock after a newer version",async()=>{
  state.lockedAt=new Date("2026-10-18T10:00:00.000Z");
  state.previousReason="Final review";
  state.previousActor=actor().membership!.id;
  state.latestId="88888888-8888-4888-8888-888888888888";
  await expect(lockAdminProjectSubmission(actor(),projectId,submissionId,{reason:"Final review"}))
   .rejects.toThrow("PROJECT_SUBMISSION_CONFLICT");
  expect(state.updates).toBe(0);
  expect(state.deliveryEvents).toBe(0);
  expect(state.activityEvents).toBe(0);
 });
 it("PROJ-BREAK-input-36 malformed reasons and absent submissions never create events",async()=>{
  await expect(lockAdminProjectSubmission(actor(),projectId,submissionId,{reason:""})).rejects.toThrow();
  state.found=false;
  await expect(lockAdminProjectSubmission(actor(),projectId,submissionId,{reason:"Present"}))
   .rejects.toThrow("PROJECT_SUBMISSION_INVALID_STATE");
  expect(state.updates).toBe(0);
  expect(state.activityEvents).toBe(0);
 });
});
