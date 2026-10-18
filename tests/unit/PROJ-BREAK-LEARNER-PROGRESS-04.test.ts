import {beforeEach,describe,expect,it,vi} from "vitest";
const state=vi.hoisted(()=>({
 own:vi.fn(),select:vi.fn(),tasks:[] as Array<{projectId:string;status:string}>,
}));
vi.mock("@/modules/projects/member-service",()=>({listMyProjectInstances:state.own}));
vi.mock("@/db/client",()=>({getDb:()=>({select:state.select})}));
import {listMyLearnerProjectProgress} from "@/modules/projects/learner-project-progress-service";

const p1="11111111-1111-4111-8111-111111111111";
const p2="22222222-2222-4222-8222-222222222222";
const foreign="33333333-3333-4333-8333-333333333333";
const context=(status:"ACTIVE"|"DISABLED"="ACTIVE",roles:readonly string[]=["LEARNER"])=>({
 user:{id:"44444444-4444-4444-8444-444444444444",identityUid:"actor",
  platformStatus:"ACTIVE" as const,systemRoles:[]},
 membership:{id:"55555555-5555-4555-8555-555555555555",
  collegeId:"66666666-6666-4666-8666-666666666666",
  organizationId:"77777777-7777-4777-8777-777777777777",
  status,roles},
}) as unknown as Parameters<typeof listMyLearnerProjectProgress>[0];
beforeEach(()=>{
 state.own.mockReset();state.select.mockReset();state.tasks=[];
 state.own.mockResolvedValue([{memberRole:"LEARNER",project:{id:p1}},
  {memberRole:"LEARNER",project:{id:p2}},
  {memberRole:"MENTOR",project:{id:foreign}}]);
 const chain={from(){return chain;},where(){return Promise.resolve(state.tasks);}};
 state.select.mockImplementation(()=>chain);
});
describe("PROJ-BREAK-LEARNER-PROGRESS-04 wrong tenant, revoked role and forged IDs",()=>{
 it("blocks inactive and wrong-role actor before reading any private roster or tasks",async()=>{
  for(const actor of [context("DISABLED"),context("ACTIVE",["FACULTY"])]){
   await expect(listMyLearnerProjectProgress(actor,[p1])).rejects.toThrow("PROJECT_ACCESS_DENIED");
  }
  expect(state.own).not.toHaveBeenCalled();
  expect(state.select).not.toHaveBeenCalled();
 });
 it("rejects malformed and oversized request arrays before own-project lookup",async()=>{
  await expect(listMyLearnerProjectProgress(context(),[foreign,"bad-id"])).rejects.toThrow();
  await expect(listMyLearnerProjectProgress(context(),Array(2001).fill(p1))).rejects.toThrow();
  expect(state.own).not.toHaveBeenCalled();
  expect(state.select).not.toHaveBeenCalled();
 });
 it("ignores forged foreign project IDs and deduplicates before a single scoped bulk read",async()=>{
  state.tasks=[
   {projectId:p1,status:"DONE"},
   {projectId:p1,status:"BLOCKED"},
   {projectId:p2,status:"TODO"},
   {projectId:foreign,status:"DONE"},
  ];
  const result=await listMyLearnerProjectProgress(context(),[p1,p1,foreign,p2]);
  expect(result).toHaveLength(2);
  expect(result[0]).toMatchObject({projectId:p1,totalTasks:2,completedTasks:1,blockedTasks:1});
  expect(result[1]).toMatchObject({projectId:p2,totalTasks:1,completedTasks:0,blockedTasks:0});
  expect(state.own).toHaveBeenCalledOnce();
  expect(state.select).toHaveBeenCalledOnce();
 });
 it("no authorized requested project returns no private tasks or DB reads",async()=>{
  expect(await listMyLearnerProjectProgress(context(),[foreign])).toEqual([]);
  expect(state.select).not.toHaveBeenCalled();
 });
 it("distinguishes truly empty progress from 0% rather than fabricating completion",async()=>{
  const result=await listMyLearnerProjectProgress(context(),[p1]);
  expect(result).toMatchObject([{projectId:p1,totalTasks:0,completedTasks:0,percentage:null}]);
 });
});
