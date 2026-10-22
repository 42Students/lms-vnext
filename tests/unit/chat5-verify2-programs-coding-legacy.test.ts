import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {CODING_PROFILE_OPTIONS,codingProfileChoices,validateCodingProfile}
 from "@/modules/placements/tpo-coding-profile-model";

describe("Verify2b lane-5 legacy coding platform choices",()=>{
 it("preserves all six legacy options in order and full choice metadata",()=>{
  expect(CODING_PROFILE_OPTIONS.slice(0,6).map(option=>option.key)).toEqual([
   "LEETCODE","HACKERRANK","CODECHEF","CODEFORCES","GFG","HACKEREARTH",
  ]);
  for(const option of codingProfileChoices.slice(0,6)){
   expect(option.urlPrefix).toMatch(/^https:\/\//);
   expect(option.pattern.length).toBeGreaterThan(0);
   expect(option.hint.length).toBeGreaterThan(0);
  }
 });
 it("accepts a username and a pasted legacy HTTP link with canonical HTTPS result",()=>{
  expect(validateCodingProfile("LEETCODE","asha_k")).toEqual({
   url:"https://leetcode.com/u/asha_k",error:null,
  });
  expect(validateCodingProfile("LEETCODE","http://leetcode.com/u/asha_k/")).toEqual({
   url:"https://leetcode.com/u/asha_k",error:null,
  });
  expect(validateCodingProfile("LEETCODE","https://wrong.example/u/asha_k").error)
   .toContain("not a LeetCode profile");
 });
});

describe("Verify2b selected-college program server paging",()=>{
 const service=readFileSync("src/modules/academics/program-service.ts","utf8");
 const page=service.slice(service.indexOf("export async function listProgramsPage("),
  service.indexOf("export async function listGlobalProgramsForSuperAdmin("));
 it("filters the SQL page instead of only the already paginated client rows",()=>{
  expect(page).toContain("q?: string");
  expect(page).toContain("ilike(programs.name, searchPattern)");
  expect(page).toContain("ilike(programs.code, searchPattern)");
  expect(page).toContain("ilike(departments.name, searchPattern)");
  expect(page).toContain("q.length > 100");
  expect(page).toContain("eq(departments.collegeId, collegeId)");
 });
});
