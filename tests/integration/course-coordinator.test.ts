import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection, getDb } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { CoursesServiceError } from "@/modules/courses/errors";
import {
  assertPersistedOfferingContentAuthority,
  getOfferingCoordinator,
  grantOfferingCoordinator,
  listEligibleOfferingCoordinators,
  listMyCoordinatedOfferings,
  listOfferingCoordinatorHistory,
  resolveOfferingContentAuthority,
  revokeOfferingCoordinator,
} from "@/modules/courses/coordinator-service";
import {
  archiveCourseLesson,
  createCourseLesson,
  moveCollegeCourseLesson,
  reorderCollegeCourseLessons,
  restoreCourseLesson,
  updateCourseLesson,
} from "@/modules/courses/lesson-service";
import { createLessonContent, listLessonContents, transitionLessonContent, updateLessonContent } from "@/modules/courses/lesson-content-service";
import { getCoordinatorOfferingWorkspace } from "@/modules/courses/coordinator-workspace";
import { createCourseAssignment, transitionCourseAssignment, updateCourseAssignment } from "@/modules/courses/assignment-service";
import { createCourseQuiz, transitionCourseQuiz, updateCourseQuiz } from "@/modules/courses/quiz-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled
  ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 })
  : null;

const admin: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "w-coordinator-admin", platformStatus: "ACTIVE", systemRoles: [] },
  membership: {
    id: SEED_IDS.collegeAdminMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"],
  },
};
const otherCollegeAdmin: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "w-coordinator-admin-b", platformStatus: "ACTIVE", systemRoles: [] },
  membership: {
    id: SEED_IDS.facultyCollegeBMembership, collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"],
  },
};

type Person = { user: string; membership: string; role: string };
const person = (): Person => ({ user: randomUUID(), membership: randomUUID(), role: randomUUID() });
const ids = {
  period: randomUUID(), program: randomUUID(), cohort: randomUUID(),
  sectionA: randomUUID(), sectionB: randomUUID(), course: randomUUID(), offering: randomUUID(),
  deliveryA: randomUUID(), deliveryB: randomUUID(),
  teachA: randomUUID(), teachB: randomUUID(),
  path: randomUUID(), otherCourse: randomUUID(), otherOffering: randomUUID(), otherPath: randomUUID(),
};
const lessonIds: string[] = [];
const contentIds: string[] = [];
const assignmentIds: string[] = [];
const quizIds: string[] = [];
const future = () => new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
const oneQuestion = [{
  type: "SINGLE_CHOICE" as const, prompt: "Pick one", points: 1, sequence: 0,
  options: [{ text: "Yes", correct: true, sequence: 0 }, { text: "No", correct: false, sequence: 1 }],
}];
const a = person(); // teaches section A
const b = person(); // teaches section B
const outsider = person(); // faculty in the college who teaches nothing here
const label = "W-COORD-" + ids.course.slice(0, 8);

const faculty = (p: Person): RequestContext => ({
  user: { id: p.user, identityUid: "w-coord-" + p.user, platformStatus: "ACTIVE", systemRoles: [] },
  membership: {
    id: p.membership, collegeId: SEED_IDS.collegeA, organizationId: SEED_IDS.organization,
    status: "ACTIVE", roles: ["FACULTY"],
  },
});
const offering = () => ({ id: ids.offering, collegeId: SEED_IDS.collegeA, organizationId: SEED_IDS.organization });

async function insertPerson(p: Person, name: string) {
  await pool!.query("INSERT INTO users(id,identity_uid,display_name) VALUES($1,$2,$3)", [p.user, "w-coord-" + p.user, name]);
  await pool!.query("INSERT INTO college_memberships(id,user_id,college_id) VALUES($1,$2,$3)", [p.membership, p.user, SEED_IDS.collegeA]);
  await pool!.query("INSERT INTO membership_roles(id,membership_id,role) VALUES($1,$2,'FACULTY')", [p.role, p.membership]);
}

