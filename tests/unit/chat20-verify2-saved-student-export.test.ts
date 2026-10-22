import {describe,expect,it} from "vitest";
import {legacyGridExportFilename,legacySavedViewExportFilename} from "@/modules/placements/grid-export-filename";
import {selectTpoExcelColumns,TPO_STUDENT_EXCEL_COLUMNS} from "@/modules/placements/tpo-students-xlsx";

describe("legacy TPO student view export naming",()=>{
 it("dates saved view exports in Asia/Kolkata but leaves unsaved exports undated",()=>{
  const now=new Date("2026-10-07T20:00:00.000Z");
  expect(legacySavedViewExportFilename("TCS shortlist","xlsx",now)).toBe("TCS shortlist – 8 Oct 2026.xlsx");
  expect(legacySavedViewExportFilename("TCS shortlist","csv",now)).toBe("TCS shortlist – 8 Oct 2026.csv");
  expect(legacyGridExportFilename("Students","csv")).toBe("Students.csv");
 });
 it("offers the optional old Class column without changing the private required columns",()=>{
  expect(selectTpoExcelColumns(["student","class","marksVerified"])).toEqual(
   ["student","batch","class","branch","marksVerified","email","eligibilityReason"]);
  expect(TPO_STUDENT_EXCEL_COLUMNS.class[0]).toBe("Class");
 });
 it("neutralizes unsupported filename characters without stripping the dated view label",()=>{
  const now=new Date("2026-10-07T20:00:00.000Z");
  expect(legacySavedViewExportFilename("TCS/shortlist","csv",now)).toBe("TCS-shortlist – 8 Oct 2026.csv");
 });
});
