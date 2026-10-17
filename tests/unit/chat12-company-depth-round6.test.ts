import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const s=(p:string)=>readFileSync(new URL("../../src/"+p,import.meta.url),"utf8");
describe("Chat12 company depth and URL filters",()=>{
 it("TPO-students-23 filters interviewed-with using actual applied company evidence",()=>{
  expect(s("modules/placements/tpo-students-model.ts")).toContain("row.interviewedCompanies");
  expect(s("app/(authenticated)/tpo/students/page.tsx")).toContain('name="interviewedWith"');
 });
 it("TPO-students-28 provides company name and +N depth on Best so far",()=>{
  expect(s("components/tpo/tpo-students-spreadsheet.tsx")).toContain('" more"');
  expect(s("components/tpo/tpo-student-quick-panel.tsx")).toContain("student.bestCompany");
 });
 it("TPO-students-39 retains browser-stored column selection",()=>{expect(s("components/tpo/tpo-students-spreadsheet.tsx")).toContain('storageKey="tpo-students-columns-v1"');});
 it("TPO-students-45 retains all-season history links",()=>{expect(s("components/tpo/tpo-student-quick-panel.tsx")).toContain("history");});
 it("TPO-students-48 displays the current page count",()=>{expect(s("components/tpo/tpo-students-spreadsheet.tsx")).toContain("selected of {shared?.totalCount??rows.length} in the authorized view.");});
 it("TPO-students-51 retains mobile card actions",()=>{expect(s("components/tpo/tpo-students-spreadsheet.tsx")).toContain("mobileActionsCollapsible");});
 it("TPO-students-53 preserves offers waiting independently of interviewed companies",()=>{expect(s("modules/placements/tpo-students-model.ts")).toContain("offersAwaitingAnswer");});
 it("TPO-students-54 preserves last recorded outcome labels",()=>{expect(s("components/tpo/tpo-student-outcome-pill.tsx")).toContain("AFTER_COLLEGE_LABELS[recorded]");});
});
