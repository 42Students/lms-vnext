import {
  and,
  asc,
  eq,
  inArray,
  ilike,
  isNull,
  ne,
  isNotNull,
  or,
  sql,
  gt,
  lt,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {z} from "zod";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { notifyActiveProjectMembers } from "./project-notification-service";
import {queueMentorProjectEmailIntent} from "./mentor-project-email-outbox-service";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {assertPersistedProjectMutationActor} from "./persisted-mentor-mutation";
import {assertPersistedLearnerProjectMutation} from "./learner-mutation-guard";
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
import {mentorMeetingFacilitationSchema,emptyMentorMeetingFacilitation} from "./mentor-meeting-facilitation-model";
import {maySaveMentorMeetingStatus} from "./mentor-meeting-status-model";
import {
  projectMeetingIdSchema,
  projectMeetingTransitionInputSchema,
  requestProjectMeetingInputSchema,
  scheduleProjectMeetingInputSchema,
} from "./validation";

/** The old RepeatingItemEditor submitted up to 500 meetings in a single
 * section PUT with a meetingsToken. vNext uses item-level CAS per meeting.
 * This preflight is intentionally side-effect free: malformed batches return
 * row-indexed errors; no mutation can be made without first verifying the
 * original section token under the same project lock and applying every row
 * in one transaction. Never loop scheduleProjectMeeting (each call commits). */
const legacyMeetingBatchSchema=z.strictObject({
 expectedMeetingsToken:z.string().trim().min(1).max(256),
 meetings:z.array(z.strictObject({
  meetingId:projectMeetingIdSchema.nullable(),
  input:z.unknown(),
 })).max(500),
});
export function inspectLegacyMeetingBatch(raw:unknown){
 const parsed=legacyMeetingBatchSchema.safeParse(raw);
 if(!parsed.success)return {valid:false as const,issues:parsed.error.issues.map(issue=>({
  path:issue.path.join("."),message:issue.message,
 }))};
 const issues:Array<{path:string;message:string}>=[];
 for(const [index,row] of parsed.data.meetings.entries()){
  const meeting=scheduleProjectMeetingInputSchema.safeParse(row.input);
  if(!meeting.success)for(const issue of meeting.error.issues){
   issues.push({path:"meetings."+index+".input"+
    (issue.path.length?"."+issue.path.join("."):""),message:issue.message});
  }
 }
 return issues.length?{valid:false as const,issues}:{
  valid:true as const,count:parsed.data.meetings.length,
  expectedMeetingsToken:parsed.data.expectedMeetingsToken,
 };
}

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
        isNull(projectMeetings.deletedAt),
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

/** Resolve legacy template links inside the authorized project only.
 * UUID links continue to use validateMeetingLinks; never resolve across tenants. */
export async function resolveLegacyMeetingLinksByKey(
  context: RequestContext,
  projectIdInput: string,
  keys: { sprintKey?: string | null; taskKey?: string | null },
) {
  const scope = await requireProjectReadAccess(context, projectIdInput);
  const sprintKey = keys.sprintKey?.trim() || null;
  const taskKey = keys.taskKey?.trim() || null;
  if ((sprintKey && sprintKey.length > 120) || (taskKey && taskKey.length > 120)) {
    throw new ProjectsServiceError("PROJECT_MEETING_LINK_INVALID");
  }
  const [sprints, tasks] = await Promise.all([
    sprintKey
      ? getDb().select({ id: projectSprints.id }).from(projectSprints)
          .where(and(
            eq(projectSprints.projectId, scope.project.id),
            or(eq(projectSprints.templateKey, sprintKey), eq(projectSprints.legacySprintKey, sprintKey)),
          )).limit(2)
      : Promise.resolve([]),
    taskKey
      ? getDb().select({ id: projectTasks.id, sprintId: projectTasks.sprintId }).from(projectTasks)
          .where(and(
            eq(projectTasks.projectId, scope.project.id),
            or(eq(projectTasks.templateKey, taskKey), eq(projectTasks.legacyTaskKey, taskKey)),
          )).limit(2)
      : Promise.resolve([]),
  ]);
  if ((sprintKey && sprints.length !== 1) || (taskKey && tasks.length !== 1)) {
    throw new ProjectsServiceError("PROJECT_MEETING_LINK_INVALID");
  }
  const linkedSprintId = sprints[0]?.id ?? null;
  const linkedTaskId = tasks[0]?.id ?? null;
  if (linkedSprintId && linkedTaskId && tasks[0]?.sprintId !== linkedSprintId) {
    throw new ProjectsServiceError("PROJECT_MEETING_LINK_INVALID");
  }
  return { linkedSprintId, linkedTaskId };
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

export type ProjectMeetingListOptions = {
  q?: string;
  state?: "ALL" | "DRAFT" | "REQUESTED" | "SCHEDULED" | "RESCHEDULED" | "COMPLETED" | "CANCELLED";
  archive?: "ACTIVE" | "INACTIVE" | "ALL";
  page?: number;
  pageSize?: number;
};

export async function listProjectMeetings(
  context: RequestContext,
  projectIdInput: string,
  options: ProjectMeetingListOptions = {},
) {
  if (!(await resolveOptionalModuleAccess(context)).projects.enabled) {
    throw new ProjectsServiceError("PROJECT_MEETING_ACCESS_DENIED");
  }
  const scope = await requireProjectReadAccess(context, projectIdInput);
  const moderator = scope.access === "MENTOR" || scope.access === "ADMIN";
  const archive = options.archive ?? "ACTIVE";
  if (!moderator && (archive !== "ACTIVE" || options.state === "DRAFT")) {
    throw new ProjectsServiceError("PROJECT_MEETING_ACCESS_DENIED");
  }
  const search = (options.q ?? "").trim();
  if (search.length > 120 ||
      (options.page !== undefined && (!Number.isSafeInteger(options.page) || options.page < 1 || options.page > 100000)) ||
      (options.pageSize !== undefined && (!Number.isSafeInteger(options.pageSize) || options.pageSize < 1 || options.pageSize > 100))) {
    throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
  }
  const escaped = search.replace(/[\\%_]/g, "\\$&");
  const query = getDb().select().from(projectMeetings)
    .where(and(
      eq(projectMeetings.projectId, scope.project.id),
      archive === "ACTIVE" ? isNull(projectMeetings.deletedAt) :
        archive === "INACTIVE" ? isNotNull(projectMeetings.deletedAt) : undefined,
      options.state && options.state !== "ALL"
        ? eq(projectMeetings.status, options.state) : undefined,
      search ? or(
        ilike(projectMeetings.title, "%" + escaped + "%"),
        ilike(projectMeetings.agenda, "%" + escaped + "%"),
      ) : undefined,
      ...(!moderator ? [
        ne(projectMeetings.status, "DRAFT"),
        or(
          ne(projectMeetings.status, "CANCELLED"),
          isNotNull(projectMeetings.requestedByMembershipId),
          isNotNull(projectMeetings.scheduledByUserId),
        )!,
      ] : []),
    ))
    .orderBy(
      asc(projectMeetings.startsAt),
      asc(projectMeetings.createdAt),
      asc(projectMeetings.id),
    );
  const rows = options.page !== undefined || options.pageSize !== undefined
    ? await query.limit(options.pageSize ?? 25).offset(((options.page ?? 1) - 1) * (options.pageSize ?? 25))
    : await query;
  return moderator ? rows :
    rows.map(row => ({ ...row, facilitation: emptyMentorMeetingFacilitation }));
}

export async function requestProjectMeeting(
  context: RequestContext,
  projectIdInput: string,
  rawInput: unknown,
) {
  if(!(await resolveOptionalModuleAccess(context)).projects.enabled)
    throw new ProjectsServiceError("PROJECT_MEETING_ACCESS_DENIED");
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
    const [project] = await tx.select({status:projectInstances.status,deletedAt:projectInstances.deletedAt})
      .from(projectInstances).where(and(
        eq(projectInstances.id, scope.project.id),
        eq(projectInstances.collegeId,scope.collegeId),
      )).for("update").limit(1);
    if (!project||project.deletedAt) throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
    ensureMeetingProjectMutable(project.status);
    // The page-time learner grant can be revoked before this transaction obtains
    // the project lock. Verify the live user, college role and Project assignment
    // while holding the locks, before reading conflicts or creating notifications.
    await assertPersistedLearnerProjectMutation(tx,context,scope.project.id,scope.collegeId);
    if (!isFutureProjectMeetingWindow(startsAt,endsAt,Date.now()))
      throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
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
    await queueMentorProjectEmailIntent(tx,{
      sourceEventId:event.id,projectId:scope.project.id,
      collegeId:scope.collegeId,organizationId:scope.organizationId,
      kind:"MEETING_REQUEST",excludeUserId:context.user.id,
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
  rawInput: unknown,
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
    const [project] = await tx.select({
      status:projectInstances.status,updatedAt:projectInstances.updatedAt,
      deletedAt:projectInstances.deletedAt,
    }).from(projectInstances).where(and(
        eq(projectInstances.id,scope.project.id),
        eq(projectInstances.collegeId,scope.collegeId),
      )).for("update").limit(1);
    if (!project||project.deletedAt)
      throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
    ensureMeetingProjectMutable(project.status);
    await assertPersistedProjectMutationActor(tx,context,scope);
    // A future window validated before a contended row lock may be in the past
    // by the time the write starts; the server clock inside the lock is final.
    if (!isFutureProjectMeetingWindow(startsAt,endsAt,Date.now()))
      throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
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
    const timeChanged=existing!==null && existing!==undefined && (
      existing.startsAt.getTime()!==startsAt.getTime() ||
      existing.endsAt.getTime()!==endsAt.getTime()
    );
    // A direct call to the legacy scheduling service must obey the same
    // audited state machine as the Mentor UI. In particular, a changed time
    // cannot silently remain SCHEDULED; only SCHEDULED -> RESCHEDULED is valid.
    if (!maySaveMentorMeetingStatus(existing?.status??null,targetStatus,timeChanged) ||
      (targetStatus!=="DRAFT" && !(input.meetingUrl??existing?.meetingUrl)))
      throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
    // MEN-projects-meetings-R02: prevent the organiser being double-booked
    // across multiple Project workspaces. The transaction-scoped lock makes
    // the check safe even when two different projects schedule concurrently.
    const organiserId=existing?.scheduledByUserId??context.user.id;
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${organiserId}, 17))`);
    const [conflict] = await tx.select({id:projectMeetings.id}).from(projectMeetings)
      .where(and(or(
          eq(projectMeetings.projectId,scope.project.id),
          eq(projectMeetings.scheduledByUserId,organiserId),
        ),
        inArray(projectMeetings.status,["SCHEDULED","RESCHEDULED"]),
        lt(projectMeetings.startsAt,endsAt),gt(projectMeetings.endsAt,startsAt),
        ...(existing ? [ne(projectMeetings.id,existing.id)] : [])))
      .limit(1);
    if (targetStatus!=="DRAFT" && conflict) throw new ProjectsServiceError("PROJECT_MEETING_SCHEDULE_CONFLICT");
    // Preserve existing links when a private facilitation edit omits them.
    const effectiveSprintId=input.linkedSprintId===undefined
      ? existing?.linkedSprintId??null : links.linkedSprintId;
    const effectiveTaskId=input.linkedTaskId===undefined
      ? existing?.linkedTaskId??null : links.linkedTaskId;
    if(effectiveSprintId && effectiveTaskId){
      const [linkedTask]=await tx.select({sprintId:projectTasks.sprintId})
        .from(projectTasks).where(and(eq(projectTasks.id,effectiveTaskId),
          eq(projectTasks.projectId,scope.project.id))).limit(1);
      if(!linkedTask||linkedTask.sprintId!==effectiveSprintId)
        throw new ProjectsServiceError("PROJECT_MEETING_LINK_INVALID");
    }
    const values = {
      status: targetStatus,
      meetingType: input.meetingType ?? existing?.meetingType ?? "GENERAL" as const,
      title: input.title, agenda: input.agenda ?? null,
      startsAt, endsAt, timeZone: input.timeZone,
      meetingUrl: targetStatus==="DRAFT"?null:(input.meetingUrl??existing?.meetingUrl??null),
      scheduledByUserId: targetStatus==="DRAFT"?null:organiserId,
      scheduledByMembershipId:targetStatus==="DRAFT"?null:(existing?.scheduledByMembershipId??context.membership?.id??null),
      linkedSprintId: effectiveSprintId, linkedTaskId: effectiveTaskId,
      outcome: input.outcome===undefined?existing?.outcome??null:input.outcome,
      // Keep structured attendee/action/retro keys when an older client
      // submits just free-text facilitation fields. No flattening into notes.
      facilitation:mentorMeetingFacilitationSchema.parse({
       ...(existing?.facilitation??{}),...(input.facilitation??{}),
      }),
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
    // Only facilitator-owned notes changed; do not announce an unchanged meeting.
    const facilitatorOnlyChange=existing.status===targetStatus
      && existing.title===values.title
      && (existing.agenda??null)===(values.agenda??null)
      && existing.meetingType===values.meetingType
      && existing.startsAt.getTime()===values.startsAt.getTime()
      && existing.endsAt.getTime()===values.endsAt.getTime()
      && existing.timeZone===values.timeZone
      && (existing.meetingUrl??null)===(values.meetingUrl??null)
      && (existing.linkedSprintId??null)===(values.linkedSprintId??null)
      && (existing.linkedTaskId??null)===(values.linkedTaskId??null)
      && (existing.outcome??null)===(values.outcome??null);
    const [updated] = await tx.update(projectMeetings).set(values)
      .where(and(eq(projectMeetings.id,existing.id),
        eq(projectMeetings.projectId,scope.project.id),
        inArray(projectMeetings.status,["DRAFT","REQUESTED","SCHEDULED","RESCHEDULED"])))
      .returning();
    if (!updated) throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
    await tx.update(projectInstances).set({updatedAt:new Date(Math.max(Date.now(),project.updatedAt.getTime()+1))})
      .where(eq(projectInstances.id,scope.project.id));
    if(targetStatus==="DRAFT" || facilitatorOnlyChange)return updated;
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
  rawInput: unknown,
) {
  if(!(await resolveOptionalModuleAccess(context)).projects.enabled)
    throw new ProjectsServiceError("PROJECT_MEETING_ACCESS_DENIED");
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
  // New callers can send the version displayed in the UI. Older clients
  // remain supported, but the pre-transaction read is still pinned to the
  // exact persisted version by an optimistic compare-and-swap below.
  if(input.expectedUpdatedAt &&
     new Date(input.expectedUpdatedAt).getTime()!==meeting.updatedAt.getTime())
    throw new ProjectsServiceError("PROJECT_MEETING_STALE_VERSION");

  if (input.action === "COMPLETE") {
    if (
      scope.access !== "ADMIN" &&
      scope.access !== "MENTOR"
    ) {
      throw new ProjectsServiceError(
        "PROJECT_MEETING_ACCESS_DENIED",
      );
    }

    if (!["SCHEDULED","RESCHEDULED"].includes(meeting.status)) {
      throw new ProjectsServiceError(
        "PROJECT_MEETING_INVALID_STATE",
      );
    }

    return getDb().transaction(async tx => {
    const [project]=await tx.select({status:projectInstances.status,deletedAt:projectInstances.deletedAt})
      .from(projectInstances).where(and(
        eq(projectInstances.id,scope.project.id),
        eq(projectInstances.collegeId,scope.collegeId),
      )).for("update").limit(1);
    if(!project||project.deletedAt)throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
    ensureMeetingProjectMutable(project.status);
    await assertPersistedProjectMutationActor(tx,context,scope);
    const [completed] = await tx
      .update(projectMeetings)
      .set({
        status: "COMPLETED",
        outcome: input.outcome ?? meeting.outcome ?? null,
        cancellationNote: null,
        updatedAt: new Date(Math.max(Date.now(),meeting.updatedAt.getTime()+1)),
      })
      .where(
        and(
          eq(projectMeetings.id, meeting.id),
          eq(projectMeetings.projectId,scope.project.id),
          eq(projectMeetings.status,meeting.status),
          sql`date_trunc('milliseconds', ${projectMeetings.updatedAt}) = ${meeting.updatedAt.toISOString()}::timestamptz`,
        ),
      )
      .returning();

    if (!completed) {
      throw new ProjectsServiceError("PROJECT_MEETING_STALE_VERSION");
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
    meeting.status !== "DRAFT" &&
    meeting.status !== "REQUESTED" &&
    meeting.status !== "SCHEDULED" && meeting.status !== "RESCHEDULED"
  ) {
    throw new ProjectsServiceError(
      "PROJECT_MEETING_INVALID_STATE",
    );
  }

  return getDb().transaction(async tx => {
  const [project]=await tx.select({status:projectInstances.status,deletedAt:projectInstances.deletedAt})
    .from(projectInstances).where(and(
      eq(projectInstances.id,scope.project.id),
      eq(projectInstances.collegeId,scope.collegeId),
    )).for("update").limit(1);
  if(!project||project.deletedAt)throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
  ensureMeetingProjectMutable(project.status);
  if(scope.access==="MENTOR"||scope.access==="ADMIN")
    await assertPersistedProjectMutationActor(tx,context,scope);
  else
    await assertPersistedLearnerProjectMutation(tx,context,scope.project.id,scope.collegeId);
  const [cancelled] = await tx
    .update(projectMeetings)
    .set({
      status: "CANCELLED",
      cancellationNote: input.note ?? null,
      updatedAt: new Date(Math.max(Date.now(),meeting.updatedAt.getTime()+1)),
    })
    .where(
      and(
        eq(projectMeetings.id, meeting.id),
        eq(
          projectMeetings.projectId,
          scope.project.id,
        ),
        eq(projectMeetings.status,meeting.status),
        sql`date_trunc('milliseconds', ${projectMeetings.updatedAt}) = ${meeting.updatedAt.toISOString()}::timestamptz`,
        ...(scope.access === "LEARNER" ? [
          eq(projectMeetings.status, "REQUESTED"),
          eq(projectMeetings.requestedByMembershipId, context.membership!.id),
        ] : []),
      ),
    )
    .returning();

  if (!cancelled) {
    throw new ProjectsServiceError("PROJECT_MEETING_STALE_VERSION");
  }
  // MEN-projects-meetings-27: drafts are never sent to learners or the wider team.
  if (meeting.status === "DRAFT") return cancelled;
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
