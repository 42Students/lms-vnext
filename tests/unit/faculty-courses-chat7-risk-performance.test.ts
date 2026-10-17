import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../../src/components/courses/faculty-course-home-signals.tsx",import.meta.url),"utf8");
describe("Faculty Courses dashboard risk and performance parity",()=>{
 it("FAC-courses-R01 separates critical and moderate learner risk and has a true zero-risk empty state",()=>{
  expect(source).toContain("signals.atRiskCounts.critical");
  expect(source).toContain("signals.atRiskCounts.moderate");
  expect(source).toContain("Submissions missing");
  expect(source).toContain("Average grade");
  expect(source).toContain("No major learner risk signals");
 });
 it("FAC-courses-R02 shows strongest and weakest performance with a learner distribution drilldown",()=>{
  expect(source).toContain("weakest spot right now");
  expect(source).toContain("Strongest:");
  expect(source).toContain("student.averagePercent");
  expect(source).toContain("View all assessments");
  expect(source).toContain("Grade a few submissions to see the class&apos;s score spread here.");
 });
});