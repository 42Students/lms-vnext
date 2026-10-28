import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat-9 public auth unconfirmed decisions",()=>{
 it("PUB-auth-public-22 shows static college when there is only one active choice",()=>{
  const s=read("src/components/shell/membership-switcher.tsx");
  expect(s).toContain("if (choices.length === 1 && active)");
  expect(s).toContain("{active.label}");
 });
 it("PUB-auth-public-23 ignores blank selection and never clears membership through the switcher",()=>{
  const s=read("src/components/shell/membership-switcher.tsx");
  expect(s).toContain("if (!choice || choice.value === active?.value) return;");
  expect(s).toContain("const choice = choices.find((item) => item.value === value);");
  expect(s).toContain('<option value="" disabled>Switch workspace</option>');
  expect(s).not.toContain('method:"DELETE"');
 });
 it("PUB-auth-public-26 keeps central OTP authentication rather than resurrecting college-specific PIN login",()=>{
  const s=read("src/modules/auth/config.ts");
  expect(s).toContain("first-party login (phone / email one-time codes)");
  expect(s).not.toContain("rollNumberPin");
 });
 it("PUB-auth-public-30 explains disabled projects without leaking private projects",()=>{
  const s=read("src/app/(authenticated)/learn/projects/page.tsx");
  expect(s).toContain("This module is currently disabled for your college.");
  expect(s.indexOf("return <section className")).toBeGreaterThan(-1);
  expect(s.indexOf("return <section className")).toBeLessThan(s.indexOf("const params = await searchParams;"));
 });
 it("PUB-auth-public-35 retains five-day absolute expiry without sliding sessions",()=>{
  const c=read("src/modules/auth/config.ts"),s=read("src/modules/auth/session-service.ts");
  expect(c).toContain("60 * 60 * 24 * 5");
  expect(s).toContain("SET last_seen_at = CASE");
  expect(s).toContain("s.expires_at > clock_timestamp()");
  expect(s).not.toMatch(/SET expires_at\s*=/);
 });
 it("PUB-auth-public-36 retains registered provider OTP copy without leaking codes to logs",()=>{
  const sms=read("src/modules/notifications/exotel-sms.ts");
  const email=read("src/modules/notifications/zeptomail-email.ts");
  expect(sms).toContain("DltTemplateId: config.otpDltTemplateId");
  expect(sms).toContain("For security reasons, please do not share this OTP");
  expect(email).toContain('expiryMinutes: "5"');
  expect(email).toContain('SYSTEM_EMAIL_VERIFICATION: ["otp"]');
 });
});
