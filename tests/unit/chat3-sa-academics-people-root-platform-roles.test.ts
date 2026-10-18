import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";

const read=(file:string)=>readFileSync(join(process.cwd(),file),"utf8");
const active:RequestContext={
 user:{id:"administrator",identityUid:"administrator",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{
  collegeId:"11111111-1111-4111-8111-111111111111",
  organizationId:"22222222-2222-4222-8222-222222222222",
 },
};
describe("Super Admin root-page platform-role defense",()=>{
 it("SA-ACADEMICS-ROOT-01 enforces a Super Admin check before loading academic workspace",()=>{
  const source=read("src/app/(authenticated)/admin/academics/page.tsx");
  expect(source).toContain('import { isSuperAdmin } from "@/modules/identity/context";');
  expect(source).toContain('if (!isSuperAdmin(context)) redirect("/dashboard");');
  const check=source.indexOf('if (!isSuperAdmin(context)) redirect("/dashboard");');
  const workspace=source.indexOf("const workspace = await getAcademicsWorkspace(");
  expect(check).toBeGreaterThan(0);
  expect(workspace).toBeGreaterThan(check);
 });
 it("SA-PEOPLE-ROOT-01 protects person identity and membership reads before creating a roster",()=>{
  const source=read("src/app/(authenticated)/admin/people/page.tsx");
  expect(source).toContain('import { isSuperAdmin } from "@/modules/identity/context";');
  const check=source.indexOf('if (!isSuperAdmin(context)) redirect("/dashboard");');
  const people=source.indexOf("const people = await listCollegePeopleWithRuntime(");
  expect(check).toBeGreaterThan(0);
  expect(people).toBeGreaterThan(check);
 });
 it("SA-PEOPLE-ROOT-02 verifies all People views and Faculty assignment list assert Super Admin before reading records",()=>{
  const checks=[
   ["src/app/(authenticated)/admin/people/directory/page.tsx",
    "const data=await listSuperAdminUsers("],
   ["src/app/(authenticated)/admin/people/unassigned/page.tsx",
    "const data = await listSuperAdminUnassignedUsers("],
   ["src/app/(authenticated)/admin/faculty-assignment/page.tsx",
    "const [classes,workspace]=await Promise.all(["],
  ] as const;
  for(const [path,lookup] of checks){
   const page=read(path);
   expect(page).toContain('redirect("/dashboard")');
   const guard=page.indexOf("isSuperAdmin(context)");
   expect(guard).toBeGreaterThan(0);
   expect(page.indexOf(lookup)).toBeGreaterThan(guard);
  }
 });
 it("both pages deny Faculty, Mentor, Learner and College Admin with a stale forged adminScope",()=>{
  expect(isSuperAdmin(active)).toBe(true);
  for(const role of ["FACULTY","MENTOR","LEARNER","COLLEGE_ADMIN"] as const){
   const wrong:RequestContext={
    ...active,
    user:{...active.user,systemRoles:[]},
    membership:{id:"membership",collegeId:active.adminScope!.collegeId!,
     organizationId:active.adminScope!.organizationId!,status:"ACTIVE",roles:[role]},
   };
   expect(isSuperAdmin(wrong)).toBe(false);
  }
  expect(isSuperAdmin({...active,user:{...active.user,platformStatus:"DISABLED"}}))
   .toBe(false);
 });
});
