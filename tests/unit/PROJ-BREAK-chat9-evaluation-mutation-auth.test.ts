import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {createProjectEvaluation} from "@/modules/projects/evaluation-service";

const projectId="11111111-1111-4111-8111-111111111111";
const submissionId="22222222-2222-4222-8222-222222222222";
const collegeId="33333333-3333-4333-8333-333333333333";
const organizationId="44444444-4444-4444-8444-444444444444";
const state=vi.hoisted(()=>({
  access:"ADMIN" as "ADMIN"|"MENTOR"|"LEARNER",
  adminAllowed:true,
  mentorAllowed:true,
  projectStatus:"ACTIVE",projectDeletedAt:null as Date|null,
  submissionStatus:"APPROVED",
  locks:0,checks:0,mentors:0,inserts:0,events:0,transactions:0,
}));
vi.mock("@/modules/projects/access",()=>({
  requireProjectLifecycleAccess:async()=>({
    access:state.access,
    project:{id:projectId,title:"IIT Dharwad Project"},
    collegeId,organizationId,
  }),
}));
vi.mock("@/modules/permissions/persisted-actor",()=>({
  assertPersistedPlatformPermission:async()=>{
    state.checks+=1;
    if(!state.adminAllowed)throw Error("Missing permission: projects.manage");
  },
}));
vi.mock("@/modules/activity/service",()=>({
  recordActivityEventInTransaction:async()=>{state.events+=1;return {id:"event"};},
}));
vi.mock("@/db/client",()=>({
  getDb:()=>({
    transaction:async(run:(tx:unknown)=>Promise<unknown>)=>{
      state.transactions+=1;
      let reads=0;
      const tx={
        select:()=>{
          const step=reads++;
          const result=step===0
            ?[{status:state.projectStatus,deletedAt:state.projectDeletedAt}]
            :state.access==="MENTOR"&&step===1
              ?(state.mentorAllowed?[{id:"persisted-project-mentor"}]:[])
              :[{id:submissionId,status:state.submissionStatus}];
          const q={
            from:()=>q,
            innerJoin:()=>q,
            where:()=>q,
            for:()=>{
              state.locks+=1;
              return q;
            },
            limit:async()=>result,
          };
          if(state.access==="MENTOR"&&step===1)state.mentors+=1;
          return q;
        },
        insert:()=>{
          const insertion=++state.inserts;
          return {
            values:(_value:unknown)=>({
              returning:async()=>insertion===1
                ?[{id:"evaluation",submissionId,totalScore:8,maxScore:10}]
                :[{evaluationId:"evaluation",criterion:"Completion",score:8,maxScore:10}],
            }),
          };
        },
      };
      return run(tx);
    },
  }),
}));
const admin=():RequestContext=>({
  user:{id:"55555555-5555-4555-8555-555555555555",identityUid:"admin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
  membership:null,adminScope:{collegeId,organizationId},
});
const mentor=():RequestContext=>({
  user:{id:"66666666-6666-4666-8666-666666666666",identityUid:"mentor",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:"77777777-7777-4777-8777-777777777777",collegeId,organizationId,status:"ACTIVE",roles:["MENTOR"]},
  adminScope:null,
});
const valid={items:[{criterion:"Completion",score:8,maxScore:10}],summary:"Reviewed against rubric"};
beforeEach(()=>{
  state.access="ADMIN";state.adminAllowed=true;state.mentorAllowed=true;
  state.projectStatus="ACTIVE";state.projectDeletedAt=null;state.submissionStatus="APPROVED";
  state.locks=0;state.checks=0;state.mentors=0;state.inserts=0;state.events=0;state.transactions=0;
});
describe("IIT Dharwad Projects evaluation write: persisted role and grading integrity",()=>{
  it("PROJ-BREAK-grading-09 a forged learner lifecycle scope never opens a grading transaction",async()=>{
    state.access="LEARNER";
    await expect(createProjectEvaluation(mentor(),projectId,submissionId,valid))
      .rejects.toThrow("PROJECT_LIFECYCLE_ACCESS_DENIED");
    expect(state.transactions).toBe(0);
    expect(state.locks).toBe(0);
    expect(state.inserts).toBe(0);
    expect(state.events).toBe(0);
  });
  it("PROJ-BREAK-grading-05 revoked Super Admin cannot grade after the page opened",async()=>{
    state.adminAllowed=false;
    await expect(createProjectEvaluation(admin(),projectId,submissionId,valid))
      .rejects.toThrow("Missing permission: projects.manage");
    expect(state.locks).toBe(1);
    expect(state.checks).toBe(1);
    expect(state.inserts).toBe(0);
    expect(state.events).toBe(0);
  });
  it("PROJ-BREAK-grading-06 removed mentor cannot forge an approved delivery grade",async()=>{
    state.access="MENTOR";state.mentorAllowed=false;
    await expect(createProjectEvaluation(mentor(),projectId,submissionId,valid))
      .rejects.toThrow("PROJECT_LIFECYCLE_ACCESS_DENIED");
    expect(state.mentors).toBe(1);
    expect(state.inserts).toBe(0);
    expect(state.events).toBe(0);
  });
  it("PROJ-BREAK-grading-07 correctly scoped active mentor grades approved delivery exactly once",async()=>{
    state.access="MENTOR";
    const result=await createProjectEvaluation(mentor(),projectId,submissionId,valid);
    expect(result.evaluation.totalScore).toBe(8);
    expect(result.evaluation.maxScore).toBe(10);
    expect(state.mentors).toBe(1);
    expect(state.inserts).toBe(2);
    expect(state.events).toBe(1);
  });
  it("DB074 denies grading after project soft deletion without rubric or event writes",async()=>{
    state.projectDeletedAt=new Date("2026-10-20T10:00:00.000Z");
    await expect(createProjectEvaluation(admin(),projectId,submissionId,valid))
      .rejects.toThrow("PROJECT_EVALUATION_INVALID_STATE");
    expect(state.inserts).toBe(0);
    expect(state.events).toBe(0);
    expect(state.checks).toBe(0);
  });
  it("PROJ-BREAK-grading-08 archived and nonapproved deliveries deny before inserting rubric rows",async()=>{
    state.projectStatus="ARCHIVED";
    await expect(createProjectEvaluation(admin(),projectId,submissionId,valid))
      .rejects.toThrow("PROJECT_EVALUATION_INVALID_STATE");
    state.projectStatus="ACTIVE";state.submissionStatus="SUBMITTED";
    await expect(createProjectEvaluation(admin(),projectId,submissionId,valid))
      .rejects.toThrow("PROJECT_EVALUATION_INVALID_STATE");
    expect(state.inserts).toBe(0);
    expect(state.events).toBe(0);
  });
});
