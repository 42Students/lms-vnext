import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("TPO Students phone presentation and scoped selection summary",()=>{
 it("TPO-students-48 announces selected of filtered view with exact scoped totals",()=>{
  const selection=src("src/components/tpo/tpo-students-selection.tsx");
  const page=src("src/app/(authenticated)/tpo/students/page.tsx");
  expect(selection).toContain('{visibleIds.length} shown of {totalCount} in this view');
  expect(selection).toContain('selectedCount} selected');
  expect(selection).toContain('role="status" aria-live="polite"');
  expect(page).toContain('<TpoStudentsSelectionSummary visibleIds={roster.items.map(student=>student.membershipId)} totalCount={roster.total}/>');
 });
 it("TPO-students-51 shows two-column phone journey, focused row summary and collapsible details/actions",()=>{
  const page=src("src/app/(authenticated)/tpo/students/page.tsx");
  const grid=src("src/components/tpo/tpo-spreadsheet-grid.tsx");
  expect(page).toContain('className="mt-5 grid min-w-0 grid-cols-2 gap-0 overflow-hidden rounded-[var(--lms-canvas-radius)] border border-border md:grid-cols-4" aria-label="Student placement journey"');
  expect(grid).toContain("const mobilePrimary = mobilePrimaryKeys?.length");
  expect(grid).toContain("mobilePrimaryKeys.includes(column.key)");
  expect(grid).toContain(": display.slice(0,5)");
  expect(grid).toContain("More student details");
  expect(grid).toContain("rowActions ? mobileActionsCollapsible ?");
  expect(grid).toContain('<Dropdown mobileSheet align="end"');
  expect(grid).toContain('trigger="Actions"');
  expect(grid).toContain('aria-label={"Row actions for "+');
  const filters=src("src/components/tpo/tpo-grid-filter-panel.tsx");
  const sheet=src("src/components/ui/bottom-sheet.tsx");
  expect(filters).toContain('<BottomSheet open={sheetOpen}');
  expect(filters).toContain('onOpenChange={next=>{setSheetOpen(next);if(!next&&autoOpenMobile)onAutoClose?.();}} title={title}');
  expect(sheet).toContain('className="fixed inset-x-0 bottom-[var(--lms-visual-bottom)]');
  expect(sheet).toContain("modal.showModal()");
  expect(sheet).toContain("onClose={() => { if (open) onOpenChange(false); opener.current?.focus(); }}");
 });
 it("TPO-students-R03 screen readers can distinguish mobile checkboxes by student",()=>{
  const grid=src("src/components/tpo/tpo-spreadsheet-grid.tsx");
  expect(grid).toContain('aria-label={"Select "+(openPrimary?.ariaLabel(row)??rowKey(row))}');
 });
});
