export const asArray = (value) => (Array.isArray(value) ? value : []);

export const unwrapApiList = (response) => {
  const payload = response?.data?.data ?? response?.data ?? response ?? [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const unwrapApiItem = (response) => {
  const payload = response?.data?.data ?? response?.data ?? response ?? null;
  if (!payload || Array.isArray(payload)) return null;
  return payload;
};

export const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null && value !== "");

export const textOrDash = (value) => {
  const text = firstDefined(value, "");
  return text ? String(text) : "—";
};

// Several backend timestamps (e.g. admin audit log createdAt) serialize as a Jackson
// LocalDateTime array [year, month, day, hour, minute, second] rather than an ISO string.
// Left un-formatted, String([...]) renders as a raw "2026,8,3,1,15,31" in the UI.
// Event times from the backend (submitted/reviewed/published/override/created) are UTC: the JVM
// runs in UTC and these come either as a Jackson array [y, M, d, h, m, s] or an ISO string with no
// zone ("2026-10-03T14:11:23", from String.valueOf(LocalDateTime)). Both used to be read as the
// browser's local time, so every one of them showed 5h30m early in India. A value that carries a
// zone (Z / +05:30) is used as-is; a plain date (3-element array or YYYY-MM-DD) is a calendar date
// and is shown without a time.
const DATE_ONLY = { year: "numeric", month: "short", day: "numeric" };
const DATE_TIME = { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" };

export const parseServerTimestamp = (value) => {
  if (Array.isArray(value) && value.length >= 3) {
    const [year, month, day, hour, minute = 0, second = 0] = value;
    if (value.length <= 3 || hour === undefined) return { date: new Date(year, (month || 1) - 1, day), dateOnly: true };
    return { date: new Date(Date.UTC(year, (month || 1) - 1, day, hour, minute, second)), dateOnly: false };
  }
  if (typeof value === "string" && value) {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split("-").map(Number);
      return { date: new Date(y, m - 1, d), dateOnly: true };
    }
    const hasZone = /(Z|[+-]\d{2}:?\d{2})$/i.test(trimmed);
    const isoish = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(trimmed);
    return { date: new Date(isoish && !hasZone ? `${trimmed.replace(" ", "T")}Z` : trimmed), dateOnly: false };
  }
  return null;
};

export const formatTimestamp = (value) => {
  const parsed = parseServerTimestamp(value);
  if (parsed && !Number.isNaN(parsed.date.getTime())) {
    return parsed.date.toLocaleString(undefined, parsed.dateOnly ? DATE_ONLY : DATE_TIME);
  }
  return textOrDash(value);
};

export const normaliseCollegeScopedName = (item, fallbackLabel) =>
  textOrDash(
    firstDefined(
      item?.title,
      item?.name,
      item?.projectTitle,
      item?.templateTitle,
      item?.courseLabel,
      item?.course,
      fallbackLabel
    )
  );

// Backend status/lifecycle enums are stored as raw uppercase-with-underscores tokens
// (DRAFT, IN_PROGRESS, READY_OVERRIDE, ...) — statusLabel is the single place every admin
// page renders one of these in a Tag, so humanizing here fixes every call site at once
// instead of leaking "IN_PROGRESS" as literal text on some pages and not others.
const humanizeToken = (value) => {
  const text = String(value ?? "").trim();
  if (!text) return "";
  return text
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export const statusLabel = (value, fallback = "Draft") => textOrDash(humanizeToken(firstDefined(value, fallback)));

export const statusColor = (value) => {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized.includes("archiv")) return "default";
  if (normalized.includes("draft")) return "gold";
  // "BLOCKED" is one of the real workspace status values (ACTIVE/IN_PROGRESS/READY/BLOCKED/
  // ARCHIVED) but matched none of the branches below — it rendered the same neutral grey as an
  // unset status, giving no visual signal that a workspace needs attention. Check it ahead of
  // "review"/"progress" since it's the most urgent state.
  if (normalized.includes("block")) return "red";
  // Check "review"/"progress" before "ready"/"active" — a status like "Ready for Review"
  // contains both substrings, and the more specific "in review" signal should win rather than
  // "ready" matching first and giving it the wrong (green, "all clear") color.
  if (normalized.includes("progress") || normalized.includes("review")) return "blue";
  if (normalized.includes("publish") || normalized.includes("active") || normalized.includes("ready")) return "green";
  return "default";
};

export const countBy = (list, predicate) => asArray(list).filter(predicate).length;

export const projectMemberCount = (project) => {
  const members = asArray(project?.members || project?.resolvedMembers);
  return members.length;
};

// "status" is the only field that actually drives workspace behavior (archiving, mutation
// guards, list filtering — see ProjectWorkspaceServiceImpl). "lifecycleStatus" belongs only to
// templates, never workspaces, and "phase" is written but never read anywhere in the backend —
// falling back through either of them here would silently display an unrelated or dead value
// as if it were the workspace's real status.
export const projectStatus = (project) => firstDefined(project?.status, "Active");

// ONE progress formula for a workspace, the same one the student/mentor Overview donut uses
// (ProjectDetailContent projectProgressValue): completed tasks + completed sprints over all tasks +
// sprints. The admin lists used tasks only and the Summary page a hand-typed number, so the same
// workspace showed three different percentages. The stored `progress` is only a fallback for a
// workspace with no tasks or sprints yet.
export const derivedProjectProgress = (project) => {
  const r = project?.readiness || {};
  const total = Number(r.totalTasks || 0) + Number(r.totalSprints || 0);
  if (!(total > 0)) return null;
  const done = Number(r.completedTasks || 0) + Number(r.completedSprints || 0);
  return Math.max(0, Math.min(100, Math.round((done / total) * 100)));
};

export const projectProgress = (project) => {
  const derived = derivedProjectProgress(project);
  if (derived != null) return derived;
  return Math.max(0, Math.min(100, Number(firstDefined(project?.progress, project?.readiness?.progress, project?.completion, 0) || 0)));
};

// "goal" and "deliverables" are the only two Overview keys the Overview tab actually reads
// (see ProjectDetailContent.jsx's resolvedOverview.goal/.deliverables, and the "only two keys
// that matter" comments in templates/new.js and templates/[templateId]/edit.js) — everything
// else on the overview object is legacy/junk "facts" carried over from old rows. Counting raw
// Object.keys() here let a template with only stray legacy keys and no real goal/deliverables
// outrank a genuinely complete template, which is backwards for an admin scanning for gaps.
const meaningfulOverviewKeyCount = (overview) => {
  let count = 0;
  if (String(overview?.goal ?? "").trim()) count += 1;
  const deliverables = overview?.deliverables;
  const hasDeliverables = Array.isArray(deliverables) ? deliverables.length > 0 : Boolean(String(deliverables ?? "").trim());
  if (hasDeliverables) count += 1;
  if (Array.isArray(overview?.definitionOfDone) ? overview.definitionOfDone.some(Boolean) : Boolean(String(overview?.definitionOfDone ?? "").trim())) count += 1;
  if (Array.isArray(overview?.personas) ? overview.personas.some(Boolean) : Boolean(String(overview?.personas ?? "").trim())) count += 1;
  return count;
};

export const templateSectionCount = (template, key) => {
  const section = template?.[key];
  if (key === "overview") return meaningfulOverviewKeyCount(section);
  if (Array.isArray(section)) return section.length;
  if (section && typeof section === "object") return Object.keys(section).length;
  return 0;
};

export const isArchivedStatus = (value) => String(value ?? "").toLowerCase().includes("archiv");

// Picks the workspace's PRIMARY mentor specifically — a FACULTY member whose role label is
// "Project Mentor" (or blank on legacy rows), not just the first FACULTY member found. Without
// this distinction, a workspace with a Co-Mentor/Reviewer added before the actual mentor would
// report the wrong person as "current mentor" everywhere this helper is used (e.g. reassign-mentor
// page's "From mentor" filter and current-mentor display).
const isPrimaryMentorRoleLabel = (roleLabel) => {
  const normalized = String(roleLabel ?? "").trim().toLowerCase();
  return normalized === "" || normalized === "project mentor";
};

// ProjectMemberDTO serializes this field as "role" (see ProjectMemberDTO.java) — "roleLabel" is
// only the write-side request field name (assignProjectMentor/assignProjectLearners payloads).
// Reading `member?.roleLabel` here always returned undefined, so every FACULTY member looked
// "blank role label" and this always picked the first one rather than the actual designated
// mentor whenever a workspace had a co-mentor/reviewer too. Check `role` first, falling back to
// `roleLabel` in case a caller ever passes an already-normalized shape.
export const memberRoleLabel = (member) => member?.role ?? member?.roleLabel;

export const projectMentorMember = (project) =>
  asArray(project?.members || project?.resolvedMembers).find(
    (member) => String(member?.userType).toUpperCase() === "FACULTY" && isPrimaryMentorRoleLabel(memberRoleLabel(member))
  ) || null;

// Mirrors ProjectDetailContent's own resolveMemberName (mentor/learner side) -- same "only
// resolves against members currently on the project" caveat, same field-name fallback chain.
// Used for task submittedBy/submittedAt and any other id-only attribution field an admin page
// needs to show a name for.
export const resolveProjectMemberName = (project, userId) => {
  if (userId == null) return null;
  const match = asArray(project?.members || project?.resolvedMembers).find(
    (member) => String(member?.userId ?? member?.memberId ?? member?.id ?? "") === String(userId)
  );
  return match?.name || match?.displayName || match?.fullName || null;
};

const STALE_AFTER_DAYS = 7;

export const projectLastActivityAt = (project) => {
  const activityTimestamps = asArray(project?.resolvedActivity || project?.activity)
    .map((entry) => entry?.when)
    .filter(Boolean)
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()));
  // The workspaces-list endpoint doesn't include resolvedActivity (only the single-project
  // detail fetch does) — fall back to the project's own lastActivityAt/updatedAt so a project
  // fetched from a list view isn't treated as having zero activity signal, matching the same
  // fallback ProjectsContent.jsx (student/mentor surfaces) already applies.
  const timestamps = activityTimestamps.length
    ? activityTimestamps
    : [project?.lastActivityAt]
        .filter(Boolean)
        .map((value) => new Date(value))
        .filter((value) => !Number.isNaN(value.getTime()));
  if (!timestamps.length) return null;
  return timestamps.reduce((a, b) => (a > b ? a : b));
};

