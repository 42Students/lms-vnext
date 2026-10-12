import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { createProgram } from "@/modules/academics/program-service";
import { createAcademicPeriod } from "@/modules/academics/period-service";
import { createCohort } from "@/modules/academics/cohort-service";
import { createSection } from "@/modules/academics/section-service";
import { createCourse } from "@/modules/courses/course-service";
import { createCourseOffering } from "@/modules/courses/offering-service";
import { createCourseSectionDelivery } from "@/modules/courses/delivery-service";
import { createCourseTeachingAssignment } from "@/modules/courses/teaching-assignment-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

// Requires a disposable, seeded PostgreSQL test DB. Never run against
// production. This suite is authored, NOT claimed executed by Chat 6.
const connectionString =
  process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("A disposable TEST_DATABASE_URL is required for DB05 race tests");
}
const pool = new Pool({ connectionString, max: 2 });
const prefix = "S6LK-";

const admin: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser,
    identityUid: "seed-college-admin",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.collegeAdminMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["COLLEGE_ADMIN"],
  },
};

const facultyIds = {
  user: "81000000-0000-4000-8000-000000000006",
  membership: "82000000-0000-4000-8000-000000000006",
  role: "83000000-0000-4000-8000-000000000006",
};

async function cleanup() {
  // Fixed prefix ensures cleanup never touches other seeded or test rows.
  await pool.query(`DELETE FROM course_teaching_assignments WHERE delivery_id IN (
    SELECT d.id FROM course_section_deliveries d
    JOIN course_offerings o ON o.id=d.offering_id
    JOIN courses c ON c.id=o.course_id WHERE c.code LIKE 'S6LK-%'
  )`);
  await pool.query(`DELETE FROM course_section_deliveries WHERE offering_id IN (
    SELECT o.id FROM course_offerings o JOIN courses c ON c.id=o.course_id
    WHERE c.code LIKE 'S6LK-%'
  )`);
  await pool.query(`DELETE FROM course_offerings WHERE course_id IN (
    SELECT id FROM courses WHERE code LIKE 'S6LK-%'
  )`);
  await pool.query("DELETE FROM courses WHERE code LIKE 'S6LK-%'");
  await pool.query(`DELETE FROM sections WHERE cohort_id IN (
    SELECT c.id FROM cohorts c JOIN programs p ON p.id=c.program_id
    WHERE p.code LIKE 'S6LK-%'
  )`);
  await pool.query(`DELETE FROM cohorts WHERE program_id IN (
    SELECT id FROM programs WHERE code LIKE 'S6LK-%'
  )`);
  await pool.query("DELETE FROM programs WHERE code LIKE 'S6LK-%'");
  await pool.query("DELETE FROM academic_periods WHERE code LIKE 'S6LK-%'");
  await pool.query("DELETE FROM departments WHERE name = 'S6LK Locked Department'");
  await pool.query("DELETE FROM membership_roles WHERE membership_id=$1", [facultyIds.membership]);
  await pool.query("DELETE FROM college_memberships WHERE id=$1", [facultyIds.membership]);
  await pool.query("DELETE FROM users WHERE id=$1", [facultyIds.user]);
}

async function structure() {
  const program = await createProgram(admin, {
    departmentId: SEED_IDS.departmentA,
    name: "S6LK Source Program",
    code: prefix + "PROGRAM",
    durationTerms: 8,
  });
  const period = await createAcademicPeriod(admin, {
    collegeId: SEED_IDS.collegeA,
    name: "S6LK Term 1",
    code: prefix + "PERIOD",
    startDate: "2026-07-01",
    endDate: "2026-12-15",
  });
  const cohort = await createCohort(admin, {
    programId: program.id,
    name: "S6LK Cohort",
    code: prefix + "COHORT",
    startPeriodId: period.id,
  });
  const section = await createSection(admin, {
    cohortId: cohort.id,
    academicPeriodId: period.id,
    name: "S6LK Section",
    code: prefix + "SECTION",
    capacity: 30,
  });
  const course = await createCourse(admin, {
    departmentId: SEED_IDS.departmentA,
    name: "S6LK Database Safety",
    code: prefix + "COURSE",
  });
  return { program, period, cohort, section, course };
}

async function offeringFor(
  created: Awaited<ReturnType<typeof structure>>,
) {
  return createCourseOffering(admin, {
    courseId: created.course.id,
    cohortId: created.cohort.id,
    academicPeriodId: created.period.id,
    type: "CORE",
    credits: 3,
    displayOrder: 0,
  });
}

