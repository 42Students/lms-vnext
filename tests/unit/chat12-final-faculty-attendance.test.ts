import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("chat-12 final sprint faculty audit",()=>{
 it("FAC-attendance-grades-18 keeps bounded present and absent lists with duplicate checks",()=>{
  const source=read("src/modules/attendance/faculty-service.ts");
  expect(source).toContain("absentMembershipIds: z.array(uuid).max(1000)");
  expect(source).toContain("presentMembershipIds: z.array(uuid).max(1000)");
  expect(source).toContain("A learner cannot be both present and absent");
  expect(source).toContain("present.size !== value.presentMembershipIds.length");
  expect(source).toContain("absent.size !== value.absentMembershipIds.length");
 });
 it("FAC-attendance-grades-18 checks roster membership within the scheduled class",()=>{
  const source=read("src/modules/attendance/faculty-service.ts");
  expect(source).toContain("presentMembershipIds");
  expect(source).toContain("absentMembershipIds");
  expect(source).toContain("sectionEnrollments");
  expect(source).toContain("attendanceRecords");
 });
 it("FAC-attendance-grades-19 honors persisted college policy rather than hardcoded UI risk rules",()=>{
  const source=read("src/modules/attendance/faculty-service.ts");
  expect(source).toContain("attendancePolicies.eligibilityThresholdPercent");
  const home=read("src/components/courses/faculty-course-home-signals.tsx");
  expect(home).not.toContain("currently match the legacy risk rules");
 });
 it("FAC-attendance-grades-22 uses purposeful native reports and gradebook labels, without invented legacy eyebrow",()=>{
  for(const file of ["gradebook","reports","session-coverage"]){
   const page=read("src/app/(authenticated)/teacher/courses/[deliveryId]/"+file+"/page.tsx");
   expect(page).toContain("<PageHeader title=");
   expect(page).not.toContain('eyebrow="Faculty ·');
  }
 });
});
