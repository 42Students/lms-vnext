import {expect,it} from "vitest";
import {facultyAssessmentCanArchive} from "@/modules/courses/faculty-assessment-editor-model";
it("only offers supported non-destructive archival transitions",()=>{
 expect(facultyAssessmentCanArchive("ASSIGNMENT","DRAFT")).toBe(true);
 expect(facultyAssessmentCanArchive("ASSIGNMENT","PUBLISHED")).toBe(true);
 expect(facultyAssessmentCanArchive("ASSIGNMENT","ARCHIVED")).toBe(false);
 expect(facultyAssessmentCanArchive("QUIZ","CLOSED")).toBe(true);
 expect(facultyAssessmentCanArchive("QUIZ","ARCHIVED")).toBe(false);
 expect(facultyAssessmentCanArchive("QUIZ","UNKNOWN")).toBe(false);
});
