import type { RequestContext } from "@/modules/identity/context";
import {
  getProjectInstanceWorkspace,
} from "./instance-service";
import {
  listProjectMembers,
} from "./member-service";
import {
  getProjectReadiness,
} from "./readiness-service";
import {
  listProjectMeetings,
} from "./meeting-service";
import {
  listProjectSubmissions,
} from "./submission-service";
import {
  listProjectTaskSubmissionsForProject,
} from "./task-submission-service";
import {
  listProjectEvaluations,
} from "./evaluation-service";
import {
  listProjectActivity,
} from "./activity-service";

export async function getProjectWorkspaceView(
  context: RequestContext,
  projectId: string,
) {
  const [
    workspace,
    members,
    readiness,
    meetings,
    finalDelivery,
    taskSubmissions,
    evaluation,
    activity,
  ] = await Promise.all([
    getProjectInstanceWorkspace(
      context,
      projectId,
    ),
    listProjectMembers(context, projectId),
    getProjectReadiness(context, projectId),
    listProjectMeetings(context, projectId),
    listProjectSubmissions(context, projectId),
    listProjectTaskSubmissionsForProject(
      context,
      projectId,
    ),
    listProjectEvaluations(
      context,
      projectId,
    ),
    listProjectActivity(
      context,
      projectId,
    ),
  ]);

  return {
    ...workspace,
    members,
    readiness,
    meetings,
    finalDelivery,
    taskSubmissions,
    evaluation,
    activity,
  };
}
