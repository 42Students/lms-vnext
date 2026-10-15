import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { can } from "@/modules/permissions/policy";
import type { RequestContext } from "@/modules/identity/context";

const globalAdmin:RequestContext={user:{id:"admin",identityUid:"admin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},membership:null,adminScope:null};
const scoped:RequestContext={...globalAdmin,adminScope:{organizationId:"org-1",collegeId:"college-1"}};
const collegeAdmin:RequestContext={user:{id:"ca",identityUid:"ca",platformStatus:"ACTIVE",systemRoles:[]},membership:{id:"m",collegeId:"college-1",organizationId:"org-1",status:"ACTIVE",roles:["COLLEGE_ADMIN"]}};

describe("Global project template direct route guard",()=>{
 it("allows only an unscoped global administrator to create templates",()=>{
  expect(can(globalAdmin,"project-template.manage")).toBe(true);
  expect(can(scoped,"project-template.manage")).toBe(false);
  expect(can({...globalAdmin,adminScope:{organizationId:"org-1",collegeId:null}},"project-template.manage")).toBe(false);
  expect(can(collegeAdmin,"project-template.manage")).toBe(false);
 });
 it("renders a non-leaking denial rather than throwing the missing permission on direct navigation",()=>{
  const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/admin/projects/templates/new/page.tsx"),"utf8");
  expect(source).toMatch(/if\s*\(!can\(ctx,\s*"project-template\.manage"\)\)/);
  expect(source).toContain('title="Access denied"');
  expect(source).toContain('href="/admin/projects/templates"');
  expect(source).not.toContain("requirePermission(");
 });
});
