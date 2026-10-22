import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const s=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("chat12 mobile filters and chips",()=>{
 it("TPO-students-24 displays removable filter chips with URL-preserving reset",()=>{
  const p=s("src/components/tpo/tpo-grid-filter-panel.tsx");
  expect(p).toContain('aria-label="Active grid filters"');
  expect(p).toContain('aria-label={"Remove "+chip.label}');
  expect(p).toContain("clearTpoGridFilters");
 });
 it("TPO-students-51 exposes an accessible mobile filter disclosure and bottom sheet",()=>{
  const p=s("src/components/tpo/tpo-grid-filter-panel.tsx");
  expect(p).toContain('<BottomSheet open={sheetOpen} onOpenChange={next=>{setSheetOpen(next);if(!next&&autoOpenMobile)onAutoClose?.();}} title={title}>');
  const sheet=s("src/components/ui/bottom-sheet.tsx");
  // Native modal opening moved into a shared focus/exit hook, not removed.
  expect(sheet).toContain("useOverlayExit(ref, opener, open");
  expect(s("src/components/ui/use-overlay-exit.ts")).toContain("dialog.showModal()");
  expect(sheet).toContain("onCancel={event => { event.preventDefault(); if (dismissible) onOpenChange(false); }}");
  expect(sheet).toContain('aria-labelledby={titleId}');
  expect(sheet).toContain("opener.current?.focus()");
  expect(sheet).toContain("bottom-[var(--lms-visual-bottom)]");
  expect(p).toContain('title="Filter students"');
  expect(p).toContain("{title} ({activeCount})");
  // The students sheet mounts the shared GridWorkspace, which owns the mobile filter sheet.
  expect(s("src/components/tpo/tpo-students-spreadsheet.tsx")).toContain("<GridWorkspace");
  expect(s("src/components/tpo/grid/grid-workspace.tsx")).toContain("<TpoGridFilterPanel fields={filters} title={filterTitle} mobileSheet");
 });
 it("TPO-students-48 announces both filtered counts and visible-page selection",()=>{
  expect(s("src/components/tpo/tpo-grid-filter-panel.tsx")).toContain('role="status"');
  expect(s("src/components/tpo/tpo-students-selection.tsx")).toContain("{visibleIds.length} shown of {totalCount} in this view");
  expect(s("src/components/tpo/tpo-students-spreadsheet.tsx")).toContain("selected of {shared?.totalCount??rows.length} in the authorized view.");
 });
});
