import {expect,it} from "vitest";
import {facultyAssessmentLimitEditable,facultyAssessmentLimitPatch} from "@/modules/courses/faculty-assessment-editor-model";
it("does not propose changes to published Quiz attempt limits",()=>{
 expect(facultyAssessmentLimitEditable("QUIZ","DRAFT")).toBe(true);
 expect(facultyAssessmentLimitEditable("QUIZ","PUBLISHED")).toBe(false);
 expect(facultyAssessmentLimitEditable("QUIZ","CLOSED")).toBe(false);
 expect(facultyAssessmentLimitPatch("QUIZ","DRAFT",3)).toEqual({maxAttempts:3});
 expect(facultyAssessmentLimitPatch("QUIZ","PUBLISHED",3)).toEqual({});
 expect(facultyAssessmentLimitPatch("QUIZ","CLOSED",3)).toEqual({});
 expect(facultyAssessmentLimitPatch("ASSIGNMENT","DRAFT",30)).toEqual({maxPoints:30});
});
