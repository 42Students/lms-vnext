/**
 * Pure planner for NSRIT stage 2b-ii, projects part: templates and versions,
 * workspaces (project instances) with releases, sprints, tasks, members,
 * comments, resources, meetings and final deliveries.
 *
 * vNext projects are always created from a template version, so a legacy
 * workspace whose own template is test data (or missing) gets a synthetic,
 * ARCHIVED "legacy import" template built from the workspace's own loaded
 * sprints, tasks and resources. Files (project resource uploads, delivery
 * attachments) belong to a later stage: only their counts are recorded.
 */
import { istNaiveToUtcIso, nsritId } from "./common";
import { junkChildNameReasons, junkReasonsFor, type JunkReason } from "./filters";
import { str, toIntRoundHalfUp, type Row } from "./mappers";
import {
  asJsonObject,
  mapDeliveryStatus,
  mapMeetingStatus,
  mapMeetingType,
  mapReleaseStatus,
  mapResourceVisibility,
  mapSprintState,
  mapTaskPriority,
  mapTaskStatus,
  mapTaskType,
  mapWorkspaceStatus,
  normalizeTimeZone,
  projectKey,
  publicHttpUrl,
  textList,
  uniqueKey,
} from "./mappers-2bii";
import { item2bii } from "./plan-placements";
import type { Collector, PersonData, Plan, Planned, Reason } from "./plan";
import type { Snapshot } from "./snapshot";
import { projectTemplateBlueprintSchema } from "../../../src/modules/projects/validation";
import { projectCompletionPercent } from "../../../src/modules/projects/progress-percentage-policy";

const idOf = (row: Row) => String(row.id);
const ist = (value: unknown) => istNaiveToUtcIso(str(value));
const isTrue = (value: unknown) => value === 1 || value === "1" || value === true;
const clip = (value: unknown, max: number): string | null => {
  const text = str(value);
  return text ? text.slice(0, max) : null;
};

// --------------------------------------------------------------------- types

export type Blueprint = Record<string, unknown>;
export type TemplateData = {
  slug: string;
  title: string;
  summary: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  currentVersion: number;
  publishedVersion: number | null;
  createdByUserId: string;
  archivedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};
export type TemplateVersionData = {
  templateId: string;
  version: number;
  title: string;
  summary: string | null;
  blueprint: Blueprint;
  changeNote: string | null;
  createdByUserId: string;
  createdAt: string | null;
};
export type TemplateAssignmentData = {
  templateId: string;
  templateVersionId: string;
  collegeId: string;
  assignedByUserId: string;
  assignedAt: string;
  revokedAt: string | null;
};
export type InstanceData = {
  collegeId: string;
  templateId: string;
  templateVersionId: string;
  slug: string;
  title: string;
  summary: string | null;
  status: "PLANNED" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
  createdByUserId: string;
  materializedAt: string | null;
  archivedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};
export type ReleaseData = {
  projectId: string;
  templateKey: string;
  title: string;
  description: string | null;
  sequence: number;
  status: "PLANNED" | "IN_PROGRESS" | "SHIPPED";
  createdAt: string | null;
  updatedAt: string | null;
};
export type SprintData = {
  projectId: string;
  releaseId: string;
  templateKey: string;
  title: string;
  description: string | null;
  sequence: number;
  status: "PLANNED" | "ACTIVE" | "COMPLETED";
  createdAt: string | null;
  updatedAt: string | null;
};
export type TaskData = {
  projectId: string;
  sprintId: string;
  templateKey: string;
  title: string;
  description: string | null;
  acceptanceCriteria: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "TODO" | "IN_PROGRESS" | "BLOCKED" | "IN_REVIEW" | "DONE";
  sequence: number;
  assigneeMembershipId: string | null;
  legacyAssigneeId: number | null;
  legacyAssigneeType: string | null;
  legacyAssigneeName: string | null;
  blockerReason: string | null;
  dueDate: string | null;
  estimatePoints: number | null;
  taskType: "STORY" | "BUG" | "CHORE" | "SPIKE" | null;
  createdAt: string | null;
  updatedAt: string | null;
};
export type TaskSubmissionData = {
  projectId: string;
  taskId: string;
  version: number;
  submittedByMembershipId: string;
  submissionUrl: string;
  note: string | null;
  status: "SUBMITTED";
  submittedAt: string;
};
export type CommentData = {
  projectId: string;
  taskId: string;
  authorMembershipId: string;
  body: string;
  createdAt: string | null;
  updatedAt: string | null;
};
export type MemberData = {
  projectId: string;
  membershipId: string;
  role: "LEARNER" | "MENTOR";
  roleKind: "LEARNER" | "MENTOR" | "CO_MENTOR";
  canMutate: boolean;
  isPrimary: boolean;
  roleLabel: string | null;
  startedAt: string;
  endedAt: string | null;
  createdByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};
export type ResourceData = {
  projectId: string;
  templateKey: string | null;
  title: string;
  description: string | null;
  url: string | null;
  required: boolean;
  sequence: number;
  status: "ACTIVE" | "ARCHIVED";
  visibility: "TEAM" | "MENTOR_ONLY";
  createdAt: string | null;
  updatedAt: string | null;
};
export type MeetingData = {
  projectId: string;
  status: "REQUESTED" | "SCHEDULED" | "COMPLETED" | "CANCELLED";
  meetingType: "GENERAL" | "PLANNING" | "STANDUP" | "REVIEW" | "RETRO";
  title: string;
  agenda: string | null;
  startsAt: string;
  endsAt: string;
  timeZone: string;
  meetingUrl: string | null;
  requestedByMembershipId: string | null;
  scheduledByUserId: string | null;
  scheduledByMembershipId: string | null;
  linkedSprintId: string | null;
  linkedTaskId: string | null;
  outcome: string | null;
  createdByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};
export type SubmissionData = {
  projectId: string;
  version: number;
  status: "DRAFT" | "SUBMITTED" | "CHANGES_REQUESTED" | "APPROVED";
  summary: string;
  sourceUrl: string | null;
  demoUrl: string | null;
  notes: string | null;
  createdByMembershipId: string;
  submittedByMembershipId: string | null;
  submittedAt: string | null;
  lockedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};
export type ReviewData = {
  projectId: string;
  submissionId: string;
  decision: "CHANGES_REQUESTED" | "APPROVED";
  feedback: string | null;
  reviewedByUserId: string;
  reviewedByMembershipId: string | null;
  reviewedAt: string;
};
export type DeliveryEventData = {
  projectId: string;
  submissionId: string;
  eventType: "LOCKED" | "REOPENED";
  actorMembershipId: string;
  reason: string;
  occurredAt: string;
};

export type ProjectFacts = {
  projects: {
    project: string;
    storedProgress: number | null;
    tasks: number;
    doneTasks: number;
    sprints: number;
    completedSprints: number;
    derivedPercent: number | null;
  }[];
};

