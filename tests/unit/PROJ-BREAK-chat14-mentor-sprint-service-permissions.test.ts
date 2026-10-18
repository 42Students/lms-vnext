import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {getMentorSprintProgress} from "@/modules/projects/mentor-sprint-progress-service";

const projectId="11111111-1111-4111-8111-111111111111";
const foreignId="22222222-2222-4222-8222-222222222222";
const state=vi.hoisted(()=>({
 active:true,role:true,permission:true,enabled:true,rosterCalls:0,dbCalls:0,
 rows:[] as Array<{memberRole:string;project:{
  id:string;collegeId:string;status:string;title:string
 }}>,
}));
vi.mock("server-only",()=>({}));
vi.mock("@/modules/identity/context",()=>({
 hasActiveMembership:()=>state.active,
 hasMembershipRole:(_:unknown,role:string)=>role==="MENTOR"&&state.role,
}));
vi.mock("@/modules/permissions/policy",()=>({
 can:()=>state.permission,
}));
vi.mock("@/modules/module-access/service",()=>({
 resolveOptionalModuleAccess:async()=>({projects:{enabled:state.enabled}}),
}));
vi.mock("@/modules/projects/member-service",()=>({
 listMyProjectInstances:async()=>{
  state.rosterCalls++;
  return state.rows;
 },
}));
vi.mock("@/db/client",()=>({
 getDb:()=>{state.dbCalls++;throw new Error("DB_READ_ATTEMPTED");},
}));
function ctx():RequestContext{
 return {user:{id:"mentor",platformStatus:"ACTIVE",identityUid:"mentor-id",systemRoles:[]},
  membership:{id:"member",collegeId:"college-a",organizationId:"org-a",
   status:"ACTIVE",roles:["MENTOR"]}} as RequestContext;
}
const row=(id:string,collegeId:string,memberRole="MENTOR",status="ACTIVE")=>({
 memberRole,project:{id,collegeId,title:"Workspace "+id,status},
});
beforeEach(()=>{
 state.active=true;state.role=true;state.permission=true;state.enabled=true;
 state.rosterCalls=0;state.dbCalls=0;state.rows=[];
});

describe("Mentor sprint progress service permission and tenant boundary",()=>{
 it("PROJ-BREAK-MENTOR-377 disabled platform actor cannot inspect roster or sprint rows",async()=>{
  const actor=ctx();actor.user.platformStatus="DISABLED";
  state.rows=[row(projectId,"college-a")];
  await expect(getMentorSprintProgress(actor,{}))
   .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  expect(state.rosterCalls+state.dbCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-378 inactive, wrong role or insufficient permission never queries roster",async()=>{
  for(const failure of ["inactive","role","permission"]){
   state.active=failure!=="inactive";state.role=failure!=="role";
   state.permission=failure!=="permission";
   await expect(getMentorSprintProgress(ctx(),{}))
    .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  }
  expect(state.rosterCalls+state.dbCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-379 disabled module cannot enumerate private project choices",async()=>{
  state.enabled=false;
  state.rows=[row(projectId,"college-a")];
  const result=await getMentorSprintProgress(ctx(),{});
  expect(result).toMatchObject({enabled:false,items:[],projects:[],total:0});
  expect(state.rosterCalls+state.dbCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-380 injected other-college or learner roster rows cannot reach data query",async()=>{
  state.rows=[row(foreignId,"college-b"),row(projectId,"college-a","LEARNER"),
   row("33333333-3333-4333-8333-333333333333","college-a","MENTOR","ARCHIVED")];
  const result=await getMentorSprintProgress(ctx(),{});
  expect(result).toMatchObject({enabled:true,items:[],projects:[],total:0});
  expect(state.rosterCalls).toBe(1);
  expect(state.dbCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-381 forged project query is rejected before any cross-tenant sprint data read",async()=>{
  state.rows=[row(projectId,"college-a")];
  await expect(getMentorSprintProgress(ctx(),{projectId:foreignId}))
   .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  expect(state.rosterCalls).toBe(1);
  expect(state.dbCalls).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-382 own college, active Mentor assignment enables scoped query only",async()=>{
  state.rows=[row(projectId,"college-a"),row(foreignId,"college-b")];
  await expect(getMentorSprintProgress(ctx(),{projectId}))
   .rejects.toThrow("DB_READ_ATTEMPTED");
  expect(state.rosterCalls).toBe(1);
  expect(state.dbCalls).toBe(1);
 });
});
