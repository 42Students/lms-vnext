import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const src=readFileSync("src/app/api/tracker/audit-findings/export/route.ts","utf8");
describe("DB10 audit findings export route safety",()=>{
 it("uses tracker-specific errors without leaking private issue details",()=>{
  expect(src).toContain("bugTrackerApiError(error)");
  expect(src).toContain("trackerAdminRuntimeEnabled()");
  expect(src).toContain("listBugTrackerIssuesForAdmin");
 });
});