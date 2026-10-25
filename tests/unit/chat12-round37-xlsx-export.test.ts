import {readFileSync} from "node:fs";import {it,expect} from "vitest";
import {selectTpoExcelColumns,exportTpoStudentsXlsx} from "@/modules/placements/tpo-students-xlsx";
import {legacyGridExportFilename} from "@/modules/placements/grid-export-filename";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
it("TPO-students-36 creates genuine ZIP-based XLSX with sorted scoped columns, mandatory batch/branch and an italic view provenance line",()=>{
 expect(selectTpoExcelColumns(["cgpa","unknown","student"])).toEqual(["student","batch","branch","cgpa","email","eligibilityReason"]);
 expect(selectTpoExcelColumns(["class","student"])).toEqual(["student","batch","class","branch","email","eligibilityReason"]);
 const data=exportTpoStudentsXlsx([],["student"],"Sample filtered view");
 expect([...data.slice(0,4)]).toEqual([80,75,3,4]);
 const route=src("src/app/api/placements/tpo/students/export-xlsx/route.ts");
 expect(route).toContain("getTpoStudentsIntelligence");
 expect(route).toContain("idsList.some");
 expect(route).toContain('"Content-Disposition"');
 expect(route).toContain('legacyGridExportFilename(downloadName, "xlsx")');
 expect(src("src/modules/placements/tpo-students-xlsx.ts")).toContain("How this list was made: ");
 const grid=src("src/components/tpo/tpo-students-spreadsheet.tsx");
 expect(grid).toContain('/api/placements/tpo/students/export-xlsx?');
 expect(grid).toContain("xlsxHref={xlsxHref}");
});

it("uses the saved view label for an export and safely strips HTTP-header control characters",()=>{
 const views=src("src/components/tpo/tpo-student-saved-views.tsx");
 expect(views).toContain('router.push(hrefFor(view.query,view.name))');
 const endpoint=src("src/app/api/placements/tpo/students/export-xlsx/route.ts");
 expect(endpoint).toContain('const savedViewRequested=raw["view"]!==undefined;');
 expect(endpoint).toContain('const downloadName=savedViewRequested?viewName:"students";');
 expect(endpoint).toContain('legacySavedViewExportFilename(viewName, "xlsx")');
 expect(legacyGridExportFilename("TCS shortlist","xlsx")).toBe("TCS shortlist.xlsx");
 expect(legacyGridExportFilename("TCS\r\nOther: value","csv")).toBe("TCS-Other- value.csv");
});