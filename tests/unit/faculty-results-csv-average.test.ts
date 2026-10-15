import {expect,it} from "vitest";
import {facultyResultExportAverage} from "@/modules/courses/faculty-results-export";
it("shows unknown for invalid grade averages, preserving valid zero",()=>{
 expect(facultyResultExportAverage(0)).toBe("0");
 expect(facultyResultExportAverage(79.5)).toBe("79.5");
 for(const invalid of [null,NaN,Infinity,-1,101]){
  expect(facultyResultExportAverage(invalid)).toBe("Unknown");
 }
});
