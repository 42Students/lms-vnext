import type {LearnerAssignmentOverviewItem} from "@/components/courses/learner-assessment-overview";
export function learnerAssignmentMobileState(
  item:Pick<LearnerAssignmentOverviewItem,
    "submissionId"|"gradePublished"|"dueAt"|"submittedAt">,nowMs:number,
){
  if(item.submissionId){
    return item.gradePublished
      ? {label:"Grade published",detail:"Your submitted work has a published result",urgent:false}
      : {label:"Submitted",detail:"Waiting for faculty grading",urgent:false};
  }
  if(item.dueAt!==null){
    const due=Date.parse(item.dueAt);
    if(Number.isFinite(due)&&due<=nowMs){
      return {label:"Closed",detail:"Submissions are closed",urgent:true};
    }
    if(Number.isFinite(due)&&due>=nowMs&&due-nowMs<=86_400_000){
      return {label:"Due within 24 hours",detail:"Open the assignment to submit",urgent:true};
    }
  }
  if(item.dueAt===null)return {label:"Unavailable",detail:"Assignment deadline is not configured",urgent:true};
  return {label:"Not submitted",detail:"Open assignment instructions and submission",urgent:false};
}
