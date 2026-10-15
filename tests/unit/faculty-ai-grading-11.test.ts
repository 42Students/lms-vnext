import {it,expect} from "vitest";
import {facultyAiGradingEvidenceReviewed,toggleFacultyAiGradingReview} from "@/modules/courses/faculty-ai-grading-review";
it("requires explicit human review of every rubric evidence row before local acceptance",()=>{
 const evidence=[{criterionId:"a"},{criterionId:"b"}];
 expect(facultyAiGradingEvidenceReviewed(evidence,[])).toBe(false);
 expect(facultyAiGradingEvidenceReviewed(evidence,["a"])).toBe(false);
 expect(facultyAiGradingEvidenceReviewed(evidence,["a","b"])).toBe(true);
 expect(toggleFacultyAiGradingReview(["a"],"a")).toEqual([]);
 expect(facultyAiGradingEvidenceReviewed(evidence,["a","b","c"])).toBe(false);
});
