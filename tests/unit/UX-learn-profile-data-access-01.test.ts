import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

const page=readFileSync(new URL("../../src/app/(authenticated)/learn/profile/data-access/page.tsx",import.meta.url),"utf8");

describe("UX-learn-profile-data-access-01 /learn/profile/data-access",()=>{
 it("uses learner-only scoped readers and explains access without claiming unrecorded view history",()=>{
  expect(page).toContain("getCurrentRequestContext()");
  expect(page).toContain("getOwnLearnerProfileDataActions(context)");
  expect(page).toContain("getOwnLearnerAcademicSummary(context)");
  expect(page).toContain("Who has my data");
  expect(page).toContain("A complete record of profile views is not available");
  expect(page).toContain("no view or consent is inferred");
  expect(page).not.toContain("getAllLearner");
 });
 it("has a route back, labelled semantic sections, truthful empties and 44px navigation",()=>{
  expect(page).toContain('href="/learn/profile"');
  expect(page).toContain("min-h-11");
  expect(page).toContain("<PageHeader");
  expect(page).toContain("<h2");
  expect(page).toContain('role="status"');
  expect(page).toContain("No recorded membership changes to display.");
  expect(page).toContain('timeZone:"Asia/Kolkata"');
  expect(page).toContain("min-w-0");
 });
});
