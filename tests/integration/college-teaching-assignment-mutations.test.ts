import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  createCourseTeachingAssignment,
  endCourseTeachingAssignment,
} from "@/modules/courses/teaching-assignment-service";
import { listCollegeTeachingOptions } from "@/modules/courses/college-teaching-options-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled
  ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 })
  : null;

const admin: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser, identityUid: "w-college-faculty-assignment",
    platformStatus: "ACTIVE", systemRoles: [],
  },
  membership: {
    id: SEED_IDS.collegeAdminMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE", roles: ["COLLEGE_ADMIN"],
  },
};
const adminB: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser, identityUid: "w-college-faculty-assignment-b",
    platformStatus: "ACTIVE", systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeBMembership,
    collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE", roles: ["COLLEGE_ADMIN"],
  },
};
const noManage: RequestContext = {
  ...admin,
  membership: { ...admin.membership!, roles: ["FACULTY"] },
};
const ids = {
  period: randomUUID(), program: randomUUID(), cohort: randomUUID(),
  section: randomUUID(), course: randomUUID(), offering: randomUUID(),
  delivery: randomUUID(), otherUser: randomUUID(), otherMembership: randomUUID(),
  otherRole: randomUUID(),
};
const label = "W-CTA-" + ids.course.slice(0, 8);
const assignments: string[] = [];

