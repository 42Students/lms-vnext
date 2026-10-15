import {it,expect} from "vitest";
import {exportTpoStudentsCsv} from "@/modules/placements/tpo-students-csv";
import type {TpoStudentRow} from "@/modules/placements/tpo-students-model";
it("exports the after-college field with formula-safe quoting",()=>{
 const row={displayName:"=1+1",afterCollegeOutcome:"ENTREPRENEURSHIP"} as TpoStudentRow;
 const result=exportTpoStudentsCsv([row]);
 expect(result).toContain('"After college"');
 expect(result).toContain('"ENTREPRENEURSHIP"');
 expect(result).toContain("'=1+1");
});