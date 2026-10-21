import dayjs from "dayjs";
import Api from "../ApiMethod";

export const getProjects = () => Api.get("/api/v1/projects/me");

export const getProjectsPage = ({ page = 0, size = 25, search, status, attention } = {}) => {
  const safePage = Math.max(0, Math.trunc(Number(page) || 0));
  const safeSize = Math.max(1, Math.min(50, Math.trunc(Number(size) || 25)));
  const params = new URLSearchParams({ page: String(safePage), size: String(safeSize) });
  if (search?.trim()) params.set("search", search.trim());
  if (status) params.set("status", status);
  if (attention) params.set("attention", attention);
  return Api.get(`/api/v1/projects/me/page?${params.toString()}`);
};

export const getProjectById = (projectId) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  return Api.get(`/api/v1/projects/${encodeURIComponent(projectId)}`);
};

export const updateProjectById = (projectId, payload) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  return Api.put(`/api/v1/projects/${encodeURIComponent(projectId)}`, payload);
};

export const updateProjectOverview = (projectId, payload) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  return Api.put(`/api/v1/projects/${encodeURIComponent(projectId)}/overview`, payload);
};

export const updateProjectSprints = (projectId, payload) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  return Api.put(`/api/v1/projects/${encodeURIComponent(projectId)}/sprints`, payload);
};

// Sprint lifecycle — deliberately separate from updateProjectSprints (the generic bulk-save
// used by the sprint editor): starting/completing a sprint has server-side rules (only one ACTIVE
// sprint at a time, dates freeze once ACTIVE, incomplete work returns to the backlog on
// completion) that must go through these dedicated endpoints, not a client-side field edit.
export const startProjectSprint = (projectId, sprintKey) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  return Api.post(`/api/v1/projects/${encodeURIComponent(projectId)}/sprints/${encodeURIComponent(sprintKey)}/start`);
};

export const completeProjectSprint = (projectId, sprintKey) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  return Api.post(`/api/v1/projects/${encodeURIComponent(projectId)}/sprints/${encodeURIComponent(sprintKey)}/complete`);
};

// State-machine audit finding: completing a sprint had no undo anywhere, unlike a release's
// ship/un-ship. Server-guarded to only a COMPLETED sprint, and only when no other sprint on the
// project is currently ACTIVE — see ProjectWorkspaceServiceImpl.reopenSprint.
export const reopenProjectSprint = (projectId, sprintKey) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  return Api.post(`/api/v1/projects/${encodeURIComponent(projectId)}/sprints/${encodeURIComponent(sprintKey)}/reopen`);
};

export const updateProjectTasks = (projectId, payload) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  return Api.put(`/api/v1/projects/${encodeURIComponent(projectId)}/tasks`, payload);
};

export const getProjectTasks = (projectId, { sprintScope } = {}) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  const query = sprintScope ? `?sprintScope=${encodeURIComponent(sprintScope)}` : "";
  return Api.get(`/api/v1/projects/${encodeURIComponent(projectId)}/tasks/items${query}`);
};

export const getProjectReleases = (projectId) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  return Api.get(`/api/v1/projects/${encodeURIComponent(projectId)}/releases`);
};

export const createProjectRelease = (projectId, payload) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  return Api.post(`/api/v1/projects/${encodeURIComponent(projectId)}/releases`, payload);
};

export const updateProjectRelease = (projectId, releaseKey, payload) => {
  if (!projectId || !releaseKey) {
    throw new Error("projectId and releaseKey are required");
  }
  return Api.put(`/api/v1/projects/${encodeURIComponent(projectId)}/releases/${encodeURIComponent(releaseKey)}`, payload);
};

export const removeProjectRelease = (projectId, releaseKey) => {
  if (!projectId || !releaseKey) {
    throw new Error("projectId and releaseKey are required");
  }
  return Api.delete(`/api/v1/projects/${encodeURIComponent(projectId)}/releases/${encodeURIComponent(releaseKey)}`);
};

