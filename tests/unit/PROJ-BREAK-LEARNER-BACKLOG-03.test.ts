import {beforeEach,describe,expect,it,vi} from "vitest";
import {projectInstances,projectReleases,projectSprints,projectTasks} from "@/db/schema";

const state=vi.hoisted(()=>({
 scope:vi.fn(),guard:vi.fn(),event:vi.fn(),notify:vi.fn(),
 releaseStatus:"SHIPPED",sprintStatus:"ACTIVE",projectStatus:"ACTIVE",
 assignee:"55555555-5555-4555-8555-555555555555",taskStatus:"TODO",
 version:"2026-10-18T05:30:00.123Z",writes:0,lockKinds:[] as string[],
}));
vi.mock("@/modules/projects/access",()=>({requireProjectReadAccess:state.scope}));
vi.mock("@/modules/projects/learner-mutation-guard",()=>({
 assertPersistedLearnerProjectMutation:state.guard,
}));
vi.mock("@/modules/activity/service",()=>({recordActivityEventInTransaction:state.event}));
vi.mock("@/modules/projects/project-notification-service",()=>({notifyActiveProjectMembers:state.notify}));
vi.mock("@/db/client",()=>({
 getDb:()=>({transaction:(fn:(tx:ReturnType<typeof fakeTx>)=>Promise<unknown>)=>fn(fakeTx())}),
}));
import {pullOwnBacklogTask} from "@/modules/projects/learner-backlog-pull-service";
const projectId="11111111-1111-4111-8111-111111111111";
const taskId="22222222-2222-4222-8222-222222222222";
const sprintId="33333333-3333-4333-8333-333333333333";
const releaseId="44444444-4444-4444-8444-444444444444";
const memberId="55555555-5555-4555-8555-555555555555";
const actor={user:{id:"66666666-6666-4666-8666-666666666666",platformStatus:"ACTIVE"},
 membership:{id:memberId,status:"ACTIVE",roles:["LEARNER"]}}
 as unknown as Parameters<typeof pullOwnBacklogTask>[0];
const command={taskId,sprintId,expectedUpdatedAt:"2026-10-18T05:30:00.123Z"};

function fakeTx(){
 let taskReads=0;
 return {
  select(fields?:Record<string,unknown>){
   let source:unknown;
   const chain={
    from(table:unknown){source=table;return chain;},
    where(){return chain;},
    for(mode:string){state.lockKinds.push(mode);return chain;},
    orderBy(){return chain;},
    limit(){
     if(source===projectInstances)return Promise.resolve([{status:state.projectStatus}]);
     if(source===projectTasks){
      taskReads++;
      return Promise.resolve(taskReads===1?[{
       id:taskId,projectId,sprintId:null,status:state.taskStatus,
       assigneeMembershipId:state.assignee,updatedAt:new Date(state.version),title:"Task",
      }]:[{sequence:1}]);
     }
     if(source===projectSprints)return Promise.resolve([{id:sprintId,releaseId,status:state.sprintStatus,title:"Sprint"}]);
     if(source===projectReleases)return Promise.resolve([{status:state.releaseStatus}]);
     if(fields?.sequence)return Promise.resolve([{sequence:1}]);
     return Promise.resolve([]);
    },
   };
   return chain;
  },
  update(){
   const chain={
    set(){return chain;},
    where(){return chain;},
    returning(){state.writes++;return Promise.resolve([{id:taskId,sprintId,status:"TODO"}]);},
   };
   return chain;
  },
 };
}
beforeEach(()=>{
 state.releaseStatus="SHIPPED";state.sprintStatus="ACTIVE";state.projectStatus="ACTIVE";
 state.assignee=memberId;state.taskStatus="TODO";
 state.version=command.expectedUpdatedAt;state.writes=0;state.lockKinds=[];
 for(const mock of [state.scope,state.guard,state.event,state.notify])mock.mockReset();
 state.scope.mockResolvedValue({
  access:"LEARNER",project:{id:projectId},
  collegeId:"77777777-7777-4777-8777-777777777777",
  organizationId:"88888888-8888-4888-8888-888888888888",
 });
 state.guard.mockResolvedValue(undefined);
 state.event.mockResolvedValue({id:"activity-1"});
});
describe("PROJ-BREAK-LEARNER-BACKLOG-03 shipment, stale-tab and revocation transactions",()=>{
 it("a shipped release never accepts learner task pull or records mentor notices",async()=>{
  await expect(pullOwnBacklogTask(actor,projectId,command))
   .rejects.toThrow("PROJECT_TASK_INVALID_STATE");
  expect(state.guard).toHaveBeenCalledOnce();
  expect(state.writes).toBe(0);
  expect(state.event).not.toHaveBeenCalled();
  expect(state.notify).not.toHaveBeenCalled();
  expect(state.lockKinds).toContain("share");
 });
 it("a concurrent membership revocation fails before any task write",async()=>{
  state.guard.mockRejectedValueOnce(new Error("PROJECT_ACCESS_DENIED"));
  await expect(pullOwnBacklogTask(actor,projectId,command))
   .rejects.toThrow("PROJECT_ACCESS_DENIED");
  expect(state.writes).toBe(0);
  expect(state.notify).not.toHaveBeenCalled();
 });
 it("a second stale tab cannot pull an already moved task",async()=>{
  state.taskStatus="IN_PROGRESS";
  await expect(pullOwnBacklogTask(actor,projectId,command))
   .rejects.toThrow("PROJECT_TASK_INVALID_STATE");
  expect(state.writes).toBe(0);
 });
 it("a wrong assignee is denied before a sprint or release transition",async()=>{
  state.assignee="99999999-9999-4999-8999-999999999999";
  await expect(pullOwnBacklogTask(actor,projectId,command))
   .rejects.toThrow("PROJECT_TASK_INVALID_STATE");
  expect(state.writes).toBe(0);
 });
 it("valid task pull writes one move, one audited event and one scoped notification",async()=>{
  state.releaseStatus="IN_PROGRESS";
  await expect(pullOwnBacklogTask(actor,projectId,command)).resolves.toMatchObject({id:taskId,sprintId});
  expect(state.writes).toBe(1);
  expect(state.event).toHaveBeenCalledOnce();
  expect(state.notify).toHaveBeenCalledOnce();
 });
});
