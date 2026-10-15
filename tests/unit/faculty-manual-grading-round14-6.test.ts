import {it,expect} from "vitest";
import {beginFacultyManualGradeOperation} from "@/modules/courses/faculty-manual-grade-receipt";
it("a publish request is rejected while a score change holds the same lock",()=>{
 const shared={current:false};
 expect(beginFacultyManualGradeOperation(shared)).toBe(true);
 expect(beginFacultyManualGradeOperation(shared)).toBe(false);
 shared.current=false;
 expect(beginFacultyManualGradeOperation(shared)).toBe(true);
});