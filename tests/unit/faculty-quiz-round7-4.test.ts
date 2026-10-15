import {it,expect} from "vitest";
import {facultyQuizAnswerSummary} from "@/modules/courses/faculty-quiz-builder-model";
it("distinguishes valid single and multi-choice answers from incomplete sets",()=>{
 expect(facultyQuizAnswerSummary({type:"SINGLE_CHOICE",options:[{correct:true},{correct:false}]})).toBe("1 of 2 answers marked correct");
 expect(facultyQuizAnswerSummary({type:"MULTIPLE_CHOICE",options:[{correct:true},{correct:true},{correct:false}]})).toBe("2 of 3 answers marked correct");
 expect(facultyQuizAnswerSummary({type:"MULTIPLE_CHOICE",options:[{correct:false},{correct:false}]})).toBe("0 of 2 answers marked correct");
});