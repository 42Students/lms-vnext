import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { ZodError } from "zod";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { CoursesServiceError } from "@/modules/courses/errors";
import { getLearnerAttendanceWorkspace } from "@/modules/attendance/learner-service";
import { getFacultyDeliveryRoster, markFacultyAttendance } from "@/modules/attendance/faculty-service";
import {
  getAttendanceParentSmsReadiness,
  getAttendanceParentSmsSupportHistory,
  recordVerifiedAttendanceParentContact,
  revokeAttendanceParentContact,
} from "@/modules/attendance/parent-sms-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
import { deleteDisposableAttendanceEvents, insertDisposableAttendanceMark } from "../support/db045-attendance-fixture.mjs";
import { contextFor, insertPerson as insertActor, person, seededCollegeAdmin, type Person, type TestRole } from "../support/actors";
import {
  cleanupLearnerCourseWriteFixture,
  newLearnerCourseWriteFixture,
  seedLearnerCourseWriteFixture,
} from "../support/learner-course-write-fixture";

/**
 * Attendance and guardian contact data: object-level access between people of the SAME college.
 *
 * Learners A and B are in section 1, learner C is in section 2; each has one recorded mark. Teacher 1 teaches section 1,
 * teacher 2 teaches section 2, teacher 0 teaches nothing. A learner sees only their own attendance; only the section's
 * teaching faculty can read the roster or mark attendance; guardian phone numbers and message history are for the college
 * administrator only. Every refusal must be an access error, and a refused write must leave the marks and the guardian
 * contact table exactly as they were.
 */
if (!process.env.TEST_DATABASE_URL || process.env.DB03_ISOLATED_TEST_DATABASE !== "1") {
  throw new Error("sec-cross-user-attendance needs TEST_DATABASE_URL and DB03_ISOLATED_TEST_DATABASE=1 (disposable database)");
}
assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 });

const fixture = newLearnerCourseWriteFixture();
const { ids } = fixture;
const college = SEED_IDS.collegeA;

const learnerBp = person();
const learnerCp = person();
const teacher1 = person();
const teacher2 = person();
const teacher0 = person();
const section2 = randomUUID();
const delivery2 = randomUUID();
const event1 = randomUUID();
const event2 = randomUUID();
const enrollment = { b: randomUUID(), c: randomUUID() };
const sectionEnrollment = { b: randomUUID(), c: randomUUID() };
const teaching = { t1: randomUUID(), t2: randomUUID() };
const GUARDIAN = "+919876500001";

const as = (p: Person, role: TestRole, collegeId: string = college): RequestContext => contextFor(p, role, collegeId, "sec-att");
const insertPerson = (p: Person, role: string, name: string) => insertActor(pool, p, role, name, college, "sec-att");
const learnerA = fixture.context;
const learnerB = as(learnerBp, "LEARNER");
const learnerC = as(learnerCp, "LEARNER");
const t1 = as(teacher1, "FACULTY");
const t2 = as(teacher2, "FACULTY");
const t0 = as(teacher0, "FACULTY");
const admin = seededCollegeAdmin();
const otherCollegeAdmin = as(person(), "COLLEGE_ADMIN", SEED_IDS.collegeB);

/** Refused by an access rule: never a validation error, never a crash. */
async function refused(call: Promise<unknown>, who: string) {
  let error: unknown = null;
  try {
    await call;
  } catch (caught) {
    error = caught;
  }
  expect(error, who + " must be refused").not.toBeNull();
  expect(error instanceof ZodError, who + " was refused for invalid input, not for access").toBe(false);
  expect(error instanceof AuthorizationError || error instanceof CoursesServiceError, who + ": " + String(error)).toBe(true);
}

const mark = async (membership: string, event: string) =>
  (await pool.query("SELECT status, version FROM attendance_records WHERE schedule_event_id=$1 AND membership_id=$2", [event, membership])).rows[0] as
    | { status: string; version: number }
    | undefined;
