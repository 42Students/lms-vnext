import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
import {SESSION_MAX_AGE_SECONDS} from "@/modules/auth/config";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat-11 session and attendance parity",()=>{
 it("FAC-attendance-grades-10 offers the legacy class selector on the attendance tab",()=>{
  const code=source("src/components/courses/faculty-course-tab-navigation.tsx");
  expect(code).toContain('(activeTab==="students"||activeTab==="attendanceDetail")');
  expect(code).toContain('aria-label={activeTab==="students"?"Select class to view its roster":"Select class to view attendance"}');
  expect(code).toContain("teachingSections.map");
  expect(code).toContain("router.push(facultyCourseTabHref(event.target.value, activeTab))");
 });
 it("FAC-attendance-grades-16 retires the dead-end correction request page after access validation",()=>{
  const code=source("src/app/(authenticated)/teacher/courses/[deliveryId]/attendance-corrections/page.tsx");
  expect(code).toContain("getFacultyCorrectionAvailability");
  expect(code).toContain("getCurrentRequestContext()");
  expect(code).toContain('"/attendanceDetail"');
  expect(code).toContain("redirect(");
  expect(code).not.toContain("Correction request history unavailable");
 });
 it("PUB-auth-public-35 documents five-day absolute session expiry without sliding tokens",()=>{
  expect(SESSION_MAX_AGE_SECONDS).toBe(5*24*60*60);
  const session=source("src/modules/auth/session-service.ts");
  expect(session).toContain("s.expires_at > clock_timestamp()");
  expect(session).toContain("expires_at <= clock_timestamp()");
  expect(session).toContain("SET last_seen_at = CASE");
  expect(session).not.toContain("SET expires_at =");
  expect(source("docs/audit/decisions/session-absolute-expiry.md")).toContain("never extends");
 });
});
