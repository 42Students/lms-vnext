import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  CollegePromotionPreviewError, previewCollegeBatchPromotion,
} from "@/modules/academics/college-batch-promotion-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = !!process.env.TEST_DATABASE_URL && process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 }) : null;

const admin: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "promotion-preview", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.collegeAdminMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const foreign: RequestContext = {
  user: { ...admin.user, id: SEED_IDS.facultyUser },
  membership: { id: SEED_IDS.facultyCollegeBMembership, collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const learner: RequestContext = {
  ...admin, membership: { ...admin.membership!, roles: ["LEARNER"] },
};
const ids = {
  period: randomUUID(), program: randomUUID(), term1: randomUUID(), term2: randomUUID(),
  cohort: randomUUID(), section: randomUUID(), course:randomUUID(), mappedCourse:randomUUID(),
  user: randomUUID(), membership: randomUUID(), role: randomUUID(),
  enrollment: randomUUID(), sectionEnrollment: randomUUID(),
};
const code = "preview-" + ids.cohort.slice(0, 8);
describe.skipIf(!enabled)("College Admin promotion preview, actual PostgreSQL rows", () => {
  beforeAll(async () => {
    if (!pool) throw Error("Disposable PostgreSQL required");
    await pool.query(
      "INSERT INTO users(id,identity_uid,display_name) VALUES($1,$2,$3)",
      [ids.user, code + "-identity", "Learner " + code],
    );
    await pool.query(
      "INSERT INTO college_memberships(id,user_id,college_id,status) VALUES($1,$2,$3,'ACTIVE')",
      [ids.membership, ids.user, SEED_IDS.collegeA],
    );
    await pool.query(
      "INSERT INTO membership_roles(id,membership_id,role) VALUES($1,$2,'LEARNER')",
      [ids.role, ids.membership],
    );
    await pool.query(
      "INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) " +
      "VALUES($1,$2,$3::text,$3::text,'2026-07-01','2026-12-31')",
      [ids.period, SEED_IDS.collegeA, code],
    );
    await pool.query(
      "INSERT INTO programs(id,department_id,name,code,duration_terms) VALUES($1,$2,$3::text,$3::text,2)",
      [ids.program, SEED_IDS.departmentA, code],
    );
    await pool.query(
      "INSERT INTO program_terms(id,program_id,term_number,name) VALUES($1,$2,1,$3),($4,$2,2,$5)",
      [ids.term1, ids.program, code + " I", ids.term2, code + " II"],
    );
    await pool.query(
      "INSERT INTO courses(id,department_id,name,code) VALUES($1,$2,$3::text,$3::text)",
      [ids.course,SEED_IDS.departmentA,code+"-course"],
    );
    await pool.query(
      "INSERT INTO program_term_courses(id,program_term_id,course_id,type,credits,display_order) " +
      "VALUES($1,$2,$3,'CORE',3,1)",
      [ids.mappedCourse,ids.term2,ids.course],
    );
    await pool.query(
      "INSERT INTO cohorts(id,program_id,name,code,start_period_id,status) " +
      "VALUES($1,$2,$3::text,$3::text,$4,'ACTIVE')",
      [ids.cohort, ids.program, code, ids.period],
    );
    await pool.query(
      "INSERT INTO cohort_progression_state(cohort_id,current_term_number,current_academic_year_start,current_period_id) " +
      "VALUES($1,1,2026,$2) ON CONFLICT (cohort_id) DO NOTHING",
      [ids.cohort, ids.period],
    );
    await pool.query(
      "INSERT INTO sections(id,cohort_id,academic_period_id,name,code) VALUES($1,$2,$3,$4::text,$4::text)",
      [ids.section, ids.cohort, ids.period, code],
    );
    await pool.query(
      "INSERT INTO learner_program_enrollments(id,membership_id,program_id,cohort_id,status) " +
      "VALUES($1,$2,$3,$4,'ACTIVE')",
      [ids.enrollment, ids.membership, ids.program, ids.cohort],
    );
    await pool.query(
      "INSERT INTO section_enrollments(id,learner_enrollment_id,section_id,academic_period_id,status) " +
      "VALUES($1,$2,$3,$4,'ACTIVE')",
      [ids.sectionEnrollment, ids.enrollment, ids.section, ids.period],
    );
  });
  afterAll(async () => {
    try {
      if (pool) {
        for (const [table, key, value] of [
          ["section_enrollments", "id", ids.sectionEnrollment],
          ["learner_program_enrollments", "id", ids.enrollment],
          ["sections", "id", ids.section],
          ["cohort_progression_state", "cohort_id", ids.cohort],
          ["cohorts", "id", ids.cohort],
          ["program_term_courses", "id", ids.mappedCourse],
          ["program_terms", "id", ids.term1],
          ["program_terms", "id", ids.term2],
          ["courses", "id", ids.course],
          ["programs", "id", ids.program],
          ["academic_periods", "id", ids.period],
          ["membership_roles", "id", ids.role],
          ["college_memberships", "id", ids.membership],
          ["users", "id", ids.user],
        ] as const) {
          await pool.query(`DELETE FROM ${table} WHERE ${key}=$1`, [value]);
        }
      }
    } finally { await pool?.end(); await closeDatabaseConnection(); }
  });
  it("computes a read-only preview from actual enrolled learner and class rows", async () => {
    const before = await pool!.query(
      "SELECT current_term_number,current_academic_year_start FROM cohort_progression_state WHERE cohort_id=$1",
      [ids.cohort],
    );
    const preview = await previewCollegeBatchPromotion(admin, {
      programId: ids.program, cohortId: ids.cohort, yearStart: 2028,
    });
    expect(preview.plan).toMatchObject({
      action: "PROMOTE", targetTermNumber: 2, academicYearStart: 2028, blockers: [],
    });
    expect(preview.learners).toHaveLength(1);
    expect(preview.learners[0]?.blockers).toEqual([]);
    expect(preview.simulatedReadiness).toBe(true);
    expect(preview.canProceed).toBe(false);
    const after = await pool!.query(
      "SELECT current_term_number,current_academic_year_start FROM cohort_progression_state WHERE cohort_id=$1",
      [ids.cohort],
    );
    expect(after.rows).toEqual(before.rows);
  });
  it("COL-academic-setup-R04 previews and blocks an active but unmapped next semester",async()=>{
    await pool!.query("DELETE FROM program_term_courses WHERE id=$1",[ids.mappedCourse]);
    try{
      const preview=await previewCollegeBatchPromotion(admin,{cohortId:ids.cohort});
      expect(preview.blockers).toContain("NEXT_TERM_NO_MAPPED_COURSES");
      expect(preview.simulatedReadiness).toBe(false);
      expect(preview.plan.targetTermNumber).toBe(2);
    }finally{
      await pool!.query("INSERT INTO program_term_courses(id,program_term_id,course_id,type,credits,display_order) VALUES($1,$2,$3,'CORE',3,1)",
        [ids.mappedCourse,ids.term2,ids.course]);
    }
  });
  it("reads true persisted blocker rows, not a UI-derived count", async () => {
    await pool!.query(
      "UPDATE section_enrollments SET status='MOVED',ended_at=now() WHERE id=$1",
      [ids.sectionEnrollment],
    );
    const preview = await previewCollegeBatchPromotion(admin, { cohortId: ids.cohort });
    expect(preview.learners[0]?.blockers).toContain("NO_ACTIVE_CLASS");
    await pool!.query(
      "UPDATE section_enrollments SET status='ACTIVE',ended_at=NULL WHERE id=$1",
      [ids.sectionEnrollment],
    );
    await pool!.query("UPDATE program_terms SET is_active=false WHERE id=$1", [ids.term2]);
    const missingNext = await previewCollegeBatchPromotion(admin, { cohortId: ids.cohort });
    expect(missingNext.blockers).toContain("NEXT_TERM_UNCONFIGURED");
    await pool!.query("UPDATE program_terms SET is_active=true WHERE id=$1", [ids.term2]);
  });
  it("rejects a foreign college, non-admin and malformed request boundaries", async () => {
    await expect(previewCollegeBatchPromotion(foreign, { cohortId: ids.cohort }))
      .rejects.toBeInstanceOf(CollegePromotionPreviewError);
    await expect(previewCollegeBatchPromotion(learner, { cohortId: ids.cohort }))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(previewCollegeBatchPromotion(admin, {
      cohortId: ids.cohort, collegeId: SEED_IDS.collegeB,
    })).rejects.toBeDefined();
  });
});
