import { describe, expect, it } from "vitest";
import {
  hasCollegeDependencies, assertCollegeCanArchive, CollegeHasDependenciesError,
  type CollegeUsage,
} from "@/modules/colleges/archive-policy";
import {
  collegeSignInMethodSchema, updateCollegeSignInSchema, signInCapabilities,
} from "@/modules/colleges/signin-methods-model";
import { signInPolicyReadState } from "@/modules/colleges/signin-policy-read-model";
import {
  tenantLifecyclePaging, tenantLifecycleHref, tenantSetupLinksAvailable,
  parseTenantLifecycleSearchParams, TENANT_LIFECYCLE_PAGE_SIZE,
} from "@/modules/colleges/admin-tenant-lifecycle-model";

const zeroUsage = (): CollegeUsage => ({
  memberships: 0, departments: 0, academicPeriods: 0,
  projectTemplateAssignments: 0, projects: 0, placementRelationships: 0,
  placementSeasons: 0, placementJobs: 0, tenantDomains: 0,
});
const collegeId = "40000000-0000-4000-8000-000000000001";

describe("chat-4 tenant lifecycle and sign-in behavioral security", () => {
  it("SA-colleges-directory-08 accepts only unambiguous base-ten page numbers", () => {
    expect(parseTenantLifecycleSearchParams({ page: "2" })?.page).toBe(2);
    expect(parseTenantLifecycleSearchParams({ page: "1000" })?.page).toBe(1000);
    expect(parseTenantLifecycleSearchParams({ page: "0002" })?.page).toBe(2);
    for (const raw of ["0", "1001", "-1", "1.5", "1e2", "0x10", " 2 ", "NaN", "Infinity", ""]) {
      if(raw === "") {
        // Empty page is invalid; unlike an absent key it is not a valid default.
        expect(parseTenantLifecycleSearchParams({ page: raw })).toBeNull();
      } else {
        expect(parseTenantLifecycleSearchParams({ page: raw })).toBeNull();
      }
    }
    expect(parseTenantLifecycleSearchParams({ page: ["1","2"] })).toBeNull();
    expect(parseTenantLifecycleSearchParams({ hidden: "on" })).toBeNull();
    expect(parseTenantLifecycleSearchParams({})).toMatchObject({ status: "ACTIVE", page: 1 });
  });

  it("SA-colleges-directory-09 paginates bounded tenant results and never generates out-of-range links", () => {
    expect(TENANT_LIFECYCLE_PAGE_SIZE).toBe(20);
    expect(tenantLifecyclePaging(0, 1)).toMatchObject({ total: 0, totalPages: 1, page: 1, offset: 0 });
    expect(tenantLifecyclePaging(55, 2)).toMatchObject({ total: 55, totalPages: 3, page: 2, offset: 20 });
    expect(tenantLifecyclePaging(55, 99)).toMatchObject({ page: 3, offset: 40 });
    expect(tenantLifecycleHref({})).toBe("/admin/tenants");
    expect(tenantLifecycleHref({ q: "  IIT ", status: "ARCHIVED", page: 2 }))
      .toBe("/admin/tenants?q=IIT&status=ARCHIVED&page=2");
    expect(tenantLifecycleHref({ organizationId: collegeId }))
      .toBe("/admin/tenants?organizationId="+collegeId);
  });

  it("SA-colleges-directory-10 denies tenant setup when either tenant or parent is archived", () => {
    expect(tenantSetupLinksAvailable("ACTIVE","ACTIVE")).toBe(true);
    for(const [college,org] of [
      ["ACTIVE","ARCHIVED"],["ARCHIVED","ACTIVE"],["ARCHIVED","ARCHIVED"],
      ["ACTIVE","DELETED"],["DELETED","ACTIVE"],
    ])expect(tenantSetupLinksAvailable(college,org)).toBe(false);
  });

  it("COL-tenant-archive-01 prevents archival when any dependent college data remains", () => {
    const clean=zeroUsage();
    expect(hasCollegeDependencies(clean)).toBe(false);
    expect(()=>assertCollegeCanArchive(clean)).not.toThrow();
    for(const key of Object.keys(clean) as Array<keyof CollegeUsage>){
      const usage={...clean,[key]:1};
      expect(hasCollegeDependencies(usage)).toBe(true);
      expect(()=>assertCollegeCanArchive(usage)).toThrow(CollegeHasDependenciesError);
      try{assertCollegeCanArchive(usage)}catch(e){
        expect(e).toBeInstanceOf(CollegeHasDependenciesError);
        if(e instanceof CollegeHasDependenciesError)expect(e.usage).toEqual(usage);
      }
    }
  });

  it("COL-tenant-signin-01 models each valid email/phone order without accidental channel expansion", () => {
    expect(signInCapabilities("EMAIL_AND_PHONE")).toEqual({ email:true,phone:true,primary:"EMAIL" });
    expect(signInCapabilities("PHONE_AND_EMAIL")).toEqual({ email:true,phone:true,primary:"PHONE" });
    expect(signInCapabilities("EMAIL_ONLY")).toEqual({ email:true,phone:false,primary:"EMAIL" });
    expect(signInCapabilities("PHONE_ONLY")).toEqual({ email:false,phone:true,primary:"PHONE" });
    expect(collegeSignInMethodSchema.safeParse("SSO_ONLY").success).toBe(false);
  });

  it("COL-tenant-signin-02 validates exact college, method and nonnegative optimistic version", () => {
    const valid={collegeId,method:"PHONE_ONLY",expectedVersion:0};
    expect(updateCollegeSignInSchema.safeParse(valid).success).toBe(true);
    for(const candidate of [
      {...valid,expectedVersion:-1},
      {...valid,expectedVersion:1.5},
      {...valid,expectedVersion:"0"},
      {...valid,method:"SSO_ONLY"},
      {...valid,collegeId:"wrong"},
      {...valid,force:true},
    ])expect(updateCollegeSignInSchema.safeParse(candidate).success).toBe(false);
  });

  it("COL-tenant-signin-03 distinguishes missing migration, unconfigured, corrupt and valid persisted policy", () => {
    expect(signInPolicyReadState(false,"PHONE_ONLY")).toEqual({kind:"MIGRATION_PENDING",method:null});
    expect(signInPolicyReadState(true,null)).toEqual({kind:"NOT_CONFIGURED",method:null});
    expect(signInPolicyReadState(true,"INVALID")).toEqual({kind:"INVALID_POLICY",method:null});
    expect(signInPolicyReadState(true,"EMAIL_ONLY")).toEqual({kind:"CONFIGURED",method:"EMAIL_ONLY"});
  });
});