export const shipProjectRelease = (projectId, releaseKey) => {
  if (!projectId || !releaseKey) {
    throw new Error("projectId and releaseKey are required");
  }
  return Api.post(`/api/v1/projects/${encodeURIComponent(projectId)}/releases/${encodeURIComponent(releaseKey)}/ship`);
};

export const unshipProjectRelease = (projectId, releaseKey) => {
  if (!projectId || !releaseKey) {
    throw new Error("projectId and releaseKey are required");
  }
  return Api.post(`/api/v1/projects/${encodeURIComponent(projectId)}/releases/${encodeURIComponent(releaseKey)}/unship`);
};

export const createProjectTask = (projectId, payload) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  return Api.post(`/api/v1/projects/${encodeURIComponent(projectId)}/tasks/items`, payload);
};

export const updateProjectTaskItem = (projectId, taskId, payload) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  if (!taskId) {
    throw new Error("taskId is required");
  }
  return Api.put(`/api/v1/projects/${encodeURIComponent(projectId)}/tasks/items/${encodeURIComponent(taskId)}`, payload);
};

export const deleteProjectTask = (projectId, taskId) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  if (!taskId) {
    throw new Error("taskId is required");
  }
  return Api.delete(`/api/v1/projects/${encodeURIComponent(projectId)}/tasks/items/${encodeURIComponent(taskId)}`);
};

export const getProjectTaskComments = (projectId, taskId) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  if (!taskId) {
    throw new Error("taskId is required");
  }
  return Api.get(`/api/v1/projects/${encodeURIComponent(projectId)}/tasks/items/${encodeURIComponent(taskId)}/comments`);
};

export const addProjectTaskComment = (projectId, taskId, payload) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  if (!taskId) {
    throw new Error("taskId is required");
  }
  return Api.post(`/api/v1/projects/${encodeURIComponent(projectId)}/tasks/items/${encodeURIComponent(taskId)}/comments`, payload);
};

export const reorderProjectTasks = (projectId, orderedTaskIds) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  return Api.put(`/api/v1/projects/${encodeURIComponent(projectId)}/tasks/reorder`, { orderedTaskIds });
};

export const updateProjectResources = (projectId, payload) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  return Api.put(`/api/v1/projects/${encodeURIComponent(projectId)}/resources`, payload);
};

export const downloadProjectResource = (projectId, resourceKey) => {
  if (!projectId || !resourceKey) {
    throw new Error("projectId and resourceKey are required");
  }
  return Api.get(`/api/v1/projects/${encodeURIComponent(projectId)}/resources/${encodeURIComponent(resourceKey)}/download`, {
    responseType: "blob",
  });
};

// #11: fromDate/toDate are plain "YYYY-MM-DD" strings -- the backend takes fromDate at the
// start of that day and toDate at the end of it, so callers never need to compute a time
// component themselves.
export const getProjectActivityFeed = (projectId, params = {}) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  return Api.get(`/api/v1/projects/${encodeURIComponent(projectId)}/activity/feed`, { params });
};

export const updateProjectDelivery = (projectId, payload) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  return Api.put(`/api/v1/projects/${encodeURIComponent(projectId)}/delivery`, payload);
};

export const getProjectDelivery = (projectId) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  return Api.get(`/api/v1/projects/${encodeURIComponent(projectId)}/delivery`);
};

export const getProjectDeliveryHistory = (projectId) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  return Api.get(`/api/v1/projects/${encodeURIComponent(projectId)}/delivery/history`);
};

export const getProjectReadiness = (projectId) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  return Api.get(`/api/v1/projects/${encodeURIComponent(projectId)}/readiness`);
};

export const getProjectSubmission = (projectId) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  return Api.get(`/api/v1/projects/${encodeURIComponent(projectId)}/submission`);
};

