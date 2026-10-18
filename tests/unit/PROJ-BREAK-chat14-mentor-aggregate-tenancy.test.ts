import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {listMyMentorProjectAttention} from "@/modules/projects/mentor-attention-service";
import {getMentorProjectWorkCounts} from "@/modules/projects/mentor-project-work-service";
import {getMentorProjectTeamSizes} from "@/modules/projects/mentor-project-team-size-service";

const state=vi.hoisted(()=>({
 active:true,role:true,allow:true,enabled:true,reads:0,rosterReads:0,
}));
vi.mock("server-only",()=>({}));
vi.mock("@/modules/identity/context",()=>({
 hasActiveMembership:()=>state.active,
 hasMembershipRole:(_:unknown,role:string)=>role==="MENTOR"&&state.role,
}));
vi.mock("@/modules/permissions/policy",()=>({can:()=>state.allow}));
vi.mock("@/modules/module-access/service",()=>({
 resolveOptionalModuleAccess:async()=>({projects:{enabled:state.enabled}}),
}));
vi.mock("@/modules/projects/member-service",()=>({
 listMyProjectInstances:async()=>{state.rosterReads++;return [];},
}));
vi.mock("@/db/client",()=>({
 getDb:()=>{state.reads++;throw new Error("DB_READ_ATTEMPTED");},
}));
const actor=():RequestContext=>({
 user:{id:"mentor",identityUid:"mentor-id",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"membership-a",status:"ACTIVE",collegeId:"college-a",
  organizationId:"org-a",roles:["MENTOR"]},
} as unknown as RequestContext);
const own={memberRole:"MENTOR",project:{id:"11111111-1111-4111-8111-111111111111",
 title:"Own workspace",collegeId:"college-a",updatedAt:new Date("2026-10-18T09:00:00.000Z"),
 status:"ACTIVE"}} as never;
const other={memberRole:"MENTOR",project:{id:"22222222-2222-4222-8222-222222222222",
 title:"Other tenant's project",collegeId:"college-b",
 updatedAt:new Date("2026-10-18T09:00:00.000Z"),status:"ACTIVE"}} as never;
const calls=[
 (ctx:RequestContext,rows:never[])=>listMyMentorProjectAttention(ctx,new Date("2026-10-18T10:00:00.000Z"),rows),
 (ctx:RequestContext,rows:never[])=>getMentorProjectWorkCounts(ctx,rows),
 (ctx:RequestContext,rows:never[])=>getMentorProjectTeamSizes(ctx,rows),
] as const;
beforeEach(()=>{
 state.active=true;state.role=true;state.allow=true;state.enabled=true;
 state.reads=0;state.rosterReads=0;
});
describe("PROJ-BREAK-MENTOR-136..140 aggregate source-of-truth and scope",()=>{
 it("PROJ-BREAK-MENTOR-136 foreign tenant rows passed by a caller cannot trigger DB access",async()=>{
  for(const service of calls){
   const result=await service(actor(),[other]);
   expect(result instanceof Map?result.size:result.length).toBe(0);
  }
  expect(state.reads).toBe(0);
  expect(state.rosterReads).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-137 injected roster with foreign plus owned row narrows to owned only",async()=>{
  for(const service of calls){
   await expect(service(actor(),[other,own])).rejects.toThrow("DB_READ_ATTEMPTED");
  }
  expect(state.reads).toBe(3);
 });
 it("PROJ-BREAK-MENTOR-138 inactive membership or removed Mentor role denies every aggregate",async()=>{
  for(const mode of ["inactive","wrong-role","disabled-user"]){
   const ctx=actor();
   state.active=mode!=="inactive";
   state.role=mode!=="wrong-role";
   if(mode==="disabled-user")ctx.user.platformStatus="DISABLED";
   for(const service of calls){
    await expect(service(ctx,[other])).rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
   }
   state.active=true;state.role=true;
  }
  expect(state.reads).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-139 wrong permission denies every aggregate before queries",async()=>{
  state.allow=false;
  for(const service of calls)
   await expect(service(actor(),[own])).rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  expect(state.reads).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-141 disabled Projects cannot expose aggregate data even for valid assigned Mentor rows",async()=>{
  state.enabled=false;
  for(const service of calls){
   await expect(service(actor(),[own]))
    .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  }
  expect(state.reads).toBe(0);
  expect(state.rosterReads).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-140 other-role injected rows cannot be counted as Mentors",async()=>{
  const fake={memberRole:"LEARNER",project:{id:"11111111-1111-4111-8111-111111111111",
    collegeId:"college-a"}} as never;
  for(const service of calls){
   const data=await service(actor(),[fake]);
   expect(data instanceof Map?data.size:data.length).toBe(0);
  }
  expect(state.reads).toBe(0);
 });
});
