import {beforeEach,describe,expect,it,vi} from "vitest";

const state=vi.hoisted(()=>({
 access:vi.fn(),guard:vi.fn(),transaction:vi.fn(),activity:vi.fn(),notify:vi.fn(),
 deleted:vi.fn(),reads:0,status:"ACTIVE",taskStatus:"TODO",sprintStatus:"ACTIVE",
 releaseStatus:"SHIPPED",comment:null as {id:string}|null,submission:null as {id:string}|null,
}));
vi.mock("@/modules/projects/access",()=>({requireProjectReadAccess:state.access}));
vi.mock("@/modules/projects/learner-mutation-guard",()=>({assertPersistedLearnerProjectMutation:state.guard}));
vi.mock("@/modules/activity/service",()=>({recordActivityEventInTransaction:state.activity}));
vi.mock("@/modules/projects/project-notification-service",()=>({notifyActiveProjectMembers:state.notify}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  transaction:state.transaction,
 }),
}));
import {deleteLearnerOwnTask} from "@/modules/projects/learner-own-task-service";

const projectId="11111111-1111-4111-8111-111111111111";
const taskId="22222222-2222-4222-8222-222222222222";
const memberId="33333333-3333-4333-8333-333333333333";
const sprintId="44444444-4444-4444-8444-444444444444";
const releaseId="55555555-5555-4555-8555-555555555555";
const actor={user:{id:"66666666-6666-4666-8666-666666666666"},
 membership:{id:memberId,roles:["LEARNER"]}} as unknown as Parameters<typeof deleteLearnerOwnTask>[0];
function makeTx(){
 return {
  select(){
   const at=state.reads++;
   const results=[
    [{status:state.status}],
    [{id:taskId,projectId,assigneeMembershipId:memberId,status:state.taskStatus,
     sprintId,templateKey:"learner-"+memberId.replaceAll("-","")+"-abcd1234",title:"My task"}],
    [{id:sprintId,status:state.sprintStatus,releaseId}],
    [{id:releaseId,status:state.releaseStatus}],
    state.comment?[state.comment]:[],
    state.submission?[state.submission]:[],
   ][at]??[];
   const chain={from(){return chain;},where(){return chain;},
    for(){return chain;},limit(){return Promise.resolve(results);}};
   return chain;
  },
  delete(){
   return {where(){state.deleted();return Promise.resolve();}};
  },
 };
}
beforeEach(()=>{
 state.reads=0;state.status="ACTIVE";state.taskStatus="TODO";
 state.sprintStatus="ACTIVE";state.releaseStatus="SHIPPED";
 state.comment=null;state.submission=null;
 for(const mock of [state.access,state.guard,state.transaction,state.activity,state.notify,state.deleted])mock.mockReset();
 state.access.mockResolvedValue({
  access:"LEARNER",collegeId:"77777777-7777-4777-8777-777777777777",
  organizationId:"88888888-8888-4888-8888-888888888888",project:{id:projectId},
 });
 state.transaction.mockImplementation(async(fn:(tx:ReturnType<typeof makeTx>)=>Promise<unknown>)=>fn(makeTx()));
 state.guard.mockResolvedValue(undefined);
 state.activity.mockResolvedValue({id:"event-1"});
 state.notify.mockResolvedValue(undefined);
});
describe("PROJ-BREAK-LEARNER-RELEASE-01 task deletion across lifecycle and authorization",()=>{
 it("fails malformed project/task identifiers before reading an unauthorized project",async()=>{
  await expect(deleteLearnerOwnTask(actor,{projectId:"foreign"},taskId)).rejects.toThrow();
  await expect(deleteLearnerOwnTask(actor,{projectId},"foreign")).rejects.toThrow();
  expect(state.access).not.toHaveBeenCalled();
  expect(state.transaction).not.toHaveBeenCalled();
 });
 it("denies non-learner project scope before opening a transaction",async()=>{
  state.access.mockResolvedValueOnce({access:"MENTOR",project:{id:projectId}});
  await expect(deleteLearnerOwnTask(actor,{projectId},taskId)).rejects.toThrow();
  expect(state.transaction).not.toHaveBeenCalled();
 });
 it.each(["SHIPPED", "ARCHIVED"] as const)("cannot delete from a %s release even when sprint still ACTIVE",async(status)=>{
  state.releaseStatus=status;
  await expect(deleteLearnerOwnTask(actor,{projectId},taskId)).rejects.toThrow("PROJECT_TASK_INVALID_STATE");
  expect(state.reads).toBe(4);
  expect(state.deleted).not.toHaveBeenCalled();
  expect(state.activity).not.toHaveBeenCalled();
  expect(state.notify).not.toHaveBeenCalled();
 });
 it("cannot delete a completed or in-review task",async()=>{
  state.taskStatus="DONE";
  await expect(deleteLearnerOwnTask(actor,{projectId},taskId)).rejects.toThrow();
  expect(state.deleted).not.toHaveBeenCalled();
 });
 it("cannot delete tasks after comments or submissions exist",async()=>{
  state.releaseStatus="IN_PROGRESS";state.comment={id:"discussion"};
  await expect(deleteLearnerOwnTask(actor,{projectId},taskId)).rejects.toThrow();
  expect(state.deleted).not.toHaveBeenCalled();
  state.reads=0;state.comment=null;state.submission={id:"receipt"};
  await expect(deleteLearnerOwnTask(actor,{projectId},taskId)).rejects.toThrow();
  expect(state.deleted).not.toHaveBeenCalled();
 });
 it("deletes only own unreviewed TODO task on an ACTIVE release with an activity and mentor notification",async()=>{
  state.releaseStatus="IN_PROGRESS";
  await expect(deleteLearnerOwnTask(actor,{projectId},taskId)).resolves.toEqual({deleted:true});
  expect(state.guard).toHaveBeenCalledOnce();
  expect(state.deleted).toHaveBeenCalledOnce();
  expect(state.activity).toHaveBeenCalledOnce();
  expect(state.notify).toHaveBeenCalledOnce();
 });
});
