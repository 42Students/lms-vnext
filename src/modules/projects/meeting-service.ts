import {
  and,
  asc,
  eq,
  inArray,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  projectMeetings,
  projectSprints,
  projectTasks,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import {
  requireProjectLifecycleAccess,
  requireProjectReadAccess,
} from "./access";
import { ProjectsServiceError } from "./errors";
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
  if (status === "ARCHIVED") {
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
    | { id: string; sprintId: string }
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
      eq(
        projectMeetings.projectId,
        scope.project.id,
      ),
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
  const scope =
    await requireProjectReadAccess(
      context,
      projectIdInput,
    );
  ensureMeetingProjectMutable(
    scope.project.status,
  );

  if (
    scope.access !== "LEARNER" ||
    !context.membership
  ) {
    throw new ProjectsServiceError(
      "PROJECT_MEETING_ACCESS_DENIED",
    );
  }

  const input =
    requestProjectMeetingInputSchema.parse(
      rawInput,
    );

  const [meeting] = await getDb()
    .insert(projectMeetings)
    .values({
      projectId: scope.project.id,
      status: "REQUESTED",
      meetingType: "GENERAL",
      title: input.title,
      agenda: input.agenda ?? null,
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
      timeZone: input.timeZone,
      requestedByMembershipId:
        context.membership.id,
      createdByUserId: context.user.id,
    })
    .returning();

  return meeting;
}

export async function scheduleProjectMeeting(
  context: RequestContext,
  projectIdInput: string,
  meetingIdInput: string | null,
  rawInput: ScheduleProjectMeetingInput,
) {
  const scope =
    await requireProjectLifecycleAccess(
      context,
      projectIdInput,
    );
  ensureMeetingProjectMutable(
    scope.project.status,
  );

  const input =
    scheduleProjectMeetingInputSchema.parse(
      rawInput,
    );
  const links = await validateMeetingLinks(
    scope.project.id,
    input.linkedSprintId,
    input.linkedTaskId,
  );
  const values = {
    status: "SCHEDULED" as const,
    meetingType: input.meetingType ?? "GENERAL",
    title: input.title,
    agenda: input.agenda ?? null,
    startsAt: new Date(input.startsAt),
    endsAt: new Date(input.endsAt),
    timeZone: input.timeZone,
    meetingUrl: input.meetingUrl,
    scheduledByUserId: context.user.id,
    scheduledByMembershipId:
      context.membership?.id ?? null,
    linkedSprintId: links.linkedSprintId,
    linkedTaskId: links.linkedTaskId,
    outcome: null,
    cancellationNote: null,
    updatedAt: new Date(),
  };
  const db = getDb();

  if (!meetingIdInput) {
    const [meeting] = await db
      .insert(projectMeetings)
      .values({
        projectId: scope.project.id,
        ...values,
        createdByUserId: context.user.id,
      })
      .returning();

    return meeting;
  }

  const existing = await loadMeeting(
    scope.project.id,
    meetingIdInput,
  );

  if (
    existing.status !== "REQUESTED" &&
    existing.status !== "SCHEDULED"
  ) {
    throw new ProjectsServiceError(
      "PROJECT_MEETING_INVALID_STATE",
    );
  }

  const [meeting] = await db
    .update(projectMeetings)
    .set(values)
    .where(
      and(
        eq(projectMeetings.id, existing.id),
        eq(
          projectMeetings.projectId,
          scope.project.id,
        ),
        inArray(projectMeetings.status, ["REQUESTED", "SCHEDULED"]),
      ),
    )
    .returning();

  if (!meeting) {
    throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
  }
  return meeting;
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

    const [completed] = await getDb()
      .update(projectMeetings)
      .set({
        status: "COMPLETED",
        outcome: input.outcome ?? null,
        cancellationNote: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(projectMeetings.id, meeting.id),
          eq(
            projectMeetings.status,
            "SCHEDULED",
          ),
        ),
      )
      .returning();

    if (!completed) {
      throw new ProjectsServiceError(
        "PROJECT_MEETING_INVALID_STATE",
      );
    }

    return completed;
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

  const [cancelled] = await getDb()
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
  return cancelled;
}
