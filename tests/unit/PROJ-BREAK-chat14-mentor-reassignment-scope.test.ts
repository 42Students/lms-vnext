import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {
 listCollegeProjectMentorWorkload,listCollegeReassignmentWorkspaces,
 mentorReassignmentLiteralSearch,
} from "@/modules/projects/mentor-reassignment-workload-service";

const state=vi.hoisted(()=>({permitted:false,loaded:0,permissions:0,dbCalls:0}));
vi.mock("server-only",()=>({}));
vi.mock("@/modules/projects/scope",()=>({
 loadProjectCollegeScope:async(id:string)=>{
  state.loaded++;
  return {id,organizationId:"org-a"};
 },
}));
vi.mock("@/modules/permissions/policy",()=>({
 requirePermission:(_context:unknown,permission:string,resource:Record<string,unknown>)=>{
  state.permissions++;
  if(!state.permitted||permission!=="projects.manage"||
    resource.collegeId!=="college-a"||resource.organizationId!=="org-a")
   throw new Error("PROJECTS_MANAGE_DENIED");
 },
}));
vi.mock("@/db/client",()=>({
 getDb:()=>{state.dbCalls++;throw new Error("DB_QUERY_STARTED");},
}));
const context={user:{id:"admin"},membership:{id:"member",collegeId:"college-a",
 organizationId:"org-a",roles:["COLLEGE_ADMIN"]}} as unknown as RequestContext;
beforeEach(()=>{state.permitted=false;state.loaded=0;state.permissions=0;state.dbCalls=0;});

describe("PROJ-BREAK-MENTOR-196..199 scoped college mentor reassignment",()=>{
 it("PROJ-BREAK-MENTOR-196 refuses unauthorized admin before any workloads DB query",async()=>{
  await expect(listCollegeProjectMentorWorkload(context,"college-a"))
   .rejects.toThrow("PROJECTS_MANAGE_DENIED");
  await expect(listCollegeReassignmentWorkspaces(context,"college-a",{}))
   .rejects.toThrow("PROJECTS_MANAGE_DENIED");
  expect(state.permissions).toBe(2);
  expect(state.dbCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-197 permitted college admin reaches scoped database services",async()=>{
  state.permitted=true;
  await expect(listCollegeProjectMentorWorkload(context,"college-a"))
   .rejects.toThrow("DB_QUERY_STARTED");
  await expect(listCollegeReassignmentWorkspaces(context,"college-a",{}))
   .rejects.toThrow("DB_QUERY_STARTED");
  expect(state.dbCalls).toBe(2);
 });
 it("PROJ-BREAK-MENTOR-198 page, size, and tenant selectors cannot produce unbounded query",async()=>{
  state.permitted=true;
  for(const query of [
   {page:0},{page:10001},{pageSize:101},{pageSize:0},
   {fromMentorId:"../../foreign"},{status:"MADE_UP"},
   {q:"a".repeat(121)},
  ]){
   await expect(listCollegeReassignmentWorkspaces(context,"college-a",query as never))
    .rejects.toThrow();
  }
  expect(state.dbCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-199 LIKE metacharacters search as literals, not wildcards",()=>{
  expect(mentorReassignmentLiteralSearch("100% _ \\"))
   .toBe("100\\% \\_ \\\\");
  expect(mentorReassignmentLiteralSearch("IIT Dharwad")).toBe("IIT Dharwad");
 });
});
