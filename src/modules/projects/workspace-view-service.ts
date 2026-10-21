import type { RequestContext } from "@/modules/identity/context";
import {and,eq,inArray,sql} from "drizzle-orm";
import { getDb } from "@/db/client";
import {projectTaskComments,projectTemplateVersions,projectMembers} from "@/db/schema/projects";
import {collegeMemberships,users,facultyProfiles} from "@/db/schema";
import {getProjectActivityPage} from "./activity-service";
import {ProjectsServiceError} from "./errors";
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
    readiness,
    meetingsRead,
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
    listProjectMeetings(context, projectId)
      .then(items=>({items,failed:false as const}))
      .catch(()=>({items:[] as Awaited<ReturnType<typeof listProjectMeetings>>,
        failed:true as const})),
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

  const meetings=meetingsRead.items;
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
  const [templateVersion] = await getDb().select({
    blueprint: projectTemplateVersions.blueprint,
    title: projectTemplateVersions.title,
    version: projectTemplateVersions.version,
  })
    .from(projectTemplateVersions)
    .where(eq(projectTemplateVersions.id, workspace.project.templateVersionId))
    .limit(1);

  const taskCommentCounts=await getDb().select({
    taskId:projectTaskComments.taskId,
    total:sql<number>`count(*)::int`,
  }).from(projectTaskComments).where(eq(projectTaskComments.projectId,workspace.project.id))
    .groupBy(projectTaskComments.taskId);

  // Legacy workspace delivery was a flat DTO. Project delivery is normalized
  // by submission version; this is a read-only compatibility projection.
  const latest = finalDelivery.submissions.at(-1) ?? null;
  const latestReview = latest
    ? finalDelivery.reviews.find(review=>review.submissionId===latest.id) ?? null
    : null;
  const actorMembershipIds = [...new Set([
    latest?.submittedByMembershipId,
    latestReview?.reviewedByMembershipId,
  ].filter((id):id is string=>typeof id==="string"))];
  const actorRows=actorMembershipIds.length
    ? await getDb().select({
      membershipId:collegeMemberships.id,displayName:users.displayName,
    }).from(collegeMemberships)
      .innerJoin(users,eq(users.id,collegeMemberships.userId))
      .where(and(inArray(collegeMemberships.id,actorMembershipIds),
        eq(collegeMemberships.collegeId,workspace.project.collegeId)))
    : [];
  const actorName=(id:string|null|undefined)=>
    actorRows.find(row=>row.membershipId===id)?.displayName ?? null;
  const latestTaskEvidence = new Map<string,(typeof taskSubmissions)[number]>();
  for(const submission of taskSubmissions){
    if(submission.submissionUrl.trim()){
      // Source list is ordered by task and version ascending.
      latestTaskEvidence.set(submission.taskId,submission);
    }
  }
  const completedTasks=workspace.tasks.filter(task=>task.status==="DONE"&&!task.deletedAt);
  const completedWithEvidence=completedTasks.filter(task=>latestTaskEvidence.has(task.id)).length;
  const resolvedDelivery=latest?{
    id:latest.id,
    version:latest.version,
    status:latest.status,
    reviewStatus:latestReview?.decision??latest.legacyReviewStatus??"PENDING",
    revisionCount:latest.legacyRevisionCount??
      Math.max(0,finalDelivery.submissions.filter(item=>item.version<=latest.version).length-1),
    submittedAt:latest.submittedAt,
    submittedBy:actorName(latest.submittedByMembershipId),
    reviewedAt:latestReview?.reviewedAt??null,
    reviewedBy:actorName(latestReview?.reviewedByMembershipId),
    feedback:latestReview?.feedback??null,
    attachments:latest.attachments,
    summary:latest.summary,
    sourceUrl:latest.sourceUrl,
    demoUrl:latest.demoUrl,
    notes:latest.notes,
  }:null;
  const resourceAudit=activity.filter(event=>event.eventType.startsWith("projects.resource."))
    .map(event=>({
      id:event.id,resourceId:event.subjectId,action:event.eventType,
      actorName:event.actorDisplayName??"Unknown actor",
      summary:event.summary,occurredAt:event.occurredAt,
    }));
  return {
    // Legacy resolvedOverview/Sprints/Tasks/MeetingsList are presentation-only.
    // The normalized workspace remains the source for all mutations.
    resolvedOverview:{id:workspace.project.id,summary:workspace.project.summary,
      status:workspace.project.status},
    resolvedSprints:workspace.sprints.map(item=>({
      id:item.id,title:item.title,status:item.status,sequence:item.sequence,
    })),
    resolvedTasks:workspace.tasks.map(item=>({
      id:item.id,title:item.title,status:item.status,sprintId:item.sprintId,
      submissionUrl:latestTaskEvidence.get(item.id)?.submissionUrl??null,
    })),
    resolvedMeetingsList:meetings.map(item=>({
      id:item.id,title:item.title,status:item.status,startsAt:item.startsAt,
      endsAt:item.endsAt,
    })),
    resolvedDelivery,
    readinessProofCoverage:{completedTasks:completedTasks.length,
      completedWithEvidence,percentage:completedTasks.length
        ?Math.round(100*completedWithEvidence/completedTasks.length):0},
    resourceAudit,
    taskCommentCounts,
    templateOverview: templateVersion?.blueprint.overview ?? null,
    templateTitle: templateVersion?.title ?? null,
    templateVersion: templateVersion?.version ?? null,
    ...workspace,
    members,
    mentorRoster,
    readiness,
    meetings,
    meetingsLoadError:meetingsRead.failed,
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

/** Legacy college-admin resource audit, scoped by the authenticated project
 * grant and its persisted college. Recipient-only learners cannot enumerate
 * managers' deleted/private resource history. */
export async function getProjectResourceAuditPage(
  context:RequestContext,projectId:string,
  cursor?:{beforeTime:string;beforeId:string},
){
  const access=await requireProjectReadAccess(context,projectId);
  if(access.access!=="ADMIN"&&access.access!=="MENTOR")
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const page=await getProjectActivityPage(context,projectId,{
    category:"RESOURCE",...(cursor??{}),
  });
  const last=page.events.at(-1);
  return {
    events:page.events.map(({cursorOccurredAt,...event})=>event),
    hasMore:page.hasMore,
    nextCursor:last&&page.hasMore?{beforeTime:last.cursorOccurredAt,beforeId:last.id}:null,
  };
}
