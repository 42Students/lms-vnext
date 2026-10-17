import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
const text=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat-11 provider and gradebook owner decisions",()=>{
 it("PUB-auth-public-36 preserves registered DLT SMS and the legacy ZeptoMail OTP merge fields",()=>{
  const sms=text("src/modules/notifications/exotel-sms.ts");
  expect(sms).toContain("DltTemplateId");
  expect(sms).toContain("DltEntityId");
  expect(sms).toContain("is the One Time Password (OTP) to access your account at 42LMS.COM.");
  const email=text("src/modules/notifications/zeptomail-email.ts");
  for(const part of ["template_key","learnerName:","expiryMinutes: \"5\"","mobile:","otp:"])expect(email).toContain(part);
  expect(text("src/modules/auth/login-service.ts")).toContain("deps.email.sendOtpEmail");
  expect(text("src/modules/auth/login-service.ts")).toContain("deps.sms.sendOtp");
 });
 it("FAC-attendance-grades-21 keeps manual non-assignment grade entry out of scope per OD-33",()=>{
  const owner=text("docs/audit/owner-decisions-resolved.md");
  expect(owner).toContain("OD-33");
  expect(owner).toContain("No manual marks for non-assignment components.");
  const gradebook=text("src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/page.tsx");
  expect(gradebook).toContain("Published gradebook");
 });
});
