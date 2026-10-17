import {
  and,
  asc,
  eq,
  inArray,
  ne,
  or,
  sql,
  gt,
  lt,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { notifyActiveProjectMembers } from "./project-notification-service";
import {
  projectMeetings,
  projectInstances,
  projectSprints,
  projectTasks,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import {
  requireProjectLifecycleMutationAccess,
  requireProjectReadAccess,
} from "./access";
import { ProjectsServiceError } from "./errors";
import { isFutureProjectMeetingWindow } from "./meeting-window-policy";
import {mentorMeetingFacilitationSchema} from "./mentor-meeting-facilitation-model";
import {
  projectMeetingIdSchema,
  projectMeetingTransitionInputSchema,
  requestProjectMeetingInputSchema,
  scheduleProjectMeetingInputSchema,
  type ProjectMeetingTransitionInput,
  type RequestProjectMeetingInput,
  type ScheduleProjectMeetingInput,
} from "./validation";

function ensureMeetingProjectMutable(
  status: string,
) {
  if (status === "ARCHIVED" || status === "COMPLETED") {
    throw new ProjectsServiceError(
      "PROJECT_MEETING_INVALID_STATE",
    );
  }
}

async function loadMeeting(
  projectId: string,
  meetingIdInput: string,
) {
  const meetingId =
    projectMeetingIdSchema.parse(meetingIdInput);
  const [meeting] = await getDb()
    .select()
    .from(projectMeetings)
    .where(
      and(
        eq(projectMeetings.id, meetingId),
        eq(projectMeetings.projectId, projectId),
      ),
    )
    .limit(1);

  if (!meeting) {
    throw new ProjectsServiceError(
      "PROJECT_MEETING_NOT_FOUND",
    );
  }

  return meeting;
}

async function validateMeetingLinks(
  projectId: string,
  sprintId: string | null | undefined,
  taskId: string | null | undefined,
) {
  let sprint:
    | { id: string }
    | null = null;
  let task:
    | { id: string; sprintId: string | null }
    | null = null;

  if (sprintId) {
    const [row] = await getDb()
      .select({ id: projectSprints.id })
      .from(projectSprints)
      .where(
        and(
          eq(projectSprints.id, sprintId),
          eq(projectSprints.projectId, projectId),
        ),
      )
      .limit(1);
    sprint = row ?? null;

    if (!sprint) {
      throw new ProjectsServiceError(
        "PROJECT_MEETING_LINK_INVALID",
      );
    }
  }

  if (taskId) {
    const [row] = await getDb()
      .select({
        id: projectTasks.id,
        sprintId: projectTasks.sprintId,
      })
      .from(projectTasks)
      .where(
        and(
          eq(projectTasks.id, taskId),
          eq(projectTasks.projectId, projectId),
        ),
      )
      .limit(1);
    task = row ?? null;

    if (!task) {
      throw new ProjectsServiceError(
        "PROJECT_MEETING_LINK_INVALID",
      );
    }
  }

  if (
    sprint &&
    task &&
    task.sprintId !== sprint.id
  ) {
    throw new ProjectsServiceError(
      "PROJECT_MEETING_LINK_INVALID",
    );
  }

  return {
    linkedSprintId: sprintId ?? null,
    linkedTaskId: taskId ?? null,
  };
}

export async function listProjectMeetings(
  context: RequestContext,
  projectIdInput: string,
) {
  const scope =
    await requireProjectReadAccess(
      context,
      projectIdInput,
    );

  return getDb()
    .select()
    .from(projectMeetings)
    .where(
      and(eq(projectMeetings.projectId,scope.project.id),
        ...(scope.access==="LEARNER" ? [ne(projectMeetings.status,"DRAFT")] : [])),
    )
    .orderBy(
      asc(projectMeetings.startsAt),
      asc(projectMeetings.createdAt),
    );
}

export async function requestProjectMeeting(
  context: RequestContext,
  projectIdInput: string,
  rawInput: RequestProjectMeetingInput,
) {
  const scope = await requireProjectReadAccess(context, projectIdInput);
  ensureMeetingProjectMutable(scope.project.status);
  if (scope.access !== "LEARNER" || !context.membership) {
    throw new ProjectsServiceError("PROJECT_MEETING_ACCESS_DENIED");
  }
  const input = requestProjectMeetingInputSchema.parse(rawInput);
  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);
  if (!isFutureProjectMeetingWindow(startsAt, endsAt, Date.now())) {
    throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
  }
  return getDb().transaction(async (tx) => {
    const [project] = await tx.select({status:projectInstances.status})
      .from(projectInstances).where(eq(projectInstances.id, scope.project.id))
      .for("update").limit(1);
    if (!project) throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
    ensureMeetingProjectMutable(project.status);
    const [conflict] = await tx.select({id:projectMeetings.id}).from(projectMeetings)
      .where(and(eq(projectMeetings.projectId,scope.project.id),
        eq(projectMeetings.requestedByMembershipId,context.membership!.id),
        inArray(projectMeetings.status,["REQUESTED","SCHEDULED","RESCHEDULED"]),
        lt(projectMeetings.startsAt,endsAt),gt(projectMeetings.endsAt,startsAt)))
      .limit(1);
    if (conflict) throw new ProjectsServiceError("PROJECT_MEETING_SCHEDULE_CONFLICT");
    const [meeting] = await tx.insert(projectMeetings).values({
      projectId: scope.project.id,
      status: "REQUESTED", meetingType: "GENERAL",
      title: input.title, agenda: input.agenda ?? null,
      startsAt, endsAt, timeZone: input.timeZone,
      requestedByMembershipId: context.membership!.id,
      createdByUserId: context.user.id,
    }).returning();
    if(!meeting)throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
    const event=await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.PROJECTS_MEETING_DECIDED,
      collegeId:scope.collegeId,organizationId:scope.organizationId,
      subjectType:"project_meeting",subjectId:meeting.id,subjectLabel:meeting.title,
      summary:"Project meeting requested",
      metadata:{projectId:scope.project.id,meetingId:meeting.id,status:"REQUESTED"},
      groupKey:"project:"+scope.project.id+":meetings",
    });
    await notifyActiveProjectMembers(tx,event.id,{
      projectId:scope.project.id,collegeId:scope.collegeId,
      roles:["MENTOR"],exceptUserId:context.user.id,
      title:"Meeting requested",body:"A meeting has been requested for your project.",
      actionHref:"/mentor/projects/"+scope.project.id+"?tab=meetings",
    });
    await notifyActiveProjectMembers(tx,event.id,{
      projectId:scope.project.id,collegeId:scope.collegeId,
      roles:["LEARNER"],exceptUserId:context.user.id,
      title:"Meeting requested",body:"A meeting has been requested for your project.",
      actionHref:"/learn/projects/"+scope.project.id+"?tab=meetings",
    });
    return meeting;
  });
}

