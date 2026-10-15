import type { RequestContext } from "@/modules/identity/context";
import { submitProjectTask, reviewProjectTaskSubmission } from "@/modules/projects/task-submission-service";
/** Exercise the learner submission and mentor review, not the forbidden direct DONE transition. */
export async function approveProjectTaskThroughReview({
  learner, mentor, projectId, taskId,
}: {learner:RequestContext;mentor:RequestContext;projectId:string;taskId:string}) {
  const submission=await submitProjectTask(learner,projectId,taskId,{
    submissionUrl:"https://example.com/task-proof/"+encodeURIComponent(taskId),
  });
  const review=await reviewProjectTaskSubmission(mentor,projectId,taskId,submission.id,{
    decision:"APPROVED",confirmed:true,expectedUpdatedAt:submission.updatedAt.toISOString(),
  });
  return {submission,review};
}