describe.skipIf(!enabled)("College Admin Faculty teaching assignment mutations — PostgreSQL", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("Disposable PostgreSQL required");
    const tables = await pool.query(
      "SELECT to_regclass('public.course_teaching_assignments') AS assignments, " +
      "to_regclass('public.activity_events') AS audits, " +
      "to_regclass('public.course_section_deliveries') AS deliveries",
    );
    for (const value of Object.values(tables.rows[0] ?? {})) {
      if (!value) throw new Error("Registered delivery, assignment and activity tables required");
    }
    await pool.query(
      "INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) " +
      "VALUES($1,$2,$3,$4,'2026-07-01','2026-12-31')",
      [ids.period, SEED_IDS.collegeA, label, label],
    );
    await pool.query(
      "INSERT INTO programs(id,department_id,name,code,duration_terms) " +
      "VALUES($1,$2,$3,$4,8)",
      [ids.program, SEED_IDS.departmentA, label, label],
    );
    await pool.query(
      "INSERT INTO cohorts(id,program_id,name,code,start_period_id) " +
      "VALUES($1,$2,$3,$4,$5)",
      [ids.cohort, ids.program, label, label, ids.period],
    );
    await pool.query(
      "INSERT INTO sections(id,cohort_id,academic_period_id,name,code) " +
      "VALUES($1,$2,$3,$4,$5)",
      [ids.section, ids.cohort, ids.period, label, label],
    );
    await pool.query(
      "INSERT INTO courses(id,department_id,name,code) VALUES($1,$2,$3,$4)",
      [ids.course, SEED_IDS.departmentA, label, label],
    );
    await pool.query(
      "INSERT INTO course_offerings(id,course_id,cohort_id,academic_period_id) " +
      "VALUES($1,$2,$3,$4)",
      [ids.offering, ids.course, ids.cohort, ids.period],
    );
    await pool.query(
      "INSERT INTO course_section_deliveries(id,offering_id,section_id) VALUES($1,$2,$3)",
      [ids.delivery, ids.offering, ids.section],
    );
    await pool.query(
      "INSERT INTO users(id,identity_uid,display_name) VALUES($1,$2,$3)",
      [ids.otherUser, "w-cta-" + ids.otherUser, label + "-second-faculty"],
    );
    await pool.query(
      "INSERT INTO college_memberships(id,user_id,college_id) VALUES($1,$2,$3)",
      [ids.otherMembership, ids.otherUser, SEED_IDS.collegeA],
    );
    await pool.query(
      "INSERT INTO membership_roles(id,membership_id,role) VALUES($1,$2,'FACULTY')",
      [ids.otherRole, ids.otherMembership],
    );
  });

  afterAll(async () => {
    try {
      if (pool) {
        // All ids are disposable test-owned rows. Audit rows must be deleted before actors.
        await pool.query(
          "DELETE FROM activity_events WHERE subject_type='course_teaching_assignment' " +
          "AND subject_id = ANY($1::text[])",
          [assignments],
        );
        await pool.query("DELETE FROM course_teaching_assignments WHERE delivery_id=$1", [ids.delivery]);
        await pool.query("DELETE FROM course_section_deliveries WHERE id=$1", [ids.delivery]);
        await pool.query("DELETE FROM course_offerings WHERE id=$1", [ids.offering]);
        await pool.query("DELETE FROM program_term_courses WHERE course_id=$1",[ids.course]);
        await pool.query("DELETE FROM courses WHERE id=$1", [ids.course]);
        await pool.query("DELETE FROM sections WHERE id=$1", [ids.section]);
        await pool.query("DELETE FROM cohorts WHERE id=$1", [ids.cohort]);
        await pool.query("DELETE FROM program_terms WHERE program_id=$1",[ids.program]);
        await pool.query("DELETE FROM programs WHERE id=$1", [ids.program]);
        await pool.query("DELETE FROM academic_periods WHERE id=$1", [ids.period]);
        await pool.query("DELETE FROM membership_roles WHERE id=$1", [ids.otherRole]);
        await pool.query("DELETE FROM college_memberships WHERE id=$1", [ids.otherMembership]);
        await pool.query("DELETE FROM users WHERE id=$1", [ids.otherUser]);
      }
    } finally {
      await pool?.end();
      await closeDatabaseConnection();
    }
  });

  it("creates and ends a primary teaching assignment with exactly two atomic actor audits", async () => {
    const input = {
      deliveryId: ids.delivery,
      membershipId: SEED_IDS.facultyCollegeAMembership,
      role: "PRIMARY" as const,
    };
    const options = await listCollegeTeachingOptions(admin);
    expect(options.deliveries.map(x => x.id)).toContain(ids.delivery);
    expect(options.faculty.map(x => x.id)).toContain(input.membershipId);

    const created = await createCourseTeachingAssignment(admin, input);
    assignments.push(created.id);
    expect(created.endedAt).toBeNull();
    await expect(createCourseTeachingAssignment(admin, input))
      .rejects.toMatchObject({ code: "TEACHING_ASSIGNMENT_CONFLICT" });

    const ended = await endCourseTeachingAssignment(admin, created.id);
    expect(ended.endedAt).toBeInstanceOf(Date);
    await expect(endCourseTeachingAssignment(admin, created.id))
      .rejects.toBeDefined();

    const stored = await pool!.query(
      "SELECT ended_at, membership_id FROM course_teaching_assignments WHERE id=$1", [created.id],
    );
    expect(stored.rows[0]?.ended_at).toBeInstanceOf(Date);
    expect(stored.rows[0]?.membership_id).toBe(input.membershipId);
    const audits = await pool!.query(
      "SELECT event_type,actor_user_id,actor_membership_id,college_id,metadata " +
      "FROM activity_events WHERE subject_type='course_teaching_assignment' " +
      "AND subject_id=$1 ORDER BY occurred_at,id", [created.id],
    );
    expect(audits.rows.map(x => x.event_type).sort()).toEqual([
      "courses.teaching_assignment.assigned", "courses.teaching_assignment.ended",
    ]);
    expect(audits.rows.every(x =>
      x.actor_user_id === admin.user.id &&
      x.actor_membership_id === admin.membership?.id &&
      x.college_id === SEED_IDS.collegeA,
    )).toBe(true);
  });

  it("enforces unique primary and same-teacher conflicts at the service guard, not Zod", async () => {
    const first = await createCourseTeachingAssignment(admin, {
      deliveryId: ids.delivery, membershipId: SEED_IDS.facultyCollegeAMembership, role: "PRIMARY",
    });
    assignments.push(first.id);
    await expect(createCourseTeachingAssignment(admin, {
      deliveryId: ids.delivery, membershipId: ids.otherMembership, role: "PRIMARY",
    })).rejects.toMatchObject({ code: "PRIMARY_TEACHER_CONFLICT" });
    await expect(createCourseTeachingAssignment(admin, {
      deliveryId: ids.delivery, membershipId: SEED_IDS.facultyCollegeAMembership, role: "CO_TEACHER",
    })).rejects.toMatchObject({ code: "TEACHING_ASSIGNMENT_CONFLICT" });
    const coTeacher = await createCourseTeachingAssignment(admin, {
      deliveryId: ids.delivery, membershipId: ids.otherMembership, role: "CO_TEACHER",
    });
    assignments.push(coTeacher.id);
    expect(coTeacher.role).toBe("CO_TEACHER");
    await endCourseTeachingAssignment(admin, first.id);
    await endCourseTeachingAssignment(admin, coTeacher.id);
    const count = await pool!.query(
      "SELECT count(*)::int AS total FROM course_teaching_assignments " +
      "WHERE delivery_id=$1 AND ended_at IS NULL", [ids.delivery],
    );
    expect(count.rows[0]?.total).toBe(0);
  });

  it("denies other-college, forbidden role and invalid foreign faculty without adding audit", async () => {
    await expect(createCourseTeachingAssignment(adminB, {
      deliveryId: ids.delivery, membershipId: SEED_IDS.facultyCollegeAMembership, role: "TA",
    })).rejects.toBeInstanceOf(AuthorizationError);
    await expect(createCourseTeachingAssignment(noManage, {
      deliveryId: ids.delivery, membershipId: SEED_IDS.facultyCollegeAMembership, role: "TA",
    })).rejects.toBeInstanceOf(AuthorizationError);
    await expect(createCourseTeachingAssignment(admin, {
      deliveryId: ids.delivery, membershipId: SEED_IDS.facultyCollegeBMembership, role: "TA",
    })).rejects.toMatchObject({ code: "MEMBERSHIP_COLLEGE_MISMATCH" });
    await expect(createCourseTeachingAssignment(admin, {
      deliveryId: ids.delivery, membershipId: SEED_IDS.learnerCollegeAMembership, role: "TA",
    })).rejects.toMatchObject({ code: "FACULTY_ROLE_REQUIRED" });
    await expect(createCourseTeachingAssignment(admin, {
      deliveryId: ids.delivery, membershipId: ids.otherMembership, role: "TA",
      collegeId: SEED_IDS.collegeB,
    })).rejects.toBeDefined();
    const optsB = await listCollegeTeachingOptions(adminB);
    expect(optsB.deliveries.map(x => x.id)).not.toContain(ids.delivery);
    const count = await pool!.query(
      "SELECT count(*)::int AS total FROM activity_events " +
      "WHERE subject_type='course_teaching_assignment' AND subject_id=ANY($1::text[])",
      [assignments],
    );
    expect(count.rows[0]?.total).toBe(assignments.length * 2);
  });
});
