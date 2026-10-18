import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {
 tpoTrustedCompanyDomainSchema,validTpoTrustedHost,
} from "@/modules/placements/tpo-trusted-domain-validation";

describe("TPO-settings-audit-TRUST-02 college-scoped company domain validation",()=>{
 it("accepts ordinary domains, nested subdomains and optional email-style @ prefix",()=>{
  for(const [input,want] of [
   ["Hiring.Example","hiring.example"],
   ["@RECRUIT.Example","recruit.example"],
   [" employer.example ","employer.example"],
   ["careers.eng.example","careers.eng.example"],
   ["one-division.example","one-division.example"],
  ]){
   expect(tpoTrustedCompanyDomainSchema.parse(input)).toBe(want);
   expect(validTpoTrustedHost(want)).toBe(true);
  }
 });
 it("rejects DNS labels with trailing hyphens, invalid separators, 64-byte labels and public mail providers",()=>{
  for(const invalid of [
   "bad-.example","-bad.example","bad..example",".bad.example","bad.example.",
   "bad_.example","foo@other.example","https://hiring.example","user:hiring.example",
   "invalid..corp.com","x".repeat(64)+".example","a.example."+"x".repeat(64),
   "gmail.com","@Outlook.com","yahoo.co.in","foo.example/path","example.com:443",
   "a.local","a.localhost","a.internal","a.com?secret=123",
  ]){
   expect(tpoTrustedCompanyDomainSchema.safeParse(invalid).success,invalid).toBe(false);
  }
 });

 it("TPO-settings-audit-TRUST-03 bounds the trusted-domain HTTP mutation body before accepting changes",()=>{
  const route=readFileSync("src/app/api/placements/tpo/trusted-domains/route.ts","utf8");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain("getCurrentRequestContext()");
  expect(route).toContain("readTpoSettingsBody(request)");
  expect(route).toContain("TpoCommunicationBodyError");
  expect(route).toContain('error:"INVALID_REQUEST"');
  expect(route).toContain('status:error.code==="BODY_TOO_LARGE"?413:400');
  expect(route).not.toContain("await request.json()");
 });
 it("requires a strict client payload, persisted actor reauthorization, explicit college and auditable write",()=>{
  const service=readFileSync("src/modules/placements/tpo-trusted-domains-write-service.ts","utf8");
  expect(service).toContain("domain:tpoTrustedCompanyDomainSchema");
  expect(service).toContain('z.enum(["TRUST","REMOVE"])');
  expect(service).toContain("z.strictObject(");
  const permission=service.indexOf('assertPersistedPlatformPermission(tx,ctx,"placements.manage"');
  const write=service.indexOf('tx.insert(placementTpoTrustedDomains)');
  const activity=service.indexOf('tx.insert(activityEvents)');
  expect(permission).toBeGreaterThan(0);
  expect(write).toBeGreaterThan(permission);
  expect(activity).toBeGreaterThan(write);
  expect(service).toContain("eq(placementTpoTrustedDomains.collegeId,college.id)");
  expect(service).toContain("DOMAIN_ALREADY_TRUSTED");
  expect(service).toContain("DOMAIN_NOT_FOUND");
 });
});
