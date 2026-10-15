import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("TPO empty applicant grid recovery",()=>{
 it("keeps the spreadsheet and its filter panel mounted at zero matches",()=>{
  const page=readFileSync("src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx","utf8");
  const grid=readFileSync("src/components/tpo/tpo-applications-spreadsheet.tsx","utf8");
  expect(page).toContain('<TpoApplicationsSpreadsheet rows={data.rows}');
  expect(page).toContain('!data.rows.length?<EmptyState');
  expect(page).not.toMatch(/<EmptyState[^\n]*\/>\s*:\s*<Suspense/);
  expect(grid).toContain("<TpoGridFilterPanel fields={filters}/>");
 });
});