export async function scheduleProjectMeeting(
  context: RequestContext,
  projectIdInput: string,
  meetingIdInput: string | null,
  rawInput: ScheduleProjectMeetingInput,
) {
  const scope = await requireProjectLifecycleMutationAccess(context, projectIdInput);
  ensureMeetingProjectMutable(scope.project.status);
  const input = scheduleProjectMeetingInputSchema.parse(rawInput);
  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);
  if (!isFutureProjectMeetingWindow(startsAt, endsAt, Date.now())) {
    throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
  }
  const links = await validateMeetingLinks(scope.project.id,input.linkedSprintId,input.linkedTaskId);
  return getDb().transaction(async (tx) => {
    const [project] = await tx.select({status:projectInstances.status,updatedAt:projectInstances.updatedAt})
      .from(projectInstances).where(eq(projectInstances.id,scope.project.id))
      .for("update").limit(1);
    if (!project) throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
    ensureMeetingProjectMutable(project.status);
    const [existing] = meetingIdInput ? await tx.select().from(projectMeetings)
      .where(and(eq(projectMeetings.id,projectMeetingIdSchema.parse(meetingIdInput)),
        eq(projectMeetings.projectId,scope.project.id))).for("update").limit(1) : [null];
    if (meetingIdInput && !existing) throw new ProjectsServiceError("PROJECT_MEETING_NOT_FOUND");
    // MEN-projects-meetings-R07: reject obsolete mentor submissions before
    // making any meeting or activity changes inside the locked transaction.
    if (scope.access==="MENTOR" && (
      (existing && !input.expectedUpdatedAt) ||
      (!existing && !input.expectedProjectUpdatedAt)
    )) throw new ProjectsServiceError("PROJECT_MEETING_STALE_VERSION");
    if (existing && input.expectedUpdatedAt &&
      existing.updatedAt.getTime()!==new Date(input.expectedUpdatedAt).getTime())
      throw new ProjectsServiceError("PROJECT_MEETING_STALE_VERSION");
    if (!existing && input.expectedProjectUpdatedAt &&
      project.updatedAt.getTime()!==new Date(input.expectedProjectUpdatedAt).getTime())
      throw new ProjectsServiceError("PROJECT_MEETING_STALE_VERSION");
    if (existing && !["DRAFT","REQUESTED","SCHEDULED","RESCHEDULED"].includes(existing.status)) {
      throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
    }
    // Drafts have no learner-facing invitations and cannot silently replace
    // a requested or previously announced scheduled meeting.
    const targetStatus=input.status??(existing?.status==="RESCHEDULED"?"RESCHEDULED":"SCHEDULED");
    if ((!existing && targetStatus==="RESCHEDULED") ||
      (existing?.status!=="DRAFT" && existing && targetStatus==="DRAFT") ||
      (targetStatus==="RESCHEDULED" && existing &&
        existing.startsAt.getTime()===startsAt.getTime() &&
        existing.endsAt.getTime()===endsAt.getTime()) ||
      (targetStatus!=="DRAFT" && !input.meetingUrl))
      throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
    // MEN-projects-meetings-R02: prevent the organiser being double-booked
    // across multiple Project workspaces. The transaction-scoped lock makes
    // the check safe even when two different projects schedule concurrently.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${context.user.id}, 17))`);
    const [conflict] = await tx.select({id:projectMeetings.id}).from(projectMeetings)
      .where(and(or(
          eq(projectMeetings.projectId,scope.project.id),
          eq(projectMeetings.scheduledByUserId,context.user.id),
        ),
        inArray(projectMeetings.status,["SCHEDULED","RESCHEDULED"]),
        lt(projectMeetings.startsAt,endsAt),gt(projectMeetings.endsAt,startsAt),
        ...(existing ? [ne(projectMeetings.id,existing.id)] : [])))
      .limit(1);
    if (targetStatus!=="DRAFT" && conflict) throw new ProjectsServiceError("PROJECT_MEETING_SCHEDULE_CONFLICT");
    const values = {
      status: targetStatus,
      meetingType: input.meetingType ?? "GENERAL" as const,
      title: input.title, agenda: input.agenda ?? null,
      startsAt, endsAt, timeZone: input.timeZone,
      meetingUrl: targetStatus==="DRAFT"?null:input.meetingUrl,
      scheduledByUserId: targetStatus==="DRAFT"?null:context.user.id,
      scheduledByMembershipId:targetStatus==="DRAFT"?null:context.membership?.id ?? null,
      linkedSprintId: links.linkedSprintId, linkedTaskId: links.linkedTaskId,
      outcome: input.outcome===undefined?existing?.outcome??null:input.outcome,
      facilitation:mentorMeetingFacilitationSchema.parse(input.facilitation??existing?.facilitation??{}),
      cancellationNote: null, updatedAt: new Date(),
    };
    if (!existing) {
      const [created] = await tx.insert(projectMeetings).values({
        projectId:scope.project.id,...values,createdByUserId:context.user.id,
      }).returning();
      if(!created)throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
      await tx.update(projectInstances).set({updatedAt:new Date(Math.max(Date.now(),project.updatedAt.getTime()+1))})
        .where(eq(projectInstances.id,scope.project.id));
      if(targetStatus==="DRAFT")return created;
      const event=await recordActivityEventInTransaction(tx,context,{
        eventType:ACTIVITY_EVENT_TYPES.PROJECTS_MEETING_DECIDED,
        collegeId:scope.collegeId,organizationId:scope.organizationId,
        subjectType:"project_meeting",subjectId:created.id,subjectLabel:created.title,
        summary:"Project meeting scheduled",
        metadata:{projectId:scope.project.id,meetingId:created.id,status:targetStatus},
        groupKey:"project:"+scope.project.id+":meetings",
      });
      await notifyActiveProjectMembers(tx,event.id,{
        projectId:scope.project.id,collegeId:scope.collegeId,roles:["LEARNER"],
        exceptUserId:context.user.id,
        title:"Project meeting",body:"A project meeting has been scheduled.",
        actionHref:"/learn/projects/"+scope.project.id+"?tab=meetings",
      });
      await notifyActiveProjectMembers(tx,event.id,{
        projectId:scope.project.id,collegeId:scope.collegeId,roles:["MENTOR"],
        exceptUserId:context.user.id,
        title:"Project meeting",body:"A project meeting has been scheduled.",
        actionHref:"/mentor/projects/"+scope.project.id+"?tab=meetings",
      });
      return created;
    }
    const [updated] = await tx.update(projectMeetings).set(values)
      .where(and(eq(projectMeetings.id,existing.id),
        eq(projectMeetings.projectId,scope.project.id),
        inArray(projectMeetings.status,["DRAFT","REQUESTED","SCHEDULED","RESCHEDULED"])))
      .returning();
    if (!updated) throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
    await tx.update(projectInstances).set({updatedAt:new Date(Math.max(Date.now(),project.updatedAt.getTime()+1))})
      .where(eq(projectInstances.id,scope.project.id));
    if(targetStatus==="DRAFT")return updated;
    const event=await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.PROJECTS_MEETING_DECIDED,
      collegeId:scope.collegeId,organizationId:scope.organizationId,
      subjectType:"project_meeting",subjectId:updated.id,subjectLabel:updated.title,
      summary:"Project meeting scheduled",
      metadata:{projectId:scope.project.id,meetingId:updated.id,status:targetStatus},
      groupKey:"project:"+scope.project.id+":meetings",
    });
    await notifyActiveProjectMembers(tx,event.id,{
      projectId:scope.project.id,collegeId:scope.collegeId,roles:["LEARNER"],
      exceptUserId:context.user.id,
      title:"Project meeting",body:"A project meeting has been scheduled.",
      actionHref:"/learn/projects/"+scope.project.id+"?tab=meetings",
    });
    await notifyActiveProjectMembers(tx,event.id,{
      projectId:scope.project.id,collegeId:scope.collegeId,roles:["MENTOR"],
      exceptUserId:context.user.id,
      title:"Project meeting",body:"A project meeting has been scheduled.",
      actionHref:"/mentor/projects/"+scope.project.id+"?tab=meetings",
    });
    return updated;
  });
}

