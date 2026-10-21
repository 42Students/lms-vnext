/**
 * Pure planner for NSRIT stage 2b-i (academics): courses, offerings,
 * deliveries, teaching, lessons and contents, assignments and submissions,
 * progress, schedule and attendance, quizzes, discussion messages and
 * announcements. It builds on the stage 2a plan (deterministic ids of
 * sections, people, departments) and never touches a database. Every legacy
 * row that is not planned is recorded with a reason code; reports carry
 * legacy numeric ids and counts only.
 *
 * Derived structure (documented decisions):
 *  - A DELIVERY exists for every (course, class) pair that has real evidence:
 *    a teaching assignment, a faculty-course mapping, a lesson content, a
 *    quiz, a scheduled class or a classroom message (only evidence rows that
 *    were themselves accepted count).
 *  - An OFFERING exists for every (course, cohort) with a delivery; its period
 *    is the cohort start period (the one stage 2a gave the sections).
 *  - One learning path per offering. Legacy lessons belong to a course, so a
 *    lesson is copied into every offering that uses it (items in a class of
 *    that cohort) and, when it has no items at all, into every offering of its
 *    course.
 */
import {
  istDateOnly,
  istNaiveToUtcIso,
  nsritId,
  sourceHash,
  LOADER_VERSION_2B,
} from "./common";
import { junkReasonsFor, type JunkReason } from "./filters";
import { str, toIntRoundHalfUp, uniqueCode, type Row } from "./mappers";
import {
  asJsonObject,
  fileReference,
  htmlToText,
  mapAttendanceStatus,
  mapQuestionType,
  mapQuizStatus,
  mapSubmissionKind,
  mapTeachingRole,
  legacyAttendancePercent,
  parseOptionIds,
  pct2,
  plainText,
  publicHttpUrl,
  type AttendanceStatusName,
} from "./mappers-academics";
import {
  Collector,
  type CohortData,
  type DepartmentData,
  type Deferral,
  type EntityStat,
  type PersonData,
  type Plan,
  type Planned,
  type ProgramData,
  type Reason,
  type Rejection,
  type SectionData,
} from "./plan";
import type { Snapshot } from "./snapshot";

const idOf = (row: Row) => String(row.id);
const lower = (value: string) => value.toLowerCase();
const ist = (value: unknown) => istNaiveToUtcIso(str(value));
const isTrue = (value: unknown) => value === 1 || value === "1" || value === true;
const isFalse = (value: unknown) => value === 0 || value === "0" || value === false;

function item2b<T>(
  legacyType: string,
  legacyId: string,
  newType: string,
  data: T,
  legacyRow: unknown,
  metadata?: Record<string, unknown>,
): Planned<T> {
  return {
    legacyType,
    legacyId,
    newType,
    newId: nsritId(newType, legacyType, legacyId),
    hash: sourceHash({ legacy: legacyRow, mapped: data, metadata: metadata ?? null }, LOADER_VERSION_2B),
    data,
    ...(metadata ? { metadata } : {}),
  };
}

// --------------------------------------------------------------------- types

export type CourseData = {
  departmentId: string;
  name: string;
  code: string;
  description: string | null;
  status: "ACTIVE" | "ARCHIVED";
  createdAt: string | null;
  updatedAt: string | null;
};
export type OfferingData = {
  courseId: string;
  cohortId: string;
  academicPeriodId: string;
  type: "CORE" | "ELECTIVE";
  credits: number | null;
  displayOrder: number;
  createdAt: string | null;
  updatedAt: string | null;
};
export type DeliveryData = {
  offeringId: string;
  sectionId: string;
  startedAt: string;
  createdAt: string | null;
  updatedAt: string | null;
};
export type TeachingData = {
  deliveryId: string;
  membershipId: string;
  userId: string;
  courseId: string;
  role: "PRIMARY" | "CO_TEACHER" | "TA";
  startedAt: string;
  endedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};
export type AssociationData = {
  membershipId: string;
  courseId: string;
  startedAt: string;
  endedAt: string | null;
};
export type PathData = {
  offeringId: string;
  title: string;
  status: "PUBLISHED";
  createdAt: string | null;
  updatedAt: string | null;
};
export type LessonData = {
  learningPathId: string;
  name: string;
  sequence: number;
  status: "ACTIVE" | "ARCHIVED";
  createdAt: string | null;
  updatedAt: string | null;
};
export type ContentData = {
  lessonId: string;
  deliveryId: string;
  contentType: "RESOURCE";
  title: string;
  notes: string | null;
  externalUrl: string | null;
  sequence: number;
  status: "PUBLISHED" | "DRAFT";
  visibleToStudents: boolean;
  createdByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};
export type AssignmentData = {
  lessonId: string;
  deliveryId: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  maxPoints: number;
  sequence: number;
  status: "PUBLISHED" | "DRAFT";
  createdByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};
export type SubmissionData = {
  assignmentId: string;
  assignmentLegacyId: string;
  deliveryId: string;
  membershipId: string;
  submissionType: "TEXT" | "LINK";
  textContent: string | null;
  submissionUrl: string | null;
  submittedAt: string;
  pointsAwarded: number | null;
  previousPoints: number | null;
  attemptNumber: number;
  gradingStatus: "NOT_GRADED" | "GRADED";
  gradePublished: boolean;
  gradedByUserId: string | null;
  gradedAt: string | null;
  maxPoints: number;
  createdAt: string | null;
  updatedAt: string | null;
};
export type ProgressData = {
  membershipId: string;
  lessonContentId: string;
  lastPositionSeconds: number;
  completedAt: string | null;
  firstCompletedAt: string | null;
  attempt: number;
  createdAt: string | null;
  updatedAt: string | null;
};
export type EventData = {
  sectionId: string;
  facultyMembershipId: string | null;
  lectureHallId: string | null;
  deliveryId: string | null;
  title: string;
  startsAt: string;
  endsAt: string;
  createdAt: string | null;
  updatedAt: string | null;
};
export type AttendanceSessionData = {
  scheduleEventId: string;
  status: "MARKED" | "UNMARKED";
  markedByUserId: string | null;
  markedAt: string | null;
};
export type AttendanceRecordData = {
  scheduleEventId: string;
  membershipId: string;
  learnerLegacyId: string;
  status: AttendanceStatusName;
  derived: boolean;
  note: string | null;
  markedByUserId: string;
  markedAt: string;
};
export type QuizData = {
  lessonId: string;
  deliveryId: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  maxAttempts: number;
  totalPoints: number;
  sequence: number;
  status: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
  resultsPublished: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  createdByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};
export type QuestionData = {
  quizId: string;
  questionType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
  prompt: string;
  points: number;
  sequence: number;
  createdAt: string | null;
  updatedAt: string | null;
};
export type OptionData = {
  questionId: string;
  optionText: string;
  isCorrect: boolean;
  sequence: number;
  createdAt: string | null;
};
export type AttemptData = {
  quizId: string;
  quizLegacyId: string;
  deliveryId: string;
  membershipId: string;
  attemptNumber: number;
  score: number;
  maxScore: number;
  submittedAt: string;
  createdAt: string | null;
};
export type AnswerData = {
  attemptId: string;
  questionId: string;
  questionType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
  promptSnapshot: string;
  pointsPossible: number;
  selectedOptionIds: string[];
  optionsSnapshot: { id: string; text: string; sequence: number; correct: boolean }[];
  correct: boolean;
  pointsAwarded: number;
  createdAt: string | null;
};
export type MessageData = {
  deliveryId: string;
  senderMembershipId: string;
  senderRole: "LEARNER" | "FACULTY" | "ADMIN";
  messageText: string;
  pinned: boolean;
  pinnedByUserId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};
