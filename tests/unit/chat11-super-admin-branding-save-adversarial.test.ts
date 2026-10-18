import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {safeTpoBrandLogoUrl} from "@/modules/placements/tpo-branding-model";
const college="11111111-1111-4111-8111-111111111111";
const org="22222222-2222-4222-8222-222222222222";
const foreign="33333333-3333-4333-8333-333333333333";
const root:RequestContext={user:{
 id:"44444444-4444-4444-8444-444444444444",
 identityUid:"root",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"],
},membership:null,adminScope:null};

describe("SA-tenants-modules-BRAND-04 safe unsaved logo preview",()=>{
 it("never renders embedded credentials, non-HTTPS assets or signed query/fragment URLs",()=>{
  for(const candidate of [
   "javascript:alert(1)","http://college.example/logo.png",
   "https://root:secret@college.example/logo.png",
   "https://college.example/logo.png?token=secret",
   "https://college.example/logo.png#private",
   "gs://private-bucket/logo.png",
  ])expect(safeTpoBrandLogoUrl(candidate)).toBeNull();
  expect(safeTpoBrandLogoUrl("https://college.example/logo.png"))
   .toBe("https://college.example/logo.png");
  const form=readFileSync("src/components/admin/college-branding-form.tsx","utf8");
  expect(form).toContain("const previewLogoUrl=uploadedLogoUrl||safeTpoBrandLogoUrl(values.logoUrl)");
  expect(form).toContain("src={previewLogoUrl}");
  expect(form).toContain("referrerPolicy=\"no-referrer\"");
  expect(form).not.toContain('^https:\\/\\/');
 });
});

describe("SA-tenants-modules-BRAND-03 branding writes require current scoped Super Admin",()=>{
 it("denies expired, wrong organization and ordinary college roles even if they can read scoped branding",()=>{
  const resource={collegeId:college,organizationId:org};
  expect(isSuperAdmin(root)).toBe(true);
  expect(can(root,"college.manage",resource)).toBe(true);
  const deniedContexts:RequestContext[]=[
   {...root,user:{...root.user,platformStatus:"DISABLED"}},
   {...root,user:{...root.user,systemRoles:[]}},
   {...root,adminScope:{organizationId:org,collegeId:foreign}},
   {...root,adminScope:{organizationId:foreign,collegeId:null}},
  ];
  for(const ctx of deniedContexts){
   expect(isSuperAdmin(ctx)&&can(ctx,"college.manage",resource)).toBe(false);
  }
  const collegeAdmin:RequestContext={...root,user:{...root.user,systemRoles:[]},
   membership:{id:foreign,collegeId:college,organizationId:org,status:"ACTIVE",roles:["COLLEGE_ADMIN"]}};
  expect(can(collegeAdmin,"college.manage",resource)).toBe(true);
  expect(isSuperAdmin(collegeAdmin)).toBe(false);
 });
 it("locks live actor/college before write and writes audit in the same transaction",()=>{
  const source=readFileSync("src/modules/colleges/branding-service.ts","utf8");
  const service=source.slice(source.indexOf("export async function saveCollegeBranding("));
  const txn=service.indexOf("return getDb().transaction(async tx=>");
  const actor=service.indexOf('assertPersistedPlatformPermission(tx,context,"college.manage"');
  const active=service.indexOf('eq(colleges.status,"ACTIVE")',txn);
  const lock=service.indexOf('.for("update")',txn);
  const insert=service.indexOf(".insert(collegeBranding)",txn);
  const audit=service.indexOf("recordActivityEventInTransaction(tx, context",txn);
  expect(txn).toBeGreaterThan(0);
  expect(actor).toBeGreaterThan(txn);
  expect(active).toBeGreaterThan(actor);
  expect(lock).toBeGreaterThan(active);
  expect(insert).toBeGreaterThan(lock);
  expect(audit).toBeGreaterThan(insert);
  expect(service).toContain("if(!active)throw new CollegeBrandingNotFoundError()");
  expect(service).toContain("metadata: { version: row.version }");
 });
});
