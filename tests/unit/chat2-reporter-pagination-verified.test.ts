import {describe,expect,it} from "vitest";
import {reporterPageHasMore} from "@/modules/bug-tracker/reporter-service";

describe("G2-16-003-039: reporter-owned report pagination boundaries",()=>{
 it("keeps a stable 20-row page boundary for both full and partial pages",()=>{
  expect(reporterPageHasMore(1,20,41)).toBe(true);
  expect(reporterPageHasMore(2,20,41)).toBe(true);
  expect(reporterPageHasMore(3,20,41)).toBe(false);
  expect(reporterPageHasMore(2,20,40)).toBe(false);
  expect(reporterPageHasMore(1,100,101)).toBe(true);
  expect(reporterPageHasMore(2,100,101)).toBe(false);
 });
 it("rejects non-positive, non-integer and unknown totals",()=>{
  expect(reporterPageHasMore(0,20,21)).toBe(false);
  expect(reporterPageHasMore(1,0,21)).toBe(false);
  expect(reporterPageHasMore(1,20,Number.NaN)).toBe(false);
  expect(reporterPageHasMore(1,20,-1)).toBe(false);
 });
});
