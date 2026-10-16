/**
 * Pure parts of the NSRIT snapshot export: which columns may leave the legacy
 * database, secret scrubbing for JSON columns, SQL generation and NDJSON/
 * manifest helpers. The only I/O (running the mysql client) is in export.ts.
 */
import { isRecord, sha256Hex } from "./common";

/** Columns that must never be exported, whatever table they are on. */
export const ALWAYS_DENIED_COLUMNS = new Set([
  "identity", // Aadhaar/PAN numbers and uploads
  "photo",
  "profile_photo",
  "photo_url",
  "certificate_upload", // private document key
  "organizations", // legacy JSON list of org ids, not needed
  "bulk_import_batch_id",
]);

/** Column names that look like secrets are dropped, not hashed or copied. */
export const SECRET_COLUMN_PATTERN =
  /(^|_)(otp|token|tokens|password|passwd|pwd|secret|salt|hash|apikey|api_key)(_|$)/i;

/** JSON keys removed (recursively) from exported JSON column values. */
export const SECRET_JSON_KEY_PATTERN =
  /otp|token|password|passwd|secret|api[_-]?key|authorization|aadhaar|aadhar|pan[_-]?number/i;

export type ColumnInfo = { name: string; dataType: string };

export type TableSpec = {
  table: string;
  /** SQL predicate (read-only SELECT, college 6 / org 6 scope). */
  where: string;
  /** Why the rows are in scope; copied into the manifest. */
  scope: string;
  /** Extra denied columns beyond the global rules. */
  deny?: string[];
  /** When set, ONLY these columns are exported. */
  only?: string[];
};

export function isDeniedColumn(column: string, spec: TableSpec): boolean {
  return (
    ALWAYS_DENIED_COLUMNS.has(column) ||
    SECRET_COLUMN_PATTERN.test(column) ||
    (spec.deny ?? []).includes(column) ||
    (spec.only !== undefined && !spec.only.includes(column))
  );
}

export function selectableColumns(
  columns: ColumnInfo[],
  spec: TableSpec,
): { kept: ColumnInfo[]; denied: string[] } {
  const kept: ColumnInfo[] = [];
  const denied: string[] = [];
  for (const column of columns) {
    if (isDeniedColumn(column.name, spec)) denied.push(column.name);
    else kept.push(column);
  }
  return { kept, denied };
}

const q = (identifier: string) => `\`${identifier.replace(/`/g, "")}\``;

/** One JSON object per row: JSON escapes newlines, so output is line-safe. */
export function buildSelectSql(
  spec: TableSpec,
  kept: ColumnInfo[],
): string {
  const parts = kept.map((column) => {
    const ref = q(column.name);
    let expr = ref;
    if (column.dataType === "bit") expr = `(${ref}+0)`;
    else if (column.dataType === "decimal") expr = `CAST(${ref} AS CHAR)`;
    return `'${column.name.replace(/'/g, "")}', ${expr}`;
  });
  return `SELECT JSON_OBJECT(${parts.join(", ")}) FROM ${q(spec.table)} WHERE ${spec.where} ORDER BY ${q("id")}`;
}

export function scrubSecrets(
  value: unknown,
  counter: { removed: number },
): unknown {
  if (Array.isArray(value)) return value.map((v) => scrubSecrets(v, counter));
  if (isRecord(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value)) {
      if (SECRET_JSON_KEY_PATTERN.test(key)) {
        counter.removed += 1;
        continue;
      }
      out[key] = scrubSecrets(v, counter);
    }
    return out;
  }
  return value;
}

/** Parses mysql `--raw --batch` output where each line is one JSON object. */
export function parseJsonLines(output: string): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  for (const line of output.split("\n")) {
    const text = line.replace(/\r$/, "");
    if (!text.trim()) continue;
    const parsed: unknown = JSON.parse(text);
    if (!isRecord(parsed)) throw new Error("Unexpected non-object row in export output");
    rows.push(parsed);
  }
  return rows;
}

export function toNdjson(rows: Record<string, unknown>[]): string {
  return rows.map((row) => JSON.stringify(row)).join("\n") + (rows.length ? "\n" : "");
}

export type ManifestTable = {
  file: string;
  rows: number;
  sha256: string;
  scope: string;
  columns: string[];
  deniedColumns: string[];
  scrubbedJsonKeys: number;
};