export const updateProjectSubmission = (projectId, payload) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  return Api.put(`/api/v1/projects/${encodeURIComponent(projectId)}/submission`, payload);
};

export const getProjectSubmissionHistory = (projectId) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  return Api.get(`/api/v1/projects/${encodeURIComponent(projectId)}/submission/history`);
};

// College-admin direct action on a stuck delivery (Accept/Request changes/Lock) — does not
// require the admin to be a project team member, unlike updateProjectSubmission above.
export const adminReviewProjectDelivery = (projectId, collegeId, payload) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  return Api.put(`/api/v1/admin/projects/${encodeURIComponent(projectId)}/delivery/review?collegeId=${encodeURIComponent(collegeId)}`, payload);
};

export const reviewProjectSubmission = (projectId, payload) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  return Api.post(`/api/v1/projects/${encodeURIComponent(projectId)}/submission/review`, payload);
};

export const updateProjectMeetings = (projectId, payload) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  return Api.put(`/api/v1/projects/${encodeURIComponent(projectId)}/meetings`, payload);
};

export const requestProjectMeeting = (projectId, payload) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  return Api.post(`/api/v1/projects/${encodeURIComponent(projectId)}/meetings/request`, payload);
};

// The requester withdraws their own still-pending request. Learners cannot use the full-array meetings save.
export const withdrawProjectMeetingRequest = (projectId, meetingKey) => {
  if (!projectId || !meetingKey) {
    throw new Error("projectId and meetingKey are required");
  }
  return Api.post(`/api/v1/projects/${encodeURIComponent(projectId)}/meetings/${encodeURIComponent(meetingKey)}/withdraw`);
};

export const searchProjectMemberCandidates = (projectId, { userType = "LEARNER", query = "", limit = 15 } = {}) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  const params = new URLSearchParams({
    userType,
    query: query || "",
    limit: String(Math.max(1, Math.min(50, Number(limit) || 15))),
  });
  return Api.get(`/api/v1/projects/${encodeURIComponent(projectId)}/member-candidates?${params.toString()}`);
};

export const addProjectMember = (projectId, payload) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  return Api.post(`/api/v1/projects/${encodeURIComponent(projectId)}/members`, payload);
};

export const updateProjectMember = (projectId, memberId, payload) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  if (!memberId) {
    throw new Error("memberId is required");
  }
  return Api.put(`/api/v1/projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(memberId)}`, payload);
};

export const removeProjectMember = (projectId, memberId) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  if (!memberId) {
    throw new Error("memberId is required");
  }
  return Api.post(`/api/v1/projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(memberId)}/remove`);
};

export const extractProjectsPayload = (response) => {
  const payload = response?.data?.data ?? response?.data ?? response ?? [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
};

export const extractProjectPayload = (response) => {
  const payload = response?.data?.data ?? response?.data ?? response ?? null;
  if (!payload || Array.isArray(payload)) return null;
  return payload;
};

const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null && value !== "");
const canonicalProjectId = (value) => firstDefined(value?.projectId, value?.id, value?.projectKey, value?.slug, "");

export const normalizePeople = (items) =>
  (Array.isArray(items) ? items : []).map((item) => ({
    ...item,
    id: firstDefined(item?.id, item?.userId, item?.memberId, ""),
    name: firstDefined(item?.name, item?.fullName, "Unnamed member"),
    role: firstDefined(item?.role, item?.title, "Member"),
    status: firstDefined(item?.status, item?.state, "Active"),
    imageUrl: firstDefined(item?.imageUrl, item?.profileImageUrl, item?.avatarUrl, item?.photoUrl, ""),
  }));

