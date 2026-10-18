import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {transitionMentorProjectTask}
  from "@/modules/projects/mentor-task-transition-service";

const projectId="11111111-1111-4111-8111-111111111111";
const taskId="22222222-2222-4222-8222-222222222222";
const collegeId="33333333-3333-4333-8333-333333333333";
const organizationId="44444444-4444-4444-8444-444444444444";
const stamp="2026-10-18T04:35:00.000Z";

const state=vi.hoisted(()=>({
  status:"TODO",
  blockerReason:null as string|null,
  updatedAt:new Date("2026-10-18T04:35:00.000Z"),
  projectStatus:"ACTIVE",
  sprintStatus:"ACTIVE",
  releaseStatus:"IN_PROGRESS",
  missingTask:false,
  missingSprint:false,
  missingRelease:false,
  casConflict:false,
  actorRevoked:false,
  actorLocks:0,
  reads:0,
  writes:0,
  activity:0,
}));
vi.mock("server-only",()=>({}));
vi.mock("@/modules/projects/access",()=>({
  requireProjectLifecycleMutationAccess:async()=>({
    project:{id:projectId,status:state.projectStatus},
    collegeId,organizationId,
  }),
}));
vi.mock("@/modules/projects/persisted-mentor-mutation",()=>({
  assertPersistedProjectMutationActor:async()=>{
    state.actorLocks++;
    if(state.actorRevoked)throw Object.assign(new Error("Access removed"),{
      code:"PROJECT_LIFECYCLE_ACCESS_DENIED",
    });
  },
}));
vi.mock("@/modules/activity/service",()=>({
  recordActivityEventInTransaction:async()=>{state.activity++;},
}));
vi.mock("@/db/client",()=>({
  getDb:()=>({
    transaction:async(callback:(tx:unknown)=>Promise<unknown>)=>{
      let readStep=0;
      const tx={
        select:()=>({
          from:()=>({
            where:()=>({
              for:()=>({
                limit:async()=>{
                  readStep++;
                  state.reads++;
                  if(readStep===1)return [{status:state.projectStatus}];
                  if(readStep===2)return state.missingTask?[]:[{
                    id:taskId,projectId,sprintId:"55555555-5555-4555-8555-555555555555",
                    title:"Implement gradebook",status:state.status,
                    updatedAt:state.updatedAt,blockerReason:state.blockerReason,
                  }];
                  if(readStep===3)return state.missingSprint?[]:[{
                    status:state.sprintStatus,
                    releaseId:"66666666-6666-4666-8666-666666666666",
                  }];
                  return [];
                },
              }),
              // Releases do not need a FOR UPDATE; their current status is checked.
              limit:async()=>{readStep++;state.reads++;return state.missingRelease?[]:[{status:state.releaseStatus}];},
            }),
          }),
        }),
        update:()=>({
          set:(update:{status:string;updatedAt:Date;blockerReason:string|null})=>({
            where:()=>({
              returning:async()=>{
                if(state.casConflict)return [];
                state.writes++;
                state.status=update.status;
                state.updatedAt=update.updatedAt;
                state.blockerReason=update.blockerReason;
                return [{id:taskId,title:"Implement gradebook",
                  status:update.status,updatedAt:update.updatedAt}];
              },
            }),
          }),
        }),
      };
      return callback(tx);
    },
  }),
}));

const context:RequestContext={
  user:{id:"77777777-7777-4777-8777-777777777777",
    identityUid:"mentor",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:"88888888-8888-4888-8888-888888888888",
    collegeId,organizationId,status:"ACTIVE",roles:["FACULTY","MENTOR"]},
};

