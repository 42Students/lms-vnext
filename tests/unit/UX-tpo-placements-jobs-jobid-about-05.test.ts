import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/placements/jobs/[jobId]/about/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-placements-jobs-jobid-about-05",()=>{
 it("shows mobile-ready branch and role package tables with explicit empty copy",()=>{
  expect(source.match(/<DataTable /g)).toHaveLength(2);
  expect(source).toContain("rows={data.byBranch}");
  expect(source).toContain("rows={data.packages}");
  expect(source).toContain("No active academic branch enrollments are recorded.");
  expect(source).toContain("No role packages are recorded for this drive.");
  expect(source).toContain('mobilePriority:"primary"');
  expect(source).not.toContain("<table");
 });
});
