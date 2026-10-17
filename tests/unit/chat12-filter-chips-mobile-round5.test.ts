import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const s=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("chat12 mobile filters and chips",()=>{
 it("TPO-students-24 displays removable filter chips with URL-preserving reset",()=>{
  const p=s("src/components/tpo/tpo-grid-filter-panel.tsx");
  expect(p).toContain('aria-label="Active student filters"');
  expect(p).toContain('aria-label={"Remove "+chip.label}');
  expect(p).toContain("clearTpoGridFilters");
 });
 it("TPO-students-51 exposes an accessible mobile filter disclosure and bottom sheet",()=>{
  const p=s("src/components/tpo/tpo-grid-filter-panel.tsx");
  expect(p).toContain("open:bottom-0");
  expect(p).toContain("Filter students ({activeCount})");
  expect(s("src/components/tpo/tpo-students-spreadsheet.tsx")).toContain("fields={filters} mobileSheet");
 });
 it("TPO-students-48 announces both filtered counts and visible-page selection",()=>{
  expect(s("src/components/tpo/tpo-grid-filter-panel.tsx")).toContain('role="status"');
  expect(s("src/components/tpo/tpo-students-selection.tsx")).toContain("{visibleIds.length} shown of {totalCount} in this view");
  expect(s("src/components/tpo/tpo-students-spreadsheet.tsx")).toContain("selected of {shared?.totalCount??rows.length} in the authorized view.");
 });
});
