import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=(path:string)=>readFileSync(path,"utf8");
describe("Learner profile academic and access record",()=>{
 it("LEARNER-profile-misc-18 makes academic enrollment and real recorded actions accessible to the active learner only",()=>{
  const svc=source("src/modules/people/learner-profile-data-access-service.ts");
  const page=source("src/app/(authenticated)/learn/profile/data-access/page.tsx");
  const profile=source("src/app/(authenticated)/learn/profile/page.tsx");
  expect(svc).toContain("requireOwnLearnerProfileAccess(context)");
  expect(svc).toContain("eq(activityEvents.organizationId,member.organizationId)");
  expect(svc).toContain("eq(activityEvents.collegeId,member.collegeId)");
  expect(svc).toContain("eq(activityEvents.subjectId,member.id)");
  expect(svc).toContain(".limit(20)");
  expect(page).toContain("Who has my data");
  expect(page).toContain("getOwnLearnerAcademicSummary(context)");
  expect(page).toContain("A complete record of profile views is not available");
  expect(profile).toContain('href="/learn/profile/data-access"');
  expect(profile).toContain('href="/learn/profile/academic-record"');
 });
 it("LEARNER-profile-misc-18 never treats absent view logs as evidence of consent or inspection",()=>{
  const page=source("src/app/(authenticated)/learn/profile/data-access/page.tsx");
  expect(page).toContain("not a list of people who opened your profile");
  expect(page).toContain("no view or consent is inferred");
  expect(page).toContain("No recorded membership changes to display.");
 });
});