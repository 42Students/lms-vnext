import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("TPO Students empty roster spreadsheet recovery",()=>{
 it("shows the existing first-page action and keeps grid-column/filter controls present",()=>{
  const page=readFileSync("src/app/(authenticated)/tpo/students/page.tsx","utf8");
  const grid=readFileSync("src/components/tpo/tpo-students-spreadsheet.tsx","utf8");
  expect(page).toContain("Nobody is in placements yet.");
  expect(page).toContain("First matching page");
  expect(page).toContain("<TpoStudentsSpreadsheet rows={roster.items}");
  expect(page).not.toMatch(/\)\s*:\s*\(\s*<Suspense fallback=\{<p role="status">Loading spreadsheet grid/);
  expect(grid).toContain("<TpoGridFilterPanel fields={filters}/>");
 });
});
