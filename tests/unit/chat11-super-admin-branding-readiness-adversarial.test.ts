import {describe,expect,it} from "vitest";
import {
 describeAdminCollegeBranding,LMS_DEFAULT_BRAND_PRIMARY,LMS_DEFAULT_BRAND_SECONDARY,
 type StoredCollegeBranding,
} from "@/modules/colleges/admin-branding-preview-model";
import {evaluateCollegeReadiness,type CollegeReadinessFacts} from "@/modules/colleges/readiness-model";
import {parseSuperAdminReadinessParams,visibleReadinessChecks}
 from "@/modules/colleges/admin-readiness-filter";

const college={id:"11111111-1111-4111-8111-111111111111",
 name:"College A",code:"A",status:"ACTIVE"};
const branding:StoredCollegeBranding={
 logoUrl:"https://college.example/logo.png",faviconUrl:"https://college.example/favicon.ico",
 loginBackgroundUrl:"https://college.example/desktop.png",
 loginBackgroundUrlMobile:null,
 primaryColor:"#aabbcc",secondaryColor:"#112233",
 supportEmail:"support@college.example",supportPhone:"+91 99999 99999",
 termsUrl:"https://college.example/terms",privacyUrl:"https://college.example/privacy",
};
const readiness:CollegeReadinessFacts={
 collegeStatus:"ACTIVE",adminMemberships:1,departments:1,programs:1,cohorts:1,
 enrolledLearners:1,facultyMemberships:1,tpoMemberships:1,
 activePlacementSeasons:1,verifiedPrimaryDomains:null,
};

describe("SA-tenants-modules-BRAND-02: Super Admin public branding preview is privacy-safe",()=>{
 it("uses standard defaults when storage is absent without claiming a saved override",()=>{
  const view=describeAdminCollegeBranding({college,branding:null});
  expect(view.brandingStored).toBe(false);
  expect(view.logoUrl).toBeNull();
  expect(view.desktopBackgroundUrl).toBeNull();
  expect(view.mobileBackgroundUrl).toBeNull();
  expect(view.primary).toBe(LMS_DEFAULT_BRAND_PRIMARY);
  expect(view.secondary).toBe(LMS_DEFAULT_BRAND_SECONDARY);
  expect(Object.values(view.suppressed).every(value=>!value)).toBe(true);
 });
 it("renders only authorized public HTTPS assets and keeps mobile fallback explicit",()=>{
  const view=describeAdminCollegeBranding({college,branding});
  expect(view.brandingStored).toBe(true);
  expect(view.logoUrl).toBe(branding.logoUrl);
  expect(view.mobileBackgroundUrl).toBe(branding.loginBackgroundUrl);
  expect(view.mobileBackgroundFallback).toBe(true);
  expect(view.primaryOverride).toBe("#AABBCC");
  expect(view.secondaryOverride).toBe("#112233");
  expect(view.supportEmail).toBe("support@college.example");
  expect(view.supportPhone).toBe("+91 99999 99999");
  expect(view.termsUrl).toBe(branding.termsUrl);
  expect(view.privacyUrl).toBe(branding.privacyUrl);
 });
 it("suppresses private objects, bearer-token URLs, credentials, injection and unsafe support contacts",()=>{
  for(const hostile of [
   "javascript:alert(1)","data:text/html,hello","http://college.example/logo.png",
   "https://user:password@college.example/logo.png",
   "https://college.example/logo.png?sig=private-token",
   "https://college.example/logo.png#secret","gs://private-bucket/logo.png",
  ]){
   const view=describeAdminCollegeBranding({college,branding:{...branding,
    logoUrl:hostile,loginBackgroundUrlMobile:hostile,termsUrl:hostile}});
   expect(view.logoUrl,hostile).toBeNull();
   expect(view.mobileBackgroundUrl,hostile).toBe(branding.loginBackgroundUrl);
   expect(view.suppressed.logo,hostile).toBe(true);
   expect(view.suppressed.mobileBackground,hostile).toBe(true);
   expect(view.suppressed.terms,hostile).toBe(true);
  }
  const view=describeAdminCollegeBranding({college,branding:{
   ...branding,primaryColor:"red;url(x)",secondaryColor:"#123",
   supportEmail:"support@college.example\r\nBcc:attacker",
   supportPhone:"<script>alert(1)</script>",
  }});
  expect(view.primary).toBe(LMS_DEFAULT_BRAND_PRIMARY);
  expect(view.secondary).toBe(LMS_DEFAULT_BRAND_SECONDARY);
  expect(view.supportEmail).toBeNull();
  expect(view.supportPhone).toBeNull();
 });
});

describe("SA-tenants-modules-READY-02 readiness filters cannot turn unknown into READY",()=>{
 const evaluated=evaluateCollegeReadiness(readiness);
 it("returns a complete, unmodified ten-check overall verdict regardless of selected filter",()=>{
  expect(evaluated.overall).toBe("INCOMPLETE");
  const all=visibleReadinessChecks(evaluated.checks,"ALL");
  expect(all).toHaveLength(10);
  const unknown=visibleReadinessChecks(evaluated.checks,"UNKNOWN");
  expect(unknown.map(check=>check.id)).toEqual(["TENANT_DOMAIN"]);
  const needs=visibleReadinessChecks(evaluated.checks,"NEEDS_ATTENTION");
  expect(needs.map(check=>check.id)).toEqual(["TENANT_DOMAIN"]);
  const domains=visibleReadinessChecks(evaluated.checks,"ALL","DOMAINS");
  expect(domains.map(check=>check.id)).toEqual(["TENANT_DOMAIN"]);
  expect(visibleReadinessChecks(evaluated.checks,"PASS","DOMAINS")).toEqual([]);
  expect(evaluated.overall).toBe("INCOMPLETE");
 });
 it("rejects duplicate/unknown URL filters and accepts only supported area and statuses",()=>{
  for(const raw of [
   {status:["ALL","UNKNOWN"]},{area:["DOMAINS","PEOPLE"]},
   {collegeId:college.id},{area:"WRONG"},{status:"ERROR"},
  ])expect(parseSuperAdminReadinessParams(raw)).toBeNull();
  expect(parseSuperAdminReadinessParams({})).toEqual({status:"ALL",area:"ALL"});
  expect(parseSuperAdminReadinessParams({status:"UNKNOWN",area:"DOMAINS"}))
   .toEqual({status:"UNKNOWN",area:"DOMAINS"});
 });
});
