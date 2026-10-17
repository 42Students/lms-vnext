import {readFileSync} from "node:fs";import {it,expect} from "vitest";
import {selectTpoExcelColumns,exportTpoStudentsXlsx} from "@/modules/placements/tpo-students-xlsx";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
it("TPO-students-36 creates genuine ZIP-based XLSX with sorted scoped columns, mandatory batch/branch and an italic view provenance line",()=>{
 expect(selectTpoExcelColumns(["cgpa","unknown","student"])).toEqual(["batch","branch","cgpa","student","email","eligibilityReason"]);
 const data=exportTpoStudentsXlsx([],["student"],"Sample filtered view");
 expect([...data.slice(0,4)]).toEqual([80,75,3,4]);
 const route=src("src/app/api/placements/tpo/students/export-xlsx/route.ts");
 expect(route).toContain("getTpoStudentsIntelligence");
 expect(route).toContain("idsList.some");
 expect(route).toContain('filename="tpo-students.xlsx"');
 expect(src("src/modules/placements/tpo-students-xlsx.ts")).toContain("How this list was made: ");
});