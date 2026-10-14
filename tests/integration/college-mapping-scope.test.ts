import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { exportCollegeOfferingMappings } from "@/modules/academics/college-mapping-export-service";
import { exportCollegeFacultyAssignments } from "@/modules/academics/college-faculty-assignment-export-service";
import {
  listCollegeFacultyAssignments,
  listCollegeSemesterCourseMappings,
} from "@/modules/academics/college-mapping-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB09_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled
  ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 })
  : null;

const admin: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "w-college-mappings", platformStatus: "ACTIVE", systemRoles: [] },
  membership: {
    id: SEED_IDS.collegeAdminMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["COLLEGE_ADMIN"],
  },
};
const foreign: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "w-college-mappings-b", platformStatus: "ACTIVE", systemRoles: [] },
  membership: {
    id: SEED_IDS.facultyCollegeBMembership,
    collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["COLLEGE_ADMIN"],
  },
};
const faculty: RequestContext = {
  ...admin,
  membership: { ...admin.membership!, roles: ["FACULTY"] },
};

const ids = {
  period: randomUUID(), program: randomUUID(), cohort: randomUUID(),
  section: randomUUID(), course: randomUUID(), offering: randomUUID(),
  delivery: randomUUID(), teaching: randomUUID(),
};
const code = "W42-" + ids.period.slice(0, 8);