const normalizeTasks = (items) =>
  (Array.isArray(items) ? items : [])
    .map((item, index) => {
    // firstDefined(...) || fallback discards a legitimate id of 0 — firstDefined itself treats 0
    // as defined and returns it, but `0 || fallback` is falsy in JS and silently overwrites it
    // with the generated fallback string. Check explicitly instead of relying on `||`.
    const rawTaskId = firstDefined(item?.taskKey, item?.taskId, item?.id, item?._clientId);
    const taskId = rawTaskId !== undefined && rawTaskId !== null && rawTaskId !== ""
      ? rawTaskId
      : `task-${index}-${firstDefined(item?.title, item?.name, "task")}`;
    const due = firstDefined(item?.dueDate, item?.dueLabel, item?.deadline, "TBD");
    return {
      ...item,
      taskId,
      _clientId: item?._clientId || taskId,
      title: firstDefined(item?.title, item?.name, "Untitled task"),
      description: firstDefined(item?.description, item?.details, ""),
      assigneeId: firstDefined(item?.assigneeId, item?.assignedToId, null),
      assigneeName: firstDefined(item?.assigneeName, item?.assignedToName, ""),
      status: firstDefined(item?.status, item?.state, "To Do"),
      priority: firstDefined(item?.priority, item?.level, "Medium"),
      due,
      dueLabel: firstDefined(item?.dueLabel, item?.deadlineLabel, due),
      sprintKey: firstDefined(item?.sprintKey, item?.sprintId, null),
      sprintLabel: firstDefined(item?.sprintLabel, item?.sprintName, ""),
      // Stage 3: relative sizing. Null (not 0) means "not yet estimated" — the board/backlog
      // must be able to tell "no size" apart from "sized at zero".
      estimatePoints: item?.estimatePoints ?? null,
      taskType: firstDefined(item?.taskType, "STORY"),
      acceptanceCriteria: firstDefined(item?.acceptanceCriteria, ""),
      carriedOverFromSprintKey: firstDefined(item?.carriedOverFromSprintKey, null),
      boardOrder: Number.isFinite(Number(item?._boardOrder)) ? Number(item?._boardOrder) : index,
    };
  })
    .filter((item, index, list) => list.findIndex((candidate) => String(candidate.taskId) === String(item.taskId)) === index)
    .sort((left, right) => Number(left.boardOrder ?? 0) - Number(right.boardOrder ?? 0));

const normalizeResources = (items) =>
  (Array.isArray(items) ? items : []).map((item) => ({
    ...item,
    resourceId: firstDefined(item?.resourceKey, item?.resourceId, item?.id, ""),
    title: firstDefined(item?.title, item?.name, "Resource"),
    kind: firstDefined(item?.kind, item?.type, "File"),
    state: firstDefined(item?.state, item?.status, "Ready"),
  }));

// "Sprint" is the user-facing name (see the storage-layer comment on ProjectSprint.java) —
// sprintId/sprintKey stay as the field names here since that's the wire contract with the
// backend, but every UI surface reading this object should call it a sprint.
const normalizeSprints = (items) =>
  (Array.isArray(items) ? items : []).map((item) => ({
    ...item,
    sprintId: firstDefined(item?.sprintKey, item?.sprintId, item?.id, ""),
    title: firstDefined(item?.title, item?.name, "Sprint"),
    due: firstDefined(item?.dueDate, item?.dueLabel, item?.deadline, "TBD"),
    status: firstDefined(item?.status, item?.state, "Next"),
    progress: Number(firstDefined(item?.progress, item?.percent, 0) || 0),
    startDate: firstDefined(item?.startDate, null),
    endDate: firstDefined(item?.endDate, null),
    // PLANNED | ACTIVE | COMPLETED — see ProjectSprint.sprintState on the backend.
    sprintState: firstDefined(item?.sprintState, "PLANNED"),
    sprintNumber: item?.sprintNumber ?? null,
    goal: firstDefined(item?.goal, ""),
    releaseLabel: firstDefined(item?.releaseLabel, null),
  }));

