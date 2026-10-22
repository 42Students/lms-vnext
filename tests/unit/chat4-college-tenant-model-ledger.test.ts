import {describe,expect,it} from "vitest";
import {adminDirectoryQuerySchema,parseAdminDirectorySearchParams} from "@/modules/colleges/admin-directory-query-model";
import {tenantLifecyclePaging,tenantLifecycleHref,tenantSetupLinksAvailable,tenantLifecycleQuerySchema} from "@/modules/colleges/admin-tenant-lifecycle-model";
import {hasCollegeDependencies,assertCollegeCanArchive,CollegeHasDependenciesError,type CollegeUsage} from "@/modules/colleges/archive-policy";
import {signInCapabilities,updateCollegeSignInSchema} from "@/modules/colleges/signin-methods-model";
import {collegeNameSchema,collegeCodeSchema,updateCollegeInputSchema} from "@/modules/colleges/validation";
import {parseSuperAdminReadinessParams,visibleReadinessChecks} from "@/modules/colleges/admin-readiness-filter";
import {readinessRemediationLink} from "@/modules/colleges/readiness-remediation-links";
import type {CollegeReadinessCheck} from "@/modules/colleges/readiness-model";
import {readFileSync} from "node:fs";
import {join} from "node:path";

describe("college/tenant directory module coverage ledger",()=>{
  it("adminDirectoryQuerySchema accepts legitimate search and rejects overlong, fractional and foreign filters",()=>{
    expect(adminDirectoryQuerySchema.safeParse({}).success).toBe(true);
    expect(adminDirectoryQuerySchema.parse({q:" Campus ",page:"2",pageSize:"50"})).toEqual({q:"Campus",page:2,pageSize:50});
    for(const bad of [{q:"x".repeat(101)},{page:0},{page:2.5},{pageSize:20},{organizationId:"foreign"},{collegeId:"foreign"}]){
      expect(adminDirectoryQuerySchema.safeParse(bad).success).toBe(false);
    }
  });
  it("parseAdminDirectorySearchParams refuses duplicates, unknown keys, malformed pages, recovers default",()=>{
    expect(parseAdminDirectorySearchParams({})).toEqual({q:"",page:1,pageSize:10});
    expect(parseAdminDirectorySearchParams({q:["a","b"]})).toBeNull();
    expect(parseAdminDirectorySearchParams({page:["2"]})).toBeNull();
    expect(parseAdminDirectorySearchParams({collegeId:"other"})).toBeNull();
    expect(parseAdminDirectorySearchParams({page:"NaN"})).toBeNull();
  });
  it("tenantLifecyclePaging clamps pages and rejects out-of-range filters",()=>{
    expect(tenantLifecyclePaging(0,1)).toEqual({total:0,totalPages:1,page:1,offset:0});
    expect(tenantLifecyclePaging(45,3)).toEqual({total:45,totalPages:2,page:2,offset:25});
    expect(tenantLifecyclePaging(45,100).page).toBe(2);
    expect(()=>tenantLifecyclePaging(2,0)).toThrow();
    expect(tenantLifecycleQuerySchema.safeParse({status:"INTERNAL"}).success).toBe(false);
  });
  it("tenantLifecycleHref encodes safe links and hides default filters",()=>{
    expect(tenantLifecycleHref({})).toBe("/admin/tenants");
    expect(tenantLifecycleHref({q:"A & B",page:2,status:"ALL"})).toBe("/admin/tenants?q=A+%26+B&status=ALL&page=2");
    expect(()=>tenantLifecycleHref({q:"",collegeId:"foreign"})).toThrow();
  });
  it("tenantSetupLinksAvailable requires both college and parent organization active",()=>{
    for(const college of ["ACTIVE","ARCHIVED"])for(const parent of ["ACTIVE","ARCHIVED"])
      expect(tenantSetupLinksAvailable(college,parent)).toBe(college==="ACTIVE"&&parent==="ACTIVE");
  });
  const empty:CollegeUsage={memberships:0,departments:0,academicPeriods:0,projectTemplateAssignments:0,projects:0,placementRelationships:0,placementSeasons:0,placementJobs:0,tenantDomains:0};
  it("hasCollegeDependencies considers every dependent table rather than only users",()=>{
    expect(hasCollegeDependencies(empty)).toBe(false);
    for(const key of Object.keys(empty) as (keyof CollegeUsage)[]){
      expect(hasCollegeDependencies({...empty,[key]:1})).toBe(true);
    }
  });
  it("assertCollegeCanArchive prevents destructive archive on any dependency",()=>{
    expect(()=>assertCollegeCanArchive(empty)).not.toThrow();
    try{assertCollegeCanArchive({...empty,placementJobs:1});throw Error("not blocked");}
    catch(error){expect(error).toBeInstanceOf(CollegeHasDependenciesError);expect((error as CollegeHasDependenciesError).usage.placementJobs).toBe(1);}
  });
  it("signInCapabilities enumerates email/phone primary fallback for every permitted mode",()=>{
    expect(signInCapabilities("EMAIL_AND_PHONE")).toEqual({email:true,phone:true,primary:"EMAIL"});
    expect(signInCapabilities("PHONE_AND_EMAIL")).toEqual({email:true,phone:true,primary:"PHONE"});
    expect(signInCapabilities("EMAIL_ONLY")).toEqual({email:true,phone:false,primary:"EMAIL"});
    expect(signInCapabilities("PHONE_ONLY")).toEqual({email:false,phone:true,primary:"PHONE"});
    expect(updateCollegeSignInSchema.safeParse({collegeId:"bad",method:"EMAIL_ONLY",expectedVersion:0}).success).toBe(false);
    expect(updateCollegeSignInSchema.safeParse({collegeId:"00000000-0000-4000-8000-000000000001",method:"BAD",expectedVersion:0}).success).toBe(false);
    expect(updateCollegeSignInSchema.safeParse({collegeId:"00000000-0000-4000-8000-000000000001",method:"EMAIL_ONLY",expectedVersion:-1}).success).toBe(false);
  });
  it("college name/code normalization and partial-update guard prevent empty updates",()=>{
    expect(collegeNameSchema.safeParse(" ").success).toBe(false);
    expect(collegeCodeSchema.parse(" COL-001 ")).toBe("col-001");
    expect(collegeCodeSchema.safeParse("a!").success).toBe(false);
    expect(updateCollegeInputSchema.safeParse({}).success).toBe(false);
    expect(updateCollegeInputSchema.safeParse({name:"Campus"}).success).toBe(true);
  });
  const checks:CollegeReadinessCheck[]=[
    {id:"COLLEGE_ACTIVE",label:"Active",status:"PASS",evidence:"on",remediation:""},
    {id:"DEPARTMENTS",label:"Departments",status:"FAIL",evidence:"0",remediation:""},
    {id:"TENANT_DOMAIN",label:"Domain",status:"UNKNOWN",evidence:"unknown",remediation:""},
  ];
  it("parseSuperAdminReadinessParams refuses repeated/foreign filters",()=>{
    expect(parseSuperAdminReadinessParams({})).toEqual({status:"ALL",area:"ALL"});
    expect(parseSuperAdminReadinessParams({area:["PEOPLE"]})).toBeNull();
    expect(parseSuperAdminReadinessParams({collegeId:"foreign"})).toBeNull();
    expect(parseSuperAdminReadinessParams({status:"FAKE"})).toBeNull();
  });
  it("visibleReadinessChecks filters failed and unknown without treating unknown as pass",()=>{
    expect(visibleReadinessChecks(checks,"NEEDS_ATTENTION")).toHaveLength(2);
    expect(visibleReadinessChecks(checks,"FAIL","ACADEMICS")).toEqual([checks[1]]);
    expect(visibleReadinessChecks(checks,"PASS","DOMAINS")).toEqual([]);
  });
  it("readinessRemediationLink sends tenant domain failures to college-scoped subdomain",()=>{
    expect(readinessRemediationLink("TENANT_DOMAIN","a b")).toBe("/admin/colleges/a%20b/subdomain");
    expect(readinessRemediationLink("DEPARTMENTS","ignored")).toBe("/admin/departments");
  });
  it("admin colleges/organizations pages render guarded scopes, mobile actions and friendly malformed-query recovery",()=>{
    const read=(n:string)=>readFileSync(join(process.cwd(),"src/app/(authenticated)/admin/"+n+"/page.tsx"),"utf8");
    for(const route of ["colleges","organizations"]){
      const page=read(route);
      expect(page).toContain("parseAdminDirectorySearchParams(");
      expect(page).toContain("<ErrorState");
      expect(page).toContain("<DataTable");
      expect(page).toContain("min-h-11");
      expect(page).toContain("getCurrentRequestContext()");
      expect(page).toContain("Pagination");
    }
    expect(read("colleges")).toContain('canManageCollegeDirectoryRow(context,college)');
    expect(read("organizations")).toMatch(/can\(\s*context,\s*"organization\.manage"/);
  });
});
