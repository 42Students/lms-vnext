// Turns an admin_audit_log row into a sentence: "<actor> <verb> <thing> <name>".
// Action keys are ENTITY_VERB[_BULK] (DEPARTMENT_DELETE, SEMESTER_COURSE_BULK_ADD, ATTENDANCE_MARK_BULK).

const VERBS = {
  CREATE: "created", ADD: "added", UPDATE: "updated", EDIT: "edited", DELETE: "deleted", REMOVE: "removed",
  RESTORE: "restored", PROMOTE: "promoted", SUSPEND: "suspended", REACTIVATE: "reactivated",
  IMPERSONATE: "impersonated", ASSIGN: "assigned", UNASSIGN: "unassigned", SET: "changed", TOGGLE: "switched",
  READ: "viewed", VIEW: "viewed", MARK: "marked", SYNC: "synced", REORDER: "reordered", PUBLISH: "published",
  UNPUBLISH: "unpublished", ARCHIVE: "archived", APPROVE: "approved", REJECT: "rejected", IMPORT: "imported",
  EXPORT: "exported", MOVE: "moved", RESET: "reset", CLEAR: "cleared", GRADE: "graded", UPLOAD: "uploaded",
  SEND: "sent", INVITE: "invited", CLOSE: "closed", OPEN: "opened", COMPLETE: "completed", ROLLBACK: "rolled back",
};

const THING_WORDS = {
  CLASS_SCHEDULE: "a class session", LESSON_CONTENT: "lesson content", LECTURE_HALL: "lecture hall",
  SEMESTER_COURSE: "semester courses", MODULE_ACCESS: "module access for", COLLEGE_FEATURE: "a college feature",
  LEARNER_IDENTITY: "student identity documents of", PROJECT_TASK_COMMENT: "a comment on task",
  PROJECT_TASK: "task", PROJECT: "project", BATCH_SEMESTER: "the semester of batch",
  COURSE_BULK_STATUS: "the status of courses",
  LEARNER: "student", LEARNER_PROFILE: "student profile",
};

const lowerWords = (tokens) => tokens.join(" ").toLowerCase();

// Whole keys whose word-by-word reading comes out wrong ("assigned project" for a mentor change).
const SENTENCES = {
  LEARNER_PROFILE_WRITE_BY_OTHER: { verb: "edited", thing: "the profile of" },
  PROJECT_ASSIGN_MENTOR: { verb: "assigned", thing: "a mentor to project" },
  PROJECT_ASSIGN_LEARNERS: { verb: "assigned", thing: "students to project" },
  PROJECT_RESOURCE_SYNC: { verb: "updated", thing: "the resources of project" },
  PROJECT_MEETINGS_SYNC: { verb: "updated", thing: "the meetings of project" },
  PROJECT_TASK_REORDER: { verb: "reordered", thing: "tasks in project" },
  CLASS_SCHEDULE_RECURRING_CREATE: { verb: "created", thing: "repeating class sessions" },
  SEMESTER_COURSE_BULK_ADD: { verb: "added", thing: "courses to semester" },
  SEMESTER_COURSE_REMOVE: { verb: "removed", thing: "a course from semester" },
  JOB_UPDATED: { verb: "updated", thing: "drive" },
};

export function describeActivity(row) {
  const fixed = SENTENCES[String(row?.actionKey || "").toUpperCase()];
  if (fixed) {
    const bulk = String(row?.actionKey || "").toUpperCase().includes("BULK");
    return { ...fixed, bulk, sentence: `${fixed.verb} ${fixed.thing}` };
  }
  const tokens = String(row?.actionKey || "").toUpperCase().split("_").filter(Boolean);
  let verbIndex = -1;
  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    if (VERBS[tokens[i]]) { verbIndex = i; break; }
  }
  const bulk = tokens.includes("BULK");
  if (verbIndex < 0) {
    const thing = lowerWords(tokens.filter((t) => t !== "BULK")) || "something";
    return { verb: "changed", thing, bulk, sentence: `changed ${thing}` };
  }
  const entityTokens = tokens.slice(0, verbIndex).filter((t) => t !== "BULK");
  const key = entityTokens.join("_");
  // "STATUS" in COURSE_BULK_STATUS_UPDATE belongs to the thing ("the status of courses").
  const thing = THING_WORDS[key] || THING_WORDS[tokens.slice(0, verbIndex).join("_")] || lowerWords(entityTokens) || "an item";
  const verb = VERBS[tokens[verbIndex]];
  return { verb, thing, bulk, sentence: `${verb} ${thing}` };
}

const NAME_KEYS = ["name", "title", "batchName", "courseName", "departmentName", "className", "lessonName",
  "programName", "semesterName", "label", "contentTitle", "quizTitle", "projectName", "taskTitle"];

/**
 * The item's human name: from the payload, else from the server's targetNames lookup
 * ("learner:152" -> "Meghana Reddy"), since most rows store only an id. Null when neither has it.
 */
export function activityName(row, targetNames = {}) {
  const p = row?.payloadJson || {};
  const looked = targetNames[`${String(row?.entityType || "").toLowerCase()}:${row?.entityId}`];
  for (const key of NAME_KEYS) {
    if (p[key] != null && String(p[key]).trim()) return String(p[key]).trim();
  }
  const person = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
  if (person) return person;
  return looked || null;
}

export function activityTone(row) {
  const k = String(row?.actionKey || "").toUpperCase();
  if (/DELETE|REMOVE|SUSPEND|IMPERSONAT|IDENTITY_READ/.test(k)) return "danger";
  if (/PROMOTE|SEMESTER_UPDATE|MODULE_ACCESS|FEATURE_TOGGLE|BULK_STATUS|RESTORE|REACTIVAT/.test(k)) return "warn";
  if (/CREATE|ADD|PUBLISH/.test(k)) return "good";
  return "neutral";
}

const humanKey = (k) => String(k).replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
const shown = (v) => {
  if (v == null) return null;
  if (typeof v === "object") {
    const text = JSON.stringify(v);
    return text.length > 160 ? `${text.slice(0, 160)}…` : text;
  }
  const text = String(v);
  return text.length > 160 ? `${text.slice(0, 160)}…` : text;
};

/** Payload fields as [label, value] pairs for the details panel. */
export function payloadDetails(row) {
  const p = row?.payloadJson || {};
  return Object.entries(p)
    // "null" arrives as a string in some payloads (MODULE_ACCESS_SET's previousValue).
    .filter(([, v]) => v != null && v !== "" && v !== "null")
    .slice(0, 14)
    .map(([k, v]) => [humanKey(k), shown(v)]);
}