// One canonical "what is due next?" calculation for every learner/mentor project surface.
// Project list and Overview previously disagreed because the list trusted ProjectWorkspace.dueLabel
// (free-text/manual) while Overview derived the nearest real unfinished task/sprint date. Keep that
// business meaning here beside normalization so every consumer gets the same answer.
const isProjectWorkComplete = (item, kind) => {
  const raw = kind === "SPRINT"
    ? firstDefined(item?.sprintState, item?.status, item?.state, "")
    : firstDefined(item?.status, item?.state, "");
  const normalized = String(raw || "").trim().toLowerCase();
  return normalized.includes("done") || normalized.includes("complete") || normalized.includes("closed") || normalized.includes("achiev");
};

const parseProjectDue = (value) => {
  if (!value || String(value).toLowerCase() === "tbd" || String(value).toLowerCase() === "no due date") return null;
  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = value.map(Number);
    if (!year || !month || !day) return null;
    const parsedArrayDate = dayjs(new Date(year, month - 1, day, hour, minute, second));
    return parsedArrayDate.isValid() ? parsedArrayDate : null;
  }
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
};

export const deriveProjectNextDue = (project) => {
  if (!project) return null;
  const sprintRows = Array.isArray(project?.resolvedSprints) ? project.resolvedSprints : Array.isArray(project?.sprints) ? project.sprints : [];
  const taskRows = Array.isArray(project?.resolvedTasks) ? project.resolvedTasks : Array.isArray(project?.tasks) ? project.tasks : [];
  const candidates = [
    ...sprintRows
      .filter((item) => !isProjectWorkComplete(item, "SPRINT"))
      .map((item) => ({
        type: "SPRINT",
        entityId: firstDefined(item?.sprintKey, item?.sprintId, item?.id, ""),
        title: firstDefined(item?.title, item?.name, "Sprint"),
        at: parseProjectDue(firstDefined(item?.dueDate, item?.due, item?.dueLabel, item?.deadline, null)),
      })),
    ...taskRows
      .filter((item) => !isProjectWorkComplete(item, "TASK"))
      .map((item) => ({
        type: "TASK",
        entityId: firstDefined(item?.taskKey, item?.taskId, item?.id, ""),
        title: firstDefined(item?.title, item?.name, "Task"),
        at: parseProjectDue(firstDefined(item?.dueDate, item?.due, item?.dueLabel, item?.deadline, null)),
      })),
  ]
    .filter((candidate) => candidate.at)
    .sort((left, right) => left.at.valueOf() - right.at.valueOf());

  const next = candidates[0];
  if (!next) return null;
  const today = dayjs().startOf("day");
  const dueDay = next.at.startOf("day");
  const dayDelta = dueDay.diff(today, "day");
  const state = dayDelta < 0 ? "overdue" : dayDelta <= 3 ? "dueSoon" : "scheduled";
  return {
    dueAt: next.at.toISOString(),
    label: next.at.format("DD MMM YYYY"),
    state,
    type: next.type,
    entityId: next.entityId,
    title: next.title,
  };
};

