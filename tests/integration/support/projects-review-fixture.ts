import type { RequestContext } from "@/modules/identity/context";
import { submitProjectTask, reviewProjectTaskSubmission } from "@/modules/projects/task-submission-service";
import { assignProjectTask } from "@/modules/projects/task-assignment-service";
import { getProjectInstanceWorkspace } from "@/modules/projects/instance-service";

/** Uses real task assignment and current row timestamp rather than unassigned legacy shortcuts. */
export async function assignProjectTaskToLearner({learner,mentor,projectId,taskId}:{
  learner:RequestContext;mentor:RequestContext;projectId:string;taskId:string;
}){
  const membershipId=learner.membership?.id;
  if(!membershipId)throw new Error("Fixture needs an active learner membership");
  const workspace=await getProjectInstanceWorkspace(mentor,projectId);
  const task=workspace.tasks.find(candidate=>candidate.id===taskId);
  if(!task)throw new Error("Project task fixture unavailable");
  if(task.assigneeMembershipId===membershipId)return task;
  return assignProjectTask(mentor,projectId,taskId,{
    assigneeMembershipId:membershipId,
    expectedUpdatedAt:task.updatedAt.toISOString(),
  });
}

/** Real workflow: mentor assigns learner, learner submits, mentor approves. */
export async function approveProjectTaskThroughReview({
  learner,mentor,projectId,taskId,
}: {learner:RequestContext;mentor:RequestContext;projectId:string;taskId:string}){
  await assignProjectTaskToLearner({learner,mentor,projectId,taskId});
  const submission=await submitProjectTask(learner,projectId,taskId,{
    submissionUrl:"https://example.com/task-proof/"+encodeURIComponent(taskId),
  });
  const review=await reviewProjectTaskSubmission(mentor,projectId,taskId,submission.id,{
    decision:"APPROVED",confirmed:true,expectedUpdatedAt:submission.updatedAt.toISOString(),
  });
  return {submission,review};
}
