import { describe, expect, it } from "vitest";
import {
  describeAdminCollegeBranding,
  LMS_DEFAULT_BRAND_PRIMARY,
  LMS_DEFAULT_BRAND_SECONDARY,
  type StoredCollegeBranding,
} from "@/modules/colleges/admin-branding-preview-model";
import { contrastRatio } from "@/modules/colleges/branding";

const college={id:"40000000-0000-4000-8000-000000000001",name:"IIT Dharwad",code:"iitd",status:"ACTIVE"};
const empty=():StoredCollegeBranding=>({
 logoUrl:null,faviconUrl:null,loginBackgroundUrl:null,loginBackgroundUrlMobile:null,
 primaryColor:null,secondaryColor:null,supportEmail:null,supportPhone:null,termsUrl:null,privacyUrl:null,
});

describe("SA-colleges-branding-01 private and malformed branding isolation",()=>{
 it("returns safe default LMS branding without inventing configured tenant values",()=>{
  const result=describeAdminCollegeBranding({college,branding:null});
  expect(result.college).toEqual(college);
  expect(result.brandingStored).toBe(false);
  expect(result.primary).toBe(LMS_DEFAULT_BRAND_PRIMARY);
  expect(result.secondary).toBe(LMS_DEFAULT_BRAND_SECONDARY);
  expect(result.logoUrl).toBeNull();
  expect(result.mobileBackgroundUrl).toBeNull();
  expect(result.mobileBackgroundFallback).toBe(false);
  expect(result.styleVariables["--lms-primary"]).toBe(result.primary);
 });
 it("suppresses credential-bearing, query-token, fragment and private-storage preview URLs",()=>{
  const result=describeAdminCollegeBranding({college,branding:{
   ...empty(),logoUrl:"branding/"+college.id+"/secret.png",
   faviconUrl:"https://login.example.com/icon.png?token=very-private",
   loginBackgroundUrl:"https://user:password@cdn.example.com/login.png",
   loginBackgroundUrlMobile:"https://cdn.example.com/mobile.png#opaque",
   termsUrl:"javascript:alert(1)",
   privacyUrl:"http://example.com/privacy",
  }});
  expect(result.brandingStored).toBe(true);
  expect(result.logoUrl).toBeNull();
  expect(result.faviconUrl).toBeNull();
  expect(result.desktopBackgroundUrl).toBeNull();
  expect(result.mobileBackgroundUrl).toBeNull();
  expect(result.termsUrl).toBeNull();
  expect(result.privacyUrl).toBeNull();
  expect(result.suppressed).toEqual({
   logo:true,favicon:true,desktopBackground:true,mobileBackground:true,terms:true,privacy:true,
  });
 });
 it("uses an approved HTTPS background as a mobile fallback only if no valid mobile override exists",()=>{
  const base=empty();
  base.loginBackgroundUrl="https://cdn.example.com/login.png";
  base.loginBackgroundUrlMobile="https://cdn.example.com/mobile.png?token=secret";
  const fallback=describeAdminCollegeBranding({college,branding:base});
  expect(fallback.desktopBackgroundUrl).toBe("https://cdn.example.com/login.png");
  expect(fallback.mobileBackgroundUrl).toBe("https://cdn.example.com/login.png");
  expect(fallback.mobileBackgroundFallback).toBe(true);
  expect(fallback.suppressed.mobileBackground).toBe(true);
  const withOverride=describeAdminCollegeBranding({college,branding:{
    ...base,loginBackgroundUrlMobile:"https://cdn.example.com/mobile.png",
  }});
  expect(withOverride.mobileBackgroundUrl).toBe("https://cdn.example.com/mobile.png");
  expect(withOverride.mobileBackgroundFallback).toBe(false);
 });
 it("accepts only validated colours and contact details while retaining WCAG-readable text",()=>{
  const input:StoredCollegeBranding={
   ...empty(),primaryColor:"#ffffff",secondaryColor:"not-a-color",
   supportEmail:"not-an-email",supportPhone:"javascript:console.log(1)",
   termsUrl:"https://college.example.org/terms",privacyUrl:"https://college.example.org/privacy",
  };
  const value=describeAdminCollegeBranding({college,branding:input});
  expect(value.primary).toBe("#FFFFFF");
  expect(value.secondary).toBe(LMS_DEFAULT_BRAND_SECONDARY);
  expect(value.supportEmail).toBeNull();
  expect(value.supportPhone).toBeNull();
  expect(value.termsUrl).toBe("https://college.example.org/terms");
  expect(value.privacyUrl).toBe("https://college.example.org/privacy");
  expect(contrastRatio(value.tokens.primary,value.tokens.onPrimary)).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(value.tokens.text,"#FFFFFF")).toBeGreaterThanOrEqual(4.5);
 });
});
