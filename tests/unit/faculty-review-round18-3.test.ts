import {expect,it} from "vitest";
import {facultyReviewRequestCurrent} from "@/modules/courses/faculty-submission-review-model";
it("recognizes only latest request and invalidates closed-drawer fetches",()=>{
 expect(facultyReviewRequestCurrent(8,8)).toBe(true);
 expect(facultyReviewRequestCurrent(8,9)).toBe(false);
 expect(facultyReviewRequestCurrent(8,7)).toBe(false);
 expect(facultyReviewRequestCurrent(1.5,1.5)).toBe(false);
});