import {it,expect} from "vitest";
import {facultyAiGradingHref,facultyAiGradingReportHref} from "@/modules/courses/faculty-ai-grading-links";
const id="317458a6-9f8b-4f48-862b-91a270e12bb1";
it("uses encoded exact assignment and Section scope for AI grading links",()=>{
 const href=facultyAiGradingHref({assignmentId:id,deliveryId:id,submissionId:id,page:2});
 expect(href).toContain("/ai-grading?");
 expect(href).toContain("submissionId="+id);
 expect(href).toContain("page=2");
 expect(facultyAiGradingReportHref({assignmentId:id,deliveryId:id,page:1})).toContain("deliveryId="+id);
});
