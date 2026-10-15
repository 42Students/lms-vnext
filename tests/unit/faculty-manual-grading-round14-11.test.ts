import {it,expect} from "vitest";import {facultyManualGradeNeedsRefresh} from "@/modules/courses/faculty-manual-grade-receipt";
it("uses the same persisted version conflict recovery for grade publish",()=>{
 expect(facultyManualGradeNeedsRefresh(409)).toBe(true);
 expect(facultyManualGradeNeedsRefresh(403)).toBe(false);
});