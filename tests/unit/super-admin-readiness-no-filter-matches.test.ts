import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {visibleReadinessChecks} from "@/modules/colleges/admin-readiness-filter";
const source=readFileSync("src/app/(authenticated)/admin/colleges/[collegeId]/readiness/page.tsx","utf8");
describe("Super Admin filtered readiness empty state",()=>{
 it("shows an explicit no-matches message",()=>{
  expect(source).toContain("shownChecks.length===0");
  expect(source).toContain("No readiness checks match the selected status and area.");
 });
 it("does not substitute filtered count for the full overall verdict",()=>{
  expect(source).toContain("evaluation.counts.total");
  expect(visibleReadinessChecks([],"FAIL","DOMAINS")).toEqual([]);
 });
});
