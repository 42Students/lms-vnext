import {it,expect} from "vitest";
import {beginFacultyManualGradeOperation} from "@/modules/courses/faculty-manual-grade-receipt";
it("does not issue a second grade mutation while one request is in flight",()=>{
 const lock={current:false};expect(beginFacultyManualGradeOperation(lock)).toBe(true);
 expect(beginFacultyManualGradeOperation(lock)).toBe(false);
 lock.current=false;expect(beginFacultyManualGradeOperation(lock)).toBe(true);
});