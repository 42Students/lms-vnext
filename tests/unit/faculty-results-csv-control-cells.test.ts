import {expect,it} from "vitest";
import {facultyResultsCsvCell} from "@/modules/courses/faculty-results-export";
it("neutralizes formula cells after stripping hidden control characters",()=>{
 expect(facultyResultsCsvCell("\u0000=2+2")).toBe('"\' =2+2"');
 expect(facultyResultsCsvCell("Hello\r\nWorld")).toBe('"Hello  World"');
 expect(facultyResultsCsvCell('@SUM(1,2)')).toBe('"\'@SUM(1,2)"');
});
