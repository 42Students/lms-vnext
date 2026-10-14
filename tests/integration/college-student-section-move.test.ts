import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  collegeStudentSectionOptions, moveCollegeStudentSection,
} from "@/modules/academics/college-student-section-move-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL }) : null;
const admin: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "move-admin", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.collegeAdminMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const foreign: RequestContext = { user: { ...admin.user, id: SEED_IDS.facultyUser },
  membership: { id: SEED_IDS.facultyCollegeBMembership, collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] } };
const faculty: RequestContext = { ...admin, membership: { ...admin.membership!, roles: ["FACULTY"] } };
const id = {
  user: randomUUID(), membership: randomUUID(), role: randomUUID(),
  period: randomUUID(), program: randomUUID(), cohort: randomUUID(),
  from: randomUUID(), to: randomUUID(), full: randomUUID(),
  enrollment: randomUUID(), placement: randomUUID(),
};
const tag = "w-student-move-" + id.period.slice(0, 8);

describe.skipIf(!enabled)("College Admin student class move — isolated PostgreSQL", () => {
  beforeAll(async () => {
    if (!pool) throw Error("Disposable PG required");
    await pool.query("INSERT INTO users(id,identity_uid,display_name) VALUES($1,$2,$3)",
      [id.user, "move-" + id.user, tag]);
    await pool.query("INSERT INTO college_memberships(id,user_id,college_id) VALUES($1,$2,$3)",
      [id.membership, id.user, SEED_IDS.collegeA]);
    await pool.query("INSERT INTO membership_roles(id,membership_id,role) VALUES($1,$2,'LEARNER')",
      [id.role, id.membership]);
    await pool.query("INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date,status) " +
      "VALUES($1,$2,$3,$4,'2026-07-01','2026-12-31','ACTIVE')",
      [id.period, SEED_IDS.collegeA, tag, tag]);
    await pool.query("INSERT INTO programs(id,department_id,name,code,duration_terms) VALUES($1,$2,$3,$4,8)",
      [id.program, SEED_IDS.departmentA, tag, tag]);
    await pool.query("INSERT INTO cohorts(id,program_id,name,code,start_period_id,status) " +
      "VALUES($1,$2,$3,$4,$5,'ACTIVE')",
      [id.cohort, id.program, tag, tag, id.period]);
    for (const [sid, suffix, capacity] of [[id.from, "from", 20], [id.to, "to", 20], [id.full, "full", 1]] as const) {
      await pool.query("INSERT INTO sections(id,cohort_id,academic_period_id,name,code,capacity) " +
        "VALUES($1,$2,$3,$4,$5,$6)",
        [sid, id.cohort, id.period, tag + suffix, tag + suffix, capacity]);
    }
    await pool.query("INSERT INTO learner_program_enrollments(id,membership_id,program_id,cohort_id) " +
      "VALUES($1,$2,$3,$4)", [id.enrollment, id.membership, id.program, id.cohort]);
    await pool.query("INSERT INTO section_enrollments(id,learner_enrollment_id,section_id,academic_period_id) " +
      "VALUES($1,$2,$3,$4)", [id.placement, id.enrollment, id.from, id.period]);
  });
  afterAll(async () => {
    try {
      if (pool) {
        await pool.query("DELETE FROM section_enrollments WHERE learner_enrollment_id=$1", [id.enrollment]);
        await pool.query("DELETE FROM learner_program_enrollments WHERE id=$1", [id.enrollment]);
        await pool.query("DELETE FROM sections WHERE cohort_id=$1", [id.cohort]);
        await pool.query("DELETE FROM cohorts WHERE id=$1", [id.cohort]);
        await pool.query("DELETE FROM programs WHERE id=$1", [id.program]);
        await pool.query("DELETE FROM academic_periods WHERE id=$1", [id.period]);
        await pool.query("DELETE FROM membership_roles WHERE id=$1", [id.role]);
        await pool.query("DELETE FROM college_memberships WHERE id=$1", [id.membership]);
        await pool.query("DELETE FROM users WHERE id=$1", [id.user]);
        // Append-only activity_events are never deleted.
      }
    } finally { await pool?.end(); await closeDatabaseConnection(); }
  });
  it("moves the current section atomically and leaves immutable audit", async () => {
    const options = await collegeStudentSectionOptions(admin, id.membership);
    expect(options.current.id).toBe(id.placement);
    expect(options.options.map(x => x.id)).toContain(id.to);
    const move = await moveCollegeStudentSection(admin, id.membership, {
      sectionId: id.to, expectedSectionEnrollmentId: options.current.id, confirm: true,
    });
    expect(move.placement.sectionId).toBe(id.to);
    const records = await pool!.query(
      "SELECT section_id,status FROM section_enrollments WHERE learner_enrollment_id=$1",
      [id.enrollment],
    );
    expect(records.rows.map(x => x.status).sort()).toEqual(["ACTIVE", "MOVED"]);
    const audit = await pool!.query(
      "SELECT event_type FROM activity_events WHERE subject_id=$1 AND event_type=$2 ORDER BY occurred_at DESC",
      [id.enrollment, "academics.learner.enrolled"],
    );
    expect(audit.rows.length).toBeGreaterThanOrEqual(1);
    await expect(moveCollegeStudentSection(admin, id.membership, {
      sectionId: id.from, expectedSectionEnrollmentId: id.placement, confirm: true,
    })).rejects.toMatchObject({ code: "CLASS_PLACEMENT_CHANGED" });
  });
  it("denies cross-college and wrong-role access and forged body fields", async () => {
    // Foreign and entirely absent membership IDs yield indistinguishable not-found codes.
    await expect(collegeStudentSectionOptions(foreign, id.membership))
      .rejects.toMatchObject({code: "STUDENT_NOT_FOUND"});
    await expect(collegeStudentSectionOptions(admin, randomUUID()))
      .rejects.toMatchObject({code: "STUDENT_NOT_FOUND"});
    await expect(moveCollegeStudentSection(foreign, id.membership, {
      sectionId: id.to, expectedSectionEnrollmentId: id.placement, confirm: true,
    })).rejects.toMatchObject({ code: "STUDENT_NOT_FOUND" });
    await expect(moveCollegeStudentSection(faculty, id.membership, {
      sectionId: id.to, expectedSectionEnrollmentId: id.placement, confirm: true,
    })).rejects.toBeInstanceOf(AuthorizationError);
    await expect(moveCollegeStudentSection(admin, id.membership, {
      sectionId: id.to, expectedSectionEnrollmentId: id.placement, confirm: true,
      collegeId: SEED_IDS.collegeB,
    })).rejects.toBeDefined();
  });
});