export type Manifest = {
  format: "nsrit-snapshot-1";
  exporter: string;
  legacyDatabase: string;
  exportedAt: string;
  college: { legacyCollegeId: number; legacyOrgId: number };
  snapshotSha256: string;
  tables: Record<string, ManifestTable>;
};

/** Hash over the per-file hashes in table-name order; stored on the import batch. */
export function snapshotDigest(tables: Record<string, ManifestTable>): string {
  return sha256Hex(
    Object.keys(tables)
      .sort()
      .map((name) => `${name}:${tables[name].rows}:${tables[name].sha256}`)
      .join("\n"),
  );
}

const DEPT = "(select id from department where college_id = 6)";
const NEW_PROGRAM = `(select id from new_program where dept_id in ${DEPT})`;
const BATCH = `(select id from batch where program_id in ${NEW_PROGRAM})`;
const LEARNERS = "(select id from learner where college_id = 6)";
const CLASSES = `(select id from class where program_id in ${NEW_PROGRAM} or batch_id in ${BATCH})`;
const FACULTY_IDS = "(select id from faculty where college_id = 6 or organization_id = 6)";
const COURSES = `(select id from course where dept_id in ${DEPT} or created_by_org_id = 6)`;
const LESSONS = `(select id from lesson where course_id in ${COURSES})`;
const RECRUITERS =
  "(select recruiter_id from recruiter_college_access where college_id = 6 or organization_id = 6)";