const normalizeMeetings = (items) =>
  (Array.isArray(items) ? items : []).map((item, index) => ({
    ...item,
    _clientId: firstDefined(item?._clientId, item?.meetingKey, item?.meetingId, item?.id, `meeting-${index}`),
    meetingKey: firstDefined(item?.meetingKey, item?.meetingId, item?.id, item?._clientId, `meeting-${index}`),
    title: firstDefined(item?.title, item?.name, "Meeting"),
    agenda: firstDefined(item?.agenda, item?.description, ""),
    notes: firstDefined(item?.notes, item?.meetingNotes, ""),
    outcome: firstDefined(item?.outcome, item?.result, ""),
    actionItems: Array.isArray(item?.actionItems) ? item.actionItems : [],
    meetingStatus: firstDefined(item?.meetingStatus, item?.status, item?.state, "SCHEDULED"),
    status: firstDefined(item?.status, item?.meetingStatus, item?.state, "SCHEDULED"),
    // Stage 6 ceremony type. GENERAL is the default for every meeting created before this
    // field existed, so old meetings keep rendering exactly as they did.
    meetingType: firstDefined(item?.meetingType, "GENERAL"),
    retroWentWell: firstDefined(item?.retroWentWell, ""),
    retroDidntGoWell: firstDefined(item?.retroDidntGoWell, ""),
    retroActions: firstDefined(item?.retroActions, ""),
    meetingDate: firstDefined(item?.meetingDate, item?.date, ""),
    startTime: firstDefined(item?.startTime, item?.time, ""),
    endTime: firstDefined(item?.endTime, ""),
    meetingUrl: firstDefined(item?.meetingUrl, item?.calendarEventId, item?.eventId, ""),
    linkedSprintKey: firstDefined(item?.linkedSprintKey, item?.sprintKey, item?.sprintId, ""),
    linkedSprintLabel: firstDefined(item?.linkedSprintLabel, item?.sprintLabel, ""),
    linkedTaskKey: firstDefined(item?.linkedTaskKey, item?.taskKey, item?.taskId, ""),
    linkedTaskLabel: firstDefined(item?.linkedTaskLabel, item?.taskLabel, ""),
    followUpAt: firstDefined(item?.followUpAt, item?.followUpDate, ""),
    followUpStatus: firstDefined(item?.followUpStatus, item?.followUpState, "OPEN"),
    followUpNotes: firstDefined(item?.followUpNotes, item?.followUpComment, ""),
    history: Array.isArray(item?.history) ? item.history : [],
  }));

const normalizeDeliveryHistory = (items) =>
  (Array.isArray(items) ? items : []).map((item, index) => ({
    ...item,
    _clientId: item?._clientId || item?.id || `delivery-history-${index}`,
    action: firstDefined(item?.action, item?.type, "UPDATE"),
    status: firstDefined(item?.status, item?.deliveryStatus, "Draft"),
    actorName: firstDefined(item?.actorName, item?.updatedByName, item?.submittedByName, "System"),
    actorType: firstDefined(item?.actorType, item?.updatedByType, item?.submittedByType, "SYSTEM"),
    createdAt: firstDefined(item?.createdAt, item?.timestamp, item?.updatedAt, ""),
  }));

const normalizeDelivery = (value) => {
  const delivery = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    ...delivery,
    status: firstDefined(delivery?.status, "Draft"),
    snapshot: firstDefined(delivery?.snapshot, ""),
    notes: firstDefined(delivery?.notes, ""),
    attachmentUrl: firstDefined(delivery?.attachmentUrl, delivery?.downloadUrl, ""),
    fileName: firstDefined(delivery?.fileName, ""),
    fileSize: Number(firstDefined(delivery?.fileSize, 0) || 0),
    fileMimeType: firstDefined(delivery?.fileMimeType, ""),
    storageKey: firstDefined(delivery?.storageKey, ""),
    sourceUrl: firstDefined(delivery?.sourceUrl, delivery?.downloadUrl, ""),
    feedback: firstDefined(delivery?.feedback, ""),
    reviewStatus: firstDefined(delivery?.reviewStatus, ""),
    submittedByName: firstDefined(delivery?.submittedByName, ""),
    reviewedByName: firstDefined(delivery?.reviewedByName, ""),
    revisionCount: Number(firstDefined(delivery?.revisionCount, delivery?.revisions, 0) || 0),
    attachments: Array.isArray(delivery?.attachments) ? delivery.attachments : [],
    version: delivery?.version ?? null,
    history: normalizeDeliveryHistory(delivery?.history),
  };
};