export type ProjectsPlan = {
  templates: Planned<TemplateData>[];
  templateVersions: Planned<TemplateVersionData>[];
  templateAssignments: Planned<TemplateAssignmentData>[];
  instances: Planned<InstanceData>[];
  releases: Planned<ReleaseData>[];
  sprints: Planned<SprintData>[];
  tasks: Planned<TaskData>[];
  taskSubmissions: Planned<TaskSubmissionData>[];
  comments: Planned<CommentData>[];
  members: Planned<MemberData>[];
  resources: Planned<ResourceData>[];
  meetings: Planned<MeetingData>[];
  submissions: Planned<SubmissionData>[];
  reviews: Planned<ReviewData>[];
  deliveryEvents: Planned<DeliveryEventData>[];
  facts: ProjectFacts;
  unmappedCounts: Record<string, number>;
};

type Person = Planned<PersonData>;

// ---------------------------------------------------------- blueprint helpers


/** Tolerant conversion of the legacy denormalised JSON arrays to the vNext blueprint; invalid pieces are dropped and counted. */
export function buildBlueprint(
  input: { overview: unknown; sprints: unknown; tasks: unknown; resources: unknown },
  note: (key: string, n?: number) => void,
): Blueprint {
  const overviewObj = asJsonObject(input.overview);
  const arr = (value: unknown): Row[] => (Array.isArray(value) ? (value.filter((v) => v && typeof v === "object") as Row[]) : []);
  const used = new Set<string>();
  const sprintKeyMap = new Map<string, string>();
  const releaseKey = "release-1";
  const sprints = arr(input.sprints).map((s, index) => {
    const raw = str(s.key) ?? str(s.sprintKey) ?? str(s.id) ?? str(s.title) ?? `sprint-${index + 1}`;
    const key = uniqueKey(projectKey(raw, `sprint-${index + 1}`), used);
    sprintKeyMap.set(String(raw), key);
    return { key, releaseKey, title: (str(s.title) ?? str(s.name) ?? `Sprint ${index + 1}`).slice(0, 200), sequence: index, ...(str(s.goal) ?? str(s.description) ? { description: (str(s.goal) ?? str(s.description))!.slice(0, 4000) } : {}) };
  });
  const taskUsed = new Set<string>();
  const sequenceInSprint = new Map<string, number>();
  const tasks: Record<string, unknown>[] = [];
  arr(input.tasks).forEach((tk, index) => {
    const sprintRaw = str(tk.sprintKey) ?? str(tk.sprint);
    const sprintKey = sprintRaw ? sprintKeyMap.get(sprintRaw) : sprints[0]?.key;
    if (!sprintKey) {
      note("templateTaskDroppedNoSprint");
      return;
    }
    const key = uniqueKey(projectKey(str(tk.key) ?? str(tk.taskKey) ?? str(tk.id) ?? str(tk.title), `task-${index + 1}`), taskUsed);
    const seq = sequenceInSprint.get(sprintKey) ?? 0;
    sequenceInSprint.set(sprintKey, seq + 1);
    tasks.push({
      key,
      sprintKey,
      title: (str(tk.title) ?? `Task ${index + 1}`).slice(0, 200),
      priority: mapTaskPriority(tk.priority),
      sequence: seq,
      ...(str(tk.description) ? { description: str(tk.description)!.slice(0, 4000) } : {}),
      ...(str(tk.acceptanceCriteria) ? { acceptanceCriteria: str(tk.acceptanceCriteria)!.slice(0, 4000) } : {}),
    });
  });
  const resUsed = new Set<string>();
  const resources: Record<string, unknown>[] = [];
  arr(input.resources).forEach((r, index) => {
    const title = str(r.title) ?? str(r.name);
    if (!title) return;
    const url = publicHttpUrl(r.url ?? r.resourceUrl).url;
    resources.push({
      key: uniqueKey(projectKey(str(r.key) ?? str(r.id) ?? title, `resource-${index + 1}`), resUsed),
      title: title.slice(0, 200),
      ...(url ? { url } : {}),
      required: isTrue(r.required),
      sequence: index,
    });
  });
  const blueprint: Blueprint = {
    overview: {
      ...(str(overviewObj.goal) ? { goal: str(overviewObj.goal)!.slice(0, 2000) } : {}),
      ...(str(overviewObj.description) ? { description: str(overviewObj.description)!.slice(0, 4000) } : {}),
      deliverables: textList(overviewObj.deliverables),
    },
    releases: sprints.length ? [{ key: releaseKey, title: "Release 1", sequence: 0 }] : [],
    sprints,
    tasks,
    resources,
  };
  const parsed = projectTemplateBlueprintSchema.safeParse(blueprint);
  if (parsed.success) return parsed.data as Blueprint;
  note("templateBlueprintReset");
  return projectTemplateBlueprintSchema.parse({ overview: { deliverables: [] }, releases: [], sprints: [], tasks: [], resources: [] }) as Blueprint;
}

// -------------------------------------------------------------------- planner

export type ProjectsOptions = { asOf: Date };

