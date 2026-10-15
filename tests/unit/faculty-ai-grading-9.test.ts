import {it,expect} from "vitest";
import {verifyFacultyAiGradingResult} from "@/modules/courses/faculty-ai-grading-result";
const id="317458a6-9f8b-4f48-862b-91a270e12bb1";
it("refuses a provider result for another learner submission",()=>{
 const rubric={title:"Essay",criteria:[{id:"reason",title:"Reasoning",description:"Evidence",maxPoints:5}]};
 const result={suggestion:{provider:"fake",providerVersion:"1",confidence:"LOW",reviewRequired:true,feedback:"Teacher review",proposedScore:3,evidence:[{criterionId:"reason",earnedPoints:3,excerpt:"Text evidence",reason:"Partial answer"}]},
 source:{assignmentId:id,deliveryId:id,submissionId:id,submissionVersion:1,rubricTitle:"Essay",provider:"fake"}};
 const scope={assignmentId:id,deliveryId:id,submissionId:id,version:1};
 expect(verifyFacultyAiGradingResult(result,scope,rubric,"Text evidence")).toEqual(result);
 expect(()=>verifyFacultyAiGradingResult({...result,source:{...result.source,submissionVersion:2}},scope,rubric,"Text evidence")).toThrow("AI_GRADING_SCOPE_MISMATCH");
});
