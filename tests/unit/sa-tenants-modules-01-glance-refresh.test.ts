import {describe,it,expect} from "vitest";
import {isCollegeAtGlanceCounts,displayedGlanceNumber,COLLEGE_GLANCE_LOAD_ERROR,COLLEGE_GLANCE_REFRESH_ERROR} from "@/modules/colleges/admin-college-at-glance-model";
describe("SA-tenants-modules-01 super admin college summary",()=>{
 it("accepts recorded zero but refuses missing fields and forged counts",()=>{
  expect(isCollegeAtGlanceCounts({students:0,faculty:0,courses:0,activeDrives:0})).toBe(true);
  expect(isCollegeAtGlanceCounts({students:0,faculty:0,courses:0})).toBe(false);
  expect(isCollegeAtGlanceCounts({students:-1,faculty:0,courses:0,activeDrives:0})).toBe(false);
  expect(displayedGlanceNumber(null)).toBe("—");
  expect(displayedGlanceNumber(0)).toBe("0");
 });
 it("retains distinct load/refresh copy",()=>{
  expect(COLLEGE_GLANCE_LOAD_ERROR).toBe("Couldn't load college summary");
  expect(COLLEGE_GLANCE_REFRESH_ERROR).toBe("Summary refresh failed");
 });
});
