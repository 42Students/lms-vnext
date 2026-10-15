import {expect,it} from "vitest";
import {facultySubmissionReviewEmptyLabel} from "@/modules/courses/faculty-submission-review-model";
it("distinguishes absent work from fully graded and late filters",()=>{
 expect(facultySubmissionReviewEmptyLabel("ALL")).toContain("received");
 expect(facultySubmissionReviewEmptyLabel("UNGRADED")).toContain("waiting");
 expect(facultySubmissionReviewEmptyLabel("GRADED")).toContain("graded");
 expect(facultySubmissionReviewEmptyLabel("LATE")).toContain("late");
});