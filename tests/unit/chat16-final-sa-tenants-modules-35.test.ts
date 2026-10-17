import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {LEGACY_TENANT_SETTING_SPECS} from "@/modules/platform-settings/legacy-setting-specs";
const read=(p:string)=>readFileSync(p,"utf8");
describe("SA-tenants-modules-35 platform and auth settings",()=>{
 it("SA-tenants-modules-35 exposes host, cookie, privileged IP and OTP settings through validated global editor",()=>{
  const keys=LEGACY_TENANT_SETTING_SPECS.filter(x=>x.scope==="GLOBAL").map(x=>x.key);
  for(const key of ["baseDomain","globalHost","cookieDomain","cookieSameSite","policy.superadmin.ipAllowlist","otp.maxAttempts","otp.windowSeconds"])expect(keys).toContain(key);
  const editor=read("src/components/admin/tenant-settings-editor.tsx");
  expect(editor).toContain('LEGACY_TENANT_SETTING_SPECS.filter(item=>item.scope===scopeType)');
  expect(editor).toContain("expectedVersion");
  expect(editor).toContain("confirmedHighImpact");
 });
 it("SA-tenants-modules-35 requires high-impact confirmation and strict validation for host, SameSite and IP networks",()=>{
  const editor=read("src/components/admin/tenant-settings-editor.tsx");
  const service=read("src/modules/platform-settings/admin-editor-service.ts");
  expect(editor).toContain('<ConfirmDialog open={impactConfirm}');
  expect(service).toContain('spec.key==="cookieSameSite"');
  expect(service).toContain('"baseDomain","globalHost","cookieDomain"');
  expect(service).toContain('spec.key==="policy.superadmin.ipAllowlist"');
 });
});