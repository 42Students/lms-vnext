import {z} from "zod";
import {aiGradingSuggestionSchema,validateAiGradingSuggestion} from "./faculty-ai-grading-suggestion";
import {aiGradingRubricSchema} from "./faculty-ai-grading-model";
const aiGradingSourceSchema=z.object({
 assignmentId:z.string().uuid(),deliveryId:z.string().uuid(),submissionId:z.string().uuid(),
 submissionVersion:z.number().int().min(0),rubricTitle:z.string().min(1).max(200),
 provider:z.string().min(1).max(80),
}).strict();
const aiGradingResultSchema=z.object({
 suggestion:aiGradingSuggestionSchema.extend({proposedScore:z.number().int().min(0).max(10000)}),
 source:aiGradingSourceSchema,
}).strict();
/** Reject cross-submission or stale results even from an approved provider. */
export function verifyFacultyAiGradingResult(raw:unknown,scope:{
 assignmentId:string;deliveryId:string;submissionId:string;version:number;
},rubric:unknown,text:string){
 const result=aiGradingResultSchema.parse(raw);
 const r=aiGradingRubricSchema.parse(rubric);
 if(result.source.assignmentId!==scope.assignmentId||
    result.source.deliveryId!==scope.deliveryId||
    result.source.submissionId!==scope.submissionId||
    result.source.submissionVersion!==scope.version||
    result.source.rubricTitle!==r.title||
    result.source.provider!==result.suggestion.provider)
  throw new Error("AI_GRADING_SCOPE_MISMATCH");
 const checked=validateAiGradingSuggestion(result.suggestion,r,text);
 if(checked.proposedScore!==result.suggestion.proposedScore)
  throw new Error("AI_GRADING_SCORE_MISMATCH");
 return result;
}
