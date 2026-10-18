import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {
 requireProjectReadAccess,requireProjectLifecycleMutationAccess,
 requireProjectLifecycleAccess,
} from "@/modules/projects/access";

const state=vi.hoisted(()=>({
 roles:["MENTOR"] as string[],superAdmin:false,
 moduleEnabled:true,allowRead:true,allowManage:false,
 userStatus:"ACTIVE",membershipStatus:"ACTIVE",
 memberPresent:true,memberRole:"MENTOR",roleKind:"MENTOR",canMutate:true,
 contextCollege:"college-a",contextOrg:"org-a",
 projectCollege:"college-a",projectOrg:"org-a",projectPresent:true,
 projectQueries:0,memberQueries:0,accessChecks:0,
}));
const projectId="11111111-1111-4111-8111-111111111111";
const context=():RequestContext=>({
 user:{id:"actor",platformStatus:state.userStatus},
 membership:state.superAdmin?null:{
  id:"membership",collegeId:state.contextCollege,
  organizationId:state.contextOrg,status:state.membershipStatus,roles:[...state.roles],
 },
} as unknown as RequestContext);
vi.mock("server-only",()=>({}));
vi.mock("drizzle-orm",()=>({
 and:(...xs:unknown[])=>xs,eq:(...xs:unknown[])=>xs,
 isNull:(x:unknown)=>x,sql:(_text:TemplateStringsArray,...xs:unknown[])=>xs,
}));
vi.mock("@/db/schema",()=>({
 projectInstances:{id:"project.id",collegeId:"project.college_id"},
 projectMembers:{id:"member.id",role:"member.role",isPrimary:"member.primary",
  roleKind:"member.role_kind",canMutate:"member.can_mutate",endedAt:"member.ended_at",
  projectId:"member.project_id",membershipId:"member.membership_id"},
 collegeMemberships:{id:"college_member.id",userId:"college_member.user_id",
  collegeId:"college_member.college_id",status:"college_member.status"},
 membershipRoles:{membershipId:"role.member_id",role:"role.role"},
 users:{id:"user.id",platformStatus:"user.status"},
}));
vi.mock("@/modules/identity/context",()=>({
 hasMembershipRole:(_:unknown,role:string)=>state.roles.includes(role),
 isSuperAdmin:()=>state.superAdmin,
}));
vi.mock("@/modules/module-access/service",()=>({
 resolveOptionalModuleAccess:async()=>({projects:{enabled:state.moduleEnabled}}),
}));
vi.mock("@/modules/projects/scope",()=>({
 loadProjectCollegeScope:async()=>({
  id:state.projectCollege,organizationId:state.projectOrg,
 }),
}));
vi.mock("@/modules/permissions/policy",()=>({
 can:(_:unknown,permission:string,resource:{collegeId:string;organizationId:string})=>{
  state.accessChecks++;
  const matches=resource.collegeId===state.projectCollege &&
    resource.organizationId===state.projectOrg;
  return matches && (permission==="projects.manage"?state.allowManage:state.allowRead);
 },
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  select:()=>({
   from:(table:unknown)=>{
    const isProject=Boolean(table && typeof table==="object" && "collegeId" in table);
    if(isProject)state.projectQueries++;else state.memberQueries++;
    const query={
     where:()=>query,innerJoin:()=>query,
     limit:async()=>isProject
      ? state.projectPresent?[{id:projectId,collegeId:state.projectCollege,status:"ACTIVE",title:"Atlas"}]:[]
      : state.memberPresent?[{id:"grant",role:state.memberRole,roleKind:state.roleKind,
        isPrimary:true,canMutate:state.canMutate}]:[],
    };
    return query;
   },
  }),
 }),
}));
beforeEach(()=>{
 state.roles=["MENTOR"];state.superAdmin=false;state.moduleEnabled=true;
 state.allowRead=true;state.allowManage=false;
 state.userStatus="ACTIVE";state.membershipStatus="ACTIVE";
 state.memberPresent=true;state.memberRole="MENTOR";
 state.roleKind="MENTOR";state.canMutate=true;
 state.contextCollege="college-a";state.contextOrg="org-a";
 state.projectCollege="college-a";state.projectOrg="org-a";
 state.projectPresent=true;state.projectQueries=0;state.memberQueries=0;
 state.accessChecks=0;
});
describe("IIT Dharwad project access and Mentor mutation matrix",()=>{
 it("PROJ-BREAK-MENTOR-250 disabled Projects rejects before any project ID lookup",async()=>{
  state.moduleEnabled=false;
  await expect(requireProjectLifecycleMutationAccess(context(),projectId))
   .rejects.toMatchObject({code:"PROJECT_LIFECYCLE_ACCESS_DENIED"});
  expect(state.projectQueries).toBe(0);
  expect(state.memberQueries).toBe(0);
  expect(state.accessChecks).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-251 assigned and persisted Mentor grant permits project mutation",async()=>{
  const result=await requireProjectLifecycleMutationAccess(context(),projectId);
  expect(result.access).toBe("MENTOR");
  expect(result.member).toMatchObject({role:"MENTOR",canMutate:true});
  expect(state.projectQueries).toBe(1);
  expect(state.memberQueries).toBe(1);
 });
 it("PROJ-BREAK-MENTOR-252 co-Mentor mutates only with explicit canMutate",async()=>{
  state.roleKind="CO_MENTOR";
  expect((await requireProjectLifecycleMutationAccess(context(),projectId)).access).toBe("MENTOR");
  state.canMutate=false;
  await expect(requireProjectLifecycleMutationAccess(context(),projectId))
   .rejects.toMatchObject({code:"PROJECT_LIFECYCLE_ACCESS_DENIED"});
 });
 it("PROJ-BREAK-MENTOR-253 Mentor observer and QA grants are never write permissions",async()=>{
  for(const roleKind of ["OBSERVER","REVIEWER","QA","LEARNER"]){
   state.roleKind=roleKind;
   const read=await requireProjectReadAccess(context(),projectId);
   expect(read.access).toBe("OBSERVER");
   await expect(requireProjectLifecycleMutationAccess(context(),projectId))
    .rejects.toMatchObject({code:"PROJECT_LIFECYCLE_ACCESS_DENIED"});
  }
 });
 it("PROJ-BREAK-MENTOR-254 missing, ended or unrelated assignment denies exact-project read",async()=>{
  state.memberPresent=false;
  await expect(requireProjectReadAccess(context(),projectId))
   .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  expect(state.projectQueries).toBe(1);
  expect(state.memberQueries).toBe(1);
 });
 it("PROJ-BREAK-MENTOR-255 refuses cross-college and cross-organization membership",async()=>{
  for(const [college,org] of [["foreign-college","org-a"],["college-a","foreign-org"]]){
   state.contextCollege=college;state.contextOrg=org;
   await expect(requireProjectReadAccess(context(),projectId))
    .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  }
  expect(state.memberQueries).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-256 refuses disabled users, removed memberships and mismatched project roles",async()=>{
  state.userStatus="SUSPENDED";
  await expect(requireProjectReadAccess(context(),projectId))
   .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  state.userStatus="ACTIVE";state.membershipStatus="ENDED";
  await expect(requireProjectReadAccess(context(),projectId))
   .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  state.membershipStatus="ACTIVE";state.memberRole="LEARNER";
  await expect(requireProjectReadAccess(context(),projectId))
   .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
 });
 it("PROJ-BREAK-MENTOR-257 TPO and recruiter cannot enumerate guessed project UUIDs",async()=>{
  for(const role of ["TPO","RECRUITER","FACULTY"]){
   state.roles=[role];state.projectQueries=0;
   await expect(requireProjectReadAccess(context(),projectId))
    .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
   expect(state.projectQueries).toBe(0);
  }
 });
 it("PROJ-BREAK-MENTOR-258 College Admin receives only policy-scoped manage access",async()=>{
  state.roles=["COLLEGE_ADMIN"];state.allowManage=true;
  const authorized=await requireProjectLifecycleMutationAccess(context(),projectId);
  expect(authorized.access).toBe("ADMIN");
  state.allowManage=false;state.memberPresent=false;
  await expect(requireProjectLifecycleMutationAccess(context(),projectId))
   .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
 });
 it("PROJ-BREAK-MENTOR-259 Super Admin acting college requires explicit manage permission",async()=>{
  state.roles=[];state.superAdmin=true;state.allowManage=true;
  expect((await requireProjectLifecycleMutationAccess(context(),projectId)).access).toBe("ADMIN");
  state.allowManage=false;
  await expect(requireProjectLifecycleMutationAccess(context(),projectId))
   .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
 });
 it("PROJ-BREAK-MENTOR-260 unknown project ID stays not-found only after Mentor role gate",async()=>{
  state.roles=["RECRUITER"];state.projectPresent=false;
  await expect(requireProjectReadAccess(context(),projectId))
   .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  expect(state.projectQueries).toBe(0);
  state.roles=["MENTOR"];
  await expect(requireProjectReadAccess(context(),projectId))
   .rejects.toMatchObject({code:"PROJECT_NOT_FOUND"});
 });
});
