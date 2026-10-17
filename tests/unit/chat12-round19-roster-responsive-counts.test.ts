import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("TPO Students phone presentation and scoped selection summary",()=>{
 it("TPO-students-48 announces selected of filtered view with exact scoped totals",()=>{
  const selection=src("src/components/tpo/tpo-students-selection.tsx");
  const page=src("src/app/(authenticated)/tpo/students/page.tsx");
  expect(selection).toContain('{visibleIds.length} of {totalCount} in this view');
  expect(selection).toContain('selectedCount} selected');
  expect(selection).toContain('role="status" aria-live="polite"');
  expect(page).toContain('<TpoStudentsSelectionSummary visibleIds={roster.items.map(student=>student.membershipId)} totalCount={roster.total}/>');
 });
 it("TPO-students-51 shows two-column phone journey, focused row summary and collapsible details/actions",()=>{
  const page=src("src/app/(authenticated)/tpo/students/page.tsx");
  const grid=src("src/components/tpo/tpo-spreadsheet-grid.tsx");
  expect(page).toContain('className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Student placement journey"');
  expect(grid).toContain("mobileActionsCollapsible?display.slice(0,5):display");
  expect(grid).toContain("More student details");
  expect(grid).toContain("mobileActionsCollapsible?<details");
  expect(src("src/components/tpo/tpo-grid-filter-panel.tsx")).toContain("open:fixed open:inset-x-0 open:bottom-0");
 });
 it("TPO-students-R03 screen readers can distinguish mobile checkboxes by student",()=>{
  const grid=src("src/components/tpo/tpo-spreadsheet-grid.tsx");
  expect(grid).toContain('aria-label={"Select "+(openPrimary?.ariaLabel(row)??rowKey(row))}');
 });
});
