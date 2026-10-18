import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {describeAdminCollegeBranding} from "@/modules/colleges/admin-branding-preview-model";

const collegeId="11111111-1111-4111-8111-111111111111";
const organizationId="22222222-2222-4222-8222-222222222222";
const actor:RequestContext={user:{
 id:"33333333-3333-4333-8333-333333333333",
 identityUid:"super",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"],
},membership:null,adminScope:{collegeId,organizationId}};

describe("SA-tenants-modules-BRAND-READ-02 public and private branding preview",()=>{
 it("does not authorize disabled, demoted or foreign-tenant administrators",()=>{
  const scope={collegeId,organizationId};
  expect(can(actor,"college.read",scope)).toBe(true);
  expect(can({...actor,user:{...actor.user,platformStatus:"DISABLED"}},"college.read",scope)).toBe(false);
  expect(can({...actor,user:{...actor.user,systemRoles:[]}},"college.read",scope)).toBe(false);
  expect(can(actor,"college.read",{collegeId:organizationId,organizationId})).toBe(false);
 });
 it("rebuilds persisted actor and selected tenant authority after reading branding rows",()=>{
  const source=readFileSync("src/modules/colleges/admin-branding-preview-service.ts","utf8");
  const fetchBranding=source.indexOf("const [branding] = await db");
  const authSnapshot=source.indexOf('requirePermission(context, "college.read"');
  const tx=source.indexOf("await db.transaction(async tx=>");
  const persisted=source.indexOf('assertPersistedPlatformPermission(tx,context,"college.read"');
  const project=source.indexOf("const result=describeAdminCollegeBranding(");
  expect(authSnapshot).toBeGreaterThan(0);
  expect(fetchBranding).toBeGreaterThan(authSnapshot);
  expect(tx).toBeGreaterThan(fetchBranding);
  expect(persisted).toBeGreaterThan(tx);
  expect(project).toBeGreaterThan(persisted);
  expect(source.slice(persisted,project)).toContain("collegeId:college.id,organizationId:college.organizationId");
  expect(source).not.toContain("logoObjectPath: college.logoObjectPath,");
 });
 it("never fabricates an uploaded image when persisted branding data is absent",()=>{
  const result=describeAdminCollegeBranding({
   college:{id:collegeId,name:"Example",code:"EX",status:"ACTIVE"},
   branding:null,
  });
  expect(result.collegeName).toBe("Example");
  expect(result.brandingStored).toBe(false);
 });
});
