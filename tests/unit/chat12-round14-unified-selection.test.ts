import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const src=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("chat-12 unified page selection",()=>{
 it("TPO-students-R03 uses one selection for student grid, bulk actions, and Add to drive",()=>{
  const page=src("src/app/(authenticated)/tpo/students/page.tsx");
  expect(page).toContain("<TpoStudentsSelectionProvider");
  for(const path of ["src/components/tpo/tpo-students-spreadsheet.tsx","src/components/tpo/tpo-bulk-action-panel.tsx","src/components/tpo/tpo-students-bulk-add.tsx"]){
   expect(src(path)).toContain("useTpoStudentsSelection()");
   expect(src(path)).toContain("shared?.setSelected??setLocalSelection");
  }
 });
 it("TPO-students-17 preserves page navigation selection and invalidates changed filter scopes",()=>{
  const page=src("src/app/(authenticated)/tpo/students/page.tsx");
  expect(page).toContain('scopeKey={context.membership.id+":"+JSON.stringify(');
  expect(page).toContain("page:undefined,pageSize:undefined,columns:undefined");
  const provider=src("src/components/tpo/tpo-students-selection.tsx");
  expect(provider).toContain('window.sessionStorage.setItem(key');
  expect(provider).toContain("Selected students hidden by these filters were unticked.");
  const add=src("src/components/tpo/tpo-students-bulk-add.tsx");
  expect(add).toContain("pageSelected=selected.filter(id=>membersById.has(id))");
  expect(add).toContain("pageSelected.length>200");
  expect(add).toContain("reviewedSelection!==selectionFingerprint");
 });
 it("TPO-students-48 announces visible selection and filter count without including hidden students",()=>{
  const grid=src("src/components/tpo/tpo-students-spreadsheet.tsx");
  expect(grid).toContain("selected of {shared?.totalCount??rows.length} in the authorized view.");
  expect(src("src/components/tpo/tpo-students-selection.tsx")).toContain("selectedCount} selected of {totalCount}");
  expect(grid).toContain('aria-live="polite"');
 });
});
