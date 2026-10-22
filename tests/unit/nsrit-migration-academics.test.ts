import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { sha256Hex } from "../../scripts/migrate/nsrit/common";
import { snapshotDigest, toNdjson, type Manifest, type ManifestTable } from "../../scripts/migrate/nsrit/export-lib";
import {
  htmlToText,
  legacyAttendancePercent,
  mapAttendanceStatus,
  mapQuestionType,
  mapSubmissionKind,
  mapTeachingRole,
  parseOptionIds,
  publicHttpUrl,
} from "../../scripts/migrate/nsrit/mappers-academics";
import { buildPlan } from "../../scripts/migrate/nsrit/plan";
import { buildAcademicsPlan, type AcademicsPlan } from "../../scripts/migrate/nsrit/plan-academics";
import { compareFacts } from "../../scripts/migrate/nsrit/reconcile";
import { academicsRejectionReportMarkdown, buildAcademicsReconciliation, academicsReconciliationMarkdown } from "../../scripts/migrate/nsrit/reports-academics";
import { REQUIRED_TABLES, type Snapshot } from "../../scripts/migrate/nsrit/snapshot";
import { STAGE_2B_TABLES } from "../../scripts/migrate/nsrit/export-lib";
import { assertStatementAllowed } from "../../scripts/migrate/nsrit/guards";

type Row = Record<string, unknown>;

