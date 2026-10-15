import type { RequestContext } from "@/modules/identity/context";
import { submitProjectTask, reviewProjectTaskSubmission } from "@/modules/projects/task-submission-service";
import {assignProjectTask} from "@/modules/projects/task-assignment-service";
import {getProjectInstanceWorkspace} from "@/modules/projects/instance-service";
/** Exercise the learner submission and mentor review, not the forbidden direct DONE transition. */
export async function approveProjectTaskThroughReview({
  learner, mentor, projectId, taskId,
}: {learner:RequestContext;mentor:RequestContext;projectId:string;taskId:string}) {
  const workspace=await getProjectInstanceWorkspace(mentor,projectId);
  const task=workspace.tasks.find(candidate=>candidate.id===taskId);
  if(!task)throw new Error("Project task fixture unavailable");
  await assignProjectTask(mentor,projectId,taskId,{
    assigneeMembershipId:learner.membership?.id??null,
    expectedUpdatedAt:task.updatedAt.toISOString(),
  });
  const submission=await submitProjectTask(learner,projectId,taskId,{
    submissionUrl:"https://example.com/task-proof/"+encodeURIComponent(taskId),
  });
  const review=await reviewProjectTaskSubmission(mentor,projectId,taskId,submission.id,{
    decision:"APPROVED",confirmed:true,expectedUpdatedAt:submission.updatedAt.toISOString(),
  });
  return {submission,review};
}
