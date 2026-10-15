import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { CollegePersonNotFoundError } from "@/modules/people/college-person-detail-model";
import { getCollegeStudentDetail } from "@/modules/people/college-student-detail-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled
  ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 })
  : null;
const admin: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "ca-student-detail", platformStatus: "ACTIVE", systemRoles: [] },
  membership: {
    id: SEED_IDS.collegeAdminMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"],
  },
};
const foreign: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "ca-foreign", platformStatus: "ACTIVE", systemRoles: [] },
  membership: {
    id: SEED_IDS.facultyCollegeBMembership, collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"],
  },
};
const learner: RequestContext = {
  ...admin, membership: { ...admin.membership!, roles: ["LEARNER"] },
};
const ids = {
  user: randomUUID(), membership: randomUUID(), role: randomUUID(),
  period: randomUUID(), program: randomUUID(), cohort: randomUUID(),
  enrollment: randomUUID(), section: randomUUID(), sectionEnrollment: randomUUID(),
};
const name = "CA-Student-Detail-" + ids.user.slice(0, 8);

describe.skipIf(!enabled)("College Student Detail real PG scope", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("Disposable PG required");
    await pool.query("INSERT INTO users(id,identity_uid,display_name) VALUES($1,$2,$3)",
      [ids.user, ids.user, name]);
    await pool.query("INSERT INTO college_memberships(id,user_id,college_id) VALUES($1,$2,$3)",
      [ids.membership, ids.user, SEED_IDS.collegeA]);
    await pool.query("INSERT INTO membership_roles(id,membership_id,role) VALUES($1,$2,'LEARNER')",
      [ids.role, ids.membership]);
    await pool.query("INSERT INTO learner_profiles(membership_id,roll_number) VALUES($1,$2)",
      [ids.membership, name]);
    await pool.query("INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) VALUES($1,$2,$3,$4,'2026-07-01','2026-12-31')",
      [ids.period, SEED_IDS.collegeA, name, name]);
    await pool.query("INSERT INTO programs(id,department_id,name,code,duration_terms) VALUES($1,$2,$3,$4,8)",
      [ids.program, SEED_IDS.departmentA, name, name]);
    await pool.query("INSERT INTO cohorts(id,program_id,name,code,start_period_id) VALUES($1,$2,$3,$4,$5)",
      [ids.cohort, ids.program, name, name, ids.period]);
    await pool.query("INSERT INTO sections(id,cohort_id,academic_period_id,name,code) VALUES($1,$2,$3,$4,$5)",
      [ids.section, ids.cohort, ids.period, name, name]);
    await pool.query("INSERT INTO learner_program_enrollments(id,membership_id,program_id,cohort_id) VALUES($1,$2,$3,$4)",
      [ids.enrollment, ids.membership, ids.program, ids.cohort]);
    await pool.query("INSERT INTO section_enrollments(id,learner_enrollment_id,section_id,academic_period_id) VALUES($1,$2,$3,$4)",
      [ids.sectionEnrollment, ids.enrollment, ids.section, ids.period]);
  });
  afterAll(async () => {
    try {
      if (pool) {
        const rows: readonly (readonly [string, string, string])[] = [
          ["section_enrollments", "id", ids.sectionEnrollment],
          ["learner_program_enrollments", "id", ids.enrollment],
          ["sections", "id", ids.section], ["cohorts", "id", ids.cohort],
          ["programs", "id", ids.program], ["academic_periods", "id", ids.period],
          ["learner_profiles", "membership_id", ids.membership],
          ["membership_roles", "id", ids.role],
          ["college_memberships", "id", ids.membership], ["users", "id", ids.user],
        ];
        for (const [table, column, id] of rows)
          await pool.query(`DELETE FROM ${table} WHERE ${column} = $1`, [id]);
      }
    } finally { await pool?.end(); await closeDatabaseConnection(); }
  });
  it("returns sourced program/cohort/class and scoped learner roll", async () => {
    const result = await getCollegeStudentDetail(admin, ids.membership);
    expect(result.person.rollNumber).toBe(name);
    expect(result.enrollments.map(x => x.cohortCode)).toContain(name);
    expect(result.classes.map(x => x.sectionCode)).toContain(name);
    expect(result.attendance.recordedPercent).toBeNull();
  });
  it("filters historical enrollment state without hiding current active class/attendance facts",async()=>{
    const active=await getCollegeStudentDetail(admin,ids.membership,{status:"ACTIVE"});
    const withdrawn=await getCollegeStudentDetail(admin,ids.membership,{status:"WITHDRAWN"});
    expect(active.enrollments.map(row=>row.cohortCode)).toContain(name);
    expect(withdrawn.enrollments).toHaveLength(0);
    expect(withdrawn.enrollmentTotal).toBe(active.enrollmentTotal);
    expect(withdrawn.classes).toEqual(active.classes);
    await expect(getCollegeStudentDetail(foreign,ids.membership,{status:"WITHDRAWN"}))
      .rejects.toBeInstanceOf(CollegePersonNotFoundError);
    await expect(getCollegeStudentDetail(learner,ids.membership,{status:"ACTIVE"}))
      .rejects.toBeInstanceOf(AuthorizationError);
  });
  it("foreign admin sees same NOT_FOUND result as missing membership", async () => {
    await expect(getCollegeStudentDetail(foreign, ids.membership))
      .rejects.toBeInstanceOf(CollegePersonNotFoundError);
    await expect(getCollegeStudentDetail(admin, randomUUID()))
      .rejects.toBeInstanceOf(CollegePersonNotFoundError);
  });
  it("denies wrong role and caller-college forgery", async () => {
    await expect(getCollegeStudentDetail(learner, ids.membership))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(getCollegeStudentDetail(admin, ids.membership, {collegeId: SEED_IDS.collegeB}))
      .rejects.toBeDefined();
  });
});
