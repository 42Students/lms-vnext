import { expect,it } from "vitest";
import {facultySubmissionReviewMatchesScope,type FacultySubmissionReviewResponse} from "@/modules/courses/faculty-submission-review-model";
it("does not render a submission from another Section or assignment",()=>{
 const payload={items:[{assignmentId:"a",deliveryId:"d"}]} as FacultySubmissionReviewResponse;
 expect(facultySubmissionReviewMatchesScope(payload,"a","d")).toBe(true);
 expect(facultySubmissionReviewMatchesScope(payload,"b","d")).toBe(false);
 expect(facultySubmissionReviewMatchesScope(payload,"a","other")).toBe(false);
 expect(facultySubmissionReviewMatchesScope({items:[]} as unknown as FacultySubmissionReviewResponse,"a","d")).toBe(true);
});