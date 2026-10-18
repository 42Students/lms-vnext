import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {decideMentorFinalDelivery} from "@/modules/projects/mentor-final-delivery-decision-service";
import {mentorFinalDeliveryCanReview} from "@/modules/projects/mentor-final-delivery-decision-model";

const state=vi.hoisted(()=>({
 moduleEnabled:true,role:"MENTOR",active:true,canRead:true,
 status:"SUBMITTED",projectStatus:"ACTIVE",locked:false,isLatest:true,
 selectCalls:0,mutations:0,audits:0,notices:0,
 persistedChecks:0,persistedAllowed:true,
}));
const projectId="11111111-1111-4111-8111-111111111111";
const submissionId="22222222-2222-4222-8222-222222222222";
const membership={id:"mentor-member",collegeId:"college-a",organizationId:"org-a",
 status:"ACTIVE",roles:["MENTOR"]};
const actor={membership,user:{id:"mentor-user",platformStatus:"ACTIVE",systemRoles:[]}} as unknown as RequestContext;
const expectedUpdatedAt="2026-10-18T10:00:00.123Z";
const body={decision:"CHANGES_REQUESTED",feedback:"Attach the corrected demo",
 confirmed:true,expectedUpdatedAt} as const;
const invalidState=(code:string)=>({code});

vi.mock("server-only",()=>({}));
vi.mock("@/modules/identity/context",()=>({
 hasActiveMembership:()=>state.active,hasMembershipRole:(_:unknown,role:string)=>state.role===role,
}));
vi.mock("@/modules/permissions/policy",()=>({can:()=>state.canRead}));
vi.mock("@/modules/projects/access",()=>({
 requireProjectLifecycleMutationAccess:async (_:unknown,id:string)=>{
  if(!state.moduleEnabled||id!==projectId)throw {code:"PROJECT_LIFECYCLE_ACCESS_DENIED"};
  return {access:"MENTOR",collegeId:"college-a",organizationId:"org-a",project:{id:projectId}};
 },
}));
vi.mock("@/modules/projects/persisted-mentor-mutation",()=>({
 assertPersistedProjectMutationActor:async()=>{
  state.persistedChecks++;
  if(!state.persistedAllowed)throw {code:"PROJECT_LIFECYCLE_ACCESS_DENIED"};
 },
}));
vi.mock("@/modules/activity/service",()=>({
 recordActivityEventInTransaction:async()=>{state.audits++;return {id:"event-1"};},
}));
vi.mock("@/modules/projects/project-notification-service",()=>({
 notifyActiveProjectMembers:async()=>{state.notices++;},
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  transaction:async<T>(fn:(tx:unknown)=>Promise<T>):Promise<T>=>{
   const transaction={
    select:(_:unknown)=>{
     const index=++state.selectCalls;
     const row=index===1?{status:state.projectStatus}:
      index===2?{id:submissionId,projectId,status:state.status,version:1,
       updatedAt:new Date(expectedUpdatedAt),lockedAt:state.locked?new Date(expectedUpdatedAt):null}:
       {id:state.isLatest?submissionId:"33333333-3333-4333-8333-333333333333"};
     const query={
      from:()=>query,where:()=>query,for:()=>query,orderBy:()=>query,
      limit:async()=>[row],
     };
     return query;
    },
    update:()=>({
     set:()=>({where:()=>({returning:async()=>{
      state.mutations++;
      return [{id:submissionId,status:body.decision,version:1}];
     }})}),
    }),
    insert:()=>({
     values:()=>({
      returning:async()=>[{id:"review-id"}],
     }),
    }),
   };
   return fn(transaction);
  },
 }),
}));
beforeEach(()=>{
 state.moduleEnabled=true;state.role="MENTOR";state.active=true;state.canRead=true;
 state.status="SUBMITTED";state.projectStatus="ACTIVE";state.locked=false;state.isLatest=true;
 state.selectCalls=0;state.mutations=0;state.audits=0;state.notices=0;
 state.persistedChecks=0;state.persistedAllowed=true;
});

describe("PROJ-BREAK-MENTOR-117..121 final-delivery review hardening",()=>{
 it("PROJ-BREAK-MENTOR-117 disabled Projects mutation gate refuses review before DB touch",async()=>{
  state.moduleEnabled=false;
  await expect(decideMentorFinalDelivery(actor,projectId,submissionId,body))
   .rejects.toMatchObject(invalidState("PROJECT_LIFECYCLE_ACCESS_DENIED"));
  expect(state.selectCalls).toBe(0);
  expect(state.mutations+state.audits+state.notices).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-118 a locked SUBMITTED row cannot be reviewed, audited or notified",async()=>{
  state.locked=true;
  await expect(decideMentorFinalDelivery(actor,projectId,submissionId,body))
   .rejects.toMatchObject(invalidState("PROJECT_SUBMISSION_INVALID_STATE"));
  expect(state.selectCalls).toBe(2);
  expect(state.mutations+state.audits+state.notices).toBe(0);
  expect(mentorFinalDeliveryCanReview("SUBMITTED","ACTIVE",true)).toBe(false);
  expect(mentorFinalDeliveryCanReview("SUBMITTED","ACTIVE",false)).toBe(true);
 });
 it("PROJ-BREAK-MENTOR-119 stale URL identifying older submission cannot review later version",async()=>{
  state.isLatest=false;
  await expect(decideMentorFinalDelivery(actor,projectId,submissionId,body))
   .rejects.toMatchObject(invalidState("PROJECT_SUBMISSION_INVALID_STATE"));
  expect(state.selectCalls).toBe(3);
  expect(state.mutations+state.audits+state.notices).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-120 expired membership, wrong role and permission rejection stop before mutations",async()=>{
  for(const reason of ["inactive","wrong-role","denied"]){
   state.active=reason!=="inactive";state.role=reason==="wrong-role"?"LEARNER":"MENTOR";
   state.canRead=reason!=="denied";state.selectCalls=0;
   await expect(decideMentorFinalDelivery(actor,projectId,submissionId,body))
    .rejects.toMatchObject(invalidState("PROJECT_SUBMISSION_ACCESS_DENIED"));
   expect(state.selectCalls).toBe(0);
  }
  expect(state.mutations+state.audits+state.notices).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-216 rescinded persisted grant stops delivery lookup and leaves audit untouched",async()=>{
  state.persistedAllowed=false;
  await expect(decideMentorFinalDelivery(actor,projectId,submissionId,body))
   .rejects.toMatchObject(invalidState("PROJECT_LIFECYCLE_ACCESS_DENIED"));
  expect(state.selectCalls).toBe(1);
  expect(state.persistedChecks).toBe(1);
  expect(state.mutations+state.audits+state.notices).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-121 latest, unlocked and active delivery writes once with one review notice",async()=>{
  const result=await decideMentorFinalDelivery(actor,projectId,submissionId,body);
  expect(result.submission.status).toBe("CHANGES_REQUESTED");
  expect(result.review.id).toBe("review-id");
  expect(state.selectCalls).toBe(3);
  expect(state.persistedChecks).toBe(1);
  expect(state.mutations).toBe(1);
  expect(state.audits).toBe(1);
  expect(state.notices).toBe(1);
 });
});
