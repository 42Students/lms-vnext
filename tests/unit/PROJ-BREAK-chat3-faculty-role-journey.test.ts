import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";

vi.mock("server-only",()=>({}));
const stubs=vi.hoisted(()=>({
 project:vi.fn(),college:vi.fn(),member:vi.fn(),module:vi.fn(),
 queries:0,rows:0,
}));
vi.mock("@/modules/projects/scope",()=>({
 loadProjectCollegeScope:stubs.college,
}));
vi.mock("@/modules/module-access/service",()=>({
 resolveOptionalModuleAccess:stubs.module,
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  select:(projection?:Record<string,unknown>)=>{
   stubs.queries++;
   const member=Boolean(projection&&"roleKind" in projection);
   const query={
    from:()=>query,
    innerJoin:()=>query,
    where:()=>query,
    limit:async()=>{
     stubs.rows++;
     const result=await (member?stubs.member():stubs.project());
     return result?[result]:[];
    },
   };
   return query;
  },
 }),
}));
import {
 requireProjectReadAccess,requireProjectManageAccess,
 requireProjectLifecycleAccess,requireProjectLifecycleMutationAccess,
} from "@/modules/projects/access";
import {can} from "@/modules/permissions/policy";

const projectId="11111111-1111-4111-8111-111111111111";
const collegeId="22222222-2222-4222-8222-222222222222";
const otherCollege="33333333-3333-4333-8333-333333333333";
const organizationId="44444444-4444-4444-8444-444444444444";
const otherOrg="55555555-5555-4555-8555-555555555555";
type Role="FACULTY"|"MENTOR"|"LEARNER"|"COLLEGE_ADMIN"|"TPO";
function actor(roles:readonly Role[],options:{
 status?:"ACTIVE"|"SUSPENDED";
 platformStatus?:"ACTIVE"|"DISABLED";
 collegeId?:string;organizationId?:string;
 superAdmin?:boolean;
}={}):RequestContext {
 return {
  user:{id:"user",identityUid:"identity",
   platformStatus:options.platformStatus??"ACTIVE",
   systemRoles:options.superAdmin?["SUPER_ADMIN"]:[]},
  membership:{
   id:"member",organizationId:options.organizationId??organizationId,
   collegeId:options.collegeId??collegeId,
   status:options.status??"ACTIVE",roles,
  },
 };
}
const member=(role:"MENTOR"|"LEARNER",kind:"MENTOR"|"CO_MENTOR"|"LEARNER"|"OBSERVER",
 canMutate:boolean)=>({id:"project-member",role,roleKind:kind,canMutate,isPrimary:false});
beforeEach(()=>{
 vi.resetAllMocks();
 stubs.queries=0;stubs.rows=0;
 stubs.project.mockResolvedValue({id:projectId,collegeId,title:"Safe project"});
 stubs.college.mockResolvedValue({id:collegeId,organizationId});
 stubs.member.mockResolvedValue(member("MENTOR","MENTOR",true));
 stubs.module.mockResolvedValue({projects:{enabled:true}});
});
describe("PROJ-BREAK-chat3-FACULTY-01 project role boundary and access journeys",()=>{
 it("Faculty-only accounts cannot discover project IDs or trigger project SQL reads",async()=>{
  const faculty=actor(["FACULTY"]);
  for(const access of [
   requireProjectReadAccess,requireProjectManageAccess,
   requireProjectLifecycleAccess,requireProjectLifecycleMutationAccess,
  ]){
   await expect(access(faculty,projectId))
    .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  }
  expect(stubs.queries).toBe(0);
  expect(stubs.college).not.toHaveBeenCalled();
  expect(stubs.member).not.toHaveBeenCalled();
  expect(can(faculty,"projects.manage",{collegeId,organizationId})).toBe(false);
 });
 it("a Faculty-plus-Mentor actor needs an active persisted Mentor project grant",async()=>{
  const hybrid=actor(["FACULTY","MENTOR"]);
  const scope=await requireProjectReadAccess(hybrid,projectId);
  expect(scope.access).toBe("MENTOR");
  expect(scope.member).toMatchObject({role:"MENTOR",roleKind:"MENTOR"});
  expect(stubs.member).toHaveBeenCalledOnce();
  expect(await requireProjectLifecycleAccess(hybrid,projectId))
   .toMatchObject({access:"MENTOR"});
 });
 it("nonmutable co-mentor/observer assignments never gain mentor lifecycle writes",async()=>{
  const hybrid=actor(["FACULTY","MENTOR"]);
  for(const value of [
   member("MENTOR","OBSERVER",false),
   member("MENTOR","CO_MENTOR",false),
   member("MENTOR","LEARNER",true),
  ]){
   stubs.member.mockResolvedValue(value);
   await expect(requireProjectReadAccess(hybrid,projectId))
    .resolves.toMatchObject({access:"OBSERVER"});
   await expect(requireProjectLifecycleAccess(hybrid,projectId))
    .rejects.toMatchObject({code:"PROJECT_LIFECYCLE_ACCESS_DENIED"});
  }
 });
 it("rejects missing, ended or wrong-role mentor project grants",async()=>{
  const hybrid=actor(["FACULTY","MENTOR"]);
  stubs.member.mockResolvedValueOnce(null);
  await expect(requireProjectReadAccess(hybrid,projectId))
   .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  stubs.member.mockResolvedValueOnce(member("LEARNER","LEARNER",true));
  await expect(requireProjectReadAccess(hybrid,projectId))
   .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
 });
 it("rejects cross-college, cross-organization, suspended membership and disabled Faculty/Mentor",async()=>{
  const blocked=[
   actor(["FACULTY","MENTOR"],{collegeId:otherCollege}),
   actor(["FACULTY","MENTOR"],{organizationId:otherOrg}),
   actor(["FACULTY","MENTOR"],{status:"SUSPENDED"}),
   actor(["FACULTY","MENTOR"],{platformStatus:"DISABLED"}),
  ];
  for(const context of blocked){
   await expect(requireProjectReadAccess(context,projectId))
    .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  }
  expect(stubs.member).not.toHaveBeenCalled();
 });
 it("a Faculty-plus-Mentor loses mutating access when the Projects module is disabled",async()=>{
  const hybrid=actor(["FACULTY","MENTOR"]);
  stubs.module.mockResolvedValue({projects:{enabled:false}});
  await expect(requireProjectLifecycleMutationAccess(hybrid,projectId))
   .rejects.toMatchObject({code:"PROJECT_LIFECYCLE_ACCESS_DENIED"});
 });
 it("an active College Admin receives only scoped project-admin authority",async()=>{
  const admin=actor(["COLLEGE_ADMIN"]);
  expect(await requireProjectManageAccess(admin,projectId)).toMatchObject({
   collegeId,organizationId,
  });
  const wrong=actor(["COLLEGE_ADMIN"],{collegeId:otherCollege});
  await expect(requireProjectManageAccess(wrong,projectId))
   .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  expect(stubs.member).not.toHaveBeenCalled();
 });
 it("invalid IDs and nonexistent projects cannot grant access",async()=>{
  await expect(requireProjectReadAccess(actor(["MENTOR"]),"not-a-uuid")).rejects.toThrow();
  stubs.project.mockResolvedValueOnce(null);
  await expect(requireProjectReadAccess(actor(["FACULTY","MENTOR"]),projectId))
   .rejects.toMatchObject({code:"PROJECT_NOT_FOUND"});
 });
});
