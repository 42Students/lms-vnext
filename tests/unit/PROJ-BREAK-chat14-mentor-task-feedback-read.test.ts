import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {getMentorTaskFeedback} from "@/modules/projects/mentor-task-feedback-service";

const state=vi.hoisted(()=>({
 active:true,role:true,enabled:true,permitted:true,access:"MENTOR",
 scopeCollege:"college-a",scopeOrganization:"org-a",taskExists:true,
 dbCalls:0,taskReads:0,feedbackReads:0,limit:0,
}));
vi.mock("server-only",()=>({}));
vi.mock("drizzle-orm",()=>({
 and:(...conditions:unknown[])=>conditions,
 eq:(column:unknown,value:unknown)=>[column,value],
 isNotNull:(column:unknown)=>["not-null",column],
 desc:(column:unknown)=>["desc",column],
}));
vi.mock("@/db/schema",()=>({
 projectTasks:{id:"task.id",title:"task.title",projectId:"task.projectId"},
 projectTaskSubmissions:{id:"submission.id",version:"submission.version",
  status:"submission.status",feedback:"submission.feedback",
  reviewedAt:"submission.reviewedAt",projectId:"submission.projectId",taskId:"submission.taskId"},
}));
vi.mock("@/modules/identity/context",()=>({
 hasActiveMembership:()=>state.active,
 hasMembershipRole:(_:unknown,role:string)=>state.role&&role==="MENTOR",
}));
vi.mock("@/modules/permissions/policy",()=>({
 can:(context:{membership?:{collegeId:string;organizationId:string}},_:unknown,
  resource:{collegeId:string;organizationId:string})=>
   state.permitted&&context.membership?.collegeId===resource.collegeId&&
   context.membership?.organizationId===resource.organizationId,
}));
vi.mock("@/modules/module-access/service",()=>({
 resolveOptionalModuleAccess:async()=>({projects:{enabled:state.enabled}}),
}));
vi.mock("@/modules/projects/access",()=>({
 requireProjectReadAccess:async(_:unknown,projectId:string)=>({
  access:state.access,collegeId:state.scopeCollege,organizationId:state.scopeOrganization,
  project:{id:projectId,status:"ACTIVE",title:"Atlas"},
 }),
}));
vi.mock("@/db/client",()=>({
 getDb:()=>{
  state.dbCalls++;
  return {select:(fields:Record<string,unknown>)=>{
   const isTask=Object.hasOwn(fields,"title");
   return {from:()=>({where:()=>({
    limit:async()=>{
     if(!isTask)throw new Error("unexpected feedback query shape");
     state.taskReads++;
     return state.taskExists?[{id:"22222222-2222-4222-8222-222222222222",title:"Test task"}]:[];
    },
    orderBy:()=>({limit:async(n:number)=>{
     if(isTask)throw new Error("unexpected task query shape");
     state.feedbackReads++;state.limit=n;
     return [{id:"33333333-3333-4333-8333-333333333333",version:3,status:"CHANGES_REQUESTED",
      feedback:"Please retry",reviewedAt:new Date("2099-01-04T09:00:00.000Z")}];
    }}),
   })})};
  }};
 },
}));
const context=():RequestContext=>({
 user:{id:"mentor-a",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"membership-a",status:"ACTIVE",roles:["MENTOR"],
  collegeId:"college-a",organizationId:"org-a"},
} as unknown as RequestContext);
const projectId="11111111-1111-4111-8111-111111111111";
const taskId="22222222-2222-4222-8222-222222222222";
const params={projectId,taskId};
beforeEach(()=>{
 state.active=true;state.role=true;state.enabled=true;state.permitted=true;state.access="MENTOR";
 state.scopeCollege="college-a";state.scopeOrganization="org-a";state.taskExists=true;
 state.dbCalls=0;state.taskReads=0;state.feedbackReads=0;state.limit=0;
});

describe("PROJ-BREAK-MENTOR-173..177 task feedback read tenancy and bounds",()=>{
 it("PROJ-BREAK-MENTOR-173 returns only scoped, persisted review feedback, never a fabricated thread",async()=>{
  const result=await getMentorTaskFeedback(context(),params);
  expect(result.projectId).toBe(projectId);
  expect(result.task).toMatchObject({id:taskId,title:"Test task"});
  expect(result.feedback).toMatchObject([{version:3,status:"CHANGES_REQUESTED",feedback:"Please retry"}]);
  expect(result.hasCommentThread).toBe(false);
  expect(state.taskReads).toBe(1);
  expect(state.feedbackReads).toBe(1);
  expect(state.limit).toBe(50);
 });
 it("PROJ-BREAK-MENTOR-174 rejects wrong role, ended membership and module disable before DB",async()=>{
  const deny=async()=>{
   await expect(getMentorTaskFeedback(context(),params))
    .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
   expect(state.dbCalls).toBe(0);
  };
  state.role=false;await deny();
  state.role=true;state.active=false;await deny();
  state.active=true;state.enabled=false;await deny();
 });
 it("PROJ-BREAK-MENTOR-175 rejects foreign college, organization and access role before DB",async()=>{
  const deny=async()=>{
   await expect(getMentorTaskFeedback(context(),params))
    .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
   expect(state.dbCalls).toBe(0);
  };
  state.scopeCollege="foreign-college";await deny();
  state.scopeCollege="college-a";state.scopeOrganization="foreign-org";await deny();
  state.scopeOrganization="org-a";state.access="LEARNER";await deny();
 });
 it("PROJ-BREAK-MENTOR-176 rejects unknown task without querying historical feedback",async()=>{
  state.taskExists=false;
  await expect(getMentorTaskFeedback(context(),params))
   .rejects.toMatchObject({code:"PROJECT_TASK_NOT_FOUND"});
  expect(state.taskReads).toBe(1);
  expect(state.feedbackReads).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-177 rejects forged project, task or supplied tenant scope without database access",async()=>{
  for(const bad of [{...params,taskId:"../../foreign"},{...params,projectId:"bad-uuid"},
   {...params,collegeId:"foreign-college"}]){
   await expect(getMentorTaskFeedback(context(),bad)).rejects.toThrow();
  }
  expect(state.dbCalls).toBe(0);
 });
});
