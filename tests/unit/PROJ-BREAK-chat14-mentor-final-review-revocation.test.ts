import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {decideMentorFinalDelivery} from "@/modules/projects/mentor-final-delivery-decision-service";

const state=vi.hoisted(()=>({
 projectPresent:true,actorAllowed:false,transactions:0,projectLocks:0,
 persistedChecks:0,submissionReads:0,writes:0,events:0,notices:0,
 currentUpdatedAt:"2099-01-01T00:00:00.000Z",
}));
const projectId="11111111-1111-4111-8111-111111111111";
const submissionId="22222222-2222-4222-8222-222222222222";
const context={
 user:{id:"mentor-user"},
 membership:{id:"mentor-membership",collegeId:"college-a",organizationId:"org-a"},
} as unknown as RequestContext;

vi.mock("server-only",()=>({}));
vi.mock("drizzle-orm",()=>({
 and:(...args:unknown[])=>args,eq:(...args:unknown[])=>args,
 desc:(column:unknown)=>column,
 sql:(_parts:TemplateStringsArray,...values:unknown[])=>values,
}));
vi.mock("@/db/schema",()=>({
 projectInstances:{id:"project.id",collegeId:"project.college_id",status:"project.status"},
 projectSubmissions:{id:"submission.id",projectId:"submission.project_id",
  status:"submission.status",updatedAt:"submission.updated_at",version:"submission.version"},
 projectSubmissionReviews:{},projectDeliveryEvents:{},
}));
vi.mock("@/modules/identity/context",()=>({
 hasActiveMembership:()=>true,hasMembershipRole:(_:unknown,role:string)=>role==="MENTOR",
}));
vi.mock("@/modules/permissions/policy",()=>({can:()=>true}));
vi.mock("@/modules/projects/access",()=>({
 requireProjectLifecycleMutationAccess:async()=>({
  access:"MENTOR",collegeId:"college-a",organizationId:"org-a",
  project:{id:projectId,status:"ACTIVE"},
 }),
}));
vi.mock("@/modules/projects/persisted-mentor-mutation",()=>({
 assertPersistedProjectMutationActor:async()=>{
  state.persistedChecks++;
  if(!state.actorAllowed)throw new Error("PROJECT_LIFECYCLE_ACCESS_DENIED");
 },
}));
vi.mock("@/modules/activity/taxonomy",()=>({
 ACTIVITY_EVENT_TYPES:{PROJECTS_DELIVERY_REVIEWED:"projects.delivery.reviewed"},
}));
vi.mock("@/modules/activity/service",()=>({
 recordActivityEventInTransaction:async()=>{state.events++;return {id:"event"};},
}));
vi.mock("@/modules/projects/delivery-activity-model",()=>({
 projectDeliveryActivity:()=>({eventType:"projects.delivery.locked"}),
}));
vi.mock("@/modules/projects/learner-project-review-notification-model",()=>({
 learnerProjectDeliveryReviewNotice:()=>({title:"Review complete",body:"Your delivery was reviewed",actionHref:"/learner/projects"}),
}));
vi.mock("@/modules/projects/project-notification-service",()=>({
 notifyActiveProjectMembers:async()=>{state.notices++;},
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  transaction:async(run:(tx:unknown)=>Promise<unknown>)=>{
   state.transactions++;
   const tx={
    select:()=>({
     from:(table:unknown)=>({
      where:()=>({
       for:()=>({
        limit:async()=>{
         if(table && typeof table==="object" && "collegeId" in table){
          state.projectLocks++;
          return state.projectPresent?[{status:"ACTIVE"}]:[];
         }
         state.submissionReads++;
         return [{
          id:submissionId,projectId,status:"SUBMITTED",version:2,
          lockedAt:null,updatedAt:new Date(state.currentUpdatedAt),
         }];
        },
       }),
       orderBy:()=>({
        limit:async()=>[{id:submissionId}],
       }),
      }),
     }),
    }),
    update:()=>({
     set:(values:{status:string;updatedAt:Date})=>({
      where:()=>({
       returning:async()=>{
        state.writes++;
        return [{id:submissionId,projectId,version:2,...values}];
       },
      }),
     }),
    }),
    insert:()=>({
     values:()=>{
      state.writes++;
      return {returning:async()=>[{id:"33333333-3333-4333-8333-333333333333"}]};
     },
    }),
   };
   return run(tx);
  },
 }),
}));

beforeEach(()=>{
 state.projectPresent=true;state.actorAllowed=false;state.transactions=0;
 state.projectLocks=0;state.persistedChecks=0;state.submissionReads=0;
 state.writes=0;state.events=0;state.notices=0;
 state.currentUpdatedAt="2099-01-01T00:00:00.000Z";
});
const input={decision:"APPROVED",expectedUpdatedAt:"2099-01-01T00:00:00.000Z",confirmed:true};

describe("mentor final review persisted permission race",()=>{
 it("PROJ-BREAK-MENTOR-206 denies a revoked Mentor after locking project and before reading delivery",async()=>{
  await expect(decideMentorFinalDelivery(context,projectId,submissionId,input))
   .rejects.toThrow("PROJECT_LIFECYCLE_ACCESS_DENIED");
  expect(state.transactions).toBe(1);
  expect(state.projectLocks).toBe(1);
  expect(state.persistedChecks).toBe(1);
  expect(state.submissionReads).toBe(0);
  expect(state.writes).toBe(0);
  expect(state.events).toBe(0);
  expect(state.notices).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-208 preserves an authorized review and notifies learners after persistence",async()=>{
  state.actorAllowed=true;
  const result=await decideMentorFinalDelivery(context,projectId,submissionId,input);
  expect(result.submission).toMatchObject({id:submissionId,status:"APPROVED"});
  expect(result.review).toHaveProperty("id");
  expect(state.projectLocks).toBe(1);
  expect(state.persistedChecks).toBe(1);
  expect(state.submissionReads).toBe(1);
  expect(state.writes).toBe(3);
  expect(state.events).toBe(2);
  expect(state.notices).toBe(1);
 });
 it("PROJ-BREAK-MENTOR-209 rejects a stale review token without audit or notification",async()=>{
  state.actorAllowed=true;
  state.currentUpdatedAt="2099-01-01T00:00:00.001Z";
  await expect(decideMentorFinalDelivery(context,projectId,submissionId,input))
   .rejects.toThrow("PROJECT_SUBMISSION_STALE_VERSION");
  expect(state.persistedChecks).toBe(1);
  expect(state.submissionReads).toBe(1);
  expect(state.writes).toBe(0);
  expect(state.events).toBe(0);
  expect(state.notices).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-207 refuses a missing scoped parent before any delivery lookup or event",async()=>{
  state.projectPresent=false;
  state.actorAllowed=true;
  await expect(decideMentorFinalDelivery(context,projectId,submissionId,input))
   .rejects.toThrow("PROJECT_SUBMISSION_NOT_FOUND");
  expect(state.projectLocks).toBe(1);
  expect(state.persistedChecks).toBe(0);
  expect(state.submissionReads).toBe(0);
  expect(state.writes).toBe(0);
  expect(state.events).toBe(0);
  expect(state.notices).toBe(0);
 });
});
