import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import type {CollegeBrandingInput} from "@/modules/colleges/branding";
import {sanitizePublicCollegeBranding} from "@/modules/colleges/public-branding-model";

const valid:CollegeBrandingInput={
 logoUrl:"https://college.example/logo.png",
 faviconUrl:"https://college.example/favicon.ico",
 loginBackgroundUrl:"https://college.example/bg.webp",
 loginBackgroundUrlMobile:null,
 primaryColor:"#AABBCC",secondaryColor:"#112233",
 supportEmail:"support@college.example",supportPhone:"+91 98765 43210",
 termsUrl:"https://college.example/terms",privacyUrl:"https://college.example/privacy",
};

describe("SA-tenants-modules-BRAND-06 public college-branding output hygiene",()=>{
 it("keeps valid public HTTPS assets, readable colours and support contacts",()=>{
  expect(sanitizePublicCollegeBranding(valid)).toEqual(valid);
 });
 it("suppresses signed tokens, credentials, hostless links, unsafe schemes and private keys",()=>{
  for(const unsafe of [
   "http://college.example/logo.png",
   "javascript:alert(1)",
   "gs://storage/logo.png",
   "https://admin:password@college.example/logo.png",
   "https://college.example/logo.png?secret=token",
   "https://college.example/logo.png#private",
   "https://localhost/logo.png",
   "branding/secret-tenant/logo.png",
  ]){
   const current=sanitizePublicCollegeBranding({...valid,
    logoUrl:unsafe,loginBackgroundUrlMobile:unsafe,termsUrl:unsafe});
   expect(current.logoUrl,unsafe).toBeNull();
   expect(current.loginBackgroundUrlMobile,unsafe).toBeNull();
   expect(current.termsUrl,unsafe).toBeNull();
   expect(current.privacyUrl).toBe(valid.privacyUrl);
  }
 });
 it("drops malformed legacy stored CSS, email headers and phone markup per field",()=>{
  const current=sanitizePublicCollegeBranding({...valid,
   primaryColor:"rgb(1,2,3)",supportEmail:"admin@college.example\r\nBcc:x",
   supportPhone:"<script>alert(1)</script>",
  });
  expect(current.primaryColor).toBeNull();
  expect(current.supportEmail).toBeNull();
  expect(current.supportPhone).toBeNull();
  expect(current.logoUrl).toBe(valid.logoUrl);
 });
 it("sanitizes before anonymous exposure while keeping the scoped logo proxy",()=>{
  const service=readFileSync("src/modules/colleges/branding-service.ts","utf8");
  const begin=service.indexOf("export async function getPublicCollegeBranding(");
  const finish=service.indexOf("export async function getCollegeBranding(",begin);
  const source=service.slice(begin,finish);
  expect(source).toContain("sanitizePublicCollegeBranding(view)");
  expect(source).toContain('logoUrl:"/api/colleges/"+college.id+"/branding/logo"');
  expect(source).not.toContain("...toView(row),");
 });
});
