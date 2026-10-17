import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const file=(path:string)=>readFileSync(path,"utf8");
describe("TPO drive mobile action layout",()=>{
 it("TPO-drive-workspace-72 renders collapsed mobile Actions and responsive applicant cards",()=>{
  const view=file("src/components/placements/placement-drive-workspace.tsx");
  expect(view).toContain('aria-label="Drive actions"');
  expect(view).toContain('md:hidden">Actions</summary>');
  expect(view).toContain("group-open:flex md:flex");
  for(const label of ["Applicants","Close drive","Cancel drive","Current shortlist"])
   expect(view).toContain(label);
  const grid=file("src/components/tpo/tpo-applications-spreadsheet.tsx");
  expect(grid).toContain("<TpoGridFilterPanel fields={filters} mobileSheet/>");
  expect(grid).toContain("mobileActionsCollapsible");
  const generic=file("src/components/tpo/tpo-spreadsheet-grid.tsx");
  expect(generic).toContain('>Actions</summary>');
 });
});