// Every value is synthetic: reserved example domains, fake phones, made-up names.
function fixtureTables(): Record<string, Row[]> {
  const tables: Record<string, Row[]> = Object.fromEntries([...REQUIRED_TABLES, ...STAGE_2B_TABLES].map((t) => [t, []]));
  tables.organization = [{ id: 6, name: "Synthetic Org", created_at: "2026-05-01 10:00:00", updated_at: "2026-05-01 10:00:00", is_deleted: 0 }];
  tables.college = [{ id: 6, name: "Synthetic College", unique_id: "synth42", org_id: 6, created_at: "2026-05-01 10:00:00", updated_at: "2026-05-01 10:00:00", is_deleted: 0 }];
  tables.department = [{ id: 1, name: "Computing", college_id: 6, is_deleted: 0, created_at: "2026-05-02 10:00:00" }];
  tables.new_program = [{ id: 10, dept_id: 1, name: "BTech", duration_years: 4, is_deleted: 0 }];
  tables.batch = [{ id: 30, program_id: 10, batch_name: "2026 Batch", academic_year: "2026-27", current_semester: 1, status: "ACTIVE" }];
  tables.semester = [{ id: 20, program_id: 10, semester_number: 1, name: "Semester 1", is_active: 1, total_credits: 20 }];
  tables.class = [
    { id: 40, program_id: 10, batch_id: 30, name: "Sec A", class_type: "SECTION", upper_limit: 60, lower_limit: 1 },
    { id: 41, program_id: 10, batch_id: 30, name: "Sec B", class_type: "SECTION", upper_limit: 60, lower_limit: 1 },
    { id: 42, program_id: 10, batch_id: 30, name: "[Elective] Java Professional Elective 1", class_type: "GROUP_BACKED" },
  ];
  const learner = (id: number, extra: Row = {}): Row => ({
    id,
    college_id: 6,
    class_id: 40,
    first_name: `Learner${id}`,
    last_name: "Synthetic",
    contact_mobile: `98765430${String(id).padStart(2, "0")}`,
    contact_mail: `learner${id}@college.example.edu`,
    roll_number: `R${id}`,
    created_at: `2026-06-0${id} 09:00:00`,
    is_deleted: 0,
    ...extra,
  });
  tables.learner = [
    learner(1),
    learner(2),
    learner(3),
    learner(4),
    learner(5, { suspended_at: "2026-07-01 10:00:00", suspension_reason: "Synthetic" }),
    learner(6, { class_id: 41 }),
  ];
  const faculty = (id: number, extra: Row): Row => ({
    id,
    college_id: 6,
    organization_id: 6,
    first_name: `Faculty${id}`,
    last_name: "Synthetic",
    contact_mobile: `98765435${String(id).padStart(2, "0")}`,
    contact_mail: `faculty${id}@college.example.edu`,
    created_at: "2026-05-03 09:00:00",
    ...extra,
  });
  tables.faculty = [
    faculty(1, { faculty_type: 4, dept_id: 1 }),
    faculty(2, { faculty_type: 0, dept_id: 1 }),
    faculty(3, { first_name: "E2E", faculty_type: 0 }), // rejected as test data
  ];
  tables.course = [
    { id: 100, dept_id: 1, created_by_org_id: 6, course_name: "Algorithms", short_title: "ALG", is_deleted: 0, active: 1, enabled: 1, created_at: "2026-05-10 09:00:00", contents: { introduction_content: "<p>Intro &amp; basics</p>" } },
    { id: 101, dept_id: 1, created_by_org_id: null, course_name: "Retired", short_title: "RET", is_deleted: 1, active: 0, enabled: 0 },
    { id: 102, dept_id: 1, created_by_org_id: 6, course_name: "Databases", short_title: "DBS", is_deleted: 0, active: 1, enabled: 1, created_at: "2026-05-10 09:00:00" },
  ];
  tables.semester_course = [{ id: 1, semester_id: 20, course_id: 100, is_mandatory: 1, credits: 4, course_order: 2, is_deleted: 0 }];
  const lesson = (id: number, courseId: number, name: string, sequence: number, extra: Row = {}): Row => ({
    id,
    course_id: courseId,
    lesson_name: name,
    sequence,
    active: 1,
    enabled: 1,
    is_deleted: 0,
    created_at: "2026-05-11 09:00:00",
    ...extra,
  });
  tables.lesson = [
    lesson(200, 100, "Intro", 1),
    lesson(201, 100, "Intro", 1), // same name, no items: attached to every offering of the course
    lesson(202, 102, "Joins", 1),
    lesson(203, 100, "Test lesson", 2), // junk name
  ];
  const content = (id: number, type: string, title: string, data: Row, extra: Row = {}): Row => ({
    id,
    lesson_id: 200,
    course_id: 100,
    class_id: 40,
    faculty_id: 2,
    content_type: type,
    content_title: title,
    content_data: data,
    sequence: 0,
    points: 0,
    active: 1,
    enabled: 1,
    is_deleted: 0,
    created_at: "2026-05-12 09:00:00",
    ...extra,
  });
  tables.lesson_contents = [
    content(300, "video", "Video one", { file_dto: { cloud_storage_object: "https://cdn.example.edu/v1.mp4" }, duration: 0 }),
    content(301, "resource", "Notes", { file_dto: { cloud_storage_object: "org-6/college-6/res/notes.pdf", size: 10, mimetype: "application/pdf" }, resource_materials: [{ kind: "FILE", file_dto: { cloud_storage_object: "org-6/college-6/res/extra.pdf" } }] }),
    content(302, "assignment", "Task one", { html_content: "<p>Do <b>this</b></p><script>alert(1)</script>", allowed_submission_types: ["WRITTEN_RESPONSE"], due_date: "2026-09-30" }, { points: 10, deadline: "2026-09-30 23:59:59" }),
    content(303, "assignment", "Task zero", {}, { points: 0 }),
    content(304, "video", "Signed video", { file_dto: { cloud_storage_object: "https://cdn.example.edu/v2.mp4?X-Amz-Signature=abc" } }),
    content(305, "resource", "Hidden notes", { link: "https://docs.example.edu/a" }, { enabled: 0 }),
    content(306, "video", "Gone video", { file_dto: { cloud_storage_object: "https://cdn.example.edu/v3.mp4" } }, { is_deleted: 1 }),
    content(307, "video", "Elective video", { file_dto: { cloud_storage_object: "https://cdn.example.edu/v4.mp4" } }, { class_id: 42 }),
  ];
  tables.quizzes = [
    { id: 400, lesson_id: 200, course_id: 100, class_id: 40, faculty_id: 2, title: "Quiz one", status: "PUBLISHED", max_attempts: 1, total_points: 99, active: 1, enabled: 1, is_deleted: 0, is_grade_published: 1, shuffle_questions: 1, shuffle_options: 0, due_at: "2026-10-01 18:00:00", created_at: "2026-05-13 09:00:00" },
    { id: 401, lesson_id: 200, course_id: 100, class_id: 40, faculty_id: 2, title: "Empty quiz", status: "PUBLISHED", max_attempts: 1, total_points: 5, active: 1, enabled: 1, is_deleted: 0 },
  ];
  tables.quiz_questions = [
    { id: 500, quiz_id: 400, question_type: "SINGLE_CHOICE", prompt: "Pick one", points: 1, sequence: 1, is_deleted: 0 },
    { id: 501, quiz_id: 400, question_type: "MULTIPLE_CHOICE", prompt: "Pick two", points: 2.5, sequence: 2, is_deleted: 0 },
  ];
  tables.quiz_options = [
    { id: 1001, question_id: 500, option_text: "A", correct: 1, sequence: 1, is_deleted: 0 },
    { id: 1002, question_id: 500, option_text: "B", correct: 0, sequence: 2, is_deleted: 0 },
    { id: 1003, question_id: 501, option_text: "C", correct: 1, sequence: 1, is_deleted: 0 },
    { id: 1004, question_id: 501, option_text: "D", correct: 1, sequence: 2, is_deleted: 0 },
    { id: 1005, question_id: 501, option_text: "E", correct: 0, sequence: 3, is_deleted: 0 },
  ];
  tables.quiz_attempts = [
    { id: 600, quiz_id: 400, learner_id: 1, attempt_number: 1, status: "SUBMITTED", score: 3, max_score: 4, submitted_at: "2026-09-02 10:30:00", is_deleted: 0 },
    { id: 601, quiz_id: 400, learner_id: 6, attempt_number: 1, status: "SUBMITTED", score: 1, max_score: 4, submitted_at: "2026-09-02 10:30:00", is_deleted: 0 },
    { id: 602, quiz_id: 400, learner_id: 5, attempt_number: 1, status: "SUBMITTED", score: 1, max_score: 4, submitted_at: "2026-09-02 10:30:00", is_deleted: 0 },
    { id: 603, quiz_id: 400, learner_id: 2, attempt_number: 1, status: "IN_PROGRESS", score: 0, max_score: 4, is_deleted: 0 },
  ];
  tables.quiz_answers = [
    { id: 700, attempt_id: 600, question_id: 500, selected_option_ids: "1001", correct: 1, points_awarded: 1, is_deleted: 0 },
    { id: 701, attempt_id: 600, question_id: 501, selected_option_ids: "1003, 1004, 9999", correct: 1, points_awarded: 2, is_deleted: 0 },
  ];
  tables.student_assignment = [
    { id: 800, lesson_content_id: 302, student_id: 1, submission_type: "WRITTEN_RESPONSE", html_content: "<p>my answer</p>", grading_status: "GRADED", graded: 1, points_obtained: 7.5, previous_points: 4.5, attempt_number: 2, graded_by: 2, graded_at: "2026-09-10 11:00:00", is_grade_published: 1, created_at: "2026-09-01 09:00:00", updated_at: "2026-09-09 09:00:00", is_deleted: 0 },
    { id: 801, lesson_content_id: 302, student_id: 2, submission_type: "PDF_UPLOAD", submission_assets: [{ file_dto: { cloud_storage_object: "org-6/college-6/assignments/a.pdf", size: 5, mimetype: "application/pdf" } }], grading_status: "NOT_GRADED", is_deleted: 0 },
    { id: 802, lesson_content_id: 302, student_id: 3, submission_type: null, assignment_contents: { cloud_storage_object: "org-6/college-6/assignments/teacher.pdf" }, is_deleted: 0 },
    { id: 803, lesson_content_id: 302, student_id: 4, submission_type: "WRITTEN_RESPONSE", html_content: "<p>x</p>", grading_status: "GRADED", graded: 1, points_obtained: 11, graded_by: 2, is_deleted: 0 },
  ];
  tables.learner_content_progress = [
    { id: 900, learner_id: 1, lesson_content_id: 300, last_position_seconds: 55, completed_at: "2026-09-03 10:00:00", attempt: 1, is_deleted: 0, created_at: "2026-09-03 09:00:00" },
    { id: 901, learner_id: 1, lesson_content_id: 302, last_position_seconds: 0, completed_at: "2026-09-04 10:00:00", attempt: 1, is_deleted: 0 },
  ];
  tables.class_schedule = [
    { id: 1000, class_id: 40, course_id: 100, faculty_id: 2, lecture_hall_id: 0, title: "Lecture 1", start_time: "2026-09-01 10:00:00", end_time: "2026-09-01 11:00:00", is_deleted: 0, created_at: "2026-08-30 09:00:00" },
    { id: 1001, class_id: 40, course_id: 100, faculty_id: 2, lecture_hall_id: 0, title: "Lecture 2", start_time: "2027-01-01 10:00:00", end_time: "2027-01-01 11:00:00", is_deleted: 0 },
    { id: 1002, class_id: 40, course_id: 100, faculty_id: 2, title: "Demo Attendance Session 1", start_time: "2026-09-02 10:00:00", end_time: "2026-09-02 11:00:00", is_deleted: 0 },
  ];
  tables.attend = [
    { id: 1100, class_schedule_id: 1000, student_id: "2", attendance_status: null, is_deleted: 0, created_at: "2026-09-01 12:00:00" },
    { id: 1101, class_schedule_id: 1001, student_id: "2", attendance_status: null, is_deleted: 0 },
    { id: 1102, class_schedule_id: 1000, student_id: "6", attendance_status: null, is_deleted: 0 },
    { id: 1103, class_schedule_id: 1002, student_id: "3", attendance_status: null, is_deleted: 0 },
  ];
  tables.faculty_teaching_assignment = [
    { id: 1200, faculty_id: 2, course_id: 100, class_id: 40, role: "PRIMARY", is_active: 1, is_deleted: 0, created_at: "2026-05-14 09:00:00" },
    { id: 1201, faculty_id: 3, course_id: 100, class_id: 40, role: "CO_TEACHER", is_active: 1, is_deleted: 0 },
  ];
  tables.faculty_course_mapping = [{ id: 1300, faculty_id: 2, course_id: 100, class_id: 40, active: 1, is_deleted: 0 }];
  tables.classroom_messages = [
    { id: 1400, course_id: 100, class_id: 40, sender_id: 1, sender_role: "Learner", message_text: "Hello class", is_pinned: 0, is_deleted: 0, created_at: "2026-09-05 09:00:00" },
    { id: 1401, course_id: 100, class_id: 40, sender_id: 1, sender_role: "Learner", message_text: "Removed", is_pinned: 0, is_deleted: 1 },
  ];
  tables.announcements = [
    { id: 1500, receiver_type: "COLLEGE", receiver_value: 6, sender_type: "ADMIN", sender_id: 1, title: "Welcome", message: "<p>Term starts</p>", is_deleted: 0, is_pinned: 1 },
  ];
  tables.lms_group = [{ id: 1, kind: "ELECTIVE", status: "ARCHIVED", name: "Java Professional Elective 1", is_deleted: 0 }];
  tables.elective_slot = [{ id: 1, name: "Professional Elective 1", status: "ARCHIVED", is_deleted: 0 }];
  return tables;
}

