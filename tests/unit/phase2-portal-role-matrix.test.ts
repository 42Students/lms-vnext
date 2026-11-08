import {describe,expect,it} from "vitest";
import {
 hasActiveMembership,hasActiveRecruiter,hasMembershipRole,isSuperAdmin,type RequestContext,
} from "@/modules/identity/context";
import {deniedPortalHome} from "@/modules/identity/unauthorized-portal-home";
import {can} from "@/modules/permissions/policy";
import {
 canOpenTpoWorkspace,getTpoWorkspaceAccessDecision,hasTpoTooling,
} from "@/modules/placements/tpo-workspace-access-model";

const COLLEGE_A="3f07e954-a74c-59f2-9d82-263343b1c1a9";
const COLLEGE_B="3027c935-2367-5706-94c4-2e71ab2ac0ca";
const ORG_A="b3f1e38b-a1b7-505d-880c-0f7aabe140db";
const ORG_B="09d24c86-cc7b-57bf-ac89-90cdccc7d132";
const REL_A="11111111-1111-4111-8111-111111111111";
const REL_B="22222222-2222-4222-8222-222222222222";
const USER="a5d7ad55-54a5-4170-b3ec-93131a8d3435";

type Opts={
 platform?:"ACTIVE"|"DISABLED";systemRoles?:("SUPER_ADMIN")[];
 roles?:("LEARNER"|"FACULTY"|"COLLEGE_ADMIN"|"MENTOR"|"TPO")[];
 membership?:"ACTIVE"|"SUSPENDED"|"ENDED"|null;
 college?:string;org?:string;recruiter?:boolean;recruiterUserId?:string;
 adminScope?:{organizationId:string|null;collegeId:string|null}|null;
};
function ctx(o:Opts={}):RequestContext{
 const membership=o.membership===null?null:{
  id:"m-1",collegeId:o.college??COLLEGE_A,organizationId:o.org??ORG_A,
  status:o.membership??"ACTIVE",roles:o.roles??[],
 };
 return {
  user:{id:USER,identityUid:"uid",platformStatus:o.platform??"ACTIVE",systemRoles:o.systemRoles??[]},
  membership,
  adminScope:o.adminScope??null,
  recruiter:o.recruiter?{
   userId:o.recruiterUserId??USER,companyId:"c-1",companyName:"Acme",title:null,status:"ACTIVE",
   grants:[{id:"g-1",organizationId:ORG_A,collegeId:COLLEGE_A,collegeName:"A",companyRelationshipId:REL_A}],
  }:null,
 };
}

describe("PHASE2-ROLE TPO workspace access decision",()=>{
 it("PHASE2-ROLE-01 no context is a 401 sign-in, not a 403",()=>{
  expect(getTpoWorkspaceAccessDecision(null)).toEqual({allowed:false,status:401,reason:"SIGN_IN_REQUIRED"});
  expect(getTpoWorkspaceAccessDecision(undefined)).toEqual({allowed:false,status:401,reason:"SIGN_IN_REQUIRED"});
  expect(canOpenTpoWorkspace(null)).toBe(false);
 });

 it("PHASE2-ROLE-02 an active TPO opens the workspace with full TPO tooling",()=>{
  const c=ctx({roles:["TPO"]});
  expect(getTpoWorkspaceAccessDecision(c)).toEqual({allowed:true,scope:"TPO"});
  expect(hasTpoTooling(c)).toBe(true);
 });

 it("PHASE2-ROLE-03 an active college admin opens the placement cell but has no TPO-personal tooling",()=>{
  const c=ctx({roles:["COLLEGE_ADMIN"]});
  expect(getTpoWorkspaceAccessDecision(c)).toEqual({allowed:true,scope:"COLLEGE_PLACEMENTS"});
  expect(hasTpoTooling(c)).toBe(false);
 });

 it("PHASE2-ROLE-04 learner, faculty and mentor are refused with PLACEMENTS_ACCESS_DENIED",()=>{
  for(const role of ["LEARNER","FACULTY","MENTOR"] as const){
   expect(getTpoWorkspaceAccessDecision(ctx({roles:[role]})),role).toEqual({allowed:false,status:403,reason:"PLACEMENTS_ACCESS_DENIED"});
   expect(hasTpoTooling(ctx({roles:[role]})),role).toBe(false);
  }
 });

 it("PHASE2-ROLE-05 a suspended or ended membership is NO_ACTIVE_MEMBERSHIP even for a TPO",()=>{
  for(const status of ["SUSPENDED","ENDED"] as const)
   expect(getTpoWorkspaceAccessDecision(ctx({roles:["TPO"],membership:status})),status)
    .toEqual({allowed:false,status:403,reason:"NO_ACTIVE_MEMBERSHIP"});
 });

 it("PHASE2-ROLE-06 a disabled platform account loses TPO access regardless of its membership",()=>{
  const c=ctx({roles:["TPO"],platform:"DISABLED"});
  expect(canOpenTpoWorkspace(c)).toBe(false);
  expect(hasTpoTooling(c)).toBe(false);
  expect(hasActiveMembership(c)).toBe(false);
 });

 it("PHASE2-ROLE-07 a user with no membership is refused even as a recruiter or super admin",()=>{
  expect(getTpoWorkspaceAccessDecision(ctx({membership:null,recruiter:true})))
   .toEqual({allowed:false,status:403,reason:"NO_ACTIVE_MEMBERSHIP"});
  expect(canOpenTpoWorkspace(ctx({membership:null,systemRoles:["SUPER_ADMIN"]}))).toBe(false);
 });

 it("PHASE2-ROLE-08 holding TPO plus another role selects none; the selected TPO role keeps the TPO scope",()=>{
  // One workspace per role: two held roles with none selected grants nothing.
  expect(getTpoWorkspaceAccessDecision(ctx({roles:["LEARNER","TPO"]})))
   .toEqual({allowed:false,status:403,reason:"NO_ACTIVE_MEMBERSHIP"});
  expect(getTpoWorkspaceAccessDecision(ctx({roles:["TPO"]}))).toEqual({allowed:true,scope:"TPO"});
 });
});