describe("PROJ-BREAK-FACULTY-03 Mentor task state machine and stale submissions",()=>{
  beforeEach(()=>{
    state.status="TODO";state.blockerReason=null;state.updatedAt=new Date(stamp);
    state.projectStatus="ACTIVE";state.sprintStatus="ACTIVE";
    state.releaseStatus="IN_PROGRESS";state.reads=0;state.writes=0;state.activity=0;
    state.missingTask=false;state.missingSprint=false;state.missingRelease=false;
    state.casConflict=false;
    state.actorRevoked=false;state.actorLocks=0;
  });

  const execute=(status:string,expectedUpdatedAt:string,blockerReason?:string)=>(
    transitionMentorProjectTask(context,{projectId,taskId},{
      status,expectedUpdatedAt,confirmed:true,...(blockerReason?{blockerReason}:{}),
    })
  );

  it("PROJ-BREAK-FACULTY-03-01 a valid mentor transition writes once, clears stale blockers and emits one audit event",async()=>{
    state.status="BLOCKED";state.blockerReason="Waiting for API";
    const updated=await execute("IN_PROGRESS",stamp);
    expect(updated.status).toBe("IN_PROGRESS");
    expect(state).toMatchObject({writes:1,activity:1,status:"IN_PROGRESS",blockerReason:null});
  });

  it("PROJ-BREAK-FACULTY-03-02 stale tab and duplicate submit cannot replace a newer task state",async()=>{
    const first=await execute("BLOCKED",stamp,"Need reviewed data");
    expect(first.status).toBe("BLOCKED");
    const persisted=state.updatedAt.toISOString();
    await expect(execute("BLOCKED",stamp,"Need reviewed data"))
      .rejects.toMatchObject({code:"PROJECT_TASK_INVALID_STATE"});
    await expect(execute("IN_PROGRESS",stamp))
      .rejects.toMatchObject({code:"PROJECT_TASK_INVALID_STATE"});
    expect(state.writes).toBe(1);
    expect(state.activity).toBe(1);
    expect(state.updatedAt.toISOString()).toBe(persisted);
  });

  it("PROJ-BREAK-FACULTY-03-03 cannot change task while project archived, sprint closed or release shipped",async()=>{
    for(const change of [
      ()=>{state.projectStatus="ARCHIVED";},
      ()=>{state.sprintStatus="COMPLETED";},
      ()=>{state.releaseStatus="SHIPPED";},
    ]){
      state.projectStatus="ACTIVE";state.sprintStatus="ACTIVE";state.releaseStatus="IN_PROGRESS";
      change();
      await expect(execute("IN_PROGRESS",stamp))
        .rejects.toMatchObject({code:"PROJECT_TASK_INVALID_STATE"});
      expect(state.writes).toBe(0);
    }
  });

  it("PROJ-BREAK-FACULTY-03-07 checks persisted actor after project lock but before task reads or mutation",async()=>{
    state.actorRevoked=true;
    await expect(execute("IN_PROGRESS",stamp))
      .rejects.toMatchObject({code:"PROJECT_LIFECYCLE_ACCESS_DENIED"});
    expect(state).toMatchObject({actorLocks:1,reads:1,writes:0,activity:0,status:"TODO"});
  });

  it("PROJ-BREAK-FACULTY-03-05 database CAS losing a parallel version race emits no success or activity",async()=>{
    state.casConflict=true;
    await expect(execute("IN_PROGRESS",stamp)).rejects.toMatchObject({
      code:"PROJECT_TASK_INVALID_STATE",
    });
    expect(state).toMatchObject({reads:4,writes:0,activity:0,status:"TODO"});
    expect(state.updatedAt.toISOString()).toBe(stamp);
  });

  it("PROJ-BREAK-FACULTY-03-06 deleted or forged task, sprint or release never transitions",async()=>{
    for(const broken of ["missingTask","missingSprint","missingRelease"] as const){
      state[broken]=true;
      await expect(execute("IN_PROGRESS",stamp)).rejects.toMatchObject({
        code:broken==="missingTask"?"PROJECT_TASK_NOT_FOUND":"PROJECT_TASK_INVALID_STATE",
      });
      expect(state.writes).toBe(0);
      expect(state.activity).toBe(0);
      state[broken]=false;
    }
  });

  it("PROJ-BREAK-FACULTY-03-04 missing confirmation, terminal state or invalid blocker rejected before transaction",async()=>{
    const cases=[
      {status:"DONE",expectedUpdatedAt:stamp,confirmed:true},
      {status:"BLOCKED",expectedUpdatedAt:stamp,confirmed:true},
      {status:"IN_PROGRESS",expectedUpdatedAt:stamp,confirmed:false},
      {status:"IN_PROGRESS",expectedUpdatedAt:"yesterday",confirmed:true},
    ];
    for(const input of cases)await expect(
      transitionMentorProjectTask(context,{projectId,taskId},input)
    ).rejects.toThrow();
    expect(state.reads).toBe(0);
    expect(state.writes).toBe(0);
  });
});
