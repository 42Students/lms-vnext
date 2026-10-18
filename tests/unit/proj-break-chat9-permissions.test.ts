import {describe,expect,it} from "vitest";
import {can,requirePermission} from "@/modules/permissions/policy";
import type {RequestContext} from "@/modules/identity/context";
const own="00000000-0000-4000-8000-000000000001",foreign="00000000-0000-4000-8000-000000000002";
const org="00000000-0000-4000-8000-000000000011",otherOrg="00000000-0000-4000-8000-000000000012";
const resource={collegeId:own,organizationId:org};
const context=(roles:RequestContext["membership"] extends infer M ? readonly ("COLLEGE_ADMIN"|"LEARNER"|"MENTOR"|"FACULTY"|"TPO"|"HR"|"RECRUITER")[] : never,
 opts:{status?:"ACTIVE"|"SUSPENDED";userStatus?:"ACTIVE"|"DISABLED";collegeId?:string;organizationId?:string;scope?:RequestContext["adminScope"];superAdmin?:boolean;removed?:boolean}={}
):RequestContext=>({
 user:{id:own,identityUid:"iit-hardening-test",platformStatus:(opts.userStatus??"ACTIVE") as RequestContext["user"]["platformStatus"],systemRoles:opts.superAdmin?["SUPER_ADMIN"]:[]},
 membership:opts.removed?null:{
  id:own,collegeId:opts.collegeId??own,organizationId:opts.organizationId??org,
  status:(opts.status??"ACTIVE") as NonNullable<RequestContext["membership"]>["status"],
  roles:roles as NonNullable<RequestContext["membership"]>["roles"]
 },
 adminScope:opts.scope
});
describe("IIT Dharwad cross-account Projects permission break attempts",()=>{
 it("PROJ-BREAK-idor-01 College Admin can manage only own college, not another college",()=>{
  const collegeAdmin=context(["COLLEGE_ADMIN"]);
  expect(can(collegeAdmin,"projects.manage",resource)).toBe(true);
  expect(can(collegeAdmin,"projects.manage",{...resource,collegeId:foreign})).toBe(false);
  expect(can(collegeAdmin,"projects.manage",{collegeId:own,organizationId:otherOrg})).toBe(true);
 });
 it("PROJ-BREAK-idor-02 learner and mentor cannot escalate from read to manage",()=>{
  for(const role of ["LEARNER","MENTOR","FACULTY","TPO","HR","RECRUITER"] as const){
   const user=context([role]);
   expect(can(user,"projects.manage",resource)).toBe(false);
   expect(()=>requirePermission(user,"projects.manage",resource)).toThrow();
  }
 });
 it("PROJ-BREAK-idor-03 removed/suspended memberships deny project management even with old role",()=>{
  expect(can(context(["COLLEGE_ADMIN"],{removed:true}),"projects.manage",resource)).toBe(false);
  expect(can(context(["COLLEGE_ADMIN"],{status:"SUSPENDED"}),"projects.manage",resource)).toBe(false);
 });
 it("PROJ-BREAK-idor-04 inactive platform account cannot access project templates or tenant data",()=>{
  expect(can(context(["COLLEGE_ADMIN"],{userStatus:"DISABLED"}),"projects.manage",resource)).toBe(false);
  expect(can(context([],{superAdmin:true,userStatus:"DISABLED"}),"project-template.read")).toBe(false);
 });
 it("PROJ-BREAK-idor-05 Super Admin selected college is a hard permission boundary",()=>{
  const user=context([],{superAdmin:true,scope:{organizationId:org,collegeId:own}});
  expect(can(user,"projects.manage",resource)).toBe(true);
  expect(can(user,"projects.manage",{collegeId:foreign,organizationId:org})).toBe(false);
 });
 it("PROJ-BREAK-idor-06 Super Admin selected organization cannot reach other organization",()=>{
  const user=context([],{superAdmin:true,scope:{organizationId:org,collegeId:null}});
  expect(can(user,"projects.manage",resource)).toBe(true);
  expect(can(user,"projects.manage",{collegeId:foreign,organizationId:otherOrg})).toBe(false);
 });
 it("PROJ-BREAK-idor-07 template writes require GLOBAL Super Admin scope, not org or college acting scope",()=>{
  const global=context([],{superAdmin:true});
  const scoped=context([],{superAdmin:true,scope:{organizationId:org,collegeId:null}});
  const collegeScoped=context([],{superAdmin:true,scope:{organizationId:org,collegeId:own}});
  expect(can(global,"project-template.manage")).toBe(true);
  expect(can(scoped,"project-template.manage")).toBe(false);
  expect(can(collegeScoped,"project-template.manage")).toBe(false);
 });
 it("PROJ-BREAK-idor-08 template publication is never available to College Admin, Mentor, TPO or learner",()=>{
  for(const role of ["COLLEGE_ADMIN","MENTOR","TPO","LEARNER"] as const){
   expect(can(context([role]),"project-template.manage")).toBe(false);
  }
 });
 it("PROJ-BREAK-idor-09 global template catalogue is read-only for scoped Super Admin",()=>{
  const scoped=context([],{superAdmin:true,scope:{organizationId:org,collegeId:own}});
  expect(can(scoped,"project-template.read")).toBe(true);
  expect(can(scoped,"project-template.manage")).toBe(false);
 });
 it("PROJ-BREAK-idor-10 direct permission assertion fails closed under undefined and missing context",()=>{
  expect(can(undefined,"projects.manage",resource)).toBe(false);
  expect(can(null,"projects.read",resource)).toBe(false);
  expect(()=>requirePermission(undefined,"projects.manage",resource)).toThrow();
 });
});
