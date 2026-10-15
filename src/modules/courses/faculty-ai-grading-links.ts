import {aiGradingSelectionSchema,type AiGradingSelection} from "./faculty-ai-grading-model";
export function facultyAiGradingHref(raw:AiGradingSelection):string{
 const selected=aiGradingSelectionSchema.parse(raw);
 const params=new URLSearchParams({
  assignmentId:selected.assignmentId,deliveryId:selected.deliveryId,
 });
 if(selected.submissionId)params.set("submissionId",selected.submissionId);
 if(selected.page>1)params.set("page",String(selected.page));
 return "/ai-grading?"+params.toString();
}
export function facultyAiGradingReportHref(raw:AiGradingSelection):string{
 const selection=aiGradingSelectionSchema.parse(raw);
 return "/teacher/report/assignment/"+encodeURIComponent(selection.assignmentId)+
  "?deliveryId="+encodeURIComponent(selection.deliveryId);
}
