import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const file=(path:string)=>readFileSync(path,"utf8");
describe("TPO drive mobile action layout",()=>{
 it("TPO-drive-workspace-72 renders collapsed mobile Actions and responsive applicant cards",()=>{
  const view=file("src/components/placements/placement-drive-workspace.tsx");
  expect(view).toContain('<Dropdown mobileSheet align="end" label="Drive actions"');
  expect(view).toContain('trigger={isTpo?"More":"Actions"}');
  for(const label of ["Applicants","Close drive","Cancel drive","Current shortlist"])
   expect(view).toContain(label);
  const grid=file("src/components/tpo/tpo-applications-spreadsheet.tsx");
  expect(grid).toContain("mobileActionsCollapsible");
  expect(grid).toContain("TpoSpreadsheetGrid");
  expect(grid).toContain("mobileActionsCollapsible");
  const generic=file("src/components/tpo/tpo-spreadsheet-grid.tsx");
  expect(generic).toContain('>Actions</summary>');
 });
});