export const isProjectStalled = (project, staleAfterDays = STALE_AFTER_DAYS) => {
  const statusLower = String(projectStatus(project) ?? "").toLowerCase();
  if (statusLower.includes("archiv") || statusLower.includes("complet") || statusLower.includes("done")) {
    return false;
  }
  const latest = projectLastActivityAt(project);
  // The admin workspaces-list endpoint doesn't include resolvedActivity (only the detail fetch
  // does), so every project used to fall through to "no timestamp -> stalled" and get flagged
  // regardless of real activity, making the at-risk report flag ~100% of projects. Without any
  // signal to judge by, assume NOT stalled rather than defaulting to an alarming false positive.
  if (!latest) return false;
  const diffDays = (Date.now() - latest.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= staleAfterDays;
};

export const projectStaleDays = (project) => {
  const latest = projectLastActivityAt(project);
  if (!latest) return null;
  return Math.floor((Date.now() - latest.getTime()) / (1000 * 60 * 60 * 24));
};

// Shared "how long has this been waiting" visual language for any day-count column (Submissions'
// Pending/Inactive columns, At-risk's Inactive column) — a longer wait is more urgent regardless
// of what it's a wait *for*.
export const ageColor = (days) => {
  if (days === null || days === undefined) return "default";
  if (days >= 7) return "red";
  if (days >= 3) return "gold";
  return "green";
};

export const ageLabel = (days) => (days === 0 ? "Today" : `${days}d`);

export const projectReviewStatus = (project) => String(project?.resolvedDelivery?.reviewStatus || project?.delivery?.reviewStatus || "").toLowerCase();

export const projectNeedsReview = (project) => {
  const reviewStatus = projectReviewStatus(project);
  return reviewStatus === "submitted" || reviewStatus === "under review";
};

export const hasProjectBlocker = (project) => Boolean(String(project?.blocker || "").trim());

export const projectRiskReasons = (project) => {
  const reasons = [];
  if (isProjectStalled(project)) {
    const staleDays = projectStaleDays(project);
    reasons.push(staleDays != null ? `No activity in ${staleDays} day${staleDays === 1 ? "" : "s"}` : "No recent activity");
  }
  // Say what is blocked; "Active blocker" alone sent the admin hunting for it.
  if (hasProjectBlocker(project)) {
    const text = String(project.blocker).trim();
    reasons.push(`Blocked: ${text.length > 80 ? `${text.slice(0, 79)}…` : text}`);
  }
  if (projectNeedsReview(project)) reasons.push("Pending review");
  return reasons;
};

export const isProjectAtRisk = (project) => projectRiskReasons(project).length > 0;

// Ordered most-severe-first so `.find` below picks the highest tier a project qualifies for.
// Shared by the At-risk table and the workspace detail page's risk banner so the same reason
// count maps to the same severity tier and color everywhere it's shown.
const RISK_SEVERITY_LEVELS = [
  { min: 3, color: "red", label: "Critical" },
  { min: 2, color: "orange", label: "Elevated" },
  { min: 1, color: "gold", label: "Watch" },
];

export const riskSeverity = (project) => {
  const count = projectRiskReasons(project).length;
  const tone = RISK_SEVERITY_LEVELS.find((level) => count >= level.min) || { color: "default" };
  return { color: tone.color, label: count ? `${count} signal${count === 1 ? "" : "s"}` : "No signals" };
};

// The delivery review-status state machine (ProjectWorkspaceServiceImpl.applyDeliveryUpdate)
// only ever sets one of six strings — shared color mapping so Submissions and the workspace
// detail page's Delivery card render the identical status the identical color.
export const reviewStatusColor = (status) => {
  const normalized = String(status ?? "").toLowerCase();
  if (normalized === "accepted" || normalized === "locked") return "green";
  if (normalized === "changes requested") return "volcano";
  if (normalized === "draft") return "blue";
  if (normalized === "submitted" || normalized === "under review" || normalized === "") return "gold";
  return "default";
};

const SUBMISSION_TYPE_LABELS = { LINK: "Link", FILE: "File", BOTH: "File + link" };

export const submissionTypeLabel = (value) => {
  if (!value) return "—";
  if (SUBMISSION_TYPE_LABELS[value]) return SUBMISSION_TYPE_LABELS[value];
  const text = String(value);
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// Some workspace/template JSON columns arrive as an already-parsed object and some as a raw JSON
// string, depending on the endpoint — so every editor needs the same "parse it if it's a string,
// otherwise use it as-is, and fall back to an empty value on anything unusable" step before it can
// seed a form. Six byte-identical copies of this existed (one per college-admin section page plus
// the superadmin hook module); it lives here because it is pure JSON plumbing with no role
// semantics, so sharing it does not couple the two panels' behavior the way a shared page or
// nav definition would.
export const toStructuredValue = (value, emptyValue) => {
  if (value === undefined || value === null) return emptyValue;
  if (typeof value === "string") {
    if (!value.trim()) return emptyValue;
    try {
      return JSON.parse(value);
    } catch {
      return emptyValue;
    }
  }
  return value;
};

// The read-side DTOs expose each row's real identity field as taskKey/sprintKey/resourceKey/
// meetingKey (see ProjectTaskDTO/ProjectSprintDTO/resource maps/ProjectMeetingDTO) — never "key".
// RepeatingItemEditor's TASK_FIELDS/SPRINT_FIELDS/RESOURCE_FIELDS/MEETING_FIELDS all edit a field
// literally named "key", so without this aliasing the "Key (optional)" input rendered blank for
// existing rows (implying no key existed) and anything typed into it was silently discarded at
// submit time. Alias non-destructively: keep the original *Key field intact (a Task row's own
// sprintKey reference still needs it, same for a Meeting's linkedSprintKey/linkedTaskKey) and just
// also populate "key".
//
// Five copies of this pair existed with three different signatures — one taking a section name,
// one an identity-field name, one hardcoding a single field — which is exactly the kind of drift
// that makes a caller pass the wrong argument and silently no-op a rename. Panel-neutral field
// plumbing, so it lives here and both panels call the same section-name form.
const SECTION_IDENTITY_FIELD = { sprints: "sprintKey", tasks: "taskKey", resources: "resourceKey", meetingsList: "meetingKey" };

export const aliasSectionRowKeys = (sectionName, rows) => {
  const identityField = SECTION_IDENTITY_FIELD[sectionName];
  if (!identityField || !Array.isArray(rows)) return rows;
  return rows.map((row) => (row && row.key === undefined ? { ...row, key: row[identityField] } : row));
};

// Reverse of aliasSectionRowKeys, applied at submit time after materializeSectionKeys has resolved
// each row's final "key". The backend never reads "key" — it resolves an item's identity from the
// real taskKey/sprintKey/resourceKey/meetingKey field — so without writing the materialized key
// back into that real field, editing the "Key" input was a complete silent no-op: the rename never
// reached the backend, and any dropdown elsewhere in the same submit that was already remapped to
// the row's new key would end up orphaned, since the row itself still saved under its old identity.
export const dealiasSectionRowKeys = (sectionName, rows) => {
  const identityField = SECTION_IDENTITY_FIELD[sectionName];
  if (!identityField || !Array.isArray(rows)) return rows;
  return rows.map((row) => (row && row.key !== undefined ? { ...row, [identityField]: row.key } : row));
};

// --- template payload safety ------------------------------------------------------------------
// AdminProjectTemplateUpsertDTO carries the WHOLE template, and ProjectWorkspaceServiceImpl's
// applyTemplatePayload treats its fields in two very different ways:
//
//   * A save with no title is a section-only save: slug, title, summary, courseLabel and phase stay as stored. Section
//     pages used to resend all five from their load-time copy, which wrote stale values back over a newer edit made on
//     the Overview tab (Projects audit R7-01).
//   * overview, sprints, tasks, resources, delivery, meetings, activity are guarded by
//     `if (entity.getX() == null || payload.getX() != null)` — an omitted section is left exactly
//     as stored. That is what lets each section page send only its own part of the template.
//   * status / lifecycleStatus fall back to the stored value when omitted. lifecycleStatus is
//     deliberately never echoed (re-running the publish gate, resetting archivedAt, reverting a publish).
//
// So: spread templateScalars(template), then add only this page's own section(s). It now carries only the
// templateVersion the page loaded, so a save after anyone else's save is a 409 instead of an overwrite.
// The Overview page, which owns the scalar fields, adds them explicitly.
export const templateScalars = (template) => ({
  expectedTemplateVersion: template?.templateVersion ?? undefined,
});

// A template's JSON columns arrive parsed or as a raw JSON string depending on the endpoint.
export const toObjectValue = (value, fallback = {}) => {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (_) {
      return fallback;
    }
  }
  return value;
};

export const toArrayValue = (value, fallback = []) => {
  const parsed = toObjectValue(value, fallback);
  return Array.isArray(parsed) ? parsed : fallback;
};

// Project change-log wording: the audit rows store codes (PROJECT_TASK_COMMENT_ADD, PROJECT_TEMPLATE,
// FACULTY); admins read "Task comment add", "Template", "Staff".
const PROJECT_AUDIT_ENTITY_LABELS = {
  PROJECT: "Workspace",
  PROJECT_TEMPLATE: "Template",
  PROJECT_TASK: "Task",
  PROJECT_MEMBER: "Member",
};

export const projectAuditEntityLabel = (type) => {
  const key = String(type ?? "").trim().toUpperCase();
  return PROJECT_AUDIT_ENTITY_LABELS[key] || textOrDash(humanizeToken(key));
};

export const projectAuditActionLabel = (actionKey) => {
  const words = humanizeToken(actionKey)
    .replace(/^Project Template /, "Template ")
    .replace(/^Project Task /, "Task ")
    .replace(/^Project Member /, "Member ")
    .replace(/^Project /, "Workspace ");
  if (!words) return "—";
  return words.charAt(0) + words.slice(1).toLowerCase();
};

export const auditActorTypeLabel = (type) =>
  ({ FACULTY: "Staff", LEARNER: "Student", ADMIN: "Admin", SUPERADMIN: "Super admin" })[String(type ?? "").toUpperCase()]
  || textOrDash(type);