/** Foundation + people tables for stage 2a (college 6, organization 6). */
export const TABLE_SPECS: TableSpec[] = [
  { table: "organization", where: "id = 6", scope: "organization.id = 6" },
  { table: "college", where: "id = 6", scope: "college.id = 6 (NSRIT)" },
  { table: "department", where: "college_id = 6", scope: "college_id = 6" },
  { table: "new_program", where: `dept_id in ${DEPT}`, scope: "dept_id in NSRIT departments" },
  { table: "batch", where: `program_id in ${NEW_PROGRAM}`, scope: "program_id in NSRIT new_program" },
  {
    table: "class",
    where: `program_id in ${NEW_PROGRAM} or batch_id in ${BATCH}`,
    scope: "program_id in NSRIT new_program or batch_id in NSRIT batch",
  },
  { table: "semester", where: `program_id in ${NEW_PROGRAM}`, scope: "program_id in NSRIT new_program" },
  { table: "lecture_hall", where: "college_id = 6", scope: "college_id = 6" },
  {
    table: "learner",
    where: "college_id = 6",
    scope: "college_id = 6",
    deny: ["token_version"],
  },
  {
    table: "qualification",
    where: `learner_id in ${LEARNERS}`,
    scope: "learner_id in NSRIT learners",
  },
  {
    table: "faculty",
    where: "college_id = 6 or organization_id = 6",
    scope: "college_id = 6 or organization_id = 6",
    deny: ["token_version"],
  },
  {
    table: "recruiter",
    where: `id in ${RECRUITERS}`,
    scope: "recruiters with access to college 6",
    deny: ["token_version"],
  },
  {
    table: "recruiter_college_access",
    where: "college_id = 6 or organization_id = 6",
    scope: "college_id = 6 or organization_id = 6",
  },
  {
    table: "company",
    where: `id in (select company_id from recruiter where id in ${RECRUITERS} and company_id is not null)`,
    scope: "companies of NSRIT recruiters (name/site only)",
    only: ["id", "name", "website", "industry", "is_deleted", "created_at", "updated_at"],
  },
  {
    table: "industry_company",
    where: `id in (select industry_company_id from recruiter where id in ${RECRUITERS} and industry_company_id is not null)`,
    scope: "industry companies of NSRIT recruiters (name/site only)",
    only: ["id", "name", "website", "industry", "is_deleted", "created_at", "updated_at"],
  },

  // ------------------------------------------------------------- stage 2b-i
  {
    table: "semester_course",
    where: `semester_id in (select id from semester where program_id in ${NEW_PROGRAM})`,
    scope: "semester_id in NSRIT semesters",
  },
  { table: "course", where: `dept_id in ${DEPT} or created_by_org_id = 6`, scope: "dept_id in NSRIT departments or created_by_org_id = 6" },
  { table: "lesson", where: `course_id in ${COURSES}`, scope: "course_id in NSRIT courses" },
  {
    table: "lesson_contents",
    where: `course_id in ${COURSES} or lesson_id in ${LESSONS} or class_id in ${CLASSES}`,
    scope: "course, lesson or class in NSRIT",
  },
  {
    table: "lesson_content_class_sequence",
    where: `class_id in ${CLASSES}`,
    scope: "class_id in NSRIT classes",
  },
  {
    table: "faculty_course_mapping",
    where: `faculty_id in ${FACULTY_IDS} or class_id in ${CLASSES}`,
    scope: "NSRIT faculty or class",
  },
  {
    table: "faculty_teaching_assignment",
    where: `faculty_id in ${FACULTY_IDS} or class_id in ${CLASSES}`,
    scope: "NSRIT faculty or class",
  },
  {
    table: "faculty_course_associations",
    where: `faculty_id in ${FACULTY_IDS} or course_id in ${COURSES}`,
    scope: "NSRIT faculty or course",
  },
  {
    table: "learner_content_progress",
    where: `learner_id in ${LEARNERS} or lesson_content_id in (select id from lesson_contents where course_id in ${COURSES} or class_id in ${CLASSES})`,
    scope: "NSRIT learners or NSRIT lesson contents",
  },
  {
    table: "student_assignment",
    where: `student_id in ${LEARNERS} or lesson_content_id in (select id from lesson_contents where course_id in ${COURSES} or class_id in ${CLASSES})`,
    scope: "NSRIT learners or NSRIT lesson contents",
  },
  {
    table: "class_schedule",
    where: `class_id in ${CLASSES}`,
    scope: "class_id in NSRIT classes",
  },
  {
    table: "attend",
    where: `class_schedule_id in (select id from class_schedule where class_id in ${CLASSES})`,
    scope: "schedule of NSRIT classes (absentee rows)",
  },
  {
    table: "quizzes",
    where: `course_id in ${COURSES} or class_id in ${CLASSES}`,
    scope: "NSRIT course or class",
  },
  {
    table: "quiz_questions",
    where: `quiz_id in (select id from quizzes where course_id in ${COURSES} or class_id in ${CLASSES})`,
    scope: "quizzes of NSRIT",
  },
  {
    table: "quiz_options",
    where: `question_id in (select id from quiz_questions where quiz_id in (select id from quizzes where course_id in ${COURSES} or class_id in ${CLASSES}))`,
    scope: "questions of NSRIT quizzes",
  },
  {
    table: "quiz_attempts",
    where: `learner_id in ${LEARNERS} or quiz_id in (select id from quizzes where course_id in ${COURSES} or class_id in ${CLASSES})`,
    scope: "NSRIT learners or NSRIT quizzes",
  },
  {
    table: "quiz_answers",
    where: `attempt_id in (select id from quiz_attempts where learner_id in ${LEARNERS} or quiz_id in (select id from quizzes where course_id in ${COURSES} or class_id in ${CLASSES}))`,
    scope: "attempts of NSRIT",
  },
  {
    table: "classroom_messages",
    where: `course_id in ${COURSES} or class_id in ${CLASSES}`,
    scope: "NSRIT course or class",
  },
  {
    table: "announcements",
    where: `(receiver_type = 'COLLEGE' and receiver_value = 6) or (receiver_type = 'DEPARTMENT' and receiver_value in ${DEPT}) or (receiver_type = 'PROGRAM' and receiver_value in ${NEW_PROGRAM}) or (receiver_type = 'CLASS' and receiver_value in ${CLASSES}) or (receiver_type = 'LEARNER' and receiver_value in ${LEARNERS}) or (receiver_type = 'FACULTY' and receiver_value in ${FACULTY_IDS})`,
    scope: "receiver is NSRIT college, department, program, class, learner or faculty",
  },
  { table: "lms_group", where: "college_id = 6", scope: "college_id = 6" },
  { table: "lms_group_member", where: "group_id in (select id from lms_group where college_id = 6)", scope: "groups of NSRIT" },
  { table: "lms_group_member_event", where: "group_id in (select id from lms_group where college_id = 6)", scope: "groups of NSRIT" },
  { table: "lms_group_rule", where: "group_id in (select id from lms_group where college_id = 6)", scope: "groups of NSRIT" },
  { table: "elective_slot", where: "college_id = 6", scope: "college_id = 6" },
  { table: "elective_offering", where: "slot_id in (select id from elective_slot where college_id = 6)", scope: "slots of NSRIT" },
];

/** Tables first needed by stage 2b-i (optional when reading a 2a-only snapshot). */
export const STAGE_2B_TABLES: string[] = TABLE_SPECS.slice(
  TABLE_SPECS.findIndex((s) => s.table === "semester_course"),
).map((s) => s.table);
