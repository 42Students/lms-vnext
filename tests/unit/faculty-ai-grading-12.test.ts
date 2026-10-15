import {it,expect} from "vitest";
import {facultyAiGradingReviewReceipt} from "@/modules/courses/faculty-ai-grading-audit";
const id="317458a6-9f8b-4f48-862b-91a270e12bb1";
it("creates redacted auditable review packet that cannot claim published grade",()=>{
 const p={reviewedAt:"2026-10-15T12:00:00Z",assignmentId:id,deliveryId:id,submissionId:id,submissionVersion:1,
 rubric:{title:"Essay",criteria:[{id:"a",title:"Reasoning",description:"Evidence",maxPoints:5}]},
 suggestion:{provider:"test",providerVersion:"1",confidence:"LOW",reviewRequired:true,feedback:"Potential response detail",
 evidence:[{criterionId:"a",earnedPoints:3,excerpt:"Sensitive submission",reason:"Partial"}]},
 reviewedEvidence:["a"],humanDraftPoints:2};
 const receipt=facultyAiGradingReviewReceipt(p);
 expect(receipt.gradeSaved).toBe(false);expect(receipt.gradePublished).toBe(false);
 expect(JSON.stringify(receipt)).not.toContain("Sensitive submission");
 expect(JSON.stringify(receipt)).not.toContain("Potential response detail");
 expect(()=>facultyAiGradingReviewReceipt({...p,reviewedEvidence:[]})).toThrow("HUMAN_REVIEW_INCOMPLETE");
});
