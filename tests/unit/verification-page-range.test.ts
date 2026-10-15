import {describe,expect,it} from "vitest";
import {verificationLastPage,verificationPageUrl} from "@/modules/verification/page-range";
describe("college verification page recovery",()=>{
 it("clamps a 50-row selected view to its real last page",()=>{
  expect(verificationLastPage(0,50)).toBe(1);
  expect(verificationLastPage(101,50)).toBe(3);
  expect(verificationLastPage(10,10)).toBe(1);
 });
 it("preserves filters and resets an out-of-range page safely",()=>{
  const uri=verificationPageUrl({attention:"MISSING_MARKSHEET",page:45,pageSize:10,sort:"NEWEST"},2);
  expect(uri).toContain("page=2");
  expect(uri).toContain("attention=MISSING_MARKSHEET");
  expect(uri).not.toContain("page=45");
 });
});