function toSnapshot(tables: Record<string, Row[]>): Snapshot {
  const manifestTables: Record<string, ManifestTable> = {};
  for (const [name, rows] of Object.entries(tables)) {
    manifestTables[name] = {
      file: `${name}.ndjson`,
      rows: rows.length,
      sha256: sha256Hex(toNdjson(rows)),
      scope: "synthetic",
      columns: [],
      deniedColumns: [],
      scrubbedJsonKeys: 0,
    };
  }
  const manifest: Manifest = {
    format: "nsrit-snapshot-1",
    exporter: "test",
    legacyDatabase: "synthetic",
    exportedAt: "2026-10-16T00:00:00Z",
    college: { legacyCollegeId: 6, legacyOrgId: 6 },
    snapshotSha256: snapshotDigest(manifestTables),
    tables: manifestTables,
  };
  return { dir: "memory", manifest, tables };
}

const TODAY = new Date("2026-10-16T00:00:00Z");
const AS_OF = new Date("2026-10-16T00:00:00Z");

function plans(keep: string[] = []) {
  const snapshot = toSnapshot(fixtureTables());
  const base = buildPlan(snapshot, { today: TODAY });
  return { snapshot, base, plan: buildAcademicsPlan(snapshot, base, { asOf: AS_OF, keepNameJunkFor: keep }) };
}

