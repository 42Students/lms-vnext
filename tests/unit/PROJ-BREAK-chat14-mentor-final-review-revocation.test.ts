import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {decideMentorFinalDelivery} from "@/modules/projects/mentor-final-delivery-decision-service";

const state=vi.hoisted(()=>({
 projectPresent:true,actorAllowed:false,transactions:0,projectLocks:0,
 persistedChecks:0,submissionReads:0,writes:0,events:0,notices:0,
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
         throw new Error("Unexpected access to a submission before persisted reauthorization");
        },
       }),
      }),
     }),
    }),
    update:()=>{state.writes++;throw new Error("Unexpected write");},
    insert:()=>{state.writes++;throw new Error("Unexpected insert");},
   };
   return run(tx);
  },
 }),
}));

beforeEach(()=>{
 state.projectPresent=true;state.actorAllowed=false;state.transactions=0;
 state.projectLocks=0;state.persistedChecks=0;state.submissionReads=0;
 state.writes=0;state.events=0;state.notices=0;
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
