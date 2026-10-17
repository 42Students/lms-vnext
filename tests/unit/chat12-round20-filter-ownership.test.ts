import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("Students filter ownership",()=>{
 it("TPO-students-R04 removes duplicate Program and Class controls and preserves the selected values on advanced Apply",()=>{
  const page=src("src/app/(authenticated)/tpo/students/page.tsx");
  const grid=src("src/components/tpo/tpo-students-spreadsheet.tsx");
  expect(page).toContain('type="hidden" name="programId" value={query.programId??""}');
  expect(page).toContain('type="hidden" name="classId" value={query.classId??""}');
  expect(page).not.toContain('<select name="programId"');
  expect(page).not.toContain('<select name="classId"');
  expect(grid).toContain('key:"programId",urlKey:"programId"');
  expect(grid).toContain('key:"classId",urlKey:"classId"');
  expect(page).toContain('name="journeyState"');
  expect(page).toContain('name="branchId"');
 });
});