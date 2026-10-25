import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const source=readFileSync("src/app/(authenticated)/hr/home/page.tsx","utf8");
describe("Final sprint recruiter first-run and all-clear",()=>{
 it("REC-home-drives-05 first-run and all-clear states preserve legacy three-step guide",()=>{
  expect(source).toContain("requestCount>0||recentJobCapReached");
  expect(source).toContain("recruiterDriveDraftHref({collegeId:selectedId})");
  const view=readFileSync("src/components/hr/recruiter-today-prototype.tsx","utf8");
  expect(view).toContain("Start with your first drive");
  expect(view).toContain("Request your first drive");
  expect(view).toContain("The placement cell reviews it before students apply.");
  expect(view).toContain("You’re all caught up");
  expect(view).toContain("New applicants, replies and decisions show up here.");
 });
});