const normalizeActivity = (items) =>
  (Array.isArray(items) ? items : []).map((item, index) => {
    if (typeof item === "string") {
      return { _clientId: `activity-${index}`, text: item };
    }
    return {
      ...item,
      _clientId: item?._clientId || item?.id || `activity-${index}`,
      title: firstDefined(item?.title, item?.text, "Activity"),
      text: firstDefined(item?.text, item?.summary, item?.message, item?.title, String(item ?? "")),
      activityType: firstDefined(item?.activityType, item?.eventType, "Update"),
      sourceTab: firstDefined(item?.sourceTab, item?.tab, "activity"),
      actorName: firstDefined(item?.actorName, item?.actor, ""),
      when: firstDefined(item?.when, item?.occurredAt, item?.createdAt, dayjs().toISOString()),
      metadata: item?.metadata || item?.metadataJson || {},
    };
  });

export const normalizeProjectRecord = (project) => {
  if (!project) return null;
  const resolvedOverview = project?.resolvedOverview ?? {};
  const resolvedSprints = Array.isArray(project?.resolvedSprints) ? project.resolvedSprints : [];
  const resolvedTasks = Array.isArray(project?.resolvedTasks) ? project.resolvedTasks : [];
  const resolvedResources = Array.isArray(project?.resolvedResources) ? project.resolvedResources : [];
  const resolvedMeetingsList = Array.isArray(project?.resolvedMeetingsList) ? project.resolvedMeetingsList : [];
  const resolvedActivity = Array.isArray(project?.resolvedActivity) ? project.resolvedActivity : [];
  return {
    ...project,
    id: canonicalProjectId(project),
    title: firstDefined(project?.title, project?.projectTitle, "Project"),
    course: firstDefined(project?.course, project?.courseName, project?.module, "Project"),
    mentor: firstDefined(project?.mentor, project?.mentorName, project?.ownerName, "Mentor"),
    status: firstDefined(project?.status, project?.state, "Active"),
    phase: firstDefined(project?.phase, project?.stage, "In progress"),
    progress: Number(firstDefined(project?.progress, project?.completion, 0) || 0),
    blocker: firstDefined(project?.blocker, project?.blockedBy, null),
    nextAction: firstDefined(project?.nextAction, project?.currentAction, "Open workspace"),
    dueLabel: firstDefined(project?.dueLabel, project?.dueDateLabel, project?.deadlineLabel, "No due date"),
    nextDue: deriveProjectNextDue({ resolvedSprints, resolvedTasks }),
    members: normalizePeople(project?.resolvedMembers),
    resolvedMembers: normalizePeople(project?.resolvedMembers),
    resources: normalizeResources(resolvedResources),
    resolvedResources: normalizeResources(resolvedResources),
    sprints: normalizeSprints(resolvedSprints),
    resolvedSprints: normalizeSprints(resolvedSprints),
    tasks: normalizeTasks(resolvedTasks),
    resolvedTasks: normalizeTasks(resolvedTasks),
    tasksOpen: Number(resolvedTasks?.filter?.((task) => !String(task?.status || "").toLowerCase().includes("done")).length || 0),
    meetings: Number(resolvedMeetingsList?.length || 0),
    overview: resolvedOverview,
    resolvedOverview,
    resolvedDelivery: normalizeDelivery(project?.resolvedDelivery),
    meetingsList: normalizeMeetings(resolvedMeetingsList),
    resolvedMeetingsList: normalizeMeetings(resolvedMeetingsList),
    activity: normalizeActivity(resolvedActivity),
    resolvedActivity: normalizeActivity(resolvedActivity),
    readiness: project?.readiness ?? null,
    // Stage 1/5.
    startDate: project?.startDate ?? null,
    endDate: project?.endDate ?? null,
    sprintLengthWeeks: project?.sprintLengthWeeks ?? 4,
    estimationUnit: firstDefined(project?.estimationUnit, "POINTS"),
    sprintMetrics: Array.isArray(project?.sprintMetrics) ? project.sprintMetrics : [],
    carryOverRatePercent: project?.carryOverRatePercent ?? null,
  };
};

export const normalizeProjectsList = (projects) => (Array.isArray(projects) ? projects : []).map(normalizeProjectRecord);
