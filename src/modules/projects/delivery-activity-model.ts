import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import type { RecordActivityEventInput } from "@/modules/activity/service";

export type ProjectDeliveryEvent = "DRAFT_CREATED" | "DRAFT_UPDATED" | "SUBMITTED" | "REVIEWED" | "LOCKED";
const deliveryEvents = {
  DRAFT_CREATED: ACTIVITY_EVENT_TYPES.PROJECTS_DELIVERY_DRAFT_CREATED,
  DRAFT_UPDATED: ACTIVITY_EVENT_TYPES.PROJECTS_DELIVERY_DRAFT_UPDATED,
  SUBMITTED: ACTIVITY_EVENT_TYPES.PROJECTS_DELIVERY_SUBMITTED,
  REVIEWED: ACTIVITY_EVENT_TYPES.PROJECTS_DELIVERY_REVIEWED,
  LOCKED: ACTIVITY_EVENT_TYPES.PROJECTS_DELIVERY_LOCKED,
} as const;
const deliveryDescriptions = {
  DRAFT_CREATED: "Project delivery draft created",
  DRAFT_UPDATED: "Project delivery draft revised",
  SUBMITTED: "Project delivery submitted for review",
  REVIEWED: "Project delivery review recorded",
  LOCKED: "Approved Project delivery locked",
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

/** Only call after an authorized, project-scoped history query. This is a
 * separate detailed view: do not copy feedback, actor names, or evidence URLs
 * into public activity metadata or generate file grants from legacy keys.
 */
export type ProjectDeliveryHistorySource = {
 projectId:string; submissionId:string; eventId:string;action:ProjectDeliveryEvent;
 occurredAt:Date; actorName:string|null; actorRole:string|null;
 version:number;feedback:string|null; evidenceFileIds:readonly string[];
};
export const PROJECT_SUBMISSION_HISTORY_MESSAGE="Project submission history retrieved";
export const PROJECT_DELIVERY_HISTORY_MESSAGE="Project delivery history retrieved";

export function projectDeliveryHistoryProjection(
 rows:readonly ProjectDeliveryHistorySource[], authorizedProjectId:string,
 options:{includeFeedback:boolean},
) {
 const ordered=rows.filter(row=>row.projectId===authorizedProjectId &&
  Number.isSafeInteger(row.version) && row.version>=0 &&
  row.occurredAt instanceof Date && Number.isFinite(row.occurredAt.getTime()))
  .sort((a,b)=>a.occurredAt.getTime()-b.occurredAt.getTime() ||
   a.version-b.version || a.eventId.localeCompare(b.eventId));
 return {
  message:PROJECT_DELIVERY_HISTORY_MESSAGE,
  emptyMessage:"No project delivery history recorded yet.",
  total:ordered.length,
  revisions:new Set(ordered.map(row=>row.version)).size,
  items:ordered.map(row=>({
   eventId:row.eventId,submissionId:row.submissionId,
   action:row.action,version:row.version,occurredAt:row.occurredAt,
   actorName:row.actorName,actorRole:row.actorRole,
   feedback:options.includeFeedback?row.feedback:null,
   // Grant only verified IDs using a separate authorized download endpoint.
   evidenceFileIds:row.evidenceFileIds.filter(id=>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)),
  })),
 };
}