const rejected = (plan: AcademicsPlan, entity: string) =>
  Object.fromEntries(
    Object.entries(plan.stats[entity]?.rejected ?? {}).map(([reason, n]) => [reason, n]),
  );

describe("stage 2b-i pure mappers", () => {
  it("turns legacy HTML into safe plain text", () => {
    const text = htmlToText("<p>Do <b>this</b> &amp; that</p><script>alert(1)</script><style>x{}</style><ul><li>one</li><li>two</li></ul>&lt;img src=x onerror=1&gt;");
    expect(text).not.toMatch(/script|alert|<|style/i);
    expect(text).toContain("Do this & that");
    expect(text).toContain("- one");
    expect(htmlToText(null)).toBe("");
  });
  it("keeps only stable public http(s) URLs", () => {
    expect(publicHttpUrl("https://cdn.example.edu/a.mp4").url).toBe("https://cdn.example.edu/a.mp4");
    expect(publicHttpUrl("https://u:p@cdn.example.edu/a").url).toBeNull();
    expect(publicHttpUrl("javascript:alert(1)").url).toBeNull();
    expect(publicHttpUrl("https://cdn.example.edu/a?X-Amz-Signature=1")).toEqual({ url: null, signed: true });
    expect(publicHttpUrl("org-6/college-6/file.pdf").url).toBeNull();
  });
  it("maps enums without guessing", () => {
    expect(mapAttendanceStatus(null)).toBe("ABSENT");
    expect(mapAttendanceStatus("medical")).toBe("MEDICAL");
    expect(mapAttendanceStatus("SICK")).toBeNull();
    expect(mapQuestionType("single_choice")).toBe("SINGLE_CHOICE");
    expect(mapQuestionType("ESSAY")).toBeNull();
    expect(mapTeachingRole(undefined)).toBe("PRIMARY");
    expect(mapTeachingRole("GUEST")).toBeNull();
    expect(mapSubmissionKind("PDF_UPLOAD")).toBe("FILE");
    expect(mapSubmissionKind("WRITTEN_RESPONSE")).toBe("TEXT");
    expect(mapSubmissionKind(null)).toBeNull();
    expect(mapSubmissionKind("SMOKE_SIGNAL")).toBe("UNKNOWN");
  });
  it("parses option id lists", () => {
    expect(parseOptionIds("31,32, 34")).toEqual(["31", "32", "34"]);
    expect(parseOptionIds("[7,8]")).toEqual(["7", "8"]);
    expect(parseOptionIds('"9"')).toEqual(["9"]);
    expect(parseOptionIds("")).toEqual([]);
  });
  it("computes the legacy attendance percentage over held sessions", () => {
    expect(legacyAttendancePercent(0, 0)).toBeNull();
    expect(legacyAttendancePercent(20, 4)).toBe(80);
    expect(legacyAttendancePercent(3, 5)).toBe(0);
  });
});

