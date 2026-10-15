import {z} from "zod";
import {aiGradingRubricSchema} from "./faculty-ai-grading-model";
export const aiGradingEvidenceSchema=z.object({
 criterionId:z.string().max(60),earnedPoints:z.number().int().min(0).max(10000),
 excerpt:z.string().trim().min(3).max(400),reason:z.string().trim().min(5).max(1000),
}).strict();
export const aiGradingSuggestionSchema=z.object({
 provider:z.string().trim().min(1).max(80),providerVersion:z.string().max(80),
 confidence:z.enum(["LOW","MEDIUM","HIGH"]),reviewRequired:z.literal(true),
 feedback:z.string().trim().min(5).max(3000),evidence:z.array(aiGradingEvidenceSchema).min(1).max(20),
}).strict();
export type AiGradingSuggestion=z.infer<typeof aiGradingSuggestionSchema>;
export function validateAiGradingSuggestion(raw:unknown,rubric:unknown,submissionText:string){
 const r=aiGradingRubricSchema.parse(rubric);
 const result=aiGradingSuggestionSchema.parse(raw);
 const byId=new Map(r.criteria.map(c=>[c.id,c]));
 if(result.evidence.length!==r.criteria.length||new Set(result.evidence.map(e=>e.criterionId)).size!==r.criteria.length)
  throw new Error("SUGGESTION_CRITERIA_INCOMPLETE");
 let proposedScore=0;
 for(const entry of result.evidence){
  const criterion=byId.get(entry.criterionId);
  if(!criterion||entry.earnedPoints>criterion.maxPoints)throw new Error("SUGGESTION_SCORE_INVALID");
  if(!submissionText.includes(entry.excerpt))throw new Error("SUGGESTION_EVIDENCE_UNVERIFIED");
  proposedScore+=entry.earnedPoints;
 }
 return {...result,proposedScore};
}
