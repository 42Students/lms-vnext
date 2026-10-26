import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {recruiterTodayHasDriveHistory} from "@/modules/placements/recruiter-today-headline-model";
const source=readFileSync("src/app/(authenticated)/hr/home/page.tsx","utf8");
describe("Final sprint recruiter first-run and all-clear",()=>{
 it("REC-home-drives-05 first-run and all-clear states preserve legacy three-step guide",()=>{
  expect(source).toContain("recruiterTodayHasDriveHistory({");
  expect(recruiterTodayHasDriveHistory({verifiedJobCount:0,requestCount:0,jobPreviewCapped:false})).toBe(false);
  expect(recruiterTodayHasDriveHistory({verifiedJobCount:0,requestCount:null,jobPreviewCapped:false})).toBe(null);
  expect(recruiterTodayHasDriveHistory({verifiedJobCount:0,requestCount:3,jobPreviewCapped:false})).toBe(true);
  expect(source).toContain("recruiterDriveDraftHref({collegeId:selectedId})");
  const view=readFileSync("src/components/hr/recruiter-today-prototype.tsx","utf8");
  expect(view).toContain("Start with your first drive");
  expect(view).toContain("Request your first drive");
  expect(view).toContain("The placement cell reviews the request, confirms dates and publishes to students.");
  expect(view).toContain("You’re all caught up");
  expect(view).toContain("New applicants, replies and decisions show up here.");
 });
});
