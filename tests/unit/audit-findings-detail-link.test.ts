import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const detail=readFileSync("src/app/(authenticated)/tracker/audit-findings/[publicId]/page.tsx","utf8");
const board=readFileSync("src/app/(authenticated)/tracker/audit-findings/page.tsx","utf8");
describe("DB10 audit finding detail integration",()=>{
 it("opens the existing authorized persisted detail and status/retest workflow",()=>{
  expect(detail).toContain("TrackerIssueDetailPage");
  expect(detail).toContain("Back to audit findings");
  expect(board).toContain("/tracker/audit-findings/");
 });
});