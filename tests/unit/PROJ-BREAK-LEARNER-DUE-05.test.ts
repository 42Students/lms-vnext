import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";

const state=vi.hoisted(()=>({
 own:vi.fn(),select:vi.fn(),
 tasks:[] as Array<{projectId:string;dueDate:string|null;status:string}>,
}));
vi.mock("@/modules/projects/member-service",()=>({listMyProjectInstances:state.own}));
vi.mock("@/db/client",()=>({getDb:()=>({select:state.select})}));
import {listMyLearnerProjectDueStates} from "@/modules/projects/learner-project-due-service";

const p1="11111111-1111-4111-8111-111111111111";
const p2="22222222-2222-4222-8222-222222222222";
const other="33333333-3333-4333-8333-333333333333";
const actor=(role:"LEARNER"|"FACULTY"="LEARNER",status:"ACTIVE"|"DISABLED"="ACTIVE")=>({
 user:{id:"44444444-4444-4444-8444-444444444444",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"55555555-5555-4555-8555-555555555555",collegeId:"66666666-6666-4666-8666-666666666666",
 organizationId:"77777777-7777-4777-8777-777777777777",status,roles:[role]},
}) as unknown as Parameters<typeof listMyLearnerProjectDueStates>[0];

beforeEach(()=>{
 vi.useFakeTimers();
 vi.setSystemTime(new Date("2026-10-18T12:00:00.000Z"));
 state.own.mockReset();state.select.mockReset();state.tasks=[];
 state.own.mockResolvedValue([
  {memberRole:"LEARNER",project:{id:p1}},
  {memberRole:"LEARNER",project:{id:p2}},
  {memberRole:"MENTOR",project:{id:other}},
 ]);
 const chain={from(){return chain;},where(){return Promise.resolve(state.tasks);}};
 state.select.mockImplementation(()=>chain);
});
afterEach(()=>vi.useRealTimers());

describe("PROJ-BREAK-LEARNER-DUE-05 owner isolation, date boundaries and bulk scale",()=>{
 it("refuses a revoked actor and a faculty session before project lookup or task reads",async()=>{
  await expect(listMyLearnerProjectDueStates(actor("FACULTY"),[p1])).rejects.toThrow("PROJECT_ACCESS_DENIED");
  await expect(listMyLearnerProjectDueStates(actor("LEARNER","DISABLED"),[p1])).rejects.toThrow("PROJECT_ACCESS_DENIED");
  expect(state.own).not.toHaveBeenCalled();
  expect(state.select).not.toHaveBeenCalled();
 });
 it("rejects forged UUIDs and >2000 IDs before querying any project record",async()=>{
  await expect(listMyLearnerProjectDueStates(actor(),["malformed"])).rejects.toThrow();
  await expect(listMyLearnerProjectDueStates(actor(),Array(2001).fill(p1))).rejects.toThrow();
  expect(state.own).not.toHaveBeenCalled();
  expect(state.select).not.toHaveBeenCalled();
 });
 it("keeps only assigned learner projects, deduplicates IDs and ignores foreign task rows",async()=>{
  state.tasks=[
   {projectId:p1,dueDate:"2026-10-21",status:"TODO"},
   {projectId:p1,dueDate:"2026-10-17",status:"DONE"},
   {projectId:p1,dueDate:"2026-10-19",status:"BLOCKED"},
   {projectId:p2,dueDate:null,status:"TODO"},
   {projectId:other,dueDate:"2020-01-01",status:"BLOCKED"},
  ];
  const rows=await listMyLearnerProjectDueStates(actor(),[p1,p1,other,p2]);
  expect(rows).toEqual([
   {projectId:p1,date:"2026-10-19",state:"Due soon"},
   {projectId:p2,date:null,state:"No due date"},
  ]);
  expect(state.select).toHaveBeenCalledOnce();
 });
 it("does not query task rows if no requested project belongs to the learner",async()=>{
  expect(await listMyLearnerProjectDueStates(actor(),[other])).toEqual([]);
  expect(state.select).not.toHaveBeenCalled();
 });
 it("groups overdue and 1000+ project/task rows without a separate per-project sort",async()=>{
  const projects=Array.from({length:1000},(_,i)=>("00000000-0000-4000-8000-"+String(i).padStart(12,"0")));
  state.own.mockResolvedValueOnce(projects.map(id=>({memberRole:"LEARNER",project:{id}})));
  state.tasks=projects.flatMap(projectId=>[
   {projectId,dueDate:"2026-10-17",status:"TODO"},
   {projectId,dueDate:"2026-10-15",status:"DONE"},
  ]);
  const rows=await listMyLearnerProjectDueStates(actor(),projects);
  expect(rows).toHaveLength(1000);
  expect(rows.every(x=>x.state==="Overdue"&&x.date==="2026-10-17")).toBe(true);
  expect(state.select).toHaveBeenCalledOnce();
 });
});