describe("PHASE2-ROLE recruiter portal gate",()=>{
 it("PHASE2-ROLE-09 only an active user with an ACTIVE recruiter profile passes",()=>{
  expect(hasActiveRecruiter(ctx({recruiter:true,membership:null}))).toBe(true);
  expect(hasActiveRecruiter(ctx({recruiter:false}))).toBe(false);
  expect(hasActiveRecruiter(ctx({recruiter:true,platform:"DISABLED"}))).toBe(false);
  expect(hasActiveRecruiter(null)).toBe(false);
  expect(hasActiveRecruiter(undefined)).toBe(false);
 });

 it("PHASE2-ROLE-10 a TPO membership alone never grants the recruiter portal",()=>{
  expect(hasActiveRecruiter(ctx({roles:["TPO"]}))).toBe(false);
 });
});

describe("PHASE2-ROLE permission policy for TPO and recruiter actions",()=>{
 const here={collegeId:COLLEGE_A,organizationId:ORG_A};

 it("PHASE2-ROLE-11 placements.manage needs TPO or college admin in the SAME college and organization",()=>{
  expect(can(ctx({roles:["TPO"]}),"placements.manage",here)).toBe(true);
  expect(can(ctx({roles:["COLLEGE_ADMIN"]}),"placements.manage",here)).toBe(true);
  expect(can(ctx({roles:["TPO"]}),"placements.manage",{collegeId:COLLEGE_B,organizationId:ORG_A})).toBe(false);
  expect(can(ctx({roles:["TPO"]}),"placements.manage",{collegeId:COLLEGE_A,organizationId:ORG_B})).toBe(false);
  expect(can(ctx({roles:["TPO"]}),"placements.manage",{})).toBe(false);
 });

 it("PHASE2-ROLE-12 faculty, mentor and learner never hold placements.manage, even in their own college",()=>{
  for(const role of ["FACULTY","MENTOR","LEARNER"] as const)
   expect(can(ctx({roles:[role]}),"placements.manage",here),role).toBe(false);
 });

 it("PHASE2-ROLE-13 a super admin reaches placements.manage only inside the selected admin scope",()=>{
  const sa=(adminScope:Opts["adminScope"])=>ctx({membership:null,systemRoles:["SUPER_ADMIN"],adminScope});
  expect(can(sa(null),"placements.manage",here)).toBe(true);
  expect(can(sa({organizationId:null,collegeId:COLLEGE_A}),"placements.manage",here)).toBe(true);
  expect(can(sa({organizationId:null,collegeId:COLLEGE_A}),"placements.manage",{collegeId:COLLEGE_B,organizationId:ORG_A})).toBe(false);
  expect(can(sa({organizationId:ORG_A,collegeId:COLLEGE_A}),"placements.manage",{collegeId:COLLEGE_A,organizationId:ORG_B})).toBe(false);
  expect(can(sa({organizationId:ORG_A,collegeId:null}),"placements.manage",{collegeId:COLLEGE_B,organizationId:ORG_A})).toBe(true);
  expect(can(sa({organizationId:ORG_A,collegeId:null}),"placements.manage",{collegeId:COLLEGE_A,organizationId:ORG_B})).toBe(false);
 });

 it("PHASE2-ROLE-13b a super admin gets no recruiter permissions without a real recruiter grant",()=>{
  const sa=ctx({membership:null,systemRoles:["SUPER_ADMIN"]});
  expect(can(sa,"placements.recruiter.read",{collegeId:COLLEGE_A,organizationId:ORG_A,placementCompanyRelationshipId:REL_A})).toBe(false);
 });

 it("PHASE2-ROLE-14 faculty hold the team-management permission only when flagged as a TPO team administrator",()=>{
  const faculty=ctx({roles:["FACULTY"]});
  expect(can(faculty,"placements.tpo.team.manage",{...here,tpoTeamAdministrator:true})).toBe(true);
  expect(can(faculty,"placements.tpo.team.manage",{...here,tpoTeamAdministrator:false})).toBe(false);
  expect(can(faculty,"placements.tpo.team.manage",here)).toBe(false);
  expect(can(ctx({roles:["TPO"]}),"placements.tpo.team.manage",here)).toBe(true);
 });

 it("PHASE2-ROLE-15 admin-scope.select belongs to an active super admin only",()=>{
  expect(can(ctx({membership:null,systemRoles:["SUPER_ADMIN"]}),"admin-scope.select")).toBe(true);
  expect(can(ctx({membership:null,systemRoles:["SUPER_ADMIN"],platform:"DISABLED"}),"admin-scope.select")).toBe(false);
  for(const role of ["TPO","COLLEGE_ADMIN","FACULTY"] as const)
   expect(can(ctx({roles:[role]}),"admin-scope.select"),role).toBe(false);
  expect(can(ctx({recruiter:true}),"admin-scope.select")).toBe(false);
  expect(isSuperAdmin(null)).toBe(false);
 });

 it("PHASE2-ROLE-16 recruiter permissions need a grant for the exact college, organization and company relationship",()=>{
  const c=ctx({recruiter:true,membership:null});
  const scope={collegeId:COLLEGE_A,organizationId:ORG_A,placementCompanyRelationshipId:REL_A};
  expect(can(c,"placements.recruiter.read",scope)).toBe(true);
  expect(can(c,"placements.recruiter.read",{...scope,collegeId:COLLEGE_B})).toBe(false);
  expect(can(c,"placements.recruiter.read",{...scope,organizationId:ORG_B})).toBe(false);
  expect(can(c,"placements.recruiter.read",{...scope,placementCompanyRelationshipId:REL_B})).toBe(false);
  expect(can(c,"placements.recruiter.read",{collegeId:COLLEGE_A,organizationId:ORG_A})).toBe(false);
  expect(can(c,"placements.recruiter.read",{collegeId:"  ",placementCompanyRelationshipId:REL_A})).toBe(false);
 });

 it("PHASE2-ROLE-17 every recruiter-scoped permission follows the same grant rule",()=>{
  const c=ctx({recruiter:true,membership:null});
  const ok={collegeId:COLLEGE_A,organizationId:ORG_A,placementCompanyRelationshipId:REL_A};
  const no={collegeId:COLLEGE_B,organizationId:ORG_A,placementCompanyRelationshipId:REL_A};
  for(const p of ["placements.recruiter.read","placements.recruiter.round.manage","placements.recruiter.slot.manage",
   "placements.recruiter.outside.record","placements.recruiter.result.stage","placements.recruiter.note"] as const){
   expect(can(c,p,ok),p).toBe(true);
   expect(can(c,p,no),p).toBe(false);
  }
 });

 it("PHASE2-ROLE-18 a recruiter context that belongs to a different user is never honoured (confused-deputy guard)",()=>{
  const c=ctx({recruiter:true,membership:null,recruiterUserId:"someone-else"});
  expect(can(c,"placements.recruiter.read",{collegeId:COLLEGE_A,organizationId:ORG_A,placementCompanyRelationshipId:REL_A})).toBe(false);
 });

 it("PHASE2-ROLE-19 TPO and college-admin membership never confer recruiter permissions",()=>{
  for(const role of ["TPO","COLLEGE_ADMIN"] as const)
   expect(can(ctx({roles:[role]}),"placements.recruiter.read",{collegeId:COLLEGE_A,organizationId:ORG_A,placementCompanyRelationshipId:REL_A}),role).toBe(false);
 });

 it("PHASE2-ROLE-20 a disabled account holds no permission at all, not even self-management",()=>{
  const c=ctx({roles:["TPO"],platform:"DISABLED"});
  expect(can(c,"identity.self.manage")).toBe(false);
  expect(can(c,"placements.manage",here)).toBe(false);
  expect(can(null,"identity.self.manage")).toBe(false);
 });
});

