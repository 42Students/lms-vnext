import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import type { RecordActivityEventInput } from "@/modules/activity/service";

export type ProjectDeliveryEvent = "DRAFT_CREATED" | "DRAFT_UPDATED" | "SUBMITTED" | "REVIEWED";
const deliveryEvents = {
  DRAFT_CREATED: ACTIVITY_EVENT_TYPES.PROJECTS_DELIVERY_DRAFT_CREATED,
  DRAFT_UPDATED: ACTIVITY_EVENT_TYPES.PROJECTS_DELIVERY_DRAFT_UPDATED,
  SUBMITTED: ACTIVITY_EVENT_TYPES.PROJECTS_DELIVERY_SUBMITTED,
  REVIEWED: ACTIVITY_EVENT_TYPES.PROJECTS_DELIVERY_REVIEWED,
} as const;
const deliveryDescriptions = {
  DRAFT_CREATED: "Project delivery draft created",
  DRAFT_UPDATED: "Project delivery draft revised",
  SUBMITTED: "Project delivery submitted for review",
  REVIEWED: "Project delivery review recorded",
} as const;
/** Event metadata never contains URLs, learner identities, feedback or notes. */
export function projectDeliveryActivity(input: {
  action: ProjectDeliveryEvent; collegeId: string; organizationId: string;
  projectId: string; submissionId: string; version: number;
  decision?: "APPROVED" | "CHANGES_REQUESTED";
}): RecordActivityEventInput {
  return {
    eventType: deliveryEvents[input.action],
    collegeId: input.collegeId, organizationId: input.organizationId,
    subjectType: "project_submission", subjectId: input.submissionId,
    subjectLabel: "Project delivery", summary: deliveryDescriptions[input.action],
    metadata: { projectId: input.projectId, version: input.version,
      ...(input.action === "REVIEWED" && input.decision ? {decision:input.decision} : {}) },
    groupKey: "project:" + input.projectId + ":deliveries",
    ...(input.action !== "DRAFT_UPDATED"
      ? { dedupeKey: "project-delivery:" + input.submissionId + ":" + input.action }
      : {}),
  };
}
