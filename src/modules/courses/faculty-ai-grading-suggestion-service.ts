import "server-only";
import type {RequestContext} from "@/modules/identity/context";
import {CoursesServiceError} from "./errors";
import {getFacultyAiGradingReview} from "./faculty-ai-grading-service";
import {aiGradingRubricForMaximum} from "./faculty-ai-grading-model";
import {facultyAiGradingRequestSchema} from "./faculty-ai-grading-request";
import {
 disabledAiGradingProvider,requestAiGradingSuggestion,
 type AiGradingProvider,
} from "./faculty-ai-grading-provider";
import {validateAiGradingSuggestion} from "./faculty-ai-grading-suggestion";

/** Runs only after the canonical scoped review reader verifies current teaching scope.
 * Provider response remains ephemeral; this service NEVER writes or publishes grades. */
export async function getFacultyAiGradingSuggestion(
 context:RequestContext,raw:unknown,provider:AiGradingProvider=disabledAiGradingProvider,
){
 const input=facultyAiGradingRequestSchema.parse(raw);
 const data=await getFacultyAiGradingReview(context,input.selection);
 const selected=data.selected;
 if(!selected||!selected.eligible||!selected.textContent)
  throw new CoursesServiceError("ASSIGNMENT_SUBMISSION_NOT_FOUND");
 if(selected.version!==input.expectedSubmissionVersion)
  throw new CoursesServiceError("ASSIGNMENT_SUBMISSION_VERSION_CONFLICT");
 const rubric=aiGradingRubricForMaximum(input.rubric,data.assignment.maxPoints);
 // This is the entire model input. Do not forward membership, email, phone, or file URLs.
 const rawSuggestion=await requestAiGradingSuggestion(provider,{
  text:selected.textContent,rubric,maxPoints:data.assignment.maxPoints,
 });
 const suggestion=validateAiGradingSuggestion(rawSuggestion,rubric,selected.textContent);
 return {
  suggestion,
  source:{
   assignmentId:data.assignment.id,deliveryId:data.assignment.deliveryId,
   submissionId:selected.id,submissionVersion:selected.version,
   rubricTitle:rubric.title,provider:provider.id,
  },
 };
}