const markCount = async () =>
  Number((await pool.query("SELECT count(*)::int AS n FROM attendance_records WHERE schedule_event_id=ANY($1::uuid[])", [[event1, event2]])).rows[0].n);
const contactCount = async () =>
  Number((await pool.query("SELECT count(*)::int AS n FROM attendance_parent_contacts WHERE membership_id=ANY($1::uuid[])", [[ids.membership, learnerBp.membership, learnerCp.membership]])).rows[0].n);

const parentInput = (membershipId: string) => ({
  collegeId: college,
  membershipId,
  phoneE164: GUARDIAN,
  consentEvidenceReference: "SEC-ATT consent form 0001",
  guardianConsentConfirmed: true,
  verifiedParentPhone: true,
});

describe("attendance and guardian data: nobody can reach another person's records", () => {
  beforeAll(async () => {
    await seedLearnerCourseWriteFixture(pool, fixture, { content: true });
    const q = pool.query.bind(pool);
    await insertPerson(learnerBp, "LEARNER", "SEC-ATT Learner B");
    await insertPerson(learnerCp, "LEARNER", "SEC-ATT Learner C");
    await insertPerson(teacher1, "FACULTY", "SEC-ATT Teacher 1");
    await insertPerson(teacher2, "FACULTY", "SEC-ATT Teacher 2");
    await insertPerson(teacher0, "FACULTY", "SEC-ATT Teacher 0");
    await q("INSERT INTO sections(id,cohort_id,academic_period_id,name,code) VALUES($1,$2,$3,$4,$5)", [section2, ids.cohort, ids.period, "SEC-ATT s2", "SEC-ATT-" + section2.slice(0, 8)]);
    await q("INSERT INTO course_section_deliveries(id,offering_id,section_id) VALUES($1,$2,$3)", [delivery2, ids.offering, section2]);
    await q("INSERT INTO learner_program_enrollments(id,membership_id,program_id,cohort_id,status) VALUES($1,$2,$3,$4,'ACTIVE')", [enrollment.b, learnerBp.membership, ids.program, ids.cohort]);
    await q("INSERT INTO section_enrollments(id,learner_enrollment_id,section_id,academic_period_id) VALUES($1,$2,$3,$4)", [sectionEnrollment.b, enrollment.b, ids.section, ids.period]);
    await q("INSERT INTO learner_program_enrollments(id,membership_id,program_id,cohort_id,status) VALUES($1,$2,$3,$4,'ACTIVE')", [enrollment.c, learnerCp.membership, ids.program, ids.cohort]);
    await q("INSERT INTO section_enrollments(id,learner_enrollment_id,section_id,academic_period_id) VALUES($1,$2,$3,$4)", [sectionEnrollment.c, enrollment.c, section2, ids.period]);
    await q("INSERT INTO course_teaching_assignments(id,delivery_id,membership_id) VALUES($1,$2,$3)", [teaching.t1, ids.delivery, teacher1.membership]);
    await q("INSERT INTO course_teaching_assignments(id,delivery_id,membership_id) VALUES($1,$2,$3)", [teaching.t2, delivery2, teacher2.membership]);
    for (const [event, section, delivery] of [[event1, ids.section, ids.delivery], [event2, section2, delivery2]] as const) {
      await q("INSERT INTO section_schedule_events(id,section_id,title,starts_at,ends_at) VALUES($1,$2,'SEC-ATT class',now()-interval '2 hours',now()-interval '1 hour')", [event, section]);
      await q("INSERT INTO section_schedule_event_courses(schedule_event_id,delivery_id) VALUES($1,$2)", [event, delivery]);
      await q("INSERT INTO attendance_sessions(schedule_event_id,status,marked_by_user_id,marked_at) VALUES($1,'MARKED',$2,now())", [event, SEED_IDS.collegeAdminUser]);
    }
    const actor = { collegeId: college, actorUserId: SEED_IDS.collegeAdminUser, actorMembershipId: SEED_IDS.collegeAdminMembership, actorRole: "COLLEGE_ADMIN" };
    await insertDisposableAttendanceMark(pool, { ...actor, scheduleEventId: event1, deliveryId: ids.delivery, membershipId: ids.membership, status: "ABSENT" });
    await insertDisposableAttendanceMark(pool, { ...actor, scheduleEventId: event1, deliveryId: ids.delivery, membershipId: learnerBp.membership, status: "PRESENT" });
    await insertDisposableAttendanceMark(pool, { ...actor, scheduleEventId: event2, deliveryId: delivery2, membershipId: learnerCp.membership, status: "ABSENT" });
  }, 90_000);

  afterAll(async () => {
    try {
      const q = (sql: string, args: unknown[]) => pool.query(sql, args).catch(() => undefined);
      await deleteDisposableAttendanceEvents(pool, [event1, event2]).catch(() => undefined);
      await q("DELETE FROM attendance_parent_contacts WHERE membership_id=ANY($1::uuid[])", [[ids.membership, learnerBp.membership, learnerCp.membership]]);
      await q("DELETE FROM attendance_records WHERE schedule_event_id=ANY($1::uuid[])", [[event1, event2]]);
      await q("DELETE FROM attendance_sessions WHERE schedule_event_id=ANY($1::uuid[])", [[event1, event2]]);
      await q("DELETE FROM section_schedule_event_courses WHERE schedule_event_id=ANY($1::uuid[])", [[event1, event2]]);
      await q("DELETE FROM section_schedule_events WHERE id=ANY($1::uuid[])", [[event1, event2]]);
      await q("DELETE FROM course_teaching_assignments WHERE id=ANY($1::uuid[])", [[teaching.t1, teaching.t2]]);
      await q("DELETE FROM section_enrollments WHERE id=ANY($1::uuid[])", [[sectionEnrollment.b, sectionEnrollment.c]]);
      await q("DELETE FROM learner_program_enrollments WHERE id=ANY($1::uuid[])", [[enrollment.b, enrollment.c]]);
      await q("DELETE FROM course_section_deliveries WHERE id=$1", [delivery2]);
      await q("DELETE FROM sections WHERE id=$1", [section2]);
      for (const p of [learnerBp, learnerCp, teacher1, teacher2, teacher0]) {
        await q("DELETE FROM membership_roles WHERE id=$1", [p.role]);
        await q("DELETE FROM college_memberships WHERE id=$1", [p.membership]);
        await q("DELETE FROM users WHERE id=$1", [p.user]);
      }
      await cleanupLearnerCourseWriteFixture(pool, fixture);
    } finally {
      await pool.end();
      await closeDatabaseConnection();
    }
  }, 90_000);

  describe("a learner's own attendance", () => {
    it("the fixture has three distinct marks", async () => {
      expect((await mark(ids.membership, event1))?.status).toBe("ABSENT");
      expect((await mark(learnerBp.membership, event1))?.status).toBe("PRESENT");
      expect((await mark(learnerCp.membership, event2))?.status).toBe("ABSENT");
    });

    it("each learner's workspace is built only from their own marks", async () => {
      const a = JSON.stringify(await getLearnerAttendanceWorkspace(learnerA, { includeHistorical: true }));
      const b = JSON.stringify(await getLearnerAttendanceWorkspace(learnerB, { includeHistorical: true }));
      // Neither learner's membership id, and nothing about the other section, appears in the other's workspace.
      expect(a).not.toContain(learnerBp.membership);
      expect(a).not.toContain(learnerCp.membership);
      expect(b).not.toContain(ids.membership);
      expect(b).not.toContain(learnerCp.membership);
      expect(a).not.toContain(delivery2);
      expect(b).not.toContain(delivery2);
    });

    it("a learner naming another section's delivery gets none of its data", async () => {
      let workspace: unknown = null;
      let error: unknown = null;
      try {
        workspace = await getLearnerAttendanceWorkspace(learnerC, { includeHistorical: true, deliveryId: ids.delivery });
      } catch (caught) {
        error = caught;
      }
      // Either refused, or an empty workspace; never section 1's marks.
      const text = JSON.stringify(workspace ?? "");
      expect(text).not.toContain(ids.membership);
      expect(text).not.toContain(learnerBp.membership);
      expect(error === null || error instanceof AuthorizationError || error instanceof CoursesServiceError).toBe(true);
    });
  });

  describe("the roster and marking belong to the section's teaching faculty", () => {
    it("the section's teacher can read their roster, and it holds only their section", async () => {
      const { roster } = await getFacultyDeliveryRoster(t1, ids.delivery);
      const members = roster.map((row: { membershipId: string }) => row.membershipId);
      expect(members).toEqual(expect.arrayContaining([ids.membership, learnerBp.membership]));
      expect(members).not.toContain(learnerCp.membership);
    });

    it("learners, a teacher of nothing, the other section's teacher and another college's admin cannot read it", async () => {
      for (const [who, actor] of [
        ["learner A", learnerA], ["learner B", learnerB], ["learner C", learnerC],
        ["teacher 0", t0], ["teacher 2 on section 1", t2], ["other college admin", otherCollegeAdmin],
      ] as const) {
        await refused(getFacultyDeliveryRoster(actor, ids.delivery), who);
      }
      await refused(getFacultyDeliveryRoster(t1, delivery2), "teacher 1 on section 2");
    });

    it("nobody outside the section's teaching faculty can mark, and the marks stay exactly as they were", async () => {
      const before = { a: await mark(ids.membership, event1), b: await mark(learnerBp.membership, event1), count: await markCount() };
      const input = { deliveryId: ids.delivery, absentMembershipIds: [], presentMembershipIds: [ids.membership, learnerBp.membership] };
      for (const [who, actor] of [
        ["learner A marking themselves present", learnerA], ["learner B", learnerB], ["teacher 0", t0],
        ["teacher 2 on section 1's class", t2], ["other college admin", otherCollegeAdmin],
      ] as const) {
        await refused(markFacultyAttendance(actor, event1, input), who);
      }
      expect(await mark(ids.membership, event1)).toEqual(before.a);
      expect(await mark(learnerBp.membership, event1)).toEqual(before.b);
      expect(await markCount()).toBe(before.count);
    });
  });

  describe("guardian phone numbers and message history are for the college administrator only", () => {
    it("the college's administrator can read the readiness of a learner in their college", async () => {
      const readiness = await getAttendanceParentSmsReadiness(admin, { collegeId: college, membershipId: ids.membership });
      expect(readiness).toBeTruthy();
    });

    it("learners, faculty and another college's administrator cannot read it or its history", async () => {
      for (const [who, actor] of [
        ["learner A on own", learnerA], ["learner B on A", learnerB], ["teacher 1", t1], ["teacher 0", t0], ["other college admin", otherCollegeAdmin],
      ] as const) {
        await refused(getAttendanceParentSmsReadiness(actor, { collegeId: college, membershipId: ids.membership }), who + " readiness");
        await refused(getAttendanceParentSmsSupportHistory(actor, { collegeId: college, membershipId: ids.membership }), who + " history");
      }
    });

    it("nobody but the administrator can record or revoke a guardian contact, and no row is created", async () => {
      const before = await contactCount();
      for (const [who, actor] of [
        ["learner A for themself", learnerA], ["learner B for A", learnerB], ["teacher 1", t1], ["teacher 0", t0], ["other college admin", otherCollegeAdmin],
      ] as const) {
        await refused(recordVerifiedAttendanceParentContact(actor, parentInput(ids.membership)), who + " record");
        await refused(revokeAttendanceParentContact(actor, { collegeId: college, membershipId: ids.membership }), who + " revoke");
      }
      expect(await contactCount()).toBe(before);
    });
  });
});
