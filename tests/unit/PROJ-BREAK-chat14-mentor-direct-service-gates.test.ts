import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {listPagedMentorProjects} from "@/modules/projects/mentor-paged-project-list-service";
import {listMyMentorCalendarMeetings} from "@/modules/projects/mentor-calendar-service";
import {mentorProjectListQuerySchema} from "@/modules/projects/mentor-project-list-query";

const state=vi.hoisted(()=>({
 enabled:true,authorized:true,active:true,role:true,dbReads:0,
}));
vi.mock("server-only",()=>({}));
vi.mock("@/modules/identity/context",()=>({
 hasActiveMembership:()=>state.active,
 hasMembershipRole:(_:unknown,role:string)=>role==="MENTOR"&&state.role,
}));
vi.mock("@/modules/permissions/policy",()=>({
 can:()=>state.authorized,
}));
vi.mock("@/modules/module-access/service",()=>({
 resolveOptionalModuleAccess:async()=>({projects:{enabled:state.enabled}}),
}));
vi.mock("@/db/client",()=>({
 getDb:()=>{state.dbReads++;throw new Error("DB_READ_ATTEMPTED");},
}));

const actor=():RequestContext=>({
 user:{id:"mentor-a",identityUid:"identity-a",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"membership-a",collegeId:"college-a",organizationId:"org-a",
  status:"ACTIVE",roles:["MENTOR"]},
} as unknown as RequestContext);
const query=()=>mentorProjectListQuerySchema.parse({page:1,pageSize:25});

beforeEach(()=>{
 state.enabled=true;state.authorized=true;state.active=true;state.role=true;state.dbReads=0;
});

describe("PROJ-BREAK-MENTOR-130..136 direct Mentor read service authorization gates",()=>{
 it("PROJ-BREAK-MENTOR-130 disabled module denies paged roster before touching DB",async()=>{
  state.enabled=false;
  await expect(listPagedMentorProjects(actor(),query()))
   .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  expect(state.dbReads).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-131 disabled module denies calendar before touching DB",async()=>{
  state.enabled=false;
  await expect(listMyMentorCalendarMeetings(actor()))
   .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  expect(state.dbReads).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-132 revoked membership and role are denied on both service paths",async()=>{
  for(const broken of ["inactive-membership","wrong-role","inactive-user"]){
   const ctx=actor();
   if(broken==="inactive-membership")ctx.membership!.status="SUSPENDED";
   if(broken==="wrong-role")ctx.membership!.roles=["LEARNER"];
   if(broken==="inactive-user")ctx.user.platformStatus="DISABLED";
   state.active=broken!=="inactive-membership";
   state.role=broken!=="wrong-role";
   await expect(listPagedMentorProjects(ctx,query()))
    .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
   await expect(listMyMentorCalendarMeetings(ctx))
    .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
   state.active=true;state.role=true;
  }
  expect(state.dbReads).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-133 rejected permission denies both project and meeting enumeration",async()=>{
  state.authorized=false;
  await expect(listPagedMentorProjects(actor(),query()))
   .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  await expect(listMyMentorCalendarMeetings(actor()))
   .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  expect(state.dbReads).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-134 direct service rejects unparsed page/size and tenant selectors",async()=>{
  for(const invalid of [
   {page:-5,pageSize:25},{page:1,pageSize:0},{page:1,pageSize:10000},
   {page:999999,pageSize:25},{page:1,pageSize:25,collegeId:"college-other"},
   {page:1,pageSize:25,organizationId:"org-other"},
  ]){
   await expect(listPagedMentorProjects(actor(),invalid as never)).rejects.toThrow();
  }
  expect(state.dbReads).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-135 valid authorized paths reach the database, no false disabled state",async()=>{
  await expect(listPagedMentorProjects(actor(),query())).rejects.toThrow("DB_READ_ATTEMPTED");
  await expect(listMyMentorCalendarMeetings(actor())).rejects.toThrow("DB_READ_ATTEMPTED");
  expect(state.dbReads).toBe(2);
 });
});
