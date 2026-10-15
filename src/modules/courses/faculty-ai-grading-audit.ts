import {z} from "zod";
import {aiGradingSuggestionSchema} from "./faculty-ai-grading-suggestion";
import {aiGradingRubricSchema} from "./faculty-ai-grading-model";
export const facultyAiGradingAuditSchema=z.object({
 reviewedAt:z.iso.datetime({offset:true}),
 assignmentId:z.string().uuid(),deliveryId:z.string().uuid(),
 submissionId:z.string().uuid(),submissionVersion:z.number().int().min(0),
 provider:z.string().max(80),providerVersion:z.string().max(80),
 confidence:z.enum(["LOW","MEDIUM","HIGH"]),
 rubricTitle:z.string().max(200),
 criterionReviews:z.array(z.object({
  criterionId:z.string().max(60),suggestedPoints:z.number().int().min(0),
  humanConfirmed:z.literal(true),
 }).strict()).min(1).max(20),
 suggestedPoints:z.number().int().min(0),humanDraftPoints:z.number().int().min(0),
 gradeSaved:z.literal(false),gradePublished:z.literal(false),
}).strict();
/** Deliberately excludes raw submission, contact details, feedback, and PDF/file URLs.
 * This local receipt is NOT an immutable server-side audit event. */
export function facultyAiGradingReviewReceipt(raw:{
 reviewedAt:string;assignmentId:string;deliveryId:string;submissionId:string;submissionVersion:number;
 rubric:unknown;suggestion:unknown;reviewedEvidence:readonly string[];humanDraftPoints:number;
}){
 const rubric=aiGradingRubricSchema.parse(raw.rubric);
 const suggestion=aiGradingSuggestionSchema.parse(raw.suggestion);
 const allIds=rubric.criteria.map(row=>row.id);
 if(allIds.length!==raw.reviewedEvidence.length||
  !allIds.every(id=>raw.reviewedEvidence.includes(id)))
  throw new Error("HUMAN_REVIEW_INCOMPLETE");
 const score=suggestion.evidence.reduce((sum,row)=>sum+row.earnedPoints,0);
 const max=rubric.criteria.reduce((sum,row)=>sum+row.maxPoints,0);
 if(!Number.isInteger(raw.humanDraftPoints)||raw.humanDraftPoints<0||raw.humanDraftPoints>max)
  throw new Error("INVALID_HUMAN_DRAFT_POINTS");
 return facultyAiGradingAuditSchema.parse({
  reviewedAt:raw.reviewedAt,assignmentId:raw.assignmentId,deliveryId:raw.deliveryId,
  submissionId:raw.submissionId,submissionVersion:raw.submissionVersion,
  provider:suggestion.provider,providerVersion:suggestion.providerVersion,
  confidence:suggestion.confidence,rubricTitle:rubric.title,
  criterionReviews:suggestion.evidence.map(item=>({criterionId:item.criterionId,
   suggestedPoints:item.earnedPoints,humanConfirmed:true as const})),
  suggestedPoints:score,humanDraftPoints:raw.humanDraftPoints,
  gradeSaved:false as const,gradePublished:false as const,
 });
}