export async function transitionProjectMeeting(
  context: RequestContext,
  projectIdInput: string,
  meetingIdInput: string,
  rawInput: ProjectMeetingTransitionInput,
) {
  const scope =
    await requireProjectReadAccess(
      context,
      projectIdInput,
    );
  ensureMeetingProjectMutable(
    scope.project.status,
  );
  const input =
    projectMeetingTransitionInputSchema.parse(
      rawInput,
    );
  const meeting = await loadMeeting(
    scope.project.id,
    meetingIdInput,
  );

  if (input.action === "COMPLETE") {
    if (
      scope.access !== "ADMIN" &&
      scope.access !== "MENTOR"
    ) {
      throw new ProjectsServiceError(
        "PROJECT_MEETING_ACCESS_DENIED",
      );
    }

    if (meeting.status !== "SCHEDULED") {
      throw new ProjectsServiceError(
        "PROJECT_MEETING_INVALID_STATE",
      );
    }

    return getDb().transaction(async tx => {
    const [completed] = await tx
      .update(projectMeetings)
      .set({
        status: "COMPLETED",
        outcome: input.outcome ?? meeting.outcome ?? null,
        cancellationNote: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(projectMeetings.id, meeting.id),
          eq(projectMeetings.projectId,scope.project.id),
          eq(projectMeetings.status, "SCHEDULED"),
        ),
      )
      .returning();

    if (!completed) {
      throw new ProjectsServiceError(
        "PROJECT_MEETING_INVALID_STATE",
      );
    }

    const event=await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.PROJECTS_MEETING_DECIDED,
      collegeId:scope.collegeId,organizationId:scope.organizationId,
      subjectType:"project_meeting",subjectId:completed.id,subjectLabel:completed.title,
      summary:"Project meeting completed",
      metadata:{projectId:scope.project.id,meetingId:completed.id,status:"COMPLETED"},
      groupKey:"project:"+scope.project.id+":meetings",
    });
    await notifyActiveProjectMembers(tx,event.id,{
      projectId:scope.project.id,collegeId:scope.collegeId,
      roles:["LEARNER"],exceptUserId:context.user.id,
      title:"Project meeting completed",body:"The meeting "+completed.title+" has been completed.",
      actionHref:"/learn/projects/"+scope.project.id+"?tab=meetings",
    });
    await notifyActiveProjectMembers(tx,event.id,{
      projectId:scope.project.id,collegeId:scope.collegeId,
      roles:["MENTOR"],exceptUserId:context.user.id,
      title:"Project meeting completed",body:"The meeting "+completed.title+" has been completed.",
      actionHref:"/mentor/projects/"+scope.project.id+"?tab=meetings",
    });
    return completed;
    });
  }

  const learnerMayCancel =
    scope.access === "LEARNER" &&
    context.membership &&
    meeting.status === "REQUESTED" &&
    meeting.requestedByMembershipId ===
      context.membership.id;
  const managerMayCancel =
    scope.access === "ADMIN" ||
    scope.access === "MENTOR";

  if (
    !learnerMayCancel &&
    !managerMayCancel
  ) {
    throw new ProjectsServiceError(
      "PROJECT_MEETING_ACCESS_DENIED",
    );
  }

  if (
    meeting.status !== "REQUESTED" &&
    meeting.status !== "SCHEDULED"
  ) {
    throw new ProjectsServiceError(
      "PROJECT_MEETING_INVALID_STATE",
    );
  }

  return getDb().transaction(async tx => {
  const [cancelled] = await tx
    .update(projectMeetings)
    .set({
      status: "CANCELLED",
      cancellationNote: input.note ?? null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(projectMeetings.id, meeting.id),
        eq(
          projectMeetings.projectId,
          scope.project.id,
        ),
        inArray(projectMeetings.status, ["REQUESTED", "SCHEDULED"]),
        ...(scope.access === "LEARNER" ? [
          eq(projectMeetings.status, "REQUESTED"),
          eq(projectMeetings.requestedByMembershipId, context.membership!.id),
        ] : []),
      ),
    )
    .returning();

  if (!cancelled) {
    throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
  }
  const event=await recordActivityEventInTransaction(tx,context,{
    eventType:ACTIVITY_EVENT_TYPES.PROJECTS_MEETING_DECIDED,
    collegeId:scope.collegeId,organizationId:scope.organizationId,
    subjectType:"project_meeting",subjectId:cancelled.id,subjectLabel:cancelled.title,
    summary:"Project meeting cancelled",
    metadata:{projectId:scope.project.id,meetingId:cancelled.id,status:"CANCELLED"},
    groupKey:"project:"+scope.project.id+":meetings",
  });
  for (const role of ["LEARNER","MENTOR"] as const) {
    await notifyActiveProjectMembers(tx,event.id,{
      projectId:scope.project.id,collegeId:scope.collegeId,roles:[role],
      exceptUserId:context.user.id,
      title:"Project meeting",body:"A project meeting has been cancelled.",
      actionHref:(role==="MENTOR"?"/mentor/projects/":"/learn/projects/")+
        scope.project.id+"?tab=meetings",
    });
  }
  return cancelled;
  });
}