describe.skipIf(!enabled)("College Admin mapping read-first DB isolation", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("Disposable TEST_DATABASE_URL is required");
    const required = await pool.query(
      "SELECT to_regclass('public.course_offerings') AS offerings, " +
      "to_regclass('public.course_teaching_assignments') AS teaching",
    );
    for (const relation of Object.values(required.rows[0] ?? {})) {
      if (!relation) throw new Error("Registered courses and teaching migrations required");
    }

    await pool.query(
      "INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) " +
      "VALUES($1,$2,$3,$4,'2026-07-01','2026-12-31')",
      [ids.period, SEED_IDS.collegeA, code, code],
    );
    await pool.query(
      "INSERT INTO programs(id,department_id,name,code,duration_terms) VALUES($1,$2,$3,$4,8)",
      [ids.program, SEED_IDS.departmentA, code, code],
    );
    await pool.query(
      "INSERT INTO cohorts(id,program_id,name,code,start_period_id) VALUES($1,$2,$3,$4,$5)",
      [ids.cohort, ids.program, code, code, ids.period],
    );
    await pool.query(
      "INSERT INTO sections(id,cohort_id,academic_period_id,name,code) VALUES($1,$2,$3,$4,$5)",
      [ids.section, ids.cohort, ids.period, code, code],
    );
    await pool.query(
      "INSERT INTO courses(id,department_id,name,code) VALUES($1,$2,$3,$4)",
      [ids.course, SEED_IDS.departmentA, code, code],
    );
    await pool.query(
      "INSERT INTO course_offerings(id,course_id,cohort_id,academic_period_id,type,credits) " +
      "VALUES($1,$2,$3,$4,'CORE',3)",
      [ids.offering, ids.course, ids.cohort, ids.period],
    );
    await pool.query(
      "INSERT INTO course_section_deliveries(id,offering_id,section_id) VALUES($1,$2,$3)",
      [ids.delivery, ids.offering, ids.section],
    );
    await pool.query(
      "INSERT INTO course_teaching_assignments(id,delivery_id,membership_id,role) " +
      "VALUES($1,$2,$3,'PRIMARY')",
      [ids.teaching, ids.delivery, SEED_IDS.facultyCollegeAMembership],
    );
  });

  afterAll(async () => {
    try {
      if (pool) {
        const cleanup: ReadonlyArray<readonly [string, string]> = [
          ["course_teaching_assignments", ids.teaching],
          ["course_section_deliveries", ids.delivery],
          ["course_offerings", ids.offering],
          ["courses", ids.course],
          ["sections", ids.section],
          ["cohorts", ids.cohort],
          ["programs", ids.program],
          ["academic_periods", ids.period],
        ];
        for (const [table, id] of cleanup) {
          await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
        }
      }
    } finally {
      await pool?.end();
      await closeDatabaseConnection();
    }
  });

  it("reads the own-college persisted offering and teaching assignment only", async () => {
    const [ownCourses, otherCourses, ownTeaching, otherTeaching] = await Promise.all([
      listCollegeSemesterCourseMappings(admin, { q: code }),
      listCollegeSemesterCourseMappings(foreign, { q: code }),
      listCollegeFacultyAssignments(admin, { q: code }),
      listCollegeFacultyAssignments(foreign, { q: code }),
    ]);
    expect(ownCourses.items.map(item => item.id)).toContain(ids.offering);
    const [core, elective] = await Promise.all([
      listCollegeSemesterCourseMappings(admin, { q: code, type: "CORE" }),
      listCollegeSemesterCourseMappings(admin, { q: code, type: "ELECTIVE" }),
    ]);
    expect(core.items.map(item => item.id)).toContain(ids.offering);
    expect(elective.items).toEqual([]);
    expect(ownCourses.items.find(item => item.id === ids.offering)).toMatchObject({
      courseName: code, courseCode: code, cohortName: code, programName: code,
      programId: ids.program, periodName: code, periodCode: code,
    });
    expect(otherCourses.items).toEqual([]);
    expect(ownTeaching.items.map(item => item.id)).toContain(ids.teaching);
    const [primary, assistant] = await Promise.all([
      listCollegeFacultyAssignments(admin, { q: code, role: "PRIMARY" }),
      listCollegeFacultyAssignments(admin, { q: code, role: "TA" }),
    ]);
    expect(primary.items.map(item => item.id)).toContain(ids.teaching);
    expect(assistant.items).toEqual([]);
    expect(ownTeaching.items.find(item => item.id === ids.teaching)?.state).toBe("ACTIVE");
    expect(ownTeaching.items.find(item => item.id === ids.teaching)).toMatchObject({
      deliveryId: ids.delivery, offeringId: ids.offering,
      courseName: code, sectionName: code, cohortName: code, periodName: code,
      endedAt: null, deliveryEndedAt: null,
    });
    expect(otherTeaching.items).toEqual([]);
  });

  it("exports only own-college offerings with role denial", async () => {
    const ours=await exportCollegeOfferingMappings(admin,{q:code});
    const theirs=await exportCollegeOfferingMappings(foreign,{q:code});
    expect(ours.csv).toContain(code);
    expect(theirs.csv).not.toContain(code);
    await expect(exportCollegeOfferingMappings(faculty,{}))
      .rejects.toBeInstanceOf(AuthorizationError);
  });
  it("exports current-college teaching assignments without contacts",async()=>{
    const ours=await exportCollegeFacultyAssignments(admin,{q:code});
    const foreignCsv=await exportCollegeFacultyAssignments(foreign,{q:code});
    expect(ours.csv).toContain(code);
    expect(ours.csv).toContain("PRIMARY");
    expect(foreignCsv.csv).not.toContain(code);
    expect(ours.csv).not.toContain("Email");
    await expect(exportCollegeFacultyAssignments(faculty,{}))
      .rejects.toBeInstanceOf(AuthorizationError);
  });
  it("denies non-admin roles and caller-supplied college IDs", async () => {
    await expect(listCollegeSemesterCourseMappings(faculty, {}))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(listCollegeFacultyAssignments(faculty, {}))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(listCollegeSemesterCourseMappings(admin, {
      collegeId: SEED_IDS.collegeB,
    })).rejects.toBeDefined();
    await expect(listCollegeFacultyAssignments(admin, {
      collegeId: SEED_IDS.collegeB,
    })).rejects.toBeDefined();
  });

  it("renders honest empty results, not fabricated mappings", async () => {
    const result = await listCollegeSemesterCourseMappings(admin, {
      q: "w42-unrelated-absent-data",
    });
    expect(result.total).toBe(0);
    expect(result.items).toEqual([]);
  });
});