describe("buildAcademicsPlan on a synthetic snapshot", () => {
  const { base, plan } = plans();

  it("loads real courses and rejects soft deleted ones", () => {
    expect(plan.courses.map((c) => c.legacyId)).toEqual(["100", "102"]);
    expect(rejected(plan, "course")).toEqual({ SOFT_DELETED: 1 });
    expect(plan.courses[0].data.description).toBe("Intro & basics");
  });

  it("derives one offering, delivery and path from real evidence only", () => {
    expect(plan.offerings).toHaveLength(1);
    expect(plan.deliveries).toHaveLength(1);
    expect(plan.paths).toHaveLength(1);
    expect(plan.offerings[0].data.credits).toBe(4);
    expect(plan.offerings[0].data.displayOrder).toBe(2);
    expect(plan.offerings[0].data.academicPeriodId).toBe(base.sections.find((s) => s.legacyId === "40")!.data.academicPeriodId);
    expect(plan.deliveries[0].data.sectionId).toBe(base.sections.find((s) => s.legacyId === "40")!.newId);
  });

  it("copies lessons per offering, de-duplicates names and renumbers sequences", () => {
    expect(plan.lessons.map((l) => l.data.name)).toEqual(["Intro", "Intro (2)"]);
    expect(plan.lessons.map((l) => l.data.sequence)).toEqual([0, 1]);
    expect(rejected(plan, "lesson")).toEqual({ NAME_TESTWORD: 1 });
    expect(plan.notes.lessonNameDeduplicated).toBe(1);
  });

  it("maps content types: video stays a public reference, resource files wait, hidden stays hidden", () => {
    const byId = new Map(plan.contents.map((c) => [c.legacyId, c]));
    expect(byId.get("300")!.data.externalUrl).toBe("https://cdn.example.edu/v1.mp4");
    expect(byId.get("300")!.data.contentType).toBe("RESOURCE");
    expect(byId.get("301")!.data.externalUrl).toBeNull();
    expect(byId.get("301")!.data.notes).toMatch(/pending file migration/);
    expect(JSON.stringify(byId.get("301")!.metadata)).toContain("org-6/college-6/res/notes.pdf");
    expect(JSON.stringify(byId.get("301")!.metadata)).toContain("extra.pdf");
    expect(byId.get("305")!.data.status).toBe("DRAFT");
    expect(byId.get("305")!.data.visibleToStudents).toBe(false);
    expect([...byId.keys()].sort()).toEqual(["300", "301", "305"]);
    expect(rejected(plan, "lesson_content")).toEqual({ NO_MEDIA_REFERENCE: 1, SOFT_DELETED: 1, ARCHIVED_ELECTIVE: 1 });
    expect(plan.notes.signedUrlDropped).toBe(1);
    expect(plan.notes.videoKeptAsExternalReference).toBe(1);
    // No storage key is ever invented: the planner has no such field at all.
    expect(JSON.stringify(plan.contents)).not.toMatch(/storageKey|storage_key/);
  });

  it("keeps assignment html safely in metadata and plain text in the description", () => {
    expect(plan.assignments).toHaveLength(1);
    const a = plan.assignments[0];
    expect(a.data.description).toBe("Do this");
    expect(a.data.maxPoints).toBe(10);
    expect(a.data.dueAt).toBe("2026-09-30T18:29:59.000Z"); // 23:59:59 IST
    expect(JSON.stringify(a.metadata)).toContain("<script>");
    expect(rejected(plan, "assignment")).toEqual({ ZERO_POINTS: 1 });
  });

  it("gives every item of a lesson and delivery a distinct dense sequence", () => {
    const seen = new Map<string, number[]>();
    for (const x of [...plan.contents, ...plan.assignments, ...plan.quizzes]) {
      const key = `${x.data.lessonId}|${x.data.deliveryId}`;
      seen.set(key, [...(seen.get(key) ?? []), x.data.sequence]);
    }
    for (const sequences of seen.values()) {
      expect([...sequences].sort((a, b) => a - b)).toEqual(sequences.map((_, i) => i));
    }
  });

  it("recomputes quiz totals, rounds half up and rejects empty quizzes", () => {
    expect(plan.quizzes).toHaveLength(1);
    expect(plan.quizzes[0].data.totalPoints).toBe(4); // 1 + round(2.5)
    expect(plan.quizzes[0].data.shuffleQuestions).toBe(true);
    expect(plan.notes.quizTotalPointsRecomputed).toBe(1);
    expect(plan.notes.roundedToInteger).toBeGreaterThanOrEqual(2); // 2.5 -> 3 and 7.5 -> 8
    expect(rejected(plan, "quiz")).toEqual({ NO_QUESTIONS: 1 });
    expect(plan.questions.map((q) => q.data.points)).toEqual([1, 3]);
    expect(plan.options).toHaveLength(5);
  });

  it("loads graded text submissions with attempt, previous points and rounding; defers files", () => {
    expect(plan.submissions).toHaveLength(1);
    const s = plan.submissions[0].data;
    expect(s.submissionType).toBe("TEXT");
    expect(s.textContent).toBe("my answer");
    expect(s.pointsAwarded).toBe(8);
    expect(s.previousPoints).toBe(5);
    expect(s.attemptNumber).toBe(2);
    expect(s.gradingStatus).toBe("GRADED");
    expect(s.gradePublished).toBe(true);
    expect(s.gradedByUserId).toBeTruthy();
    expect(rejected(plan, "student_assignment")).toEqual({ NOT_SUBMITTED: 1, INVALID_VALUE: 1 });
    expect(plan.deferred.filter((d) => d.entity === "student_assignment").map((d) => d.reason)).toEqual(["SUBMISSION_FILE_AWAITS_FILES_STAGE"]);
    expect(plan.fileDeferred).toHaveLength(1);
    expect(JSON.stringify(plan.fileDeferred[0].metadata)).toContain("org-6/college-6/assignments/a.pdf");
    expect(plan.fileDeferred[0].newId).toBe(plan.fileDeferred[0].newId);
  });

  it("loads video progress with first completion and attempt; assignment progress has no target", () => {
    expect(plan.progress).toHaveLength(1);
    expect(plan.progress[0].data.firstCompletedAt).toBe(plan.progress[0].data.completedAt);
    expect(plan.progress[0].data.attempt).toBe(1);
    expect(rejected(plan, "learner_content_progress")).toEqual({ NO_VNEXT_TARGET: 1 });
  });

  it("loads quiz attempts as SUBMITTED history with prompt and option snapshots", () => {
    expect(plan.attempts).toHaveLength(1);
    expect(rejected(plan, "quiz_attempt")).toEqual({ LEARNER_NOT_IN_SECTION: 1, LEARNER_NOT_ACTIVE: 1, UNKNOWN_ENUM: 1 });
    expect(plan.answers).toHaveLength(1);
    const answer = plan.answers[0].data;
    expect(answer.questionType).toBe("SINGLE_CHOICE");
    expect(answer.selectedOptionIds).toHaveLength(1);
    expect(answer.optionsSnapshot.map((o) => o.text)).toEqual(["A", "B"]);
    expect(answer.promptSnapshot).toBe("Pick one");
    // A dangling selected option must quarantine the whole multiple-choice
    // answer, rather than silently rewrite history as a partial response.
    expect(plan.answers.some((a) => a.legacyId === "701")).toBe(false);
    expect(rejected(plan, "quiz_answer")).toEqual({PARENT_REJECTED:1});
    expect(plan.notes.answerOptionIdsUnresolved).toBe(1);
  });

  it("rejects the demo schedule in real-data-only mode and keeps it only when told (rehearsal)", () => {
    expect(rejected(plan, "class_schedule")).toEqual({ NAME_TESTWORD: 1 });
    expect(plan.events.map((e) => e.legacyId)).toEqual(["1000", "1001"]);
    const demo = plans(["class_schedule"]).plan;
    expect(demo.events.map((e) => e.legacyId)).toEqual(["1000", "1001", "1002"]);
  });

  it("derives present rows from enrollment x held session and reconciles the counts", () => {
    const enrolledInA = base.people.filter((p) => p.data.enrollment?.sectionId === base.sections.find((s) => s.legacyId === "40")!.newId).length;
    expect(enrolledInA).toBe(5);
    const held = plan.sessions.find((s) => s.legacyId === "1000")!;
    const future = plan.sessions.find((s) => s.legacyId === "1001")!;
    expect(held.data.status).toBe("MARKED");
    expect(held.data.markedByUserId).toBeTruthy();
    expect(future.data.status).toBe("UNMARKED");
    const records = plan.records.filter((r) => r.data.scheduleEventId === held.data.scheduleEventId);
    expect(records).toHaveLength(enrolledInA);
    expect(records.filter((r) => r.data.status === "ABSENT")).toHaveLength(1);
    expect(records.filter((r) => r.data.status === "PRESENT" && r.data.derived)).toHaveLength(enrolledInA - 1);
    expect(plan.records.filter((r) => r.data.scheduleEventId === future.data.scheduleEventId)).toHaveLength(0);
    // absent row on a future session and an absent learner of another section are reported, not dropped silently
    expect(rejected(plan, "attend")).toEqual({ SESSION_NOT_HELD: 1, LEARNER_NOT_IN_SECTION: 1, PARENT_REJECTED: 1 });
    expect(plan.notes.derivedPresentRows).toBe(enrolledInA - 1);
    // attendance_sessions is keyed by the schedule event id
    expect(held.newId).toBe(held.data.scheduleEventId);
  });

  it("legacy facts follow the legacy rules (held sessions only, every attend row is an absence)", () => {
    const absent = plan.legacyFacts.attendance.find((a) => a.learner === "2")!;
    expect(absent).toMatchObject({ held: 1, absent: 1, percent: 0 });
    const present = plan.legacyFacts.attendance.find((a) => a.learner === "1")!;
    expect(present).toMatchObject({ held: 1, absent: 0, percent: 100 });
    const marks = plan.legacyFacts.marks.find((m) => m.learner === "1")!;
    expect(marks).toMatchObject({ assignmentPoints: 8, quizScore: 3, quizMax: 4 });
  });

  it("maps teaching without duplicates and keeps unloaded faculty out", () => {
    expect(plan.teaching).toHaveLength(1);
    expect(plan.teaching[0].data.role).toBe("PRIMARY");
    expect(rejected(plan, "faculty_teaching_assignment")).toEqual({ PERSON_NOT_LOADED: 1 });
    expect(rejected(plan, "faculty_course_mapping")).toEqual({ DUPLICATE_SOURCE: 1 });
    expect(plan.associations).toHaveLength(1);
  });

  it("maps discussion messages and announcements with real senders", () => {
    expect(plan.messages).toHaveLength(1);
    expect(plan.messages[0].data.senderRole).toBe("LEARNER");
    expect(rejected(plan, "classroom_message")).toEqual({ SOFT_DELETED: 1 });
    expect(plan.announcements).toHaveLength(1);
    expect(plan.announcements[0].data).toMatchObject({ receiverType: "COLLEGE", senderType: "COLLEGE_ADMIN", isPinned: true, message: "Term starts" });
    expect(plan.announcements[0].data.receiverId).toBe(base.college.newId);
  });

  it("rejects archived elective graphs with a reason instead of loading them", () => {
    expect(rejected(plan, "elective_class")).toEqual({ ARCHIVED_ELECTIVE: 1 });
    expect(rejected(plan, "lms_group")).toEqual({ ARCHIVED_ELECTIVE: 1 });
    expect(rejected(plan, "elective_slot")).toEqual({ ARCHIVED_ELECTIVE: 1 });
  });

  it("is deterministic: same snapshot, same ids and hashes", () => {
    const again = plans().plan;
    expect(again.contents.map((c) => [c.newId, c.hash])).toEqual(plan.contents.map((c) => [c.newId, c.hash]));
    expect(again.records.map((c) => c.newId)).toEqual(plan.records.map((c) => c.newId));
    expect(new Set(plan.records.map((r) => r.newId)).size).toBe(plan.records.length);
  });

  it("changes the source hash when a legacy value changes", () => {
    const tables = fixtureTables();
    tables.course[0].course_name = "Algorithms II";
    const snapshot = toSnapshot(tables);
    const changed = buildAcademicsPlan(snapshot, buildPlan(snapshot, { today: TODAY }), { asOf: AS_OF });
    expect(changed.courses[0].newId).toBe(plan.courses[0].newId);
    expect(changed.courses[0].hash).not.toBe(plan.courses[0].hash);
  });
});