describe.skipIf(!enabled)("Course offering coordinator — PostgreSQL", () => {
  beforeAll(async () => {
    const q = pool!.query.bind(pool);
    await q("INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) VALUES($1,$2,$3,$4,'2026-07-01','2026-12-31')", [ids.period, SEED_IDS.collegeA, label, label]);
    await q("INSERT INTO programs(id,department_id,name,code,duration_terms) VALUES($1,$2,$3,$4,8)", [ids.program, SEED_IDS.departmentA, label, label]);
    await q("INSERT INTO cohorts(id,program_id,name,code,start_period_id) VALUES($1,$2,$3,$4,$5)", [ids.cohort, ids.program, label, label, ids.period]);
    await q("INSERT INTO sections(id,cohort_id,academic_period_id,name,code) VALUES($1,$2,$3,$4,$5)", [ids.sectionA, ids.cohort, ids.period, label + "-A", label + "-A"]);
    await q("INSERT INTO sections(id,cohort_id,academic_period_id,name,code) VALUES($1,$2,$3,$4,$5)", [ids.sectionB, ids.cohort, ids.period, label + "-B", label + "-B"]);
    await q("INSERT INTO courses(id,department_id,name,code) VALUES($1,$2,$3,$4)", [ids.course, SEED_IDS.departmentA, label, label]);
    await q("INSERT INTO course_offerings(id,course_id,cohort_id,academic_period_id) VALUES($1,$2,$3,$4)", [ids.offering, ids.course, ids.cohort, ids.period]);
    await q("INSERT INTO course_section_deliveries(id,offering_id,section_id) VALUES($1,$2,$3)", [ids.deliveryA, ids.offering, ids.sectionA]);
    await q("INSERT INTO course_section_deliveries(id,offering_id,section_id) VALUES($1,$2,$3)", [ids.deliveryB, ids.offering, ids.sectionB]);
    await q("INSERT INTO course_learning_paths(id,offering_id,title) VALUES($1,$2,$3)", [ids.path, ids.offering, label]);
    await q("INSERT INTO courses(id,department_id,name,code) VALUES($1,$2,$3,$4)", [ids.otherCourse, SEED_IDS.departmentA, label + "-other", label + "-other"]);
    await q("INSERT INTO course_offerings(id,course_id,cohort_id,academic_period_id) VALUES($1,$2,$3,$4)", [ids.otherOffering, ids.otherCourse, ids.cohort, ids.period]);
    await q("INSERT INTO course_learning_paths(id,offering_id,title) VALUES($1,$2,$3)", [ids.otherPath, ids.otherOffering, label + "-other"]);
    await insertPerson(a, label + " Teacher A");
    await insertPerson(b, label + " Teacher B");
    await insertPerson(outsider, label + " Outsider");
    await q("INSERT INTO course_teaching_assignments(id,delivery_id,membership_id) VALUES($1,$2,$3)", [ids.teachA, ids.deliveryA, a.membership]);
    await q("INSERT INTO course_teaching_assignments(id,delivery_id,membership_id) VALUES($1,$2,$3)", [ids.teachB, ids.deliveryB, b.membership]);
  });

  afterAll(async () => {
    try {
      if (pool) {
        // Test-owned rows only. The coordinator tables refuse deletes by design, so lift their guards for cleanup.
        for (const t of ["course_offering_coordinator_events", "course_offering_coordinators"]) {
          await pool.query(`ALTER TABLE ${t} DISABLE TRIGGER USER`);
        }
        await pool.query("DELETE FROM course_offering_coordinator_events WHERE coordinator_id IN (SELECT id FROM course_offering_coordinators WHERE offering_id=$1)", [ids.offering]);
        await pool.query("DELETE FROM course_offering_coordinators WHERE offering_id=$1", [ids.offering]);
        for (const t of ["course_offering_coordinator_events", "course_offering_coordinators"]) {
          await pool.query(`ALTER TABLE ${t} ENABLE TRIGGER USER`);
        }
        await pool.query("DELETE FROM activity_events WHERE subject_id = ANY($1::text[])", [[...lessonIds, ...contentIds, ...assignmentIds, ...quizIds]]);
        await pool.query("DELETE FROM quiz_options WHERE question_id IN (SELECT id FROM quiz_questions WHERE quiz_id = ANY($1::uuid[]))", [quizIds]);
        await pool.query("DELETE FROM quiz_questions WHERE quiz_id = ANY($1::uuid[])", [quizIds]);
        await pool.query("DELETE FROM course_quizzes WHERE id = ANY($1::uuid[])", [quizIds]);
        await pool.query("DELETE FROM course_assignments WHERE id = ANY($1::uuid[])", [assignmentIds]);
        await pool.query("DELETE FROM lesson_contents WHERE lesson_id = ANY($1::uuid[])", [lessonIds]);
        await pool.query("DELETE FROM course_lessons WHERE id = ANY($1::uuid[])", [lessonIds]);
        await pool.query("DELETE FROM course_learning_paths WHERE id = ANY($1::uuid[])", [[ids.path, ids.otherPath]]);
        await pool.query("DELETE FROM course_offerings WHERE id=$1", [ids.otherOffering]);
        await pool.query("DELETE FROM program_term_courses WHERE course_id=$1", [ids.otherCourse]);
        await pool.query("DELETE FROM courses WHERE id=$1", [ids.otherCourse]);
        await pool.query("DELETE FROM course_teaching_assignments WHERE delivery_id = ANY($1::uuid[])", [[ids.deliveryA, ids.deliveryB]]);
        await pool.query("DELETE FROM course_section_deliveries WHERE offering_id=$1", [ids.offering]);
        await pool.query("DELETE FROM course_offerings WHERE id=$1", [ids.offering]);
        await pool.query("DELETE FROM program_term_courses WHERE course_id=$1", [ids.course]);
        await pool.query("DELETE FROM courses WHERE id=$1", [ids.course]);
        await pool.query("DELETE FROM sections WHERE cohort_id=$1", [ids.cohort]);
        await pool.query("DELETE FROM cohorts WHERE id=$1", [ids.cohort]);
        await pool.query("DELETE FROM program_terms WHERE program_id=$1", [ids.program]);
        await pool.query("DELETE FROM programs WHERE id=$1", [ids.program]);
        await pool.query("DELETE FROM academic_periods WHERE id=$1", [ids.period]);
        for (const p of [a, b, outsider]) {
          await pool.query("DELETE FROM activity_events WHERE actor_membership_id=$1 OR actor_user_id=$2", [p.membership, p.user]);
          await pool.query("DELETE FROM membership_roles WHERE membership_id=$1", [p.membership]);
          await pool.query("DELETE FROM college_memberships WHERE id=$1", [p.membership]);
          await pool.query("DELETE FROM users WHERE id=$1", [p.user]);
        }
      }
    } finally {
      await pool?.end();
      await closeDatabaseConnection();
    }
  });

  it("lists only teachers of this offering as eligible", async () => {
    const eligible = await listEligibleOfferingCoordinators(admin, ids.offering);
    const found = eligible.map((row) => row.membershipId).sort();
    expect(found).toEqual([a.membership, b.membership].sort());
    expect(found).not.toContain(outsider.membership);
  });

  it("refuses a non-admin and another college's admin", async () => {
    await expect(grantOfferingCoordinator(faculty(a), ids.offering, a.membership)).rejects.toBeInstanceOf(AuthorizationError);
    await expect(grantOfferingCoordinator(otherCollegeAdmin, ids.offering, a.membership)).rejects.toBeInstanceOf(AuthorizationError);
    await expect(getOfferingCoordinator(faculty(a), ids.offering)).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("refuses a nominee who does not teach the offering", async () => {
    await expect(grantOfferingCoordinator(admin, ids.offering, outsider.membership))
      .rejects.toMatchObject({ code: "COORDINATOR_NOT_ELIGIBLE" });
  });

  it("before any grant nobody but an admin has content authority", async () => {
    expect(await resolveOfferingContentAuthority(admin, offering())).toBe("ADMIN");
    expect(await resolveOfferingContentAuthority(faculty(a), offering())).toBeNull();
    expect(await resolveOfferingContentAuthority(faculty(b), offering())).toBeNull();
  });

  it("grants one coordinator, repeats harmlessly, and refuses a second", async () => {
    const first = await grantOfferingCoordinator(admin, ids.offering, a.membership);
    expect(first.membershipId).toBe(a.membership);
    expect(first.counts).toBe(true);
    const again = await grantOfferingCoordinator(admin, ids.offering, a.membership);
    expect(again.grantId).toBe(first.grantId);
    await expect(grantOfferingCoordinator(admin, ids.offering, b.membership))
      .rejects.toMatchObject({ code: "COORDINATOR_ALREADY_ASSIGNED" });
    const { rows } = await pool!.query("SELECT count(*)::int AS n FROM course_offering_coordinators WHERE offering_id=$1 AND revoked_at IS NULL", [ids.offering]);
    expect(rows[0].n).toBe(1);
  });

  it("gives authority to the coordinator only, and lists it as theirs", async () => {
    expect(await resolveOfferingContentAuthority(faculty(a), offering())).toBe("COORDINATOR");
    expect(await resolveOfferingContentAuthority(faculty(b), offering())).toBeNull();
    expect(await resolveOfferingContentAuthority(faculty(outsider), offering())).toBeNull();
    expect((await listMyCoordinatedOfferings(faculty(a))).map((row) => row.offeringId)).toEqual([ids.offering]);
    expect(await listMyCoordinatedOfferings(faculty(b))).toEqual([]);
  });

  it("rechecks the persisted facts inside a transaction", async () => {
    const ok = await getDb().transaction((tx) => assertPersistedOfferingContentAuthority(tx, faculty(a), offering()));
    expect(ok).toBe("COORDINATOR");
    await expect(getDb().transaction((tx) => assertPersistedOfferingContentAuthority(tx, faculty(b), offering())))
      .rejects.toMatchObject({ code: "FACULTY_TEACHING_SCOPE_REQUIRED" });
  });

  it("lapses while the teacher no longer teaches the offering, and works again when they return", async () => {
    await pool!.query("UPDATE course_teaching_assignments SET ended_at=now() WHERE id=$1", [ids.teachA]);
    expect(await resolveOfferingContentAuthority(faculty(a), offering())).toBeNull();
    await expect(getDb().transaction((tx) => assertPersistedOfferingContentAuthority(tx, faculty(a), offering())))
      .rejects.toBeInstanceOf(CoursesServiceError);
    expect(await listMyCoordinatedOfferings(faculty(a))).toEqual([]);
    expect((await getOfferingCoordinator(admin, ids.offering))?.counts).toBe(false);
    await pool!.query("UPDATE course_teaching_assignments SET ended_at=NULL WHERE id=$1", [ids.teachA]);
    expect(await resolveOfferingContentAuthority(faculty(a), offering())).toBe("COORDINATOR");
  });

  it("stops counting when the person is suspended or loses the faculty role", async () => {
    await pool!.query("UPDATE college_memberships SET status='SUSPENDED', suspended_at=now() WHERE id=$1", [a.membership]);
    expect(await resolveOfferingContentAuthority(faculty(a), offering())).toBeNull();
    await pool!.query("UPDATE college_memberships SET status='ACTIVE', suspended_at=NULL WHERE id=$1", [a.membership]);
    await pool!.query("DELETE FROM membership_roles WHERE id=$1", [a.role]);
    expect(await resolveOfferingContentAuthority(faculty(a), offering())).toBeNull();
    await pool!.query("INSERT INTO membership_roles(id,membership_id,role) VALUES($1,$2,'FACULTY')", [a.role, a.membership]);
    // Removing the faculty role also ends their teaching assignments (database trigger), so they stay idle.
    expect(await resolveOfferingContentAuthority(faculty(a), offering())).toBeNull();
    await pool!.query("UPDATE course_teaching_assignments SET ended_at=NULL WHERE id=$1", [ids.teachA]);
    expect(await resolveOfferingContentAuthority(faculty(a), offering())).toBe("COORDINATOR");
  });

  it("revokes, records history, and re-grants as a new nomination", async () => {
    await revokeOfferingCoordinator(admin, ids.offering);
    expect(await getOfferingCoordinator(admin, ids.offering)).toBeNull();
    expect(await resolveOfferingContentAuthority(faculty(a), offering())).toBeNull();
    await expect(revokeOfferingCoordinator(admin, ids.offering)).rejects.toMatchObject({ code: "COORDINATOR_NOT_FOUND" });
    const next = await grantOfferingCoordinator(admin, ids.offering, b.membership);
    expect(next.membershipId).toBe(b.membership);
    await revokeOfferingCoordinator(admin, ids.offering);
    await grantOfferingCoordinator(admin, ids.offering, a.membership);
    const history = (await listOfferingCoordinatorHistory(admin, ids.offering)).map((row) => row.action);
    expect(history.filter((x) => x === "GRANTED").length).toBe(2);
    expect(history).toContain("REGRANTED");
    expect(history.filter((x) => x === "REVOKED").length).toBe(2);
  });

  it("lets the counted coordinator manage the shared lesson structure", async () => {
    const coordinator = faculty(a);
    const one = await createCourseLesson(coordinator, { learningPathId: ids.path, name: label + " L1", sequence: 0 });
    const two = await createCourseLesson(coordinator, { learningPathId: ids.path, name: label + " L2", sequence: 1 });
    lessonIds.push(one.id, two.id);
    const renamed = await updateCourseLesson(coordinator, two.id, {
      name: label + " L2 renamed", visibleToStudents: false, expectedUpdatedAt: two.updatedAt.toISOString(),
    });
    expect(renamed.name).toContain("renamed");
    expect(renamed.visibleToStudents).toBe(false);
    const moved = await moveCollegeCourseLesson(coordinator, { learningPathId: ids.path, lessonId: two.id, expectedSequence: 1, direction: "UP" });
    expect(moved.sequence).toBe(0);
    const live = (await pool!.query("SELECT id,sequence FROM course_lessons WHERE learning_path_id=$1 AND status='ACTIVE' ORDER BY sequence", [ids.path])).rows;
    const reordered = await reorderCollegeCourseLessons(coordinator, {
      learningPathId: ids.path,
      expected: live.map((row) => ({ id: row.id, sequence: row.sequence })),
      orderedIds: [...live].reverse().map((row) => row.id),
    });
    expect(reordered.changed).toBe(true);
    const archived = await archiveCourseLesson(coordinator, one.id);
    expect(archived.status).toBe("ARCHIVED");
    const restored = await restoreCourseLesson(coordinator, one.id);
    expect(restored.status).toBe("ACTIVE");
  });

  it("keeps a lesson inside its offering: a coordinator cannot move it to another course", async () => {
    const lesson = await createCourseLesson(faculty(a), { learningPathId: ids.path, name: label + " stays", sequence: 5 });
    lessonIds.push(lesson.id);
    await expect(updateCourseLesson(faculty(a), lesson.id, {
      targetLearningPathId: ids.otherPath, expectedUpdatedAt: lesson.updatedAt.toISOString(),
    })).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("refuses other teachers, the outsider and a foreign admin on the shared structure", async () => {
    const lesson = (await pool!.query("SELECT id, updated_at FROM course_lessons WHERE id = $1", [lessonIds[0]])).rows[0];
    for (const who of [faculty(b), faculty(outsider)]) {
      await expect(createCourseLesson(who, { learningPathId: ids.path, name: label + " nope", sequence: 9 })).rejects.toBeInstanceOf(AuthorizationError);
      await expect(archiveCourseLesson(who, lesson.id)).rejects.toBeInstanceOf(AuthorizationError);
      await expect(updateCourseLesson(who, lesson.id, { name: "x", expectedUpdatedAt: lesson.updated_at.toISOString() })).rejects.toBeInstanceOf(AuthorizationError);
    }
    await expect(createCourseLesson(otherCollegeAdmin, { learningPathId: ids.path, name: label + " foreign", sequence: 9 })).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("lets the coordinator author shared lesson items, but never another teacher's section-only item", async () => {
    const lessonId = lessonIds[0]!;
    const shared = await createLessonContent(faculty(a), { lessonId, contentType: "RESOURCE", title: label + " shared note", notes: "for everyone", sequence: 0 });
    contentIds.push(shared.id);
    const edited = await updateLessonContent(faculty(a), shared.id, { title: label + " shared note v2", expectedUpdatedAt: shared.updatedAt.toISOString() });
    expect(edited.title).toContain("v2");
    const published = await transitionLessonContent(faculty(a), shared.id, { action: "PUBLISH", expectedUpdatedAt: edited.updatedAt.toISOString() });
    expect(published.status).toBe("PUBLISHED");
    await expect(createLessonContent(faculty(b), { lessonId, contentType: "RESOURCE", title: label + " b shared", notes: "x", sequence: 1 })).rejects.toBeInstanceOf(AuthorizationError);
    // Section B belongs to teacher B: the coordinator of the course (teacher A) has no reach into it.
    await expect(createLessonContent(faculty(a), { lessonId, deliveryId: ids.deliveryB, contentType: "RESOURCE", title: label + " into B", notes: "x", sequence: 2 }))
      .rejects.toMatchObject({ code: "FACULTY_TEACHING_SCOPE_REQUIRED" });
    const [sectionOnly] = (await pool!.query(
      "INSERT INTO lesson_contents(lesson_id,delivery_id,content_type,title,notes,sequence,created_by_user_id) VALUES($1,$2,'RESOURCE',$3,'b only',3,$4) RETURNING id, updated_at",
      [lessonId, ids.deliveryB, label + " B only", b.user])).rows;
    contentIds.push(sectionOnly.id);
    await expect(updateLessonContent(faculty(a), sectionOnly.id, { title: "hijack", expectedUpdatedAt: sectionOnly.updated_at.toISOString() }))
      .rejects.toMatchObject({ code: "FACULTY_TEACHING_SCOPE_REQUIRED" });
    await expect(transitionLessonContent(faculty(a), sectionOnly.id, { action: "ARCHIVE", expectedUpdatedAt: sectionOnly.updated_at.toISOString() }))
      .rejects.toMatchObject({ code: "FACULTY_TEACHING_SCOPE_REQUIRED" });
  });

  it("lets the coordinator author shared assignments and quizzes, and nobody else", async () => {
    const lessonId = lessonIds[0]!;
    const assignment = await createCourseAssignment(faculty(a), {
      lessonId, title: label + " shared assignment", maxPoints: 10, sequence: 0, dueAt: future(),
    });
    assignmentIds.push(assignment.id);
    expect(assignment.deliveryId).toBeNull();
    const edited = await updateCourseAssignment(faculty(a), assignment.id, { title: label + " shared assignment v2", expectedUpdatedAt: assignment.updatedAt.toISOString() });
    expect(edited.title).toContain("v2");
    const published = await transitionCourseAssignment(faculty(a), assignment.id, { action: "PUBLISH", expectedUpdatedAt: edited.updatedAt.toISOString() });
    expect(published.status).toBe("PUBLISHED");

    const quiz = await createCourseQuiz(faculty(a), {
      lessonId, title: label + " shared quiz", sequence: 0, dueAt: future(), questions: oneQuestion,
    });
    quizIds.push(quiz.id);
    expect(quiz.deliveryId).toBeNull();
    const quizEdited = await updateCourseQuiz(faculty(a), quiz.id, { title: label + " shared quiz v2", expectedUpdatedAt: quiz.updatedAt.toISOString() });
    expect(quizEdited.title).toContain("v2");
    const quizPublished = await transitionCourseQuiz(faculty(a), quiz.id, { action: "PUBLISH", expectedUpdatedAt: quizEdited.updatedAt.toISOString() });
    expect(quizPublished.status).toBe("PUBLISHED");

    for (const who of [faculty(b), faculty(outsider), otherCollegeAdmin]) {
      await expect(createCourseAssignment(who, { lessonId, title: label + " nope", maxPoints: 1, sequence: 5 })).rejects.toBeInstanceOf(AuthorizationError);
      await expect(createCourseQuiz(who, { lessonId, title: label + " nope", sequence: 5, questions: oneQuestion })).rejects.toBeInstanceOf(AuthorizationError);
      await expect(updateCourseAssignment(who, assignment.id, { title: "hijack" })).rejects.toBeInstanceOf(AuthorizationError);
      await expect(transitionCourseQuiz(who, quiz.id, { action: "UNPUBLISH", expectedUpdatedAt: quizPublished.updatedAt.toISOString() })).rejects.toBeInstanceOf(AuthorizationError);
    }
  });

  it("keeps another teacher's section-only assignment and quiz out of the coordinator's reach", async () => {
    const lessonId = lessonIds[0]!;
    await expect(createCourseAssignment(faculty(a), { lessonId, deliveryId: ids.deliveryB, title: label + " into B", maxPoints: 1, sequence: 7 }))
      .rejects.toMatchObject({ code: "FACULTY_TEACHING_SCOPE_REQUIRED" });
    await expect(createCourseQuiz(faculty(a), { lessonId, deliveryId: ids.deliveryB, title: label + " into B", sequence: 7, questions: oneQuestion }))
      .rejects.toMatchObject({ code: "FACULTY_TEACHING_SCOPE_REQUIRED" });
    // Teacher B legitimately owns section-only items in their own section.
    const bAssignment = await createCourseAssignment(faculty(b), { lessonId, deliveryId: ids.deliveryB, title: label + " B assignment", maxPoints: 5, sequence: 8, dueAt: future() });
    assignmentIds.push(bAssignment.id);
    const bQuiz = await createCourseQuiz(faculty(b), { lessonId, deliveryId: ids.deliveryB, title: label + " B quiz", sequence: 8, dueAt: future(), questions: oneQuestion });
    quizIds.push(bQuiz.id);
    await expect(updateCourseAssignment(faculty(a), bAssignment.id, { title: "hijack", expectedUpdatedAt: bAssignment.updatedAt.toISOString() }))
      .rejects.toMatchObject({ code: "FACULTY_TEACHING_SCOPE_REQUIRED" });
    await expect(transitionCourseAssignment(faculty(a), bAssignment.id, { action: "ARCHIVE", expectedUpdatedAt: bAssignment.updatedAt.toISOString() }))
      .rejects.toMatchObject({ code: "FACULTY_TEACHING_SCOPE_REQUIRED" });
    await expect(updateCourseQuiz(faculty(a), bQuiz.id, { title: "hijack", expectedUpdatedAt: bQuiz.updatedAt.toISOString() }))
      .rejects.toMatchObject({ code: "FACULTY_TEACHING_SCOPE_REQUIRED" });
    await expect(transitionCourseQuiz(faculty(a), bQuiz.id, { action: "ARCHIVE", expectedUpdatedAt: bQuiz.updatedAt.toISOString() }))
      .rejects.toMatchObject({ code: "FACULTY_TEACHING_SCOPE_REQUIRED" });
  });

  it("shows the coordinator the shared items others created, and plain teachers only their own", async () => {
    const lessonId = lessonIds[0]!;
    const byAdmin = await createLessonContent(admin, { lessonId, contentType: "RESOURCE", title: label + " admin shared", notes: "from the admin", sequence: 30 });
    contentIds.push(byAdmin.id);
    const seenByCoordinator = (await listLessonContents(faculty(a), lessonId, ids.deliveryA)).map((row) => row.id);
    expect(seenByCoordinator).toContain(byAdmin.id);
    const seenByTeacherB = (await listLessonContents(faculty(b), lessonId, ids.deliveryB)).map((row) => row.id);
    expect(seenByTeacherB).not.toContain(byAdmin.id);
    // A coordinator can then maintain that shared item.
    const updated = await updateLessonContent(faculty(a), byAdmin.id, { title: label + " admin shared (edited)", expectedUpdatedAt: byAdmin.updatedAt.toISOString() });
    expect(updated.title).toContain("edited");
  });

  it("opens the shared workspace for the coordinator and an admin, not for other teachers", async () => {
    const workspace = await getCoordinatorOfferingWorkspace(faculty(a), ids.offering);
    expect(workspace.learningPath?.id).toBe(ids.path);
    expect(workspace.offering.courseName).toContain("W-COORD");
    const lessonCount = workspace.lessons.length;
    expect(lessonCount).toBeGreaterThan(0);
    // Only shared items appear: nothing created for teacher B's section.
    const everyContent = workspace.lessons.flatMap((lesson) => lesson.contents.map((item) => item.deliveryId));
    expect(everyContent.every((value) => value === null)).toBe(true);
    const adminView = await getCoordinatorOfferingWorkspace(admin, ids.offering);
    expect(adminView.lessons.length).toBe(lessonCount);
    await expect(getCoordinatorOfferingWorkspace(faculty(b), ids.offering)).rejects.toMatchObject({ code: "FACULTY_TEACHING_SCOPE_REQUIRED" });
    await expect(getCoordinatorOfferingWorkspace(faculty(outsider), ids.offering)).rejects.toMatchObject({ code: "FACULTY_TEACHING_SCOPE_REQUIRED" });
    await expect(getCoordinatorOfferingWorkspace(otherCollegeAdmin, ids.offering)).rejects.toBeDefined();
  });

  it("a lapsed coordinator loses the shared structure at once and regains it on return", async () => {
    await pool!.query("UPDATE course_teaching_assignments SET ended_at=now() WHERE id=$1", [ids.teachA]);
    await expect(createCourseLesson(faculty(a), { learningPathId: ids.path, name: label + " lapsed", sequence: 20 })).rejects.toBeInstanceOf(AuthorizationError);
    await pool!.query("UPDATE course_teaching_assignments SET ended_at=NULL WHERE id=$1", [ids.teachA]);
    const back = await createCourseLesson(faculty(a), { learningPathId: ids.path, name: label + " back", sequence: 21 });
    lessonIds.push(back.id);
    expect(back.id).toBeDefined();
  });

  it("is enforced by the database too: no deletes, no rewrites, no cross-college rows, append-only events", async () => {
    const { rows } = await pool!.query("SELECT id FROM course_offering_coordinators WHERE offering_id=$1 AND revoked_at IS NOT NULL LIMIT 1", [ids.offering]);
    const revokedId = rows[0].id;
    await expect(pool!.query("DELETE FROM course_offering_coordinators WHERE id=$1", [revokedId])).rejects.toThrow(/never deleted/);
    await expect(pool!.query("UPDATE course_offering_coordinators SET revoked_at=NULL WHERE id=$1", [revokedId])).rejects.toThrow(/stays revoked/);
    await expect(pool!.query("UPDATE course_offering_coordinators SET membership_id=$2 WHERE id=$1", [revokedId, b.membership])).rejects.toThrow(/cannot be rewritten/);
    await expect(pool!.query("UPDATE course_offering_coordinator_events SET action='GRANTED'")).rejects.toThrow(/append-only/);
    await expect(pool!.query("DELETE FROM course_offering_coordinator_events")).rejects.toThrow(/append-only/);
    await expect(pool!.query(
      "INSERT INTO course_offering_coordinators(offering_id,college_id,membership_id) VALUES($1,$2,$3)",
      [ids.offering, SEED_IDS.collegeB, a.membership],
    )).rejects.toThrow();
    await expect(pool!.query(
      "INSERT INTO course_offering_coordinators(offering_id,college_id,membership_id) VALUES($1,$2,$3)",
      [ids.offering, SEED_IDS.collegeA, b.membership],
    )).rejects.toThrow(/active_uq|duplicate/);
  });
});
