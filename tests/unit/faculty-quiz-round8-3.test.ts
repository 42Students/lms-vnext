import {it,expect} from "vitest";
import {facultyQuizRetryNeedsConfirmation} from "@/modules/courses/faculty-quiz-builder-model";
it("protects dirty metadata on a failed question-bank retry",()=>{
 expect(facultyQuizRetryNeedsConfirmation(true,false)).toBe(true);
 expect(facultyQuizRetryNeedsConfirmation(false,false)).toBe(false);
 expect(facultyQuizRetryNeedsConfirmation(true,true)).toBe(false);
});
