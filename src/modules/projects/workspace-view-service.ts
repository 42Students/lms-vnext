import type { RequestContext } from "@/modules/identity/context";
import {eq,sql} from "drizzle-orm";
import { getDb } from "@/db/client";
import {projectTaskComments,projectTemplateVersions} from "@/db/schema/projects";
import { buildMentorWorkspaceEvidence } from "./mentor-workspace-evidence-model";
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

  // MEN-projects-meetings-17: use the version actually materialized into
  // this workspace, not the template's potentially newer live version.
  const [templateVersion] = await getDb().select({ blueprint: projectTemplateVersions.blueprint })
    .from(projectTemplateVersions)
    .where(eq(projectTemplateVersions.id, workspace.project.templateVersionId))
    .limit(1);

  const taskCommentCounts=await getDb().select({
    taskId:projectTaskComments.taskId,
    total:sql<number>`count(*)::int`,
  }).from(projectTaskComments).where(eq(projectTaskComments.projectId,workspace.project.id))
    .groupBy(projectTaskComments.taskId);

  return {
    taskCommentCounts,
    templateOverview: templateVersion?.blueprint.overview ?? null,
    ...workspace,
    members,
    readiness,
    meetings,
    finalDelivery,
    taskSubmissions,
    evaluation,
    activity,
    mentorEvidence: buildMentorWorkspaceEvidence({
      tasks: workspace.tasks,
      members,
      submissions: finalDelivery.submissions,
    }),
  };
}
