import {it,expect} from "vitest";
import {facultyManualGradeNeedsRefresh} from "@/modules/courses/faculty-manual-grade-receipt";
it("treats 409 as an optimistic submission collision",()=>{
 expect(facultyManualGradeNeedsRefresh(409)).toBe(true);
 expect(facultyManualGradeNeedsRefresh(422)).toBe(false);
 expect(facultyManualGradeNeedsRefresh(200)).toBe(false);
});