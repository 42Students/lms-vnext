import {it,expect} from "vitest";
import {facultyAiGradingEligible} from "@/modules/courses/faculty-ai-grading-eligibility";
it("only allows human-reviewed suggestions for ungraded TEXT submissions",()=>{
 const row={submissionType:"TEXT",textContent:"Written answer",gradingStatus:"NOT_GRADED",gradePublished:false};
 expect(facultyAiGradingEligible(row)).toBe(true);
 expect(facultyAiGradingEligible({...row,gradePublished:true})).toBe(false);
 expect(facultyAiGradingEligible({...row,gradingStatus:"GRADED"})).toBe(false);
 expect(facultyAiGradingEligible({...row,submissionType:"FILE"})).toBe(false);
 expect(facultyAiGradingEligible({...row,textContent:"  "})).toBe(false);
});