export function buildProjectsPlan(
  snapshot: Snapshot,
  base: Plan,
  collector: Collector,
  options: ProjectsOptions,
  notes: Record<string, number>,
): ProjectsPlan {
  const t = snapshot.tables;
  if (!t.project_workspace) throw new Error("Snapshot lacks stage 2b-ii table project_workspace: re-run the export");
  const rows = (name: string): Row[] => t[name] ?? [];
  const c = collector;
  const note = (key: string, n = 1) => {
    notes[key] = (notes[key] ?? 0) + n;
  };
  const asOfIso = options.asOf.toISOString();
  const collegeId = base.college.newId;

  const person = new Map<string, Person>();
  for (const p of base.people) person.set(`${p.legacyType}:${p.legacyId}`, p);
  const faculties = base.people.filter((p) => p.legacyType === "faculty");
  const fallback =
    faculties.find((p) => p.data.roles.includes("COLLEGE_ADMIN")) ?? faculties.find((p) => p.data.roles.includes("MENTOR")) ?? faculties[0];
  if (!fallback) throw new Error("No faculty account is loaded: stage 2a must provide one to attribute project actions");
  const find = (id: unknown, type: unknown): Person | undefined => {
    if (id === null || id === undefined || String(id) === "") return undefined;
    const hint = (str(type) ?? "").toUpperCase();
    const order = hint.startsWith("LEARNER") || hint === "STUDENT" ? ["learner", "faculty"] : ["faculty", "learner"];
    for (const kind of order) {
      const hit = person.get(`${kind}:${String(id)}`);
      if (hit) return hit;
    }
    return undefined;
  };
  const userOf = (id: unknown, type: unknown): string => {
    const p = find(id, type);
    if (p) return p.newId;
    note("projectActorFallback");
    return fallback.newId;
  };

  // ============================================================== templates
  c.stat("project_template", rows("project_template").length);
  c.stat("project_template_version", rows("project_template_version").length);
  c.stat("project_template_college", rows("project_template_college").length);
  const templates: Planned<TemplateData>[] = [];
  const templateVersions: Planned<TemplateVersionData>[] = [];
  const templateAssignments: Planned<TemplateAssignmentData>[] = [];
  const templateByLegacy = new Map<string, Planned<TemplateData>>();
  const versionsByTemplate = new Map<string, Planned<TemplateVersionData>[]>();
  const slugs = new Set<string>();
  const versionRows = new Map<string, Row[]>();
  for (const v of rows("project_template_version")) versionRows.set(String(v.template_id), [...(versionRows.get(String(v.template_id)) ?? []), v]);

  for (const row of [...rows("project_template")].sort((a, b) => Number(a.id) - Number(b.id))) {
    const reasons: JunkReason[] = junkReasonsFor({ names: [str(row.title), str(row.slug), str(row.course_label)], isDeleted: row.is_deleted });
    if (reasons.length) {
      c.reject("project_template", row, reasons[0] as Reason);
      continue;
    }
    const lifecycle = (str(row.lifecycle_status) ?? "DRAFT").toUpperCase();
    if (!["DRAFT", "PUBLISHED", "ARCHIVED"].includes(lifecycle)) {
      c.reject("project_template", row, "UNKNOWN_ENUM");
      continue;
    }
    const title = clip(row.title, 300);
    if (!title) {
      c.reject("project_template", row, "INVALID_VALUE");
      continue;
    }
    const slug = uniqueKey(projectKey(`nsrit-${idOf(row)}-${str(row.slug) ?? title}`, `nsrit-${idOf(row)}`, 96), slugs, 96);
    const creator = userOf(row.created_by, "FACULTY");
    const legacyVersions = (versionRows.get(idOf(row)) ?? []).filter((v) => !isTrue(v.is_deleted));
    const versionNumbers = [...new Set(legacyVersions.map((v) => Number(v.template_version)).filter((n) => Number.isInteger(n) && n >= 1))].sort((a, b) => a - b);
    const currentVersion = Math.max(Number(row.template_version) || 1, versionNumbers[versionNumbers.length - 1] ?? 1);
    const publishedVersions = legacyVersions.filter((v) => (str(v.lifecycle_status) ?? "").toUpperCase() === "PUBLISHED").map((v) => Number(v.template_version));
    const publishedVersion = lifecycle === "PUBLISHED" ? Math.min(Math.max(...publishedVersions, 1), currentVersion) : null;
    const planned = item2bii(
      "project_template",
      idOf(row),
      "project_templates",
      {
        slug,
        title,
        summary: clip(row.summary, 4000),
        status: lifecycle as TemplateData["status"],
        currentVersion,
        publishedVersion,
        createdByUserId: creator,
        archivedAt: lifecycle === "ARCHIVED" ? (ist(row.archived_at) ?? ist(row.updated_at) ?? asOfIso) : null,
        createdAt: ist(row.created_at),
        updatedAt: ist(row.updated_at),
      },
      row,
      { unmapped: { phase: str(row.phase), courseLabel: str(row.course_label), legacyStatus: str(row.status), meetingsAndActivityDropped: true } },
    );
    templates.push(planned);
    templateByLegacy.set(idOf(row), planned);
    c.stat("project_template").planned += 1;

    const mkVersion = (version: number, blueprintSource: Row, source: Row | null, label: string) => {
      const bp = buildBlueprint(
        {
          overview: blueprintSource.overview,
          sprints: blueprintSource.sprints,
          tasks: blueprintSource.tasks,
          resources: blueprintSource.resources,
        },
        note,
      );
      const v = item2bii(
        "project_template",
        label,
        "project_template_versions",
        {
          templateId: planned.newId,
          version,
          title,
          summary: clip(row.summary, 4000),
          blueprint: bp,
          changeNote: clip(source?.notes, 2000),
          createdByUserId: userOf(source?.changed_by ?? row.created_by, "FACULTY"),
          createdAt: ist(source?.changed_at) ?? ist(source?.created_at) ?? ist(row.created_at),
        },
        { template: idOf(row), version, source },
      );
      templateVersions.push(v);
      versionsByTemplate.set(idOf(row), [...(versionsByTemplate.get(idOf(row)) ?? []), v]);
    };
    const seenVersions = new Set<number>();
    for (const v of legacyVersions.sort((a, b) => Number(a.template_version) - Number(b.template_version) || Number(a.id) - Number(b.id))) {
      const n = Number(v.template_version);
      if (!Number.isInteger(n) || n < 1 || seenVersions.has(n)) {
        c.reject("project_template_version", v, Number.isInteger(n) && n >= 1 ? "DUPLICATE_SOURCE" : "INVALID_VALUE");
        continue;
      }
      seenVersions.add(n);
      mkVersion(n, asJsonObject(v.snapshot_json), v, `${idOf(v)}`);
      c.stat("project_template_version").planned += 1;
    }
    if (!seenVersions.has(currentVersion)) mkVersion(currentVersion, row, null, `current#${idOf(row)}`);
  }
  for (const v of rows("project_template_version")) {
    if (isTrue(v.is_deleted)) {
      if (!templateByLegacy.has(String(v.template_id))) c.reject("project_template_version", v, "PARENT_REJECTED");
      else c.reject("project_template_version", v, "SOFT_DELETED");
    } else if (!templateByLegacy.has(String(v.template_id))) c.reject("project_template_version", v, "PARENT_REJECTED");
  }
  const latestVersionOf = (templateLegacy: string): Planned<TemplateVersionData> | undefined => {
    const list = versionsByTemplate.get(templateLegacy) ?? [];
    return [...list].sort((a, b) => b.data.version - a.data.version)[0];
  };
  for (const row of rows("project_template_college")) {
    const tpl = templateByLegacy.get(String(row.template_id));
    if (!tpl) {
      c.reject("project_template_college", row, "PARENT_REJECTED");
      continue;
    }
    const version = latestVersionOf(String(row.template_id))!;
    const revoked = isTrue(row.is_deleted);
    templateAssignments.push(
      item2bii(
        "project_template_college",
        idOf(row),
        "project_template_college_assignments",
        {
          templateId: tpl.newId,
          templateVersionId: version.newId,
          collegeId,
          assignedByUserId: userOf(row.assigned_by, "FACULTY"),
          assignedAt: ist(row.created_at) ?? asOfIso,
          revokedAt: revoked ? (ist(row.updated_at) ?? asOfIso) : null,
        },
        row,
      ),
    );
    c.stat("project_template_college").planned += 1;
  }

  // ============================================================== workspaces
  c.stat("project_workspace", rows("project_workspace").length);
  const instances: Planned<InstanceData>[] = [];
  const releases: Planned<ReleaseData>[] = [];
  const sprints: Planned<SprintData>[] = [];
  const tasks: Planned<TaskData>[] = [];
  const taskSubmissions: Planned<TaskSubmissionData>[] = [];
  const comments: Planned<CommentData>[] = [];
  const members: Planned<MemberData>[] = [];
  const resources: Planned<ResourceData>[] = [];
  const meetings: Planned<MeetingData>[] = [];
  const submissions: Planned<SubmissionData>[] = [];
  const reviews: Planned<ReviewData>[] = [];
  const deliveryEvents: Planned<DeliveryEventData>[] = [];
  const instanceByLegacy = new Map<string, Planned<InstanceData>>();
  const slugSet = new Set<string>();
  const workspaceRowById = new Map<string, Row>();

  const by = (table: string): Map<string, Row[]> => {
    const out = new Map<string, Row[]>();
    for (const r of rows(table)) out.set(String(r.project_id), [...(out.get(String(r.project_id)) ?? []), r]);
    return out;
  };
  const membersBy = by("project_member");
  const sprintsBy = by("project_sprint");
  const releasesBy = by("project_release");
  const tasksBy = by("project_task");
  const commentsBy = by("project_task_comment");
  const resourcesBy = by("project_resource");
  const meetingsBy = by("project_meeting");
  const deliveriesBy = by("project_delivery");
  const eventsBy = by("project_delivery_event");

  for (const t of ["project_member", "project_sprint", "project_release", "project_task", "project_task_comment", "project_resource", "project_meeting", "project_delivery", "project_delivery_event"]) {
    c.stat(t, rows(t).length);
  }

  const workspaces = [...rows("project_workspace")].sort((a, b) => Number(a.id) - Number(b.id));
  const rejectedWorkspaces = new Set<string>();
  for (const row of workspaces) {
    workspaceRowById.set(idOf(row), row);
    const status = mapWorkspaceStatus(row.status);
    const reasons: JunkReason[] = junkReasonsFor({ names: [str(row.title), str(row.slug), str(row.course_label)], isDeleted: row.is_deleted });
    if (reasons.length) {
      c.reject("project_workspace", row, reasons[0] as Reason);
      rejectedWorkspaces.add(idOf(row));
      continue;
    }
    if (!status) {
      c.reject("project_workspace", row, "UNKNOWN_ENUM");
      rejectedWorkspaces.add(idOf(row));
      continue;
    }
    if (status === "ARCHIVED") {
      c.reject("project_workspace", row, "ARCHIVED_WORKSPACE");
      rejectedWorkspaces.add(idOf(row));
      continue;
    }
    const title = clip(row.title, 300);
    if (!title) {
      c.reject("project_workspace", row, "INVALID_VALUE");
      rejectedWorkspaces.add(idOf(row));
      continue;
    }
    const projectId = nsritId("project_instances", "project_workspace", idOf(row));
    const creator = userOf(row.created_by, "FACULTY");

    // ---- loaded children first (they define the synthetic template blueprint)
    const wsSprints = (sprintsBy.get(idOf(row)) ?? []).filter((s) => !isTrue(s.is_deleted));
    const wsReleases = (releasesBy.get(idOf(row)) ?? []).filter((r) => !isTrue(r.is_deleted));
    const wsTasks = (tasksBy.get(idOf(row)) ?? []).filter((x) => !isTrue(x.is_deleted));
    const wsResources = (resourcesBy.get(idOf(row)) ?? []).filter((r) => !isTrue(r.is_deleted));

    // ---- template: the workspace's own template when loaded, else a synthetic archived one
    let tpl = row.template_id !== null && row.template_id !== undefined ? templateByLegacy.get(String(row.template_id)) : undefined;
    let tplVersion = tpl ? latestVersionOf(String(row.template_id)) : undefined;
    if (!tpl || !tplVersion) {
      const slug = uniqueKey(projectKey(`nsrit-import-workspace-${idOf(row)}`, `nsrit-import-${idOf(row)}`, 96), slugs, 96);
      const synthRow = { workspace: idOf(row), synthetic: true };
      const templatePlanned = item2bii(
        "project_workspace",
        idOf(row),
        "project_templates",
        {
          slug,
          title: `Legacy import: ${title}`.slice(0, 300),
          summary: "Created by the NSRIT data migration for a workspace whose own template was not loaded.",
          status: "ARCHIVED" as const,
          currentVersion: 1,
          publishedVersion: null,
          createdByUserId: creator,
          archivedAt: ist(row.created_at) ?? asOfIso,
          createdAt: ist(row.created_at),
          updatedAt: ist(row.created_at),
        },
        synthRow,
        { unmapped: { syntheticForWorkspace: Number(row.id), legacyTemplateId: row.template_id ?? null } },
      );
      templates.push(templatePlanned);
      const bp = buildBlueprint(
        {
          overview: row.overview,
          sprints: wsSprints.map((s) => ({ key: s.sprint_key, title: s.title, description: s.goal ?? s.description })),
          tasks: wsTasks.map((x) => ({ key: x.task_key, sprintKey: x.sprint_key, title: x.title, description: x.description, acceptanceCriteria: x.acceptance_criteria, priority: x.priority })),
          resources: wsResources.map((r) => ({ key: r.resource_key, title: r.title, url: r.resource_url, required: r.is_required })),
        },
        note,
      );
      const versionPlanned = item2bii(
        "project_workspace",
        `${idOf(row)}#v1`,
        "project_template_versions",
        {
          templateId: templatePlanned.newId,
          version: 1,
          title: `Legacy import: ${title}`.slice(0, 300),
          summary: null,
          blueprint: bp,
          changeNote: "Synthesized from the workspace by the NSRIT data migration",
          createdByUserId: creator,
          createdAt: ist(row.created_at),
        },
        synthRow,
      );
      templateVersions.push(versionPlanned);
      tpl = templatePlanned;
      tplVersion = versionPlanned;
      note("templateSynthesizedForWorkspace");
    }

    const slug = uniqueKey(projectKey(str(row.slug) ?? title, `workspace-${idOf(row)}`, 96), slugSet, 96);
    const instance = item2bii(
      "project_workspace",
      idOf(row),
      "project_instances",
      {
        collegeId,
        templateId: tpl.newId,
        templateVersionId: tplVersion.newId,
        slug,
        title,
        summary: clip(row.summary, 4000),
        status,
        createdByUserId: creator,
        materializedAt: ist(row.created_at),
        archivedAt: null,
        createdAt: ist(row.created_at),
        updatedAt: ist(row.updated_at),
      },
      row,
      {
        unmapped: {
          phase: str(row.phase),
          storedProgress: row.progress ?? null,
          blocker: clip(row.blocker, 1000),
          nextAction: clip(row.next_action, 1000),
          dueLabel: str(row.due_label),
          classId: row.class_id ?? null,
          startDate: str(row.start_date),
          endDate: str(row.end_date),
          sprintLengthWeeks: row.sprint_length_weeks ?? null,
          estimationUnit: str(row.estimation_unit),
          legacyStatus: str(row.status),
          overviewKeptInTemplateOnly: true,
        },
      },
      projectId,
    );
    instances.push(instance);
    instanceByLegacy.set(idOf(row), instance);
    c.stat("project_workspace").planned += 1;

    // ---- members
    const memberRows = [...(membersBy.get(idOf(row)) ?? [])].sort((a, b) => Number(a.id) - Number(b.id));
    const activeMembership = new Set<string>();
    let primaryTaken = false;
    const memberByPerson = new Map<string, { membershipId: string; role: "LEARNER" | "MENTOR" }>();
    const preferredPrimary = String(row.created_by);
    const facultyMembers = memberRows.filter((m) => (str(m.user_type) ?? "").toUpperCase() === "FACULTY" && !isTrue(m.is_deleted));
    const primaryLegacy = (facultyMembers.find((m) => String(m.user_id) === preferredPrimary) ?? facultyMembers[0])?.user_id;
    for (const m of memberRows) {
      const type = (str(m.user_type) ?? "").toUpperCase();
      const p = find(m.user_id, type);
      const kind = type === "FACULTY" ? "faculty" : "learner";
      const loaded = p && p.legacyType === kind ? p : undefined;
      if (!loaded) {
        c.reject("project_member", m, "PERSON_NOT_LOADED");
        continue;
      }
      const ended = isTrue(m.is_deleted);
      if (!ended) {
        if (activeMembership.has(loaded.data.membershipId)) {
          c.reject("project_member", m, "DUPLICATE_SOURCE");
          continue;
        }
        activeMembership.add(loaded.data.membershipId);
      }
      const isMentor = kind === "faculty";
      const primary = isMentor && !ended && !primaryTaken && String(m.user_id) === String(primaryLegacy);
      if (primary) primaryTaken = true;
      const planned = item2bii(
        "project_member",
        idOf(m),
        "project_members",
        {
          projectId,
          membershipId: loaded.data.membershipId,
          role: isMentor ? ("MENTOR" as const) : ("LEARNER" as const),
          roleKind: isMentor ? (primary ? ("MENTOR" as const) : ("CO_MENTOR" as const)) : ("LEARNER" as const),
          canMutate: true,
          isPrimary: primary,
          roleLabel: clip(m.role_label, 200),
          startedAt: ist(m.created_at) ?? ist(row.created_at) ?? asOfIso,
          endedAt: ended ? (ist(m.updated_at) ?? asOfIso) : null,
          createdByUserId: creator,
          createdAt: ist(m.created_at),
          updatedAt: ist(m.updated_at),
        },
        m,
        { unmapped: { memberStatus: str(m.member_status), removedFromWorkspace: ended || undefined } },
      );
      members.push(planned);
      if (!ended) memberByPerson.set(`${kind}:${String(m.user_id)}`, { membershipId: loaded.data.membershipId, role: planned.data.role });
      c.stat("project_member").planned += 1;
    }
    const mentorMembership =
      members.find((x) => x.data.projectId === projectId && x.data.isPrimary)?.data.membershipId ??
      members.find((x) => x.data.projectId === projectId && x.data.role === "MENTOR")?.data.membershipId ??
      fallback.data.membershipId;
    const membershipOf = (id: unknown, type: unknown): string | null => {
      const p = find(id, type);
      return p ? p.data.membershipId : null;
    };

    // ---- releases
    const usedReleaseKeys = new Set<string>();
    const releaseByLegacy = new Map<string, Planned<ReleaseData>>();
    const sortedReleases = [...wsReleases].sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0) || Number(a.id) - Number(b.id));
    sortedReleases.forEach((r, index) => {
      const key = uniqueKey(projectKey(str(r.release_key) ?? str(r.title), `release-${index + 1}`), usedReleaseKeys);
      const planned = item2bii(
        "project_release",
        idOf(r),
        "project_releases",
        {
          projectId,
          templateKey: key,
          title: (str(r.title) ?? `Release ${index + 1}`).slice(0, 300),
          description: clip(r.notes, 4000),
          sequence: index,
          status: mapReleaseStatus(r.status),
          createdAt: ist(r.created_at),
          updatedAt: ist(r.updated_at),
        },
        r,
        { unmapped: { targetDate: str(r.target_date) } },
      );
      releases.push(planned);
      releaseByLegacy.set(idOf(r), planned);
      c.stat("project_release").planned += 1;
    });
    let defaultRelease = sortedReleases.length ? releaseByLegacy.get(idOf(sortedReleases[0])) : undefined;
    const ensureDefaultRelease = (): Planned<ReleaseData> => {
      if (!defaultRelease) {
        const key = uniqueKey("legacy-import", usedReleaseKeys);
        defaultRelease = item2bii(
          "project_workspace",
          `${idOf(row)}#release`,
          "project_releases",
          { projectId, templateKey: key, title: "Release 1", description: null, sequence: 0, status: "PLANNED" as const, createdAt: ist(row.created_at), updatedAt: ist(row.created_at) },
          { workspace: idOf(row), synthetic: "release" },
        );
        releases.push(defaultRelease);
        note("releaseSynthesized");
      }
      return defaultRelease;
    };
    for (const r of releasesBy.get(idOf(row)) ?? []) {
      if (isTrue(r.is_deleted)) c.reject("project_release", r, "SOFT_DELETED");
    }

    // ---- sprints (dense sequence per release; one ACTIVE per project)
    const sprintByKey = new Map<string, Planned<SprintData>>();
    const usedSprintKeys = new Set<string>();
    const sequenceInRelease = new Map<string, number>();
    let activeTaken = false;
    const orderedSprints = [...wsSprints].sort(
      (a, b) => (Number(a.sprint_number) || 0) - (Number(b.sprint_number) || 0) || (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0) || Number(a.id) - Number(b.id),
    );
    for (const s of orderedSprints) {
      const state = mapSprintState(s.sprint_state ?? s.sprint_status);
      if (!state) {
        c.reject("project_sprint", s, "UNKNOWN_ENUM");
        continue;
      }
      const release = (s.release_id !== null && s.release_id !== undefined ? releaseByLegacy.get(String(s.release_id)) : undefined) ?? ensureDefaultRelease();
      const seq = sequenceInRelease.get(release.newId) ?? 0;
      sequenceInRelease.set(release.newId, seq + 1);
      const key = uniqueKey(projectKey(str(s.sprint_key) ?? str(s.title), `sprint-${idOf(s)}`), usedSprintKeys);
      let status = state;
      if (status === "ACTIVE") {
        if (activeTaken) {
          status = "PLANNED";
          note("sprintSecondActiveDemoted");
        } else activeTaken = true;
      }
      const planned = item2bii(
        "project_sprint",
        idOf(s),
        "project_sprints",
        {
          projectId,
          releaseId: release.newId,
          templateKey: key,
          title: (str(s.title) ?? `Sprint ${seq + 1}`).slice(0, 300),
          description: clip(s.goal ?? s.description, 4000),
          sequence: seq,
          status,
          createdAt: ist(s.created_at),
          updatedAt: ist(s.updated_at),
        },
        s,
        { unmapped: { startDate: str(s.start_date), endDate: str(s.end_date), sprintNumber: s.sprint_number ?? null, legacyKey: str(s.sprint_key) } },
      );
      sprints.push(planned);
      if (str(s.sprint_key)) sprintByKey.set(String(s.sprint_key), planned);
      c.stat("project_sprint").planned += 1;
    }
    for (const s of sprintsBy.get(idOf(row)) ?? []) if (isTrue(s.is_deleted)) c.reject("project_sprint", s, "SOFT_DELETED");

    // ---- tasks
    const taskByLegacy = new Map<string, Planned<TaskData>>();
    const taskByKey = new Map<string, Planned<TaskData>>();
    const usedTaskKeys = new Set<string>();
    const sequenceInSprint = new Map<string, number>();
    let backlog: Planned<SprintData> | undefined;
    const orderedTasks = [...wsTasks].sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0) || Number(a.id) - Number(b.id));
    for (const tk of orderedTasks) {
      const status = mapTaskStatus(tk.task_status);
      const title = clip(tk.title, 500);
      if (!status) {
        c.reject("project_task", tk, "UNKNOWN_ENUM");
        continue;
      }
      if (!title) {
        c.reject("project_task", tk, "INVALID_VALUE");
        continue;
      }
      const junk = junkChildNameReasons(title);
      if (junk.length) {
        c.reject("project_task", tk, junk[0] as Reason);
        continue;
      }
      let sprint = str(tk.sprint_key) ? sprintByKey.get(String(tk.sprint_key)) : undefined;
      if (!sprint) {
        if (!backlog) {
          const release = ensureDefaultRelease();
          const seq = sequenceInRelease.get(release.newId) ?? 0;
          sequenceInRelease.set(release.newId, seq + 1);
          backlog = item2bii(
            "project_workspace",
            `${idOf(row)}#backlog`,
            "project_sprints",
            {
              projectId,
              releaseId: release.newId,
              templateKey: uniqueKey("backlog", usedSprintKeys),
              title: "Backlog (legacy import)",
              description: "Tasks that had no sprint in the legacy LMS.",
              sequence: seq,
              status: "PLANNED" as const,
              createdAt: ist(row.created_at),
              updatedAt: ist(row.created_at),
            },
            { workspace: idOf(row), synthetic: "backlog" },
          );
          sprints.push(backlog);
          note("sprintBacklogSynthesized");
        }
        sprint = backlog;
        note("taskWithoutSprintToBacklog");
      }
      const seq = sequenceInSprint.get(sprint.newId) ?? 0;
      sequenceInSprint.set(sprint.newId, seq + 1);
      const assigneeType = (str(tk.assignee_type) ?? "").toUpperCase();
      const sourceAssignee=Number(tk.assignee_id);
      const legacyAssigneeId=tk.assignee_id!=null&&
        Number.isSafeInteger(sourceAssignee)&&sourceAssignee>0?sourceAssignee:null;
      let assignee: string | null = null;
      if(legacyAssigneeId!==null){
        // Never default an unrecognized assignee type to LEARNER: numeric
        // learner and faculty identities overlap in the old source tables.
        const prefix=assigneeType==="FACULTY"?"faculty":
          assigneeType==="LEARNER"?"learner":null;
        const a=prefix?person.get(prefix+":"+legacyAssigneeId):null;
        if(a)assignee=a.data.membershipId;
        else note("taskAssigneeNotLoaded");
      }
      const estimate = toIntRoundHalfUp(tk.estimate_points);
      const due = str(tk.due_date) ? str(tk.due_date)!.slice(0, 10) : null;
      const planned = item2bii(
        "project_task",
        idOf(tk),
        "project_tasks",
        {
          projectId,
          sprintId: sprint.newId,
          templateKey: uniqueKey(projectKey(str(tk.task_key) ?? title, `task-${idOf(tk)}`), usedTaskKeys),
          title,
          description: clip(tk.description, 4000),
          acceptanceCriteria: clip(tk.acceptance_criteria, 4000),
          priority: mapTaskPriority(tk.priority),
          status,
          sequence: seq,
          assigneeMembershipId: assignee,
          legacyAssigneeId,
          legacyAssigneeType:assigneeType&&assigneeType.length<=32?assigneeType:null,
          legacyAssigneeName:clip(tk.assignee_name,160),
          blockerReason: status === "BLOCKED" ? (clip(tk.blocker_reason, 2000) ?? "Blocked (reason not recorded in the legacy LMS)") : clip(tk.blocker_reason, 2000),
          dueDate: /^\d{4}-\d{2}-\d{2}$/.test(due ?? "") ? due : null,
          estimatePoints: estimate !== null && estimate >= 0 && estimate <= 1000 ? estimate : null,
          taskType: mapTaskType(tk.task_type),
          createdAt: ist(tk.created_at),
          updatedAt: ist(tk.updated_at),
        },
        tk,
        { unmapped: { approach: clip(tk.approach, 1000), carriedOverFrom: str(tk.carried_over_from_sprint_key), dueLabel: str(tk.due_label), legacyStatus: str(tk.task_status) } },
      );
      tasks.push(planned);
      taskByLegacy.set(idOf(tk), planned);
      if (str(tk.task_key)) taskByKey.set(String(tk.task_key), planned);
      c.stat("project_task").planned += 1;
      if (status === "BLOCKED" && !clip(tk.blocker_reason, 2000)) note("taskBlockerDefaulted");
      // a task-level submission only exists when the legacy row carries a link
      const submissionUrl = publicHttpUrl(tk.submission_url).url;
      const submittedAt = ist(tk.submitted_at);
      if (submissionUrl && submittedAt) {
        const by = membershipOf(tk.submitted_by, "LEARNER") ?? assignee ?? mentorMembership;
        taskSubmissions.push(
          item2bii("project_task", `${idOf(tk)}#submission`, "project_task_submissions", { projectId, taskId: planned.newId, version: 1, submittedByMembershipId: by, submissionUrl, note: null, status: "SUBMITTED" as const, submittedAt }, tk),
        );
      }
    }
    for (const tk of tasksBy.get(idOf(row)) ?? []) if (isTrue(tk.is_deleted)) c.reject("project_task", tk, "SOFT_DELETED");

    // ---- comments
    for (const cm of [...(commentsBy.get(idOf(row)) ?? [])].sort((a, b) => Number(a.id) - Number(b.id))) {
      if (isTrue(cm.is_deleted)) {
        c.reject("project_task_comment", cm, "SOFT_DELETED");
        continue;
      }
      const task = taskByLegacy.get(String(cm.project_task_id));
      if (!task) {
        c.reject("project_task_comment", cm, "PARENT_REJECTED");
        continue;
      }
      const author = membershipOf(cm.commenter_id, cm.commenter_type);
      if (!author) {
        c.reject("project_task_comment", cm, "PERSON_NOT_LOADED");
        continue;
      }
      const body = str(cm.message);
      if (!body) {
        c.reject("project_task_comment", cm, "INVALID_VALUE");
        continue;
      }
      comments.push(
        item2bii(
          "project_task_comment",
          idOf(cm),
          "project_task_comments",
          { projectId, taskId: task.newId, authorMembershipId: author, body: body.slice(0, 4000), createdAt: ist(cm.created_at), updatedAt: ist(cm.updated_at) },
          cm,
          { unmapped: { progressValue: cm.progress_value ?? null, commentType: str(cm.comment_type), statusSnapshot: str(cm.task_status_snapshot) } },
        ),
      );
      c.stat("project_task_comment").planned += 1;
    }

    // ---- resources
    let fileResources = 0;
    const orderedResources = [...wsResources].sort((a, b) => (Number(a.resource_order) || 0) - (Number(b.resource_order) || 0) || Number(a.id) - Number(b.id));
    const usedResourceKeys = new Set<string>();
    orderedResources.forEach((r, index) => {
      const title = clip(r.title, 300);
      if (!title) {
        c.reject("project_resource", r, "INVALID_VALUE");
        return;
      }
      const kind = (str(r.resource_kind) ?? str(r.resource_type) ?? "").toLowerCase();
      const isLink = kind === "link";
      const url = isLink ? (publicHttpUrl(r.resource_url).url ?? publicHttpUrl(r.attachment_url).url) : null;
      const filePending = !isLink || !url;
      if (filePending) fileResources += 1;
      resources.push(
        item2bii(
          "project_resource",
          idOf(r),
          "project_resources",
          {
            projectId,
            templateKey: uniqueKey(projectKey(str(r.resource_key) ?? title, `resource-${idOf(r)}`), usedResourceKeys),
            title,
            description: filePending ? [clip(r.description, 3800), "Attachment pending file migration."].filter(Boolean).join("\n\n") : clip(r.description, 4000),
            url,
            required: isTrue(r.is_required),
            sequence: index,
            status: "ACTIVE" as const,
            visibility: mapResourceVisibility(r.visibility),
            createdAt: ist(r.created_at),
            updatedAt: ist(r.updated_at),
          },
          r,
          filePending
            ? { unmapped: { filePending: true, kind: str(r.resource_kind), fileReference: str(r.file_url) ?? str(r.attachment_url), pinned: isTrue(r.is_pinned) || undefined } }
            : { unmapped: { pinned: isTrue(r.is_pinned) || undefined } },
        ),
      );
      c.stat("project_resource").planned += 1;
    });
    for (const r of resourcesBy.get(idOf(row)) ?? []) if (isTrue(r.is_deleted)) c.reject("project_resource", r, "SOFT_DELETED");
    note("projectResourceFilesPending", fileResources);

    // ---- meetings
    for (const mt of [...(meetingsBy.get(idOf(row)) ?? [])].sort((a, b) => Number(a.id) - Number(b.id))) {
      if (isTrue(mt.is_deleted)) {
        c.reject("project_meeting", mt, "SOFT_DELETED");
        continue;
      }
      const legacyStatus = mapMeetingStatus(mt.meeting_status);
      const title = clip(mt.title, 300);
      if (!legacyStatus) {
        c.reject("project_meeting", mt, "UNKNOWN_ENUM");
        continue;
      }
      if (!title) {
        c.reject("project_meeting", mt, "INVALID_VALUE");
        continue;
      }
      const date = str(mt.meeting_date)?.slice(0, 10) ?? null;
      const startTime = str(mt.start_time)?.slice(0, 8);
      let startsAt = date ? ist(`${date} ${startTime ?? "00:00:00"}`) : null;
      if (!startsAt) {
        startsAt = ist(mt.created_at);
        note("meetingStartFromCreatedAt");
      }
      if (!startsAt) {
        c.reject("project_meeting", mt, "INVALID_VALUE");
        continue;
      }
      const endTime = str(mt.end_time)?.slice(0, 8);
      let endsAt = date && endTime ? ist(`${date} ${endTime}`) : null;
      if (!endsAt || endsAt <= startsAt) {
        endsAt = new Date(new Date(startsAt).getTime() + 30 * 60_000).toISOString();
        note("meetingEndDerived");
      }
      const url = publicHttpUrl(mt.meet_link).url;
      let status = legacyStatus;
      if ((status === "SCHEDULED" || status === "COMPLETED") && !url) {
        status = "REQUESTED";
        note("meetingDowngradedNoUrl");
      }
      const creatorType = str(mt.created_by_type);
      const requester = membershipOf(mt.created_by, creatorType) ?? membershipOf(mt.organizer_id, "FACULTY") ?? mentorMembership;
      const organizer = find(mt.organizer_id, "FACULTY");
      const sprintLink = str(mt.linked_sprint_key) ? sprintByKey.get(String(mt.linked_sprint_key)) : undefined;
      const taskLink = str(mt.linked_task_key) ? taskByKey.get(String(mt.linked_task_key)) : undefined;
      meetings.push(
        item2bii(
          "project_meeting",
          idOf(mt),
          "project_meetings",
          {
            projectId,
            status,
            meetingType: mapMeetingType(mt.meeting_type),
            title,
            agenda: clip(mt.agenda, 4000),
            startsAt,
            endsAt,
            timeZone: normalizeTimeZone(mt.timezone),
            meetingUrl: url,
            requestedByMembershipId: requester,
            scheduledByUserId: status === "SCHEDULED" || status === "COMPLETED" ? (organizer?.newId ?? fallback.newId) : null,
            scheduledByMembershipId: status === "SCHEDULED" || status === "COMPLETED" ? (organizer?.data.membershipId ?? fallback.data.membershipId) : null,
            linkedSprintId: sprintLink?.newId ?? null,
            linkedTaskId: taskLink?.newId ?? null,
            outcome: clip(mt.outcome, 4000) ?? clip(mt.notes, 4000),
            createdByUserId: userOf(mt.created_by, creatorType ?? "FACULTY"),
            createdAt: ist(mt.created_at),
            updatedAt: ist(mt.updated_at),
          },
          mt,
          {
            unmapped: {
              legacyStatus: str(mt.meeting_status),
              retroWentWell: clip(mt.retro_went_well, 2000),
              retroDidntGoWell: clip(mt.retro_didnt_go_well, 2000),
              retroActions: clip(mt.retro_actions, 2000),
              actionItems: mt.action_items ?? null,
              calendarProvider: str(mt.calendar_provider),
              reminderAt: str(mt.reminder_at),
              followUpStatus: str(mt.follow_up_status),
            },
          },
        ),
      );
      c.stat("project_meeting").planned += 1;
    }

    // ---- final delivery
    const deliveries = [...(deliveriesBy.get(idOf(row)) ?? [])].filter((d) => !isTrue(d.is_deleted)).sort((a, b) => Number(a.id) - Number(b.id));
    for (const d of deliveriesBy.get(idOf(row)) ?? []) if (isTrue(d.is_deleted)) c.reject("project_delivery", d, "SOFT_DELETED");
    const deliveryByLegacy = new Map<string, Planned<SubmissionData>>();
    deliveries.forEach((d, index) => {
      const status = mapDeliveryStatus(d.status, d.review_status);
      if (!status) {
        c.reject("project_delivery", d, "UNKNOWN_ENUM");
        return;
      }
      const isLast = index === deliveries.length - 1;
      if ((status === "DRAFT" || status === "SUBMITTED") && !isLast) {
        c.reject("project_delivery", d, "SUPERSEDED");
        return;
      }
      const submitter = membershipOf(d.submitted_by_id, d.submitted_by_type) ?? mentorMembership;
      const creatorMembership = membershipOf(d.draft_saved_by_id, d.last_updated_by_type) ?? membershipOf(d.last_updated_by_id, d.last_updated_by_type) ?? submitter;
      const submittedAt = status === "DRAFT" ? null : (ist(d.submitted_at) ?? ist(d.updated_at) ?? asOfIso);
      const summary = (str(d.notes) ?? str(asJsonObject(d.snapshot).summary) ?? "Final delivery recorded in the legacy LMS").slice(0, 4000);
      const sourceUrl = publicHttpUrl(d.source_url).url;
      const planned = item2bii(
        "project_delivery",
        idOf(d),
        "project_submissions",
        {
          projectId,
          version: index + 1,
          status,
          summary,
          sourceUrl,
          demoUrl: null,
          notes: clip(d.feedback, 4000),
          createdByMembershipId: creatorMembership,
          submittedByMembershipId: status === "DRAFT" ? null : submitter,
          submittedAt,
          lockedAt: ist(d.locked_at),
          createdAt: ist(d.created_at),
          updatedAt: ist(d.updated_at),
        },
        d,
        {
          unmapped: {
            attachmentReference: str(d.attachment_url) ?? str(d.storage_key),
            attachmentsPresent: d.attachments !== null && d.attachments !== undefined,
            revisionCount: d.revision_count ?? null,
            mime: str(d.file_mime_type),
            fileSize: d.file_size ?? null,
          },
        },
      );
      submissions.push(planned);
      deliveryByLegacy.set(idOf(d), planned);
      c.stat("project_delivery").planned += 1;
      if (str(d.attachment_url) || str(d.storage_key)) note("projectDeliveryFileReferences");
      if (status === "APPROVED" || status === "CHANGES_REQUESTED") {
        const reviewer = find(d.reviewed_by_id, d.reviewed_by_type);
        reviews.push(
          item2bii(
            "project_delivery",
            `${idOf(d)}#review`,
            "project_submission_reviews",
            {
              projectId,
              submissionId: planned.newId,
              decision: status,
              feedback: status === "CHANGES_REQUESTED" ? (clip(d.feedback, 4000) ?? "Changes requested in the legacy LMS") : clip(d.feedback, 4000),
              reviewedByUserId: reviewer?.newId ?? fallback.newId,
              reviewedByMembershipId: reviewer?.data.membershipId ?? null,
              reviewedAt: ist(d.reviewed_at) ?? ist(d.updated_at) ?? asOfIso,
            },
            d,
          ),
        );
      }
    });
    for (const ev of [...(eventsBy.get(idOf(row)) ?? [])].sort((a, b) => Number(a.id) - Number(b.id))) {
      if (isTrue(ev.is_deleted)) {
        c.reject("project_delivery_event", ev, "SOFT_DELETED");
        continue;
      }
      const submission = deliveryByLegacy.get(String(ev.delivery_id));
      if (!submission) {
        c.reject("project_delivery_event", ev, "PARENT_REJECTED");
        continue;
      }
      const action = (str(ev.action) ?? "").toUpperCase();
      if (action !== "LOCKED" && action !== "REOPENED") {
        c.reject("project_delivery_event", ev, "NO_VNEXT_TARGET");
        continue;
      }
      const actorMembership = membershipOf(ev.actor_id, ev.actor_type) ?? mentorMembership;
      deliveryEvents.push(
        item2bii(
          "project_delivery_event",
          idOf(ev),
          "project_delivery_events",
          { projectId, submissionId: submission.newId, eventType: action, actorMembershipId: actorMembership, reason: (str(ev.notes) ?? "Recorded in the legacy LMS").slice(0, 4000), occurredAt: ist(ev.created_at) ?? asOfIso },
          ev,
        ),
      );
      c.stat("project_delivery_event").planned += 1;
    }
  }

  // children of workspaces that were rejected as a whole
  const childTables: [string, Map<string, Row[]>][] = [
    ["project_member", membersBy],
    ["project_sprint", sprintsBy],
    ["project_release", releasesBy],
    ["project_task", tasksBy],
    ["project_task_comment", commentsBy],
    ["project_resource", resourcesBy],
    ["project_meeting", meetingsBy],
    ["project_delivery", deliveriesBy],
    ["project_delivery_event", eventsBy],
  ];
  for (const [entity, map] of childTables) {
    for (const [projectLegacy, list] of map) {
      if (instanceByLegacy.has(projectLegacy)) continue;
      for (const r of list) c.reject(entity, r, rejectedWorkspaces.has(projectLegacy) || !workspaceRowById.has(projectLegacy) ? "PARENT_REJECTED" : "PARENT_REJECTED");
    }
  }

  // ---------------------------------------------------- legacy-computed facts
  const facts: ProjectFacts = { projects: [] };
  for (const [legacyId, instance] of instanceByLegacy) {
    const sprintsOf = sprints.filter((s) => s.data.projectId === instance.newId);
    const tasksOf = tasks.filter((x) => x.data.projectId === instance.newId);
    const done = tasksOf.filter((x) => x.data.status === "DONE").length;
    const completed = sprintsOf.filter((s) => s.data.status === "COMPLETED").length;
    const ws = workspaceRowById.get(legacyId)!;
    const stored = Number(ws.progress);
    facts.projects.push({
      project: legacyId,
      storedProgress: Number.isFinite(stored) ? stored : null,
      tasks: tasksOf.length,
      doneTasks: done,
      sprints: sprintsOf.length,
      completedSprints: completed,
      derivedPercent: projectCompletionPercent(done + completed, tasksOf.length + sprintsOf.length),
    });
  }

  return {
    templates,
    templateVersions,
    templateAssignments,
    instances,
    releases,
    sprints,
    tasks,
    taskSubmissions,
    comments,
    members,
    resources,
    meetings,
    submissions,
    reviews,
    deliveryEvents,
    facts,
    unmappedCounts: {},
  };
}
