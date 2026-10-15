import {it,expect} from "vitest";
import {aiGradingRubricForMaximum,AiGradingRubricMaxMismatch} from "@/modules/courses/faculty-ai-grading-model";
it("identifies a rubric total mismatch as an invalid request, not server failure",()=>{
 const rubric={title:"Marking",criteria:[{id:"a",title:"Quality",description:"Evidence",maxPoints:5}]};
 expect(()=>aiGradingRubricForMaximum(rubric,6)).toThrow(AiGradingRubricMaxMismatch);
});