export type AnnouncementData = {
  organizationId: string;
  collegeId: string;
  receiverType: "COLLEGE" | "PROGRAM" | "DEPARTMENT" | "LEARNER" | "FACULTY" | "CLASS";
  receiverId: string;
  title: string;
  message: string;
  senderUserId: string;
  senderType: "COLLEGE_ADMIN" | "FACULTY" | "TPO" | "SYSTEM";
  scheduledAt: string | null;
  expiresAt: string | null;
  isPinned: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AcademicsPlan = {
  courses: Planned<CourseData>[];
  offerings: Planned<OfferingData>[];
  deliveries: Planned<DeliveryData>[];
  teaching: Planned<TeachingData>[];
  associations: Planned<AssociationData>[];
  paths: Planned<PathData>[];
  lessons: Planned<LessonData>[];
  contents: Planned<ContentData>[];
  assignments: Planned<AssignmentData>[];
  submissions: Planned<SubmissionData>[];
  progress: Planned<ProgressData>[];
  events: Planned<EventData>[];
  sessions: Planned<AttendanceSessionData>[];
  records: Planned<AttendanceRecordData>[];
  quizzes: Planned<QuizData>[];
  questions: Planned<QuestionData>[];
  options: Planned<OptionData>[];
  attempts: Planned<AttemptData>[];
  answers: Planned<AnswerData>[];
  messages: Planned<MessageData>[];
  announcements: Planned<AnnouncementData>[];
  /** Legacy rows that cannot load now (files stage): provenance only, no vNext row. */
  fileDeferred: {
    legacyType: string;
    legacyId: string;
    newType: string;
    newId: string;
    hash: string;
    metadata: Record<string, unknown>;
  }[];
  /** Facts for the derived-count reconciliation (legacy-computed side). */
  legacyFacts: LegacyFacts;
  stats: Record<string, EntityStat>;
  rejections: Rejection[];
  deferred: Deferral[];
  notes: Record<string, number>;
};

export type LegacyFacts = {
  asOf: string;
  /** learner legacy id -> held sessions of their class and absences (legacy rule). */
  attendance: { learner: string; held: number; absent: number; percent: number | null }[];
  /** learner legacy id -> contents considered (loaded, visible) and completed. */
  progress: { learner: string; total: number; completed: number }[];
  /** learner legacy id -> assignment points and quiz score totals. */
  marks: { learner: string; assignmentPoints: number; quizScore: number; quizMax: number }[];
};

export type AcademicsOptions = {
  /** "Now" for held-session decisions: the snapshot export time. */
  asOf: Date;
  /**
   * REHEARSAL ONLY. Entities whose name-based junk rules (not soft delete) are
   * skipped so a code path can be exercised on data that real-data-only mode
   * rejects (the 20 "Demo Attendance Session" rows). Never set by default.
   */
  keepNameJunkFor?: string[];
};

// ------------------------------------------------------------------- planner

type Person = Planned<PersonData>;
type Section = Planned<SectionData>;

export function buildAcademicsPlan(snapshot: Snapshot, base: Plan, config: AcademicsOptions): AcademicsPlan {
  const t = snapshot.tables;
  for (const name of ["course", "lesson", "lesson_contents", "quizzes", "class_schedule"]) {
    if (!t[name]) throw new Error(`Snapshot lacks stage 2b-i table ${name}: re-run the export`);
  }
  const rows = (name: string): Row[] => t[name] ?? [];
  const c = new Collector();
  const notes: Record<string, number> = {
    roundedToInteger: 0,
    videoKeptAsExternalReference: 0,
    resourceFilePending: 0,
    signedUrlDropped: 0,
    contentHtmlKeptInMetadata: 0,
    lessonNameDeduplicated: 0,
    lessonSequenceRenumbered: 0,
    contentCreatorFallback: 0,
    teachingPrimaryDowngraded: 0,
    teachingEndedForInactiveMembership: 0,
    scheduleHallUnmapped: 0,
    scheduleFacultyUnmapped: 0,
    sessionsHeld: 0,
    sessionsUnmarkedNoMarker: 0,
    derivedPresentRows: 0,
    absenteeRows: 0,
    quizTotalPointsRecomputed: 0,
    quizSingleChoiceWithManyCorrect: 0,
    answerOptionIdsUnresolved: 0,
    attemptScoreAnswerSumMismatch: 0,
    pinnedByFallback: 0,
    gradedByFallback: 0,
    submissionsNotSubmitted: 0,
  };
  const rounding = { rounded: 0 };
  const keepJunk = new Set(config.keepNameJunkFor ?? []);
  const junk = (entity: string, input: Parameters<typeof junkReasonsFor>[0]): JunkReason[] => {
    const reasons = junkReasonsFor(input);
    return keepJunk.has(entity) ? reasons.filter((r) => r === "SOFT_DELETED") : reasons;
  };

  // ---- lookups from stage 2a
  const person = new Map<string, Person>();
  for (const p of base.people) person.set(`${p.legacyType}:${p.legacyId}`, p);
  const sectionByClass = new Map<string, Section>();
  for (const s of base.sections) sectionByClass.set(s.legacyId, s);
  const cohortByNewId = new Map<string, Planned<CohortData>>();
  for (const x of base.cohorts) cohortByNewId.set(x.newId, x);
  const programByNewId = new Map<string, Planned<ProgramData>>();
  for (const x of base.programs) programByNewId.set(x.newId, x);
  const deptByLegacy = new Map<string, Planned<DepartmentData>>();
  for (const x of base.departments) deptByLegacy.set(x.legacyId, x);
  const hallByLegacy = new Map(base.halls.map((h) => [h.legacyId, h]));
  const electiveClasses = new Set(base.deferred.filter((d) => d.entity === "class").map((d) => d.legacyId));
  const learnersBySection = new Map<string, Person[]>();
  for (const p of base.people) {
    if (p.data.enrollment) {
      const list = learnersBySection.get(p.data.enrollment.sectionId) ?? [];
      list.push(p);
      learnersBySection.set(p.data.enrollment.sectionId, list);
    }
  }
  const learner = (id: unknown) => person.get(`learner:${String(id)}`);
  const faculty = (id: unknown) => person.get(`faculty:${String(id)}`);

  /** Why a class cannot host academics, or the section when it can. */
  const classTarget = (classId: unknown): { section: Section } | { reason: Reason } => {
    const key = String(classId ?? "");
    if (!key || key === "null" || key === "0") return { reason: "NO_DELIVERY" };
    const section = sectionByClass.get(key);
    if (section) return { section };
    return { reason: electiveClasses.has(key) ? "ARCHIVED_ELECTIVE" : "PARENT_REJECTED" };
  };

  // ------------------------------------------------------------- courses
  c.stat("course", rows("course").length);
  const courses: Planned<CourseData>[] = [];
  const courseByLegacy = new Map<string, Planned<CourseData>>();
  const courseNameKeys = new Set<string>();
  for (const row of rows("course")) {
    const name = str(row.course_name) ?? str(row.short_title);
    const reasons = junk("course", { names: [name, str(row.short_title)], isDeleted: row.is_deleted });
    if (reasons.length) {
      c.reject("course", row, reasons[0]);
      continue;
    }
    const dept = deptByLegacy.get(String(row.dept_id));
    if (!dept) {
      c.reject("course", row, "PARENT_REJECTED");
      continue;
    }
    if (!name || name.length > 255) {
      c.reject("course", row, "INVALID_VALUE");
      continue;
    }
    if (isFalse(row.active) || isFalse(row.enabled)) {
      c.reject("course", row, "COURSE_INACTIVE");
      continue;
    }
    const key = `${dept.newId}|${lower(name)}`;
    if (courseNameKeys.has(key)) {
      c.reject("course", row, "DUPLICATE_NAME");
      continue;
    }
    courseNameKeys.add(key);
    const meta = asJsonObject(row.contents);
    const description = htmlToText(meta.introduction_content ?? meta.html_content).slice(0, 4000) || null;
    const planned = item2b(
      "course",
      idOf(row),
      "courses",
      {
        departmentId: dept.newId,
        name,
        code: uniqueCode(str(row.short_title) ?? name, idOf(row)),
        description,
        status: "ACTIVE" as const,
        createdAt: ist(row.created_at),
        updatedAt: ist(row.updated_at),
      },
      row,
      {
        unmapped: {
          slug: str(row.slug),
          formalTitle: str(row.formal_title),
          defaultSubscriptionDays: row.default_subscription_days ?? null,
          imageUrl: publicHttpUrl(meta.image_url).url,
          takeaways: Array.isArray(meta.takeaways) ? meta.takeaways.slice(0, 20) : [],
          courseCode: str(meta.course_code),
          courseCategory: str(meta.course_category),
        },
      },
    );
    courses.push(planned);
    courseByLegacy.set(idOf(row), planned);
  }
  c.stat("course").planned = courses.length;

  // ------------------------------------------------ lessons (course level)
  c.stat("lesson", rows("lesson").length);
  type LegacyLesson = { row: Row; name: string };
  const legacyLessons = new Map<string, LegacyLesson>();
  for (const row of rows("lesson")) {
    const name = str(row.lesson_name);
    const reasons = junk("lesson", { names: [name], isDeleted: row.is_deleted });
    if (reasons.length) {
      c.reject("lesson", row, reasons[0]);
      continue;
    }
    if (!courseByLegacy.has(String(row.course_id))) {
      c.reject("lesson", row, "PARENT_REJECTED");
      continue;
    }
    if (!name) {
      c.reject("lesson", row, "INVALID_VALUE");
      continue;
    }
    legacyLessons.set(idOf(row), { row, name });
  }

  // ------------------------------------------- source screening (pass 1)
  type Ev = { row: Row; classId: string; courseId: string; section: Section; createdAt: string | null };
  const evidence: Ev[] = [];
  const addEvidence = (row: Row, courseId: unknown, section: Section) => {
    evidence.push({
      row,
      classId: String(row.class_id),
      courseId: String(courseId),
      section,
      createdAt: ist(row.created_at),
    });
  };

  // lesson contents
  c.stat("lesson_content", 0);
  c.stat("assignment", 0);
  type ContentSrc = { row: Row; kind: "video" | "resource" | "assignment"; lesson: LegacyLesson; section: Section; courseId: string };
  const contentSrc: ContentSrc[] = [];
  for (const row of rows("lesson_contents")) {
    const type = (str(row.content_type) ?? "").toLowerCase();
    const entity = type === "assignment" ? "assignment" : "lesson_content";
    c.stat(entity).legacy += 1;
    const reasons = junk(entity, { names: [str(row.content_title)], isDeleted: row.is_deleted });
    if (reasons.length) {
      c.reject(entity, row, reasons[0]);
      continue;
    }
    if (!["video", "resource", "assignment"].includes(type)) {
      c.reject(entity, row, "UNKNOWN_ENUM");
      continue;
    }
    const lesson = legacyLessons.get(String(row.lesson_id));
    const course = courseByLegacy.get(String(row.course_id ?? lesson?.row.course_id));
    if (!lesson || !course) {
      c.reject(entity, row, "PARENT_REJECTED");
      continue;
    }
    const target = classTarget(row.class_id);
    if ("reason" in target) {
      c.reject(entity, row, target.reason);
      continue;
    }
    contentSrc.push({ row, kind: type as ContentSrc["kind"], lesson, section: target.section, courseId: course.legacyId });
    addEvidence(row, course.legacyId, target.section);
  }

  // quizzes
  c.stat("quiz", rows("quizzes").length);
  type QuizSrc = { row: Row; lesson: LegacyLesson; section: Section; courseId: string };
  const quizSrc: QuizSrc[] = [];
  for (const row of rows("quizzes")) {
    const reasons = junk("quiz", { names: [str(row.title)], isDeleted: row.is_deleted });
    if (reasons.length) {
      c.reject("quiz", row, reasons[0]);
      continue;
    }
    const lesson = legacyLessons.get(String(row.lesson_id));
    const course = courseByLegacy.get(String(row.course_id));
    if (!lesson || !course) {
      c.reject("quiz", row, "PARENT_REJECTED");
      continue;
    }
    const target = classTarget(row.class_id);
    if ("reason" in target) {
      c.reject("quiz", row, target.reason);
      continue;
    }
    quizSrc.push({ row, lesson, section: target.section, courseId: course.legacyId });
    addEvidence(row, course.legacyId, target.section);
  }

  // class schedule
  c.stat("class_schedule", rows("class_schedule").length);
  type ScheduleSrc = { row: Row; section: Section; courseId: string | null; startsAt: string; endsAt: string };
  const scheduleSrc: ScheduleSrc[] = [];
  for (const row of rows("class_schedule")) {
    const reasons = junk("class_schedule", { names: [str(row.title)], isDeleted: row.is_deleted });
    if (reasons.length) {
      c.reject("class_schedule", row, reasons[0]);
      continue;
    }
    const target = classTarget(row.class_id);
    if ("reason" in target) {
      c.reject("class_schedule", row, target.reason);
      continue;
    }
    const startsAt = ist(row.start_time);
    const endsAt = ist(row.end_time);
    if (!startsAt || !endsAt || endsAt <= startsAt || !str(row.title)) {
      c.reject("class_schedule", row, "INVALID_VALUE");
      continue;
    }
    const course = courseByLegacy.get(String(row.course_id));
    scheduleSrc.push({ row, section: target.section, courseId: course?.legacyId ?? null, startsAt, endsAt });
    if (course) addEvidence(row, course.legacyId, target.section);
  }

  // classroom messages
  c.stat("classroom_message", rows("classroom_messages").length);
  type MessageSrc = { row: Row; section: Section; courseId: string };
  const messageSrc: MessageSrc[] = [];
  for (const row of rows("classroom_messages")) {
    if (isTrue(row.is_deleted)) {
      c.reject("classroom_message", row, "SOFT_DELETED");
      continue;
    }
    const course = courseByLegacy.get(String(row.course_id));
    if (!course) {
      c.reject("classroom_message", row, "PARENT_REJECTED");
      continue;
    }
    const target = classTarget(row.class_id);
    if ("reason" in target) {
      c.reject("classroom_message", row, target.reason);
      continue;
    }
    messageSrc.push({ row, section: target.section, courseId: course.legacyId });
    addEvidence(row, course.legacyId, target.section);
  }

  // teaching sources
  c.stat("faculty_teaching_assignment", rows("faculty_teaching_assignment").length);
  c.stat("faculty_course_mapping", rows("faculty_course_mapping").length);
  type TeachSrc = { entity: string; row: Row; fac: Person; section: Section; courseId: string; role: "PRIMARY" | "CO_TEACHER" | "TA"; active: boolean };
  const teachSrc: TeachSrc[] = [];
  const screenTeach = (entity: string, row: Row, role: TeachSrc["role"] | null, active: boolean) => {
    if (isTrue(row.is_deleted)) return c.reject(entity, row, "SOFT_DELETED");
    const course = courseByLegacy.get(String(row.course_id));
    if (!course) return c.reject(entity, row, "PARENT_REJECTED");
    const target = classTarget(row.class_id);
    if ("reason" in target) return c.reject(entity, row, target.reason);
    const fac = faculty(row.faculty_id);
    if (!fac) return c.reject(entity, row, "PERSON_NOT_LOADED");
    if (!role) return c.reject(entity, row, "UNKNOWN_ENUM");
    teachSrc.push({ entity, row, fac, section: target.section, courseId: course.legacyId, role, active });
    addEvidence(row, course.legacyId, target.section);
  };
  for (const row of rows("faculty_teaching_assignment")) {
    screenTeach("faculty_teaching_assignment", row, mapTeachingRole(row.role), !isFalse(row.is_active));
  }
  for (const row of rows("faculty_course_mapping")) {
    screenTeach("faculty_course_mapping", row, "PRIMARY", !isFalse(row.active));
  }

  // -------------------------------- offerings, deliveries, learning paths
  const offerings: Planned<OfferingData>[] = [];
  const deliveries: Planned<DeliveryData>[] = [];
  const paths: Planned<PathData>[] = [];
  const offeringByKey = new Map<string, Planned<OfferingData>>(); // course|batch
  const deliveryByKey = new Map<string, Planned<DeliveryData>>(); // course|class
  const pathByOffering = new Map<string, Planned<PathData>>();
  const earliest = (a: string | null, b: string | null) => (a === null ? b : b === null ? a : a < b ? a : b);
  const pairs = new Map<string, { courseId: string; classId: string; section: Section; createdAt: string | null; updatedAt: string | null }>();
  for (const ev of evidence) {
    const key = `${ev.courseId}|${ev.classId}`;
    const existing = pairs.get(key);
    if (existing) existing.createdAt = earliest(existing.createdAt, ev.createdAt);
    else pairs.set(key, { courseId: ev.courseId, classId: ev.classId, section: ev.section, createdAt: ev.createdAt, updatedAt: ist(ev.row.updated_at) });
  }
  const semesterCourses = rows("semester_course");
  const semesterById = new Map(rows("semester").map((s) => [idOf(s), s]));
  const sortedPairs = [...pairs.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  for (const [, pair] of sortedPairs) {
    const course = courseByLegacy.get(pair.courseId)!;
    const cohort = cohortByNewId.get(pair.section.data.cohortId)!;
    const offeringKey = `${pair.courseId}|${cohort.legacyId}`;
    let offering = offeringByKey.get(offeringKey);
    if (!offering) {
      const program = programByNewId.get(cohort.data.programId)!;
      const candidates = semesterCourses
        .filter((sc) => {
          const sem = semesterById.get(String(sc.semester_id));
          return sem && String(sem.program_id) === program.legacyId && String(sc.course_id) === pair.courseId && !isTrue(sc.is_deleted);
        })
        .sort((a, b) => {
          const na = Number(semesterById.get(String(a.semester_id))?.semester_number ?? 99);
          const nb = Number(semesterById.get(String(b.semester_id))?.semester_number ?? 99);
          return na - nb || Number(a.id) - Number(b.id);
        });
      const sc = candidates[0];
      const credits = sc ? toIntRoundHalfUp(sc.credits, rounding) : null;
      const order = sc ? toIntRoundHalfUp(sc.course_order, rounding) : null;
      offering = item2b(
        "course_offering",
        offeringKey,
        "course_offerings",
        {
          courseId: course.newId,
          cohortId: cohort.newId,
          academicPeriodId: pair.section.data.academicPeriodId,
          type: sc && isFalse(sc.is_mandatory) ? ("ELECTIVE" as const) : ("CORE" as const),
          credits: credits !== null && credits >= 1 && credits <= 30 ? credits : null,
          displayOrder: order !== null && order >= 0 ? order : 0,
          createdAt: pair.createdAt,
          updatedAt: pair.updatedAt,
        },
        { course: pair.courseId, batch: cohort.legacyId, semesterCourse: sc ? idOf(sc) : null },
      );
      offerings.push(offering);
      offeringByKey.set(offeringKey, offering);
      const path = item2b(
        "course_learning_path",
        offeringKey,
        "course_learning_paths",
        {
          offeringId: offering.newId,
          title: course.data.name,
          status: "PUBLISHED" as const,
          createdAt: pair.createdAt,
          updatedAt: pair.updatedAt,
        },
        { course: pair.courseId, batch: cohort.legacyId },
      );
      paths.push(path);
      pathByOffering.set(offering.newId, path);
    } else {
      offering.data.createdAt = earliest(offering.data.createdAt, pair.createdAt);
    }
    const delivery = item2b(
      "course_delivery",
      `${pair.courseId}|${pair.classId}`,
      "course_section_deliveries",
      {
        offeringId: offering.newId,
        sectionId: pair.section.newId,
        startedAt: pair.createdAt ?? pair.section.data.createdAt ?? new Date(0).toISOString(),
        createdAt: pair.createdAt,
        updatedAt: pair.updatedAt,
      },
      { course: pair.courseId, class: pair.classId },
    );
    deliveries.push(delivery);
    deliveryByKey.set(`${pair.courseId}|${pair.classId}`, delivery);
  }
  // Offerings were hashed before later evidence moved createdAt; rehash for stability.
  for (const o of offerings) o.hash = sourceHash({ mapped: o.data, metadata: o.metadata ?? null }, LOADER_VERSION_2B);
  c.stat("course_offering", offerings.length).planned = offerings.length;
  c.stat("course_delivery", deliveries.length).planned = deliveries.length;
  c.stat("course_learning_path", paths.length).planned = paths.length;

  // ------------------------------------------------- teaching assignments
  const teaching: Planned<TeachingData>[] = [];
  {
    const entityStat = { fta: c.stat("faculty_teaching_assignment"), fcm: c.stat("faculty_course_mapping") };
    const primaryOf = new Map<string, string>(); // delivery -> faculty key holding PRIMARY
    const seen = new Set<string>();
    const ordered = [...teachSrc].sort((a, b) => {
      // authoritative assignment rows first, active first, then by id
      if (a.entity !== b.entity) return a.entity === "faculty_teaching_assignment" ? -1 : 1;
      if (a.active !== b.active) return a.active ? -1 : 1;
      return Number(a.row.id) - Number(b.row.id);
    });
    for (const src of ordered) {
      const delivery = deliveryByKey.get(`${src.courseId}|${src.row.class_id}`)!;
      const dedupe = `${delivery.newId}|${src.fac.legacyId}`;
      if (seen.has(dedupe)) {
        // Same faculty and delivery already covered by an earlier source row.
        c.reject(src.entity, src.row, "DUPLICATE_SOURCE");
        continue;
      }
      seen.add(dedupe);
      let role = src.role;
      let active = src.active;
      if (active && role === "PRIMARY") {
        const holder = primaryOf.get(delivery.newId);
        if (holder && holder !== src.fac.legacyId) {
          role = "CO_TEACHER";
          notes.teachingPrimaryDowngraded += 1;
        } else primaryOf.set(delivery.newId, src.fac.legacyId);
      }
      if (active && src.fac.data.membershipStatus !== "ACTIVE") {
        active = false;
        notes.teachingEndedForInactiveMembership += 1;
      }
      const startRaw = src.entity === "faculty_teaching_assignment" ? str(src.row.start_date) : null;
      const startedAt = (startRaw ? istNaiveToUtcIso(startRaw) : null) ?? delivery.data.startedAt;
      const endRaw = src.entity === "faculty_teaching_assignment" ? str(src.row.end_date) : null;
      let endedAt: string | null = null;
      if (!active) {
        endedAt = (endRaw ? istNaiveToUtcIso(endRaw) : null) ?? ist(src.row.updated_at) ?? startedAt;
        if (endedAt < startedAt) endedAt = startedAt;
      }
      teaching.push(
        item2b(
          src.entity,
          idOf(src.row),
          "course_teaching_assignments",
          {
            deliveryId: delivery.newId,
            membershipId: src.fac.data.membershipId,
            userId: src.fac.newId,
            courseId: courseByLegacy.get(src.courseId)!.newId,
            role,
            startedAt,
            endedAt,
            createdAt: ist(src.row.created_at),
            updatedAt: ist(src.row.updated_at),
          },
          src.row,
        ),
      );
      (src.entity === "faculty_teaching_assignment" ? entityStat.fta : entityStat.fcm).planned += 1;
    }
  }
  // Faculty-course associations: one per (faculty, course) that teaches or taught it.
  const associations: Planned<AssociationData>[] = [];
  {
    const groups = new Map<string, { fac: string; course: string; data: AssociationData }>();
    for (const src of teachSrc) {
      const planned = teaching.find((x) => x.legacyType === src.entity && x.legacyId === idOf(src.row));
      if (!planned) continue;
      const key = `${src.fac.legacyId}|${src.courseId}`;
      const existing = groups.get(key);
      if (!existing) {
        groups.set(key, {
          fac: src.fac.legacyId,
          course: src.courseId,
          data: {
            membershipId: planned.data.membershipId,
            courseId: planned.data.courseId,
            startedAt: planned.data.startedAt,
            endedAt: planned.data.endedAt,
          },
        });
      } else {
        existing.data.startedAt = earliest(existing.data.startedAt, planned.data.startedAt) ?? existing.data.startedAt;
        if (planned.data.endedAt === null || existing.data.endedAt === null) existing.data.endedAt = null;
        else if (planned.data.endedAt > existing.data.endedAt) existing.data.endedAt = planned.data.endedAt;
      }
    }
    for (const [key, g] of [...groups.entries()].sort(([a], [b]) => (a < b ? -1 : 1))) {
      associations.push(item2b("faculty_course", key, "faculty_course_associations", g.data, { faculty: g.fac, course: g.course }));
    }
    c.stat("faculty_course_association", associations.length).planned = associations.length;
  }
  const primaryTeacherUser = (deliveryNewId: string): string | null =>
    teaching.find((x) => x.data.deliveryId === deliveryNewId && x.data.role === "PRIMARY" && x.data.endedAt === null)?.data.userId ??
    teaching.find((x) => x.data.deliveryId === deliveryNewId && x.data.endedAt === null)?.data.userId ??
    null;
  const anyAdminUser = base.people.find((p) => p.data.roles.includes("COLLEGE_ADMIN") && p.data.membershipStatus === "ACTIVE")?.newId ?? null;

  // ------------------------------------------------------------ lessons
  // lesson legacy id -> offerings that use it
  const usedBy = new Map<string, Set<string>>(); // lesson -> offeringKeys
  const markUse = (lessonId: string, courseId: string, section: Section) => {
    const cohort = cohortByNewId.get(section.data.cohortId)!;
    const set = usedBy.get(lessonId) ?? new Set<string>();
    set.add(`${courseId}|${cohort.legacyId}`);
    usedBy.set(lessonId, set);
  };
  for (const src of contentSrc) markUse(idOf(src.lesson.row), src.courseId, src.section);
  for (const src of quizSrc) markUse(idOf(src.lesson.row), src.courseId, src.section);
  const lessons: Planned<LessonData>[] = [];
  const lessonByOffering = new Map<string, Planned<LessonData>>(); // `${lessonId}@${offeringKey}`
  {
    const perOffering = new Map<string, { lesson: LegacyLesson; key: string }[]>();
    for (const lesson of legacyLessons.values()) {
      const courseId = String(lesson.row.course_id);
      let keys = [...(usedBy.get(idOf(lesson.row)) ?? [])];
      if (keys.length === 0) {
        keys = [...offeringByKey.keys()].filter((k) => k.startsWith(`${courseId}|`));
      }
      for (const key of keys) {
        const list = perOffering.get(key) ?? [];
        list.push({ lesson, key });
        perOffering.set(key, list);
      }
    }
    for (const [key, list] of [...perOffering.entries()].sort(([a], [b]) => (a < b ? -1 : 1))) {
      const offering = offeringByKey.get(key);
      if (!offering) continue;
      const path = pathByOffering.get(offering.newId)!;
      list.sort((a, b) => Number(a.lesson.row.sequence) - Number(b.lesson.row.sequence) || Number(a.lesson.row.id) - Number(b.lesson.row.id));
      const names = new Set<string>();
      list.forEach(({ lesson }, index) => {
        let name = lesson.name.slice(0, 250);
        if (names.has(lower(name))) {
          let n = 2;
          while (names.has(lower(`${name} (${n})`))) n += 1;
          name = `${name} (${n})`;
          notes.lessonNameDeduplicated += 1;
        }
        names.add(lower(name));
        if (Number(lesson.row.sequence) !== index) notes.lessonSequenceRenumbered += 1;
        const planned = item2b(
          "lesson",
          `${idOf(lesson.row)}@${key}`,
          "course_lessons",
          {
            learningPathId: path.newId,
            name,
            sequence: index,
            status: isFalse(lesson.row.enabled) || isFalse(lesson.row.active) ? ("ARCHIVED" as const) : ("ACTIVE" as const),
            createdAt: ist(lesson.row.created_at),
            updatedAt: ist(lesson.row.updated_at),
          },
          lesson.row,
        );
        lessons.push(planned);
        lessonByOffering.set(`${idOf(lesson.row)}@${key}`, planned);
      });
    }
  }
  c.stat("lesson").planned = lessons.length;
  const lessonFor = (lessonLegacyId: string, courseId: string, section: Section) =>
    lessonByOffering.get(`${lessonLegacyId}@${courseId}|${cohortByNewId.get(section.data.cohortId)!.legacyId}`);

  // -------------------------------------------- contents, assignments
  const contents: Planned<ContentData>[] = [];
  const assignments: Planned<AssignmentData>[] = [];
  const fileDeferred: AcademicsPlan["fileDeferred"] = [];
  const contentByLegacy = new Map<string, Planned<ContentData>>();
  const assignmentByLegacy = new Map<string, Planned<AssignmentData>>();
  const assignmentTitles = new Set<string>();
  type OrderedItem = { kind: 0 | 1 | 2; legacySeq: number; id: number; run: (sequence: number) => void };
  const ordered: OrderedItem[] = [];
  const creatorFor = (facultyId: unknown, deliveryNewId: string): string | null => {
    const own = faculty(facultyId);
    if (own) return own.newId;
    const fallback = primaryTeacherUser(deliveryNewId) ?? anyAdminUser;
    if (fallback) notes.contentCreatorFallback += 1;
    return fallback;
  };
  for (const src of contentSrc) {
    const entity = src.kind === "assignment" ? "assignment" : "lesson_content";
    const lesson = lessonFor(idOf(src.lesson.row), src.courseId, src.section);
    const delivery = deliveryByKey.get(`${src.courseId}|${src.row.class_id}`);
    if (!lesson || !delivery) {
      c.reject(entity, src.row, "PARENT_REJECTED");
      continue;
    }
    const data = asJsonObject(src.row.content_data);
    const title = str(src.row.content_title)!.slice(0, 500);
    const createdBy = creatorFor(src.row.faculty_id, delivery.newId);
    if (!createdBy) {
      c.reject(entity, src.row, "PERSON_NOT_LOADED");
      continue;
    }
    const enabled = !isFalse(src.row.enabled) && !isFalse(src.row.active);
    const legacySeq = Number(src.row.sequence) || 0;
    if (src.kind === "assignment") {
      const points = toIntRoundHalfUp(src.row.points, rounding);
      if (points === null || points < 1 || points > 10000) {
        c.reject("assignment", src.row, points === 0 ? "ZERO_POINTS" : "INVALID_VALUE");
        continue;
      }
      const html = str(data.html_content);
      const text = htmlToText(html ?? data.text);
      const deadline = ist(src.row.deadline);
      const dueDay = istDateOnly(str(data.due_date));
      const dueAt = deadline ?? (dueDay ? istNaiveToUtcIso(`${dueDay} 23:59:59`) : null);
      const resources = Array.isArray(data.assignment_resources) ? data.assignment_resources : [];
      const metadata = {
        unmapped: {
          contentHtml: html ? html.slice(0, 20000) : null,
          allowedSubmissionTypes: data.allowed_submission_types ?? null,
          allowDiscussions: data.allow_discussions ?? null,
          attachmentFiles: [fileReference(data.file_dto), ...resources.map((r) => fileReference(asJsonObject(r).file_dto))].filter(Boolean),
          resourceLinks: resources.map((r) => publicHttpUrl(asJsonObject(r).link).url).filter(Boolean),
        },
      };
      if (html) notes.contentHtmlKeptInMetadata += 1;
      const titleKey = `${lesson.newId}|${delivery.newId}|${lower(title)}`;
      let finalTitle = title;
      if (assignmentTitles.has(titleKey)) {
        finalTitle = `${title.slice(0, 480)} (${idOf(src.row)})`;
        notes.lessonNameDeduplicated += 1;
      }
      assignmentTitles.add(`${lesson.newId}|${delivery.newId}|${lower(finalTitle)}`);
      ordered.push({
        kind: 1,
        legacySeq,
        id: Number(src.row.id),
        run: (sequence) => {
          const planned = item2b(
            "lesson_contents",
            idOf(src.row),
            "course_assignments",
            {
              lessonId: lesson.newId,
              deliveryId: delivery.newId,
              title: finalTitle,
              description: text ? text.slice(0, 20000) : null,
              dueAt,
              maxPoints: points,
              sequence,
              status: enabled ? ("PUBLISHED" as const) : ("DRAFT" as const),
              createdByUserId: createdBy,
              createdAt: ist(src.row.created_at),
              updatedAt: ist(src.row.updated_at),
            },
            src.row,
            metadata,
          );
          assignments.push(planned);
          assignmentByLegacy.set(idOf(src.row), planned);
          c.stat("assignment").planned += 1;
        },
      });
      continue;
    }
    // video / resource -> RESOURCE content
    const file = fileReference(data.file_dto);
    const link = publicHttpUrl(data.link);
    const mediaUrl = publicHttpUrl(file?.objectKey);
    if (link.signed || mediaUrl.signed) notes.signedUrlDropped += 1;
    let externalUrl: string | null = null;
    let noteText: string | null = null;
    const unmapped: Record<string, unknown> = {
      legacyContentType: src.kind,
      durationSeconds: Number(data.duration) || null,
      viewBeforeSchedule: data.view_before_schedule ?? null,
      viewAfterSchedule: data.view_after_schedule ?? null,
      allowDiscussions: data.allow_discussions ?? null,
      thumbnail: publicHttpUrl(data.thumbnail).url,
      fileReference: file,
      resourceMaterials: Array.isArray(data.resource_materials)
        ? data.resource_materials.map((m) => ({ kind: str(asJsonObject(m).kind), file: fileReference(asJsonObject(m).file_dto) }))
        : [],
    };
    if (src.kind === "video") {
      if (!mediaUrl.url && !link.url) {
        c.reject("lesson_content", src.row, "NO_MEDIA_REFERENCE");
        continue;
      }
      externalUrl = mediaUrl.url ?? link.url;
      notes.videoKeptAsExternalReference += 1;
    } else {
      externalUrl = link.url;
      noteText = htmlToText(data.text ?? data.html_content).slice(0, 20000) || null;
      if (!externalUrl && !noteText) {
        if (file) {
          noteText = "Attachment pending file migration.";
          unmapped.filePending = true;
          notes.resourceFilePending += 1;
        } else {
          c.reject("lesson_content", src.row, "NO_MEDIA_REFERENCE");
          continue;
        }
      }
    }
    ordered.push({
      kind: 0,
      legacySeq,
      id: Number(src.row.id),
      run: (sequence) => {
        const planned = item2b(
          "lesson_contents",
          idOf(src.row),
          "lesson_contents",
          {
            lessonId: lesson.newId,
            deliveryId: delivery.newId,
            contentType: "RESOURCE" as const,
            title,
            notes: noteText,
            externalUrl,
            sequence,
            status: enabled ? ("PUBLISHED" as const) : ("DRAFT" as const),
            visibleToStudents: enabled,
            createdByUserId: createdBy,
            createdAt: ist(src.row.created_at),
            updatedAt: ist(src.row.updated_at),
          },
          src.row,
          { unmapped },
        );
        contents.push(planned);
        contentByLegacy.set(idOf(src.row), planned);
        c.stat("lesson_content").planned += 1;
      },
    });
  }

  // ------------------------------------------------------------- quizzes
  const quizzes: Planned<QuizData>[] = [];
  const questions: Planned<QuestionData>[] = [];
  const options: Planned<OptionData>[] = [];
  const quizByLegacy = new Map<string, Planned<QuizData>>();
  const questionByLegacy = new Map<string, Planned<QuestionData>>();
  const optionByLegacy = new Map<string, Planned<OptionData>>();
  const optionsOfQuestion = new Map<string, Planned<OptionData>[]>();
  const questionsOfQuiz = new Map<string, Planned<QuestionData>[]>();
  c.stat("quiz_question", rows("quiz_questions").length);
  c.stat("quiz_option", rows("quiz_options").length);
  const questionRowsByQuiz = new Map<string, Row[]>();
  for (const q of rows("quiz_questions")) {
    const list = questionRowsByQuiz.get(String(q.quiz_id)) ?? [];
    list.push(q);
    questionRowsByQuiz.set(String(q.quiz_id), list);
  }
  const optionRowsByQuestion = new Map<string, Row[]>();
  for (const o of rows("quiz_options")) {
    const list = optionRowsByQuestion.get(String(o.question_id)) ?? [];
    list.push(o);
    optionRowsByQuestion.set(String(o.question_id), list);
  }
  const quizTitles = new Set<string>();
  const acceptedQuizQuestionIds = new Set<string>();
  const acceptedQuizOptionIds = new Set<string>();
  const handledQuestionIds = new Set<string>();
  for (const src of quizSrc) {
    const qrows = (questionRowsByQuiz.get(idOf(src.row)) ?? []).sort(
      (a, b) => Number(a.sequence) - Number(b.sequence) || Number(a.id) - Number(b.id),
    );
    const lesson = lessonFor(idOf(src.lesson.row), src.courseId, src.section);
    const delivery = deliveryByKey.get(`${src.courseId}|${src.row.class_id}`);
    if (!lesson || !delivery) {
      c.reject("quiz", src.row, "PARENT_REJECTED");
      continue;
    }
    const status = mapQuizStatus(src.row.status);
    if (!status) {
      c.reject("quiz", src.row, "UNKNOWN_ENUM");
      continue;
    }
    const createdBy = creatorFor(src.row.faculty_id, delivery.newId);
    if (!createdBy) {
      c.reject("quiz", src.row, "PERSON_NOT_LOADED");
      continue;
    }
    // Questions and options (invalid ones are rejected individually).
    type QPlan = { q: Row; type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE"; points: number; opts: Row[] };
    const qplans: QPlan[] = [];
    for (const q of qrows) {
      handledQuestionIds.add(idOf(q));
      const type = mapQuestionType(q.question_type);
      const points = toIntRoundHalfUp(q.points, rounding);
      const prompt = str(q.prompt);
      const opts = (optionRowsByQuestion.get(idOf(q)) ?? [])
        .filter((o) => !isTrue(o.is_deleted) && str(o.option_text))
        .sort((a, b) => Number(a.sequence) - Number(b.sequence) || Number(a.id) - Number(b.id));
      if (isTrue(q.is_deleted)) c.reject("quiz_question", q, "SOFT_DELETED");
      else if (!type) c.reject("quiz_question", q, "UNKNOWN_ENUM");
      else if (!prompt || points === null || points < 1 || points > 1000 || opts.length === 0) c.reject("quiz_question", q, "INVALID_VALUE");
      else qplans.push({ q, type, points, opts });
    }
    const totalPoints = qplans.reduce((sum, x) => sum + x.points, 0);
    if (qplans.length === 0 || totalPoints < 1) {
      c.reject("quiz", src.row, "NO_QUESTIONS");
      continue;
    }
    const legacyTotal = toIntRoundHalfUp(src.row.total_points, rounding);
    if (legacyTotal !== totalPoints) notes.quizTotalPointsRecomputed += 1;
    const title = str(src.row.title)!.slice(0, 500);
    let finalTitle = title;
    if (quizTitles.has(`${lesson.newId}|${delivery.newId}|${lower(title)}`)) {
      finalTitle = `${title.slice(0, 480)} (${idOf(src.row)})`;
      notes.lessonNameDeduplicated += 1;
    }
    quizTitles.add(`${lesson.newId}|${delivery.newId}|${lower(finalTitle)}`);
    const maxAttempts = toIntRoundHalfUp(src.row.max_attempts, rounding) ?? 1;
    const quizItem = {
      kind: 2 as const,
      legacySeq: 0,
      id: Number(src.row.id),
      run: (sequence: number) => {
        const planned = item2b(
          "quizzes",
          idOf(src.row),
          "course_quizzes",
          {
            lessonId: lesson.newId,
            deliveryId: delivery.newId,
            title: finalTitle,
            description: plainText(htmlToText(src.row.description), 20000),
            dueAt: ist(src.row.due_at),
            maxAttempts: Math.min(Math.max(maxAttempts, 1), 20),
            totalPoints,
            sequence,
            status,
            resultsPublished: isTrue(src.row.is_grade_published),
            shuffleQuestions: isTrue(src.row.shuffle_questions),
            shuffleOptions: isTrue(src.row.shuffle_options),
            createdByUserId: createdBy,
            createdAt: ist(src.row.created_at),
            updatedAt: ist(src.row.updated_at),
          },
          src.row,
        );
        quizzes.push(planned);
        quizByLegacy.set(idOf(src.row), planned);
        c.stat("quiz").planned += 1;
        qplans.forEach((qp, qi) => {
          const manyCorrect = qp.opts.filter((o) => isTrue(o.correct)).length > 1;
          if (manyCorrect && qp.type === "SINGLE_CHOICE") notes.quizSingleChoiceWithManyCorrect += 1;
          const questionPlanned = item2b(
            "quiz_questions",
            idOf(qp.q),
            "quiz_questions",
            {
              quizId: planned.newId,
              questionType: manyCorrect ? ("MULTIPLE_CHOICE" as const) : qp.type,
              prompt: str(qp.q.prompt)!.slice(0, 20000),
              points: qp.points,
              sequence: qi,
              createdAt: ist(qp.q.created_at),
              updatedAt: ist(qp.q.updated_at),
            },
            qp.q,
          );
          questions.push(questionPlanned);
          questionByLegacy.set(idOf(qp.q), questionPlanned);
          acceptedQuizQuestionIds.add(idOf(qp.q));
          c.stat("quiz_question").planned += 1;
          const list = questionsOfQuiz.get(planned.newId) ?? [];
          list.push(questionPlanned);
          questionsOfQuiz.set(planned.newId, list);
          qp.opts.forEach((o, oi) => {
            const optionPlanned = item2b(
              "quiz_options",
              idOf(o),
              "quiz_options",
              {
                questionId: questionPlanned.newId,
                optionText: str(o.option_text)!.slice(0, 5000),
                isCorrect: isTrue(o.correct),
                sequence: oi,
                createdAt: ist(o.created_at),
              },
              o,
            );
            options.push(optionPlanned);
            optionByLegacy.set(idOf(o), optionPlanned);
            acceptedQuizOptionIds.add(idOf(o));
            c.stat("quiz_option").planned += 1;
            const olist = optionsOfQuestion.get(questionPlanned.newId) ?? [];
            olist.push(optionPlanned);
            optionsOfQuestion.set(questionPlanned.newId, olist);
          });
        });
      },
    };
    ordered.push(quizItem);
  }
  // Sequence numbering per (lesson, delivery): one dense order across contents,
  // assignments and quizzes (legacy sequence, then kind, then id), which also
  // satisfies each table's unique-sequence index.
  {
    ordered.sort((a, b) => a.legacySeq - b.legacySeq || a.kind - b.kind || a.id - b.id);
    for (const entry of ordered) entry.run(0);
    const orderIndex = new Map<string, number>();
    ordered.forEach((entry, index) => orderIndex.set(`${entry.kind}:${entry.id}`, index));
    const buckets = new Map<string, { data: { sequence: number }; rank: number }[]>();
    const place = (kind: 0 | 1 | 2, list: Planned<{ lessonId: string; deliveryId: string; sequence: number }>[]) => {
      for (const x of list) {
        const key = `${x.data.lessonId}|${x.data.deliveryId}`;
        const bucket = buckets.get(key) ?? [];
        bucket.push({ data: x.data, rank: orderIndex.get(`${kind}:${x.legacyId}`) ?? 0 });
        buckets.set(key, bucket);
      }
    };
    place(0, contents);
    place(1, assignments);
    place(2, quizzes);
    for (const bucket of buckets.values()) {
      bucket.sort((x, y) => x.rank - y.rank);
      bucket.forEach((entry, index) => {
        entry.data.sequence = index;
      });
    }
    for (const list of [contents, assignments, quizzes] as Planned<unknown>[][]) {
      for (const x of list) x.hash = sourceHash({ mapped: x.data, metadata: x.metadata ?? null, id: x.legacyId }, LOADER_VERSION_2B);
    }
  }

  // Questions whose quiz never reached question screening (parent rejected).
  for (const q of rows("quiz_questions")) {
    if (!handledQuestionIds.has(idOf(q))) c.reject("quiz_question", q, "PARENT_REJECTED");
  }
  for (const o of rows("quiz_options")) {
    if (acceptedQuizOptionIds.has(idOf(o))) continue;
    if (isTrue(o.is_deleted)) c.reject("quiz_option", o, "SOFT_DELETED");
    else c.reject("quiz_option", o, acceptedQuizQuestionIds.has(String(o.question_id)) ? "INVALID_VALUE" : "PARENT_REJECTED");
  }

  // --------------------------------------------------------- submissions
  c.stat("student_assignment", rows("student_assignment").length);
  const submissions: Planned<SubmissionData>[] = [];
  const submissionKeys = new Set<string>();
  for (const row of rows("student_assignment")) {
    if (isTrue(row.is_deleted)) {
      c.reject("student_assignment", row, "SOFT_DELETED");
      continue;
    }
    const assignment = assignmentByLegacy.get(String(row.lesson_content_id));
    if (!assignment) {
      c.reject("student_assignment", row, "PARENT_REJECTED");
      continue;
    }
    const who = learner(row.student_id);
    if (!who) {
      c.reject("student_assignment", row, "PERSON_NOT_LOADED");
      continue;
    }
    const kind = mapSubmissionKind(row.submission_type);
    const html = str(row.html_content);
    const link = str(row.submission_link);
    const assets = Array.isArray(row.submission_assets) ? row.submission_assets : [];
    const fileRef = fileReference(row.assignment_contents);
    // A null submission_type with an attached file is the assignment's own
    // attachment copied onto the placeholder row, not a learner submission.
    if (kind === null && !html && !link && assets.length === 0) {
      c.reject("student_assignment", row, "NOT_SUBMITTED");
      notes.submissionsNotSubmitted += 1;
      continue;
    }
    if (kind === "UNKNOWN") {
      c.reject("student_assignment", row, "UNKNOWN_ENUM");
      continue;
    }
    if (who.data.membershipStatus !== "ACTIVE") {
      c.reject("student_assignment", row, "LEARNER_NOT_ACTIVE");
      continue;
    }
    const delivery = deliveries.find((d) => d.newId === assignment.data.deliveryId)!;
    if (!who.data.enrollment || who.data.enrollment.sectionId !== delivery.data.sectionId) {
      c.reject("student_assignment", row, "LEARNER_NOT_IN_SECTION");
      continue;
    }
    if (kind === "FILE" || (kind === null && assets.length > 0)) {
      // vNext FILE submissions need a READY, scanned file row: files stage.
      c.defer("student_assignment", row, "SUBMISSION_FILE_AWAITS_FILES_STAGE");
      fileDeferred.push({
        legacyType: "student_assignment",
        legacyId: idOf(row),
        newType: "assignment_submissions",
        newId: nsritId("assignment_submissions", "student_assignment", idOf(row)),
        hash: sourceHash({ legacy: row }, LOADER_VERSION_2B),
        metadata: {
          unmapped: {
            deferredReason: "SUBMISSION_FILE_AWAITS_FILES_STAGE",
            assignment: assignment.legacyId,
            learner: who.legacyId,
            files: [fileRef, ...assets.map((a) => fileReference(asJsonObject(a).file_dto))].filter(Boolean),
            submittedAt: ist(row.updated_at),
            pointsObtained: row.points_obtained ?? null,
            gradingStatus: str(row.grading_status),
          },
        },
      });
      continue;
    }
    const key = `${assignment.newId}|${who.data.membershipId}`;
    if (submissionKeys.has(key)) {
      c.reject("student_assignment", row, "DUPLICATE_NAME");
      continue;
    }
    let textContent: string | null = null;
    let submissionUrl: string | null = null;
    if (kind === "LINK") {
      submissionUrl = publicHttpUrl(link).url;
      if (!submissionUrl) {
        c.reject("student_assignment", row, "INVALID_VALUE");
        continue;
      }
    } else {
      textContent = htmlToText(html).slice(0, 100000) || null;
      if (!textContent) {
        c.reject("student_assignment", row, "INVALID_VALUE");
        continue;
      }
    }
    const graded = str(row.grading_status)?.toUpperCase() === "GRADED" || isTrue(row.graded);
    const maxPoints = assignment.data.maxPoints;
    let pointsAwarded: number | null = null;
    let gradedBy: string | null = null;
    let gradedAt: string | null = null;
    if (graded) {
      pointsAwarded = toIntRoundHalfUp(row.points_obtained, rounding);
      if (pointsAwarded === null || pointsAwarded < 0 || pointsAwarded > maxPoints) {
        c.reject("student_assignment", row, "INVALID_VALUE");
        continue;
      }
      const grader = faculty(row.graded_by);
      gradedBy = grader?.newId ?? primaryTeacherUser(assignment.data.deliveryId) ?? anyAdminUser;
      if (!grader) notes.gradedByFallback += 1;
      gradedAt = ist(row.graded_at) ?? ist(row.updated_at);
      if (!gradedBy || !gradedAt) {
        c.reject("student_assignment", row, "PERSON_NOT_LOADED");
        continue;
      }
    }
    let previous = toIntRoundHalfUp(row.previous_points, rounding);
    if (previous !== null && (previous < 0 || !graded) && !(previous > 0)) previous = null;
    const attempt = Math.max(toIntRoundHalfUp(row.attempt_number, rounding) ?? 1, 1);
    submissionKeys.add(key);
    submissions.push(
      item2b(
        "student_assignment",
        idOf(row),
        "assignment_submissions",
        {
          assignmentId: assignment.newId,
          assignmentLegacyId: assignment.legacyId,
          deliveryId: assignment.data.deliveryId,
          membershipId: who.data.membershipId,
          submissionType: kind === "LINK" ? ("LINK" as const) : ("TEXT" as const),
          textContent,
          submissionUrl,
          submittedAt: ist(row.updated_at) ?? ist(row.created_at) ?? new Date(0).toISOString(),
          pointsAwarded,
          previousPoints: previous,
          attemptNumber: attempt,
          gradingStatus: graded ? ("GRADED" as const) : ("NOT_GRADED" as const),
          gradePublished: graded && isTrue(row.is_grade_published),
          gradedByUserId: gradedBy,
          gradedAt,
          maxPoints,
          createdAt: ist(row.created_at),
          updatedAt: ist(row.updated_at),
        },
        row,
      ),
    );
    c.stat("student_assignment").planned += 1;
  }

  // ------------------------------------------------------------- progress
  const rawContentType = new Map(rows("lesson_contents").map((r) => [idOf(r), (str(r.content_type) ?? "").toLowerCase()]));
  c.stat("learner_content_progress", rows("learner_content_progress").length);
  const progress: Planned<ProgressData>[] = [];
  const progressKeys = new Set<string>();
  for (const row of rows("learner_content_progress")) {
    if (isTrue(row.is_deleted)) {
      c.reject("learner_content_progress", row, "SOFT_DELETED");
      continue;
    }
    const content = contentByLegacy.get(String(row.lesson_content_id));
    if (!content) {
      // Progress on an assignment content has no vNext row: assignment
      // completion in vNext is derived from the submission itself.
      c.reject(
        "learner_content_progress",
        row,
        rawContentType.get(String(row.lesson_content_id)) === "assignment" ? "NO_VNEXT_TARGET" : "PARENT_REJECTED",
      );
      continue;
    }
    const who = learner(row.learner_id);
    if (!who) {
      c.reject("learner_content_progress", row, "PERSON_NOT_LOADED");
      continue;
    }
    const key = `${who.data.membershipId}|${content.newId}`;
    if (progressKeys.has(key)) {
      c.reject("learner_content_progress", row, "DUPLICATE_NAME");
      continue;
    }
    progressKeys.add(key);
    const position = Math.max(toIntRoundHalfUp(row.last_position_seconds, rounding) ?? 0, 0);
    const completedAt = ist(row.completed_at);
    progress.push(
      item2b(
        "learner_content_progress",
        idOf(row),
        "learner_content_progress",
        {
          membershipId: who.data.membershipId,
          lessonContentId: content.newId,
          lastPositionSeconds: position,
          completedAt,
          firstCompletedAt: ist(row.first_completed_at) ?? completedAt,
          attempt: Math.max(toIntRoundHalfUp(row.attempt, rounding) ?? 1, 1),
          createdAt: ist(row.created_at),
          updatedAt: ist(row.updated_at),
        },
        row,
      ),
    );
    c.stat("learner_content_progress").planned += 1;
  }

  // ------------------------------------------------ schedule + attendance
  const events: Planned<EventData>[] = [];
  const eventByLegacy = new Map<string, Planned<EventData>>();
  for (const src of scheduleSrc) {
    const row = src.row;
    const fac = faculty(row.faculty_id);
    if (!fac && row.faculty_id) notes.scheduleFacultyUnmapped += 1;
    const hall = hallByLegacy.get(String(row.lecture_hall_id));
    if (row.lecture_hall_id && Number(row.lecture_hall_id) !== 0 && !hall) notes.scheduleHallUnmapped += 1;
    const delivery = src.courseId ? deliveryByKey.get(`${src.courseId}|${row.class_id}`) : undefined;
    const planned = item2b(
      "class_schedule",
      idOf(row),
      "section_schedule_events",
      {
        sectionId: src.section.newId,
        facultyMembershipId: fac?.data.membershipId ?? null,
        lectureHallId: hall?.newId ?? null,
        deliveryId: delivery?.newId ?? null,
        title: str(row.title)!.slice(0, 500),
        startsAt: src.startsAt,
        endsAt: src.endsAt,
        createdAt: ist(row.created_at),
        updatedAt: ist(row.updated_at),
      },
      row,
    );
    events.push(planned);
    eventByLegacy.set(idOf(row), planned);
    c.stat("class_schedule").planned += 1;
  }

  const sessions: Planned<AttendanceSessionData>[] = [];
  const records: Planned<AttendanceRecordData>[] = [];
  c.stat("attend", rows("attend").length);
  const absenteesByEvent = new Map<string, Row[]>();
  for (const row of rows("attend")) {
    const ev = eventByLegacy.get(String(row.class_schedule_id));
    if (isTrue(row.is_deleted)) {
      c.reject("attend", row, "SOFT_DELETED");
      continue;
    }
    if (!ev) {
      c.reject("attend", row, "PARENT_REJECTED");
      continue;
    }
    const who = learner(row.student_id);
    if (!who) {
      c.reject("attend", row, "PERSON_NOT_LOADED");
      continue;
    }
    if (!who.data.enrollment || who.data.enrollment.sectionId !== ev.data.sectionId) {
      c.reject("attend", row, "LEARNER_NOT_IN_SECTION");
      continue;
    }
    if (!mapAttendanceStatus(row.attendance_status)) {
      c.reject("attend", row, "UNKNOWN_ENUM");
      continue;
    }
    const list = absenteesByEvent.get(ev.legacyId) ?? [];
    list.push(row);
    absenteesByEvent.set(ev.legacyId, list);
  }
  const asOfIso = config.asOf.toISOString();
  const recordKeys = new Set<string>();
  for (const ev of events) {
    const held = ev.data.startsAt <= asOfIso;
    const enrolled = learnersBySection.get(ev.data.sectionId) ?? [];
    const absentees = absenteesByEvent.get(ev.legacyId) ?? [];
    const sourceRow = scheduleSrc.find((s) => idOf(s.row) === ev.legacyId)!.row;
    if (held) notes.sessionsHeld += 1;
    const marker =
      faculty(sourceRow.faculty_id)?.newId ??
      (ev.data.deliveryId ? primaryTeacherUser(ev.data.deliveryId) : null) ??
      anyAdminUser;
    const markedAtRaw =
      ist(sourceRow.attendance_marked_at) ??
      absentees.map((a) => ist(a.created_at)).filter((x): x is string => !!x).sort()[0] ??
      ev.data.endsAt;
    const markedAt = markedAtRaw;
    const canMark = held && marker !== null;
    if (held && marker === null) notes.sessionsUnmarkedNoMarker += 1;
    const session = item2b(
      "class_schedule",
      ev.legacyId,
      "attendance_sessions",
      {
        scheduleEventId: ev.newId,
        status: canMark ? ("MARKED" as const) : ("UNMARKED" as const),
        markedByUserId: canMark ? marker : null,
        markedAt: canMark ? markedAt : null,
      },
      { held, absentees: absentees.length },
    );
    session.newId = ev.newId; // attendance_sessions is keyed by schedule_event_id
    sessions.push(session);
    if (!canMark) {
      // Absentee rows of a session that was not held yet (or has nobody to
      // attribute the marking to) have no vNext row: reported, not dropped silently.
      for (const row of absentees) c.reject("attend", row, held ? "NO_MARKER" : "SESSION_NOT_HELD");
      continue;
    }
    const absentIds = new Set<string>();
    for (const row of absentees) {
      const who = learner(row.student_id)!;
      if (recordKeys.has(`${ev.newId}|${who.data.membershipId}`)) {
        c.reject("attend", row, "DUPLICATE_NAME");
        continue;
      }
      recordKeys.add(`${ev.newId}|${who.data.membershipId}`);
      absentIds.add(who.legacyId);
      records.push(
        item2b(
          "attend",
          idOf(row),
          "attendance_records",
          {
            scheduleEventId: ev.newId,
            membershipId: who.data.membershipId,
            learnerLegacyId: who.legacyId,
            status: mapAttendanceStatus(row.attendance_status)!,
            derived: false,
            note: plainText(row.drop_class_reason, 1000),
            markedByUserId: faculty(row.marked_by)?.newId ?? marker!,
            markedAt: ist(row.created_at) ?? markedAt,
          },
          row,
        ),
      );
      c.stat("attend").planned += 1;
      notes.absenteeRows += 1;
    }
    // Derived present rows: every learner actively enrolled in the section who has no absentee row.
    for (const who of enrolled) {
      if (absentIds.has(who.legacyId)) continue;
      if (recordKeys.has(`${ev.newId}|${who.data.membershipId}`)) continue;
      recordKeys.add(`${ev.newId}|${who.data.membershipId}`);
      records.push(
        item2b(
          "enrollment_x_session",
          `${who.legacyId}|${ev.legacyId}`,
          "attendance_records",
          {
            scheduleEventId: ev.newId,
            membershipId: who.data.membershipId,
            learnerLegacyId: who.legacyId,
            status: "PRESENT" as const,
            derived: true,
            note: null,
            markedByUserId: marker!,
            markedAt,
          },
          { learner: who.legacyId, session: ev.legacyId },
        ),
      );
      notes.derivedPresentRows += 1;
    }
  }
  c.stat("attendance_session", events.length).planned = sessions.length;
  c.stat("attendance_record_derived", notes.derivedPresentRows).planned = notes.derivedPresentRows;

  // ------------------------------------------------------- quiz attempts
  c.stat("quiz_attempt", rows("quiz_attempts").length);
  c.stat("quiz_answer", rows("quiz_answers").length);
  const attempts: Planned<AttemptData>[] = [];
  const attemptByLegacy = new Map<string, Planned<AttemptData>>();
  const attemptKeys = new Set<string>();
  for (const row of rows("quiz_attempts")) {
    if (isTrue(row.is_deleted)) {
      c.reject("quiz_attempt", row, "SOFT_DELETED");
      continue;
    }
    const quiz = quizByLegacy.get(String(row.quiz_id));
    if (!quiz) {
      c.reject("quiz_attempt", row, "PARENT_REJECTED");
      continue;
    }
    const who = learner(row.learner_id);
    if (!who) {
      c.reject("quiz_attempt", row, "PERSON_NOT_LOADED");
      continue;
    }
    if ((str(row.status) ?? "SUBMITTED").toUpperCase() !== "SUBMITTED") {
      c.reject("quiz_attempt", row, "UNKNOWN_ENUM");
      continue;
    }
    if (who.data.membershipStatus !== "ACTIVE") {
      c.reject("quiz_attempt", row, "LEARNER_NOT_ACTIVE");
      continue;
    }
    const delivery = deliveries.find((d) => d.newId === quiz.data.deliveryId)!;
    if (!who.data.enrollment || who.data.enrollment.sectionId !== delivery.data.sectionId) {
      c.reject("quiz_attempt", row, "LEARNER_NOT_IN_SECTION");
      continue;
    }
    const score = toIntRoundHalfUp(row.score, rounding);
    const maxScore = toIntRoundHalfUp(row.max_score, rounding);
    const number = Math.max(toIntRoundHalfUp(row.attempt_number, rounding) ?? 1, 1);
    if (score === null || maxScore === null || maxScore <= 0 || score < 0 || score > maxScore) {
      c.reject("quiz_attempt", row, "INVALID_VALUE");
      continue;
    }
    const key = `${quiz.newId}|${who.data.membershipId}|${number}`;
    if (attemptKeys.has(key)) {
      c.reject("quiz_attempt", row, "DUPLICATE_NAME");
      continue;
    }
    attemptKeys.add(key);
    const planned = item2b(
      "quiz_attempts",
      idOf(row),
      "quiz_attempts",
      {
        quizId: quiz.newId,
        quizLegacyId: quiz.legacyId,
        deliveryId: quiz.data.deliveryId,
        membershipId: who.data.membershipId,
        attemptNumber: number,
        score,
        maxScore,
        submittedAt: ist(row.submitted_at) ?? ist(row.created_at) ?? new Date(0).toISOString(),
        createdAt: ist(row.created_at),
      },
      row,
    );
    attempts.push(planned);
    attemptByLegacy.set(idOf(row), planned);
    c.stat("quiz_attempt").planned += 1;
  }
  const answers: Planned<AnswerData>[] = [];
  const answerKeys = new Set<string>();
  const answerPointsByAttempt = new Map<string, number>();
  for (const row of rows("quiz_answers")) {
    if (isTrue(row.is_deleted)) {
      c.reject("quiz_answer", row, "SOFT_DELETED");
      continue;
    }
    const attempt = attemptByLegacy.get(String(row.attempt_id));
    const question = questionByLegacy.get(String(row.question_id));
    if (!attempt || !question) {
      c.reject("quiz_answer", row, "PARENT_REJECTED");
      continue;
    }
    if (question.data.quizId !== attempt.data.quizId) {
      c.reject("quiz_answer", row, "INVALID_VALUE");
      continue;
    }
    const key = `${attempt.newId}|${question.newId}`;
    if (answerKeys.has(key)) {
      c.reject("quiz_answer", row, "DUPLICATE_NAME");
      continue;
    }
    const opts = [...(optionsOfQuestion.get(question.newId) ?? [])].sort((a, b) => a.data.sequence - b.data.sequence);
    // Stage-to-target foreign-key preflight. The old option mapper can
    // normalize malformed IDs: NEVER silently import a partial answer when
    // any selected option is dangling or points to a different question.
    // Quarantine this row, preserving its legacy ID in the rejection ledger.
    const rawSelected = str(row.selected_option_ids) ?? "";
    const legacySelected = parseOptionIds(row.selected_option_ids);
    if (rawSelected && legacySelected.length === 0) {
      notes.answerOptionIdsUnresolved += 1;
      c.reject("quiz_answer", row, "INVALID_VALUE");
      continue;
    }
    const selected: string[] = [];
    let unresolved = false;
    for (const legacyOption of legacySelected) {
      const planned = optionByLegacy.get(legacyOption);
      if (planned && planned.data.questionId === question.newId) selected.push(planned.newId);
      else { notes.answerOptionIdsUnresolved += 1; unresolved = true; }
    }
    // A persisted answer must reference only options present in its
    // question's snapshot, with no missing option or duplicate mapped ID.
    const validOptions = new Set(opts.map(option => option.newId));
    if (unresolved || selected.some(id => !validOptions.has(id)) ||
        new Set(selected).size !== selected.length ||
        (question.data.questionType === "SINGLE_CHOICE" && selected.length > 1)) {
      c.reject("quiz_answer", row, "PARENT_REJECTED");
      continue;
    }
    const awarded = toIntRoundHalfUp(row.points_awarded, rounding);
    if (awarded === null || awarded < 0 || awarded > question.data.points) {
      c.reject("quiz_answer", row, "INVALID_VALUE");
      continue;
    }
    answerKeys.add(key);
    answerPointsByAttempt.set(attempt.legacyId, (answerPointsByAttempt.get(attempt.legacyId) ?? 0) + awarded);
    answers.push(
      item2b(
        "quiz_answers",
        idOf(row),
        "quiz_attempt_answers",
        {
          attemptId: attempt.newId,
          questionId: question.newId,
          questionType: question.data.questionType,
          promptSnapshot: question.data.prompt,
          pointsPossible: question.data.points,
          selectedOptionIds: selected,
          optionsSnapshot: opts.map((o) => ({ id: o.newId, text: o.data.optionText, sequence: o.data.sequence, correct: o.data.isCorrect })),
          correct: isTrue(row.correct),
          pointsAwarded: awarded,
          createdAt: ist(row.created_at),
        },
        row,
      ),
    );
    c.stat("quiz_answer").planned += 1;
  }
  for (const attempt of attempts) {
    const sum = answerPointsByAttempt.get(attempt.legacyId);
    if (sum !== undefined && sum !== attempt.data.score) notes.attemptScoreAnswerSumMismatch += 1;
  }

  // ------------------------------------------------------------- messages
  const messages: Planned<MessageData>[] = [];
  for (const src of messageSrc) {
    const row = src.row;
    const delivery = deliveryByKey.get(`${src.courseId}|${row.class_id}`);
    if (!delivery) {
      c.reject("classroom_message", row, "PARENT_REJECTED");
      continue;
    }
    const roleRaw = (str(row.sender_role) ?? "").toUpperCase();
    const senderRole = roleRaw === "FACULTY" ? "FACULTY" : roleRaw === "ADMIN" ? "ADMIN" : roleRaw === "LEARNER" || roleRaw === "STUDENT" ? "LEARNER" : null;
    if (!senderRole) {
      c.reject("classroom_message", row, "UNKNOWN_ENUM");
      continue;
    }
    const sender = senderRole === "LEARNER" ? learner(row.sender_id) : faculty(row.sender_id);
    if (!sender) {
      c.reject("classroom_message", row, "PERSON_NOT_LOADED");
      continue;
    }
    const text = str(row.message_text);
    if (!text || text.length > 4000) {
      c.reject("classroom_message", row, "INVALID_VALUE");
      continue;
    }
    const pinned = isTrue(row.is_pinned);
    let pinnedBy: string | null = null;
    if (pinned) {
      pinnedBy = primaryTeacherUser(delivery.newId) ?? sender.newId;
      notes.pinnedByFallback += 1;
    }
    messages.push(
      item2b(
        "classroom_messages",
        idOf(row),
        "course_discussion_messages",
        {
          deliveryId: delivery.newId,
          senderMembershipId: sender.data.membershipId,
          senderRole,
          messageText: text,
          pinned,
          pinnedByUserId: pinnedBy,
          createdAt: ist(row.created_at),
          updatedAt: ist(row.updated_at),
        },
        row,
      ),
    );
    c.stat("classroom_message").planned += 1;
  }

  // -------------------------------------------------------- announcements
  c.stat("announcement", rows("announcements").length);
  const announcements: Planned<AnnouncementData>[] = [];
  const deptNewByLegacy = deptByLegacy;
  for (const row of rows("announcements")) {
    if (isTrue(row.is_deleted)) {
      c.reject("announcement", row, "SOFT_DELETED");
      continue;
    }
    const reasons = junk("announcement", { names: [str(row.title)] });
    if (reasons.length) {
      c.reject("announcement", row, reasons[0]);
      continue;
    }
    const type = (str(row.receiver_type) ?? "").toUpperCase();
    const value = String(row.receiver_value);
    let receiverId: string | null = null;
    if (type === "COLLEGE" && value === "6") receiverId = base.college.newId;
    else if (type === "DEPARTMENT") receiverId = deptNewByLegacy.get(value)?.newId ?? null;
    else if (type === "PROGRAM") receiverId = base.programs.find((p) => p.legacyId === value)?.newId ?? null;
    else if (type === "CLASS") receiverId = sectionByClass.get(value)?.newId ?? null;
    else if (type === "LEARNER") receiverId = learner(value)?.data.membershipId ?? null;
    else if (type === "FACULTY") receiverId = faculty(value)?.data.membershipId ?? null;
    else {
      c.reject("announcement", row, "UNSUPPORTED_RECEIVER");
      continue;
    }
    if (!receiverId) {
      c.reject("announcement", row, "PARENT_REJECTED");
      continue;
    }
    const senderTypeRaw = (str(row.sender_type) ?? "").toUpperCase();
    const senderPerson = senderTypeRaw === "LEARNER" ? learner(row.sender_id) : faculty(row.sender_id);
    const senderType =
      senderTypeRaw === "ADMIN" || senderTypeRaw === "COLLEGE_ADMIN"
        ? "COLLEGE_ADMIN"
        : senderTypeRaw === "FACULTY"
          ? "FACULTY"
          : senderTypeRaw === "TPO"
            ? "TPO"
            : null;
    if (!senderType) {
      c.reject("announcement", row, "UNKNOWN_ENUM");
      continue;
    }
    if (!senderPerson) {
      c.reject("announcement", row, "PERSON_NOT_LOADED");
      continue;
    }
    const title = str(row.title);
    const message = str(row.message);
    if (!title || !message) {
      c.reject("announcement", row, "INVALID_VALUE");
      continue;
    }
    announcements.push(
      item2b(
        "announcements",
        idOf(row),
        "announcements",
        {
          organizationId: base.organization.newId,
          collegeId: base.college.newId,
          receiverType: type as AnnouncementData["receiverType"],
          receiverId,
          title: title.slice(0, 255),
          message: htmlToText(message).slice(0, 20000) || message.slice(0, 20000),
          senderUserId: senderPerson.newId,
          senderType,
          scheduledAt: ist(row.scheduled_at),
          expiresAt: ist(row.expires_at),
          isPinned: isTrue(row.is_pinned),
          createdAt: ist(row.created_at),
          updatedAt: ist(row.updated_at),
        },
        row,
      ),
    );
    c.stat("announcement").planned += 1;
  }

  // ----------------------------------------------------------- electives
  // Decision: all NSRIT elective data is ARCHIVED (4 of 6 backing classes are
  // smoke/audit named). vNext electives bind to a course delivery, and a
  // legacy GROUP_BACKED class has no cohort, so nothing is loadable without
  // guessing. Every elective row is rejected with ARCHIVED_ELECTIVE and listed.
  for (const entity of ["elective_slot", "elective_offering", "lms_group", "lms_group_member", "lms_group_member_event", "lms_group_rule"]) {
    c.stat(entity, rows(entity).length);
    for (const row of rows(entity)) {
      const status = str(row.status);
      const reasons = junk(entity, { names: [str(row.name)], isDeleted: row.is_deleted });
      if (reasons.length) {
        c.reject(entity, row, reasons[0]);
      } else if (status && status.toUpperCase() !== "ARCHIVED") {
        c.defer(entity, row, "ACTIVE_ELECTIVE_NEEDS_OWNER_REVIEW");
      } else {
        c.reject(entity, row, "ARCHIVED_ELECTIVE");
      }
    }
  }
  c.stat("elective_class", electiveClasses.size);
  for (const classId of [...electiveClasses].sort((a, b) => Number(a) - Number(b))) {
    c.reject("elective_class", { id: classId }, "ARCHIVED_ELECTIVE");
  }

  // ------------------------------------------------------ legacy facts
  // Computed from RAW legacy rows with the legacy rules (held sessions only,
  // every attend row is an absence, completed_at, graded points), restricted
  // to the sessions that were planned, so the comparison measures the
  // transformation (and any silently dropped row), not the real-data filter.
  const learnerKeys = base.people
    .filter((p) => p.legacyType === "learner" && p.data.enrollment)
    .map((p) => p.legacyId)
    .sort((a, b) => Number(a) - Number(b));
  const plannedEventIds = new Set(events.map((e) => e.legacyId));
  const classOfLearner = (id: string) => {
    const enrollment = person.get(`learner:${id}`)!.data.enrollment!;
    return base.sections.find((x) => x.newId === enrollment.sectionId)!.legacyId;
  };
  const heldByClass = new Map<string, Set<string>>();
  for (const row of rows("class_schedule")) {
    if (!plannedEventIds.has(idOf(row)) || isTrue(row.is_deleted)) continue;
    const startsAt = ist(row.start_time);
    if (!startsAt || startsAt > asOfIso) continue;
    const set = heldByClass.get(String(row.class_id)) ?? new Set<string>();
    set.add(idOf(row));
    heldByClass.set(String(row.class_id), set);
  }
  const absentSessions = new Map<string, Set<string>>();
  for (const row of rows("attend")) {
    if (isTrue(row.is_deleted)) continue;
    const key = String(row.student_id);
    const set = absentSessions.get(key) ?? new Set<string>();
    set.add(String(row.class_schedule_id));
    absentSessions.set(key, set);
  }
  const attendanceLegacy: LegacyFacts["attendance"] = [];
  for (const id of learnerKeys) {
    const held = heldByClass.get(classOfLearner(id));
    if (!held || held.size === 0) continue;
    const absent = [...(absentSessions.get(id) ?? [])].filter((sid) => held.has(sid)).length;
    attendanceLegacy.push({ learner: id, held: held.size, absent, percent: pct2(legacyAttendancePercent(held.size, absent)) });
  }
  const visibleContentsByClass = new Map<string, Set<string>>();
  for (const row of rows("lesson_contents")) {
    const type = (str(row.content_type) ?? "").toLowerCase();
    if (!["video", "resource"].includes(type)) continue;
    if (isTrue(row.is_deleted) || isFalse(row.active) || isFalse(row.enabled)) continue;
    const set = visibleContentsByClass.get(String(row.class_id)) ?? new Set<string>();
    set.add(idOf(row));
    visibleContentsByClass.set(String(row.class_id), set);
  }
  const completedByLearner = new Map<string, Set<string>>();
  for (const row of rows("learner_content_progress")) {
    if (isTrue(row.is_deleted) || !str(row.completed_at)) continue;
    const set = completedByLearner.get(String(row.learner_id)) ?? new Set<string>();
    set.add(String(row.lesson_content_id));
    completedByLearner.set(String(row.learner_id), set);
  }
  const progressLegacy: LegacyFacts["progress"] = [];
  for (const id of learnerKeys) {
    const visible = visibleContentsByClass.get(classOfLearner(id)) ?? new Set<string>();
    const done = [...(completedByLearner.get(id) ?? [])].filter((cid) => visible.has(cid)).length;
    if (visible.size > 0 || done > 0) progressLegacy.push({ learner: id, total: visible.size, completed: done });
  }
  const marksLegacy = new Map<string, { a: number; q: number; m: number }>();
  const marksFor = (id: string) => marksLegacy.get(id) ?? { a: 0, q: 0, m: 0 };
  const factsRounding = { rounded: 0 };
  for (const row of rows("student_assignment")) {
    if (isTrue(row.is_deleted)) continue;
    const graded = str(row.grading_status)?.toUpperCase() === "GRADED" || isTrue(row.graded);
    if (!graded) continue;
    const id = String(row.student_id);
    const e = marksFor(id);
    e.a += toIntRoundHalfUp(row.points_obtained, factsRounding) ?? 0;
    marksLegacy.set(id, e);
  }
  for (const row of rows("quiz_attempts")) {
    if (isTrue(row.is_deleted) || (str(row.status) ?? "SUBMITTED").toUpperCase() !== "SUBMITTED") continue;
    const id = String(row.learner_id);
    const e = marksFor(id);
    e.q += toIntRoundHalfUp(row.score, factsRounding) ?? 0;
    e.m += toIntRoundHalfUp(row.max_score, factsRounding) ?? 0;
    marksLegacy.set(id, e);
  }
  const legacyFacts: LegacyFacts = {
    asOf: asOfIso,
    attendance: attendanceLegacy,
    progress: progressLegacy,
    marks: learnerKeys
      .filter((id) => marksLegacy.has(id))
      .map((id) => ({ learner: id, assignmentPoints: marksLegacy.get(id)!.a, quizScore: marksLegacy.get(id)!.q, quizMax: marksLegacy.get(id)!.m })),
  };

  notes.roundedToInteger = rounding.rounded;

  return {
    courses,
    offerings,
    deliveries,
    teaching,
    associations,
    paths,
    lessons,
    contents,
    assignments,
    submissions,
    progress,
    events,
    sessions,
    records,
    quizzes,
    questions,
    options,
    attempts,
    answers,
    messages,
    announcements,
    fileDeferred,
    legacyFacts,
    stats: c.stats,
    rejections: c.rejections,
    deferred: c.deferred,
    notes,
  };
}