describe("derived count reconciliation", () => {
  const { plan } = plans();
  it("reports no mismatch when both sides agree", () => {
    const outcome = compareFacts(plan.legacyFacts, {
      attendance: plan.legacyFacts.attendance,
      progress: plan.legacyFacts.progress,
      marks: plan.legacyFacts.marks,
    });
    expect(outcome.mismatches).toEqual([]);
    expect(outcome.matched.attendance).toBe(outcome.sampled.attendance);
  });
  it("lists mismatches by learner with masked references only", () => {
    const attendance = plan.legacyFacts.attendance.map((a, i) => (i === 0 ? { ...a, absent: a.absent + 1, percent: 0 } : a));
    const marks = plan.legacyFacts.marks.slice(1);
    const outcome = compareFacts(plan.legacyFacts, { attendance, progress: plan.legacyFacts.progress, marks });
    expect(outcome.mismatches.map((m) => m.metric).sort()).toEqual(["attendance", "marks"]);
    for (const m of outcome.mismatches) expect(m.learner).toMatch(/^learner#\d+$/);
  });
});

describe("reports and write guards", () => {
  const { plan } = plans();
  it("reports contain counts, reason codes and legacy ids only", () => {
    const md = academicsRejectionReportMarkdown(plan);
    expect(md).toContain("SUBMISSION_FILE_AWAITS_FILES_STAGE");
    expect(md).toContain("ARCHIVED_ELECTIVE");
    const reconciliation = buildAcademicsReconciliation(plan, {}, { mode: "dry-run", batchId: null, snapshotSha256: "a".repeat(64), loaderVersion: "x" });
    const text = academicsReconciliationMarkdown(reconciliation);
    expect(text).not.toMatch(/@college\.example|98765|Learner\d|Faculty\d|Synthetic/);
    expect(md).not.toMatch(/@college\.example|98765|Learner\d|Faculty\d|Synthetic/);
  });
  it("allows the academics tables and still refuses messaging tables", () => {
    for (const table of ["courses", "course_offerings", "lesson_contents", "attendance_records", "quiz_attempt_answers", "announcements"]) {
      expect(() => assertStatementAllowed(`INSERT INTO ${table} (id) VALUES ($1)`)).not.toThrow();
    }
    for (const table of ["outbound_messages", "general_notification_outbox", "assignment_submission_files", "lesson_video_assets"]) {
      expect(() => assertStatementAllowed(`INSERT INTO ${table} (id) VALUES ($1)`)).toThrow(/not allowed/);
    }
  });
  it("every table written by db-academics.ts is on the allowlist and no storage key is written", () => {
    const dir = path.resolve(__dirname, "../../scripts/migrate/nsrit");
    const sql = readFileSync(path.join(dir, "db-academics.ts"), "utf8");
    const guard = readFileSync(path.join(dir, "guards.ts"), "utf8");
    const tables = [...sql.matchAll(/(?:INSERT INTO\s+([a-z_]+)\s*\(|UPDATE\s+([a-z_]+)\s+SET|DELETE FROM\s+([a-z_]+)\s+WHERE)/g)].map((m) => m[1] ?? m[2] ?? m[3]);
    expect(tables.length).toBeGreaterThan(10);
    for (const table of new Set(tables)) expect(guard).toContain(`"${table}"`);
    expect(sql).not.toMatch(/storage_key|object_key|upload_token/);
  });
});
