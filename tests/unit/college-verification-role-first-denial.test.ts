import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("College verification denies wrong-role before parsing",()=>{
 it("reuses the same authenticated context for queue and dropdown reads",()=>{
  const source=readFileSync("src/app/(authenticated)/college/verification/page.tsx","utf8");
  expect((source.match(/getCurrentRequestContext\(\)/g)??[]).length).toBe(1);
  expect(source.indexOf('hasMembershipRole(context,"COLLEGE_ADMIN")')).toBeLessThan(source.indexOf("parseCollegeVerificationPageQuery(raw)"));
  expect(source).toContain("listCollegeVerificationQueue(context,parsed.data)");
  expect(source).toContain("listVerificationProgramOptions(context)");
 });
});
