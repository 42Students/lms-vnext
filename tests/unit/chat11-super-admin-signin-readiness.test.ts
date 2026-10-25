import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {updateCollegeSignInSchema,signInCapabilities} from "@/modules/colleges/signin-methods-model";
import {signInPolicyReadState} from "@/modules/colleges/signin-policy-read-model";
import {evaluateCollegeReadiness,type CollegeReadinessFacts} from "@/modules/colleges/readiness-model";
import {summarizeTenantSetupReadiness} from "@/modules/colleges/admin-tenant-setup-status";
import {superAdminTenantSetupSteps} from "@/modules/colleges/admin-tenant-setup-journey";

const collegeId="11111111-1111-4111-8111-111111111111";
const readyFacts:CollegeReadinessFacts={
 collegeStatus:"ACTIVE",adminMemberships:1,departments:1,programs:1,cohorts:1,
 enrolledLearners:1,facultyMemberships:1,tpoMemberships:1,
 activePlacementSeasons:1,verifiedPrimaryDomains:1,
};
const source=(path:string)=>readFileSync(path,"utf8");

describe("SA-tenants-modules-LOGIN-01: per-college sign-in policy safety",()=>{
 it("accepts only supported channels, a valid college UUID and a nonnegative integer CAS version",()=>{
  const input={collegeId,method:"PHONE_ONLY",expectedVersion:0};
  expect(updateCollegeSignInSchema.safeParse(input).success).toBe(true);
  for(const invalid of [
   {...input,collegeId:"../foreign"}, {...input,method:"PASSWORD_ONLY"},
   {...input,method:"ANY"}, {...input,expectedVersion:-1},
   {...input,expectedVersion:1.5}, {...input,expectedVersion:"0"},
   {...input,organizationId:collegeId},
  ])expect(updateCollegeSignInSchema.safeParse(invalid).success).toBe(false);
 });
 it("never enables a blocked login channel or silently accepts corrupt stored values",()=>{
  expect(signInCapabilities("EMAIL_ONLY")).toEqual({email:true,phone:false,primary:"EMAIL"});
  expect(signInCapabilities("PHONE_ONLY")).toEqual({email:false,phone:true,primary:"PHONE"});
  expect(signInCapabilities("EMAIL_AND_PHONE")).toEqual({email:true,phone:true,primary:"EMAIL"});
  expect(signInCapabilities("PHONE_AND_EMAIL")).toEqual({email:true,phone:true,primary:"PHONE"});
  expect(signInPolicyReadState(false,null).kind).toBe("MIGRATION_PENDING");
  expect(signInPolicyReadState(true,null).kind).toBe("NOT_CONFIGURED");
  expect(signInPolicyReadState(true,"UNRECOGNIZED")).toEqual({kind:"INVALID_POLICY",method:null});
  expect(signInPolicyReadState(true,"PHONE_ONLY")).toEqual({kind:"CONFIGURED",method:"PHONE_ONLY"});
 });
 it("requires origin, matching URL/body college, persisted role, active college and CAS",()=>{
  const route=source("src/app/api/admin/colleges/[collegeId]/signin/route.ts");
  const service=source("src/modules/colleges/admin-signin-policy-service.ts");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain('!("collegeId" in payload)||payload["collegeId"]!==collegeId');
  expect(route).toContain('const payload=legacy!==undefined');
  expect(route.indexOf("getCurrentRequestContext()"))
   .toBeLessThan(route.indexOf("readAdminSignInRequestBody(request)"));
  expect(route).toContain("Array.isArray(body)");
  expect(service).toContain("if(!isSuperAdmin(context))throw new AuthorizationError");
  expect(service).toContain("assertPersistedPlatformPermission");
  expect(service).toContain('eq(colleges.status,"ACTIVE")');
  expect(service).toContain('.for("update")');
  expect(service).toContain("SIGNIN_POLICY_STALE");
  expect(service).toContain("if(current?.method===input.method)");
  expect(service).toContain("tx.insert(activityEvents)");
  expect(service).toContain("identity.college_signin.updated");
 });
});

describe("SA-tenants-modules-READY-01: persisted readiness does not imply launch approval",()=>{
 it("is READY only when every one of ten persisted checks has evidence",()=>{
  const all=evaluateCollegeReadiness(readyFacts);
  expect(all.overall).toBe("READY");
  expect(all.counts).toEqual({total:10,passed:10,failed:0,unknown:0});
  expect(new Set(all.checks.map(check=>check.id)).size).toBe(10);
  expect(summarizeTenantSetupReadiness(all).label).toBe("Persisted checks pass");
  expect(summarizeTenantSetupReadiness(all).detail).toMatch(/Runtime DNS/);
 });
 it("treats a missing data source as UNKNOWN, zero as FAIL, and any confirmed failure as NOT_READY",()=>{
  const missing=evaluateCollegeReadiness({...readyFacts,verifiedPrimaryDomains:null});
  expect(missing.overall).toBe("INCOMPLETE");
  expect(missing.counts).toMatchObject({passed:9,unknown:1,failed:0});
  expect(missing.checks.find(c=>c.id==="TENANT_DOMAIN")?.status).toBe("UNKNOWN");
  const zero=evaluateCollegeReadiness({...readyFacts,tpoMemberships:0});
  expect(zero.overall).toBe("NOT_READY");
  expect(zero.checks.find(c=>c.id==="TPO")?.status).toBe("FAIL");
  const both=evaluateCollegeReadiness({...readyFacts,collegeStatus:"ARCHIVED",verifiedPrimaryDomains:null});
  expect(both.overall).toBe("NOT_READY");
  expect(both.counts).toMatchObject({failed:1,unknown:1});
 });
 it("does not call an inconsistent, incomplete or missing checklist ready",()=>{
  expect(summarizeTenantSetupReadiness(null).label).toBe("Unknown");
  const all=evaluateCollegeReadiness(readyFacts);
  expect(summarizeTenantSetupReadiness({...all,counts:{...all.counts,total:9}}).label).toBe("Unknown");
  expect(summarizeTenantSetupReadiness({...all,overall:"INCOMPLETE"}).label).toBe("Incomplete evidence");
 });
 it("all eight setup links are established routes and percent-encode the selected college",()=>{
  const steps=superAdminTenantSetupSteps(collegeId);
  expect(steps).toHaveLength(8);
  expect(new Set(steps.map(step=>step.id)).size).toBe(8);
  for(const step of steps)expect(step.href.startsWith("/admin/")).toBe(true);
  expect(steps.find(step=>step.id==="brand")?.href).toBe("/admin/colleges/"+collegeId+"/branding");
  expect(steps.find(step=>step.id==="readiness")?.href).toBe("/admin/colleges/"+collegeId+"/readiness");
 });
 it("branding and module access read the selected tenant without a URL-supplied scope override",()=>{
  const branding=source("src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx");
  const modules=source("src/app/(authenticated)/admin/module-access/page.tsx");
  expect(branding).toMatch(/getSuperAdminCollegeBrandingPreview\(context,\s*collegeId\)/);
  expect(branding).toContain("getSuperAdminTenantLifecycleDetail(context,collegeId)");
  expect(branding).toContain('can(context,"college.manage",{collegeId,organizationId:tenant.organizationId})');
  expect(modules).toMatch(/requirePermission\(context,\s*"admin-scope\.select"\)/);
  expect(modules).toContain("getModuleAccessOverviewMetrics(context, [collegeId])");
 });
});
