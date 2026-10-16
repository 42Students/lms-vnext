import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {tpoStudentUrlError} from "@/modules/placements/tpo-students-url-guard";
const id="11111111-1111-4111-8111-111111111111";
describe("TPO-students-02 roster student deep link and drawer",()=>{
 it("accepts exactly one valid student UUID alongside filters, not arbitrary paths or duplicated filters",()=>{
  expect(tpoStudentUrlError({student:id,journeyState:"APPLYING"})).toBeNull();
  expect(tpoStudentUrlError({student:"../foo"})).not.toBeNull();
  expect(tpoStudentUrlError({student:[id,id]})).not.toBeNull();
  expect(tpoStudentUrlError({unsupported:id})).not.toBeNull();
 });
 it("renders five panel tabs with safe detailed navigation",()=>{
  const page=readFileSync("src/components/tpo/tpo-students-spreadsheet.tsx","utf8");
  const modal=readFileSync("src/components/tpo/tpo-student-quick-panel.tsx","utf8");
  expect(page).toContain("Open student panel");
  expect(page).toContain("q.set(\"student\",id)");
  for(const tab of ["Profile","Placement","Requests","Notes","History"])expect(modal).toContain('"'+tab+'"');
  expect(modal).toContain("onNavigate(rows[index-1].membershipId)");
  expect(modal).toContain("onNavigate(rows[index+1].membershipId)");
  expect(modal).toContain('role="dialog"');
  expect(modal).toContain("No attention flags derived");
 });
});
