import type { RequestContext } from "@/modules/identity/context";
import {and,eq,sql} from "drizzle-orm";
import { getDb } from "@/db/client";
import {projectTaskComments,projectTemplateVersions,projectMembers} from "@/db/schema/projects";
import {collegeMemberships,users,facultyProfiles} from "@/db/schema";
import {requireProjectReadAccess} from "./access";
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
    mentorRoster,
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

  // MEN-projects-meetings-25: historical roster is mentor-only. Learners
  // retain the active roster and never receive former members' profile data.
  const access = await requireProjectReadAccess(context, projectId);
  const mentorRoster = access.access === "MENTOR"
    ? await getDb().select({
        id:projectMembers.id,
        membershipId:projectMembers.membershipId,
        role:projectMembers.role,
        roleLabel:projectMembers.roleLabel,
        isPrimary:projectMembers.isPrimary,
        endedAt:projectMembers.endedAt,
        memberStatus:collegeMemberships.status,
        accountStatus:users.platformStatus,
        displayName:users.displayName,
        academicTitle:facultyProfiles.academicTitle,
        bio:sql<string | null>`nullif(left(${facultyProfiles.profileDocument}->>'bio', 2000), '')`,
        linkedIn:sql<string | null>`nullif(left(${facultyProfiles.profileDocument}->>'linkedinUrl', 2048), '')`,
      }).from(projectMembers)
        .innerJoin(collegeMemberships,and(
          eq(collegeMemberships.id,projectMembers.membershipId),
          eq(collegeMemberships.collegeId,workspace.project.collegeId),
        ))
        .innerJoin(users,eq(users.id,collegeMemberships.userId))
        .leftJoin(facultyProfiles,eq(facultyProfiles.membershipId,projectMembers.membershipId))
        .where(eq(projectMembers.projectId,workspace.project.id))
        .orderBy(sql`case when ${projectMembers.role} = 'MENTOR' then 0 else 1 end`,
          sql`lower(coalesce(${users.displayName},''))`,projectMembers.startedAt)
    : [];

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
