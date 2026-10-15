import {it,expect} from "vitest";
import {aiGradingRubricForMaximum,aiGradingSelectionSchema} from "@/modules/courses/faculty-ai-grading-model";
const id="317458a6-9f8b-4f48-862b-91a270e12bb1";
it("rejects invalid scope and rubric totals before any provider interaction",()=>{
 expect(aiGradingSelectionSchema.safeParse({assignmentId:id,deliveryId:id,page:0}).success).toBe(false);
 const rubric={title:"Essay",criteria:[{id:"reasoning",title:"Reasoning",description:"Correct reasoning",maxPoints:5}]};
 expect(aiGradingRubricForMaximum(rubric,5)).toEqual(rubric);
 expect(()=>aiGradingRubricForMaximum(rubric,10)).toThrow("RUBRIC_MAX_POINTS_MISMATCH");
 expect(()=>aiGradingRubricForMaximum({...rubric,criteria:[rubric.criteria[0],rubric.criteria[0]]},10)).toThrow();
});
