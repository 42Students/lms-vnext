import {it,expect} from "vitest";
import {validateAiGradingSuggestion} from "@/modules/courses/faculty-ai-grading-suggestion";
const rubric={title:"Short answer",criteria:[{id:"logic",title:"Reasoning",description:"Show evidence",maxPoints:5}]};
const base={provider:"test",providerVersion:"1",confidence:"LOW",reviewRequired:true,feedback:"Review carefully",evidence:[{criterionId:"logic",earnedPoints:3,excerpt:"Demonstrates logic",reason:"Partial understanding"}]};
it("never trusts scores or invented evidence from a provider",()=>{
 expect(validateAiGradingSuggestion(base,rubric,"Demonstrates logic in context").proposedScore).toBe(3);
 expect(()=>validateAiGradingSuggestion(base,rubric,"Different answer")).toThrow("SUGGESTION_EVIDENCE_UNVERIFIED");
 expect(()=>validateAiGradingSuggestion({...base,evidence:[{...base.evidence[0],earnedPoints:6}]},rubric,"Demonstrates logic")).toThrow("SUGGESTION_SCORE_INVALID");
});
