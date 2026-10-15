import {expect,it} from "vitest";
import {facultySubmissionReviewFailure} from "@/modules/courses/faculty-submission-review-model";
it("uses non-leaking auth, scope, throttle and outage messages",()=>{
 expect(facultySubmissionReviewFailure(401)).toContain("session");
 expect(facultySubmissionReviewFailure(403)).toContain("Section");
 expect(facultySubmissionReviewFailure(404)).toContain("Section");
 expect(facultySubmissionReviewFailure(429)).toContain("Retry");
 expect(facultySubmissionReviewFailure(503)).toContain("unavailable");
 expect(facultySubmissionReviewFailure(422)).toBeNull();
});