async function blockedParentMutation(
  sql: string,
  values: readonly (string | number)[],
  childWrite: () => Promise<unknown>,
  expectedError: string,
) {
  const holder = await pool.connect();
  let committed = false;
  try {
    await holder.query("BEGIN");
    // A writer has changed the parent but not committed. The child may
    // still see the old committed state in its preliminary scope SELECT.
    await holder.query(sql, [...values]);
    const pending = childWrite().then(
      () => ({ ok: true as const, error: null }),
      (error: unknown) => ({ ok: false as const, error }),
    );
    // Give the child time to reach a blocking FOR SHARE when possible.
    await new Promise((resolve) => setTimeout(resolve, 75));
    await holder.query("COMMIT");
    committed = true;
    const result = await pending;
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatchObject({ code: expectedError });
    }
  } finally {
    if (!committed) {
      await holder.query("ROLLBACK").catch(() => undefined);
    }
    holder.release();
  }
}

beforeEach(cleanup);
afterAll(async () => {
  await cleanup();
  await pool.end();
  await closeDatabaseConnection();
});

describe("DB05 transactional authoring authorization against PostgreSQL", () => {
  it("rejects course creation when an authorized department archives mid-flight", async () => {
    const result = await pool.query<{ id: string }>(
      "INSERT INTO departments (college_id, name) VALUES ($1, 'S6LK Locked Department') RETURNING id",
      [SEED_IDS.collegeA],
    );
    const departmentId = result.rows[0]!.id;
    await blockedParentMutation(
      "UPDATE departments SET archived_at=now() WHERE id=$1",
      [departmentId],
      () => createCourse(admin, {
        departmentId,
        name: "S6LK Should Not Be Created",
        code: prefix + "REJECT",
      }),
      "DEPARTMENT_NOT_FOUND",
    );
    const found = await pool.query("SELECT id FROM courses WHERE code=$1", [prefix + "REJECT"]);
    expect(found.rowCount).toBe(0);
  });

  it("rejects an offering after its chosen academic period closes", async () => {
    const prepared = await structure();
    await blockedParentMutation(
      "UPDATE academic_periods SET status='CLOSED' WHERE id=$1",
      [prepared.period.id],
      () => offeringFor(prepared),
      "ACADEMIC_PERIOD_CLOSED",
    );
    const found = await pool.query("SELECT id FROM course_offerings WHERE course_id=$1", [prepared.course.id]);
    expect(found.rowCount).toBe(0);
  });

  it("rejects a delivery after its authorized section archives", async () => {
    const prepared = await structure();
    const offering = await offeringFor(prepared);
    await blockedParentMutation(
      "UPDATE sections SET status='ARCHIVED' WHERE id=$1",
      [prepared.section.id],
      () => createCourseSectionDelivery(admin, {
        offeringId: offering.id,
        sectionId: prepared.section.id,
      }),
      "SECTION_NOT_DELIVERABLE",
    );
    const found = await pool.query("SELECT id FROM course_section_deliveries WHERE offering_id=$1", [offering.id]);
    expect(found.rowCount).toBe(0);
  });

  it("rejects a teacher assignment after FACULTY role is revoked", async () => {
    const prepared = await structure();
    const offering = await offeringFor(prepared);
    const delivery = await createCourseSectionDelivery(admin, {
      offeringId: offering.id,
      sectionId: prepared.section.id,
    });
    await pool.query(
      "INSERT INTO users (id, identity_uid, display_name) VALUES ($1, $2, $3)",
      [facultyIds.user, "db05-s6lk-role-race", "S6LK Faculty"],
    );
    await pool.query(
      "INSERT INTO college_memberships (id, user_id, college_id) VALUES ($1,$2,$3)",
      [facultyIds.membership, facultyIds.user, SEED_IDS.collegeA],
    );
    await pool.query(
      "INSERT INTO membership_roles (id, membership_id, role) VALUES ($1,$2,'FACULTY')",
      [facultyIds.role, facultyIds.membership],
    );
    await blockedParentMutation(
      "DELETE FROM membership_roles WHERE id=$1",
      [facultyIds.role],
      () => createCourseTeachingAssignment(admin, {
        deliveryId: delivery.id,
        membershipId: facultyIds.membership,
        role: "PRIMARY",
      }),
      "FACULTY_ROLE_REQUIRED",
    );
    const found = await pool.query(
      "SELECT id FROM course_teaching_assignments WHERE delivery_id=$1 AND membership_id=$2",
      [delivery.id, facultyIds.membership],
    );
    expect(found.rowCount).toBe(0);
  });
});
