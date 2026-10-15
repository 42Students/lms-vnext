import {expect,it} from "vitest";
import {facultySubmissionReportEmptyState} from "@/modules/courses/faculty-assignment-submissions-model";
const base={filter:"ALL" as const,q:"",publication:"ALL" as const};
it("explains absence of submissions separately from filtered and unpublished grades",()=>{
 expect(facultySubmissionReportEmptyState(base,0).title).toContain("No submissions yet");
 expect(facultySubmissionReportEmptyState({...base,q:"Akh"},4).title).toContain("learner");
 expect(facultySubmissionReportEmptyState({...base,publication:"PUBLISHED"},4).title).toContain("published");
 expect(facultySubmissionReportEmptyState({...base,filter:"LATE"},4).title).toContain("late");
 expect(facultySubmissionReportEmptyState({...base,filter:"UNGRADED"},4).title).toContain("grading");
});