describe("PHASE2-ROLE denied portal redirect",()=>{
 const END="?access=denied";
 it("PHASE2-ROLE-21 each role lands on its own portal home with an access-denied flag",()=>{
  expect(deniedPortalHome(ctx({membership:null,systemRoles:["SUPER_ADMIN"]}))).toBe("/admin/tenants"+END);
  expect(deniedPortalHome(ctx({membership:null,recruiter:true}))).toBe("/hr/home"+END);
  expect(deniedPortalHome(ctx({roles:["TPO"]}))).toBe("/tpo/home"+END);
  expect(deniedPortalHome(ctx({roles:["COLLEGE_ADMIN"]}))).toBe("/college"+END);
  expect(deniedPortalHome(ctx({roles:["FACULTY"]}))).toBe("/teacher/courses"+END);
  expect(deniedPortalHome(ctx({roles:["MENTOR"]}))).toBe("/mentor/projects"+END);
  expect(deniedPortalHome(ctx({roles:["LEARNER"]}))).toBe("/learn/courses"+END);
  expect(deniedPortalHome(ctx({membership:null}))).toBe("/dashboard"+END);
 });

 it("PHASE2-ROLE-22 the redirect priority is super admin, recruiter, then the single selected role; several held roles land on the dashboard",()=>{
  expect(deniedPortalHome(ctx({membership:null,systemRoles:["SUPER_ADMIN"],recruiter:true}))).toBe("/admin/tenants"+END);
  expect(deniedPortalHome(ctx({recruiter:true,roles:["TPO","COLLEGE_ADMIN"]}))).toBe("/hr/home"+END);
  expect(deniedPortalHome(ctx({roles:["LEARNER","COLLEGE_ADMIN","TPO"]}))).toBe("/dashboard"+END);
  expect(deniedPortalHome(ctx({roles:["LEARNER","FACULTY","COLLEGE_ADMIN"]}))).toBe("/dashboard"+END);
  expect(deniedPortalHome(ctx({roles:["LEARNER","MENTOR"]}))).toBe("/dashboard"+END);
  expect(deniedPortalHome(ctx({roles:["TPO"]}))).toBe("/tpo/home"+END);
 });

 it("PHASE2-ROLE-23 a suspended membership or disabled account falls back to the dashboard, never to a privileged portal",()=>{
  expect(deniedPortalHome(ctx({roles:["TPO"],membership:"SUSPENDED"}))).toBe("/dashboard"+END);
  expect(deniedPortalHome(ctx({roles:["TPO"],membership:"ENDED"}))).toBe("/dashboard"+END);
  expect(deniedPortalHome(ctx({roles:["TPO"],platform:"DISABLED"}))).toBe("/dashboard"+END);
  expect(deniedPortalHome(ctx({systemRoles:["SUPER_ADMIN"],platform:"DISABLED",membership:null}))).toBe("/dashboard"+END);
 });

 it("PHASE2-ROLE-24 the redirect is always a same-site relative path (no open redirect)",()=>{
  const variants:Opts[]=[
   {},{membership:null},{systemRoles:["SUPER_ADMIN"]},{recruiter:true},{roles:["TPO"]},{roles:["LEARNER"]},
   {roles:["MENTOR"],membership:"ENDED"},{platform:"DISABLED"},
  ];
  for(const v of variants){
   const href=deniedPortalHome(ctx(v));
   expect(href.startsWith("/")&&!href.startsWith("//"),href).toBe(true);
   expect(href.endsWith("?access=denied"),href).toBe(true);
   expect(/https?:|\\|@/.test(href),href).toBe(false);
  }
  expect(hasMembershipRole(ctx({roles:["TPO"],membership:"SUSPENDED"}),"TPO")).toBe(false);
 });
});
