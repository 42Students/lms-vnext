import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { listCollegeDepartmentInsights } from "@/modules/admin-ui/college-department-insights-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 }) : null;

const adminA: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "admin-department-insights", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.collegeAdminMembership, collegeId: SEED_IDS.collegeA, organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const adminB: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "admin-department-insights-b", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.facultyCollegeBMembership, collegeId: SEED_IDS.collegeB, organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const learner: RequestContext = { ...adminA, membership: { ...adminA.membership!, roles: ["LEARNER"] } };
const actingSuperAdmin: RequestContext = {
  user: {id:SEED_IDS.superAdminUser,identityUid:"super-admin-attendance-departments",
    platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
  membership:null,
  adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA},
};

const ids = {
  user: randomUUID(), membership: randomUUID(), role: randomUUID(),
  program: randomUUID(), period: randomUUID(), cohort: randomUUID(),
  section: randomUUID(), enrollment: randomUUID(), sectionEnrollment: randomUUID(),
  event: randomUUID(),
};
const suffix = ids.program.slice(0, 8);
const code = "W-DEPT-" + suffix;

describe.skipIf(!enabled)("College Admin department evidence scoped PostgreSQL", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("Disposable PostgreSQL required");
    const relations = await pool.query(
      "SELECT to_regclass('public.attendance_sessions') AS sessions, " +
      "to_regclass('public.attendance_records') AS records, " +
      "to_regclass('public.placement_candidate_academic_evidence') AS evidence",
    );
    for (const table of Object.values(relations.rows[0] ?? {})) {
      if (!table) throw new Error("Required registered attendance and placement tables missing");
    }
    await pool.query("INSERT INTO users(id,identity_uid,display_name) VALUES ($1,$2,$3)",
      [ids.user, "insight-" + ids.user, code]);
    await pool.query("INSERT INTO college_memberships(id,user_id,college_id) VALUES ($1,$2,$3)",
      [ids.membership, ids.user, SEED_IDS.collegeA]);
    await pool.query("INSERT INTO membership_roles(id,membership_id,role) VALUES ($1,$2,'LEARNER')",
      [ids.role, ids.membership]);
    await pool.query("INSERT INTO programs(id,department_id,name,code,duration_terms) VALUES($1,$2,$3,$4,8)",
      [ids.program, SEED_IDS.departmentA, code, code]);
    await pool.query(
      "INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) VALUES($1,$2,$3,$4,'2026-07-01','2026-12-31')",
      [ids.period, SEED_IDS.collegeA, code, code]);
    await pool.query("INSERT INTO cohorts(id,program_id,name,code,start_period_id) VALUES($1,$2,$3,$4,$5)",
      [ids.cohort, ids.program, code, code, ids.period]);
    await pool.query("INSERT INTO sections(id,cohort_id,academic_period_id,name,code) VALUES($1,$2,$3,$4,$5)",
      [ids.section, ids.cohort, ids.period, code, code]);
    await pool.query("INSERT INTO learner_program_enrollments(id,membership_id,program_id,cohort_id) VALUES($1,$2,$3,$4)",
      [ids.enrollment, ids.membership, ids.program, ids.cohort]);
    await pool.query("INSERT INTO section_enrollments(id,learner_enrollment_id,section_id,academic_period_id) VALUES($1,$2,$3,$4)",
      [ids.sectionEnrollment, ids.enrollment, ids.section, ids.period]);
    await pool.query(
      "INSERT INTO section_schedule_events(id,section_id,title,starts_at,ends_at) VALUES($1,$2,$3,now()-interval '2 hours',now()-interval '1 hour')",
      [ids.event, ids.section, code]);
    await pool.query(
      "INSERT INTO attendance_sessions(schedule_event_id,status,marked_by_user_id,marked_at) VALUES($1,'MARKED',$2,now())",
      [ids.event, SEED_IDS.collegeAdminUser]);
    await pool.query(
      "INSERT INTO attendance_records(schedule_event_id,membership_id,status,marked_by_user_id) VALUES($1,$2,'ABSENT',$3)",
      [ids.event, ids.membership, SEED_IDS.collegeAdminUser]);
    await pool.query(
      "INSERT INTO placement_candidate_academic_evidence(membership_id,cgpa_hundredths) VALUES($1,800)",
      [ids.membership]);
    await pool.query("INSERT INTO placement_candidate_preferences(membership_id) VALUES($1)",
      [ids.membership]);
  });

  afterAll(async () => {
    try {
      if (pool) {
        const deletes = [
          ["attendance_records", "schedule_event_id", ids.event],
          ["attendance_sessions", "schedule_event_id", ids.event],
          ["section_schedule_events", "id", ids.event],
          ["section_enrollments", "id", ids.sectionEnrollment],
          ["placement_candidate_preferences", "membership_id", ids.membership],
          ["placement_candidate_academic_evidence", "membership_id", ids.membership],
          ["learner_program_enrollments", "id", ids.enrollment],
          ["sections", "id", ids.section],
          ["cohorts", "id", ids.cohort],
          ["academic_periods", "id", ids.period],
          ["programs", "id", ids.program],
          ["membership_roles", "id", ids.role],
          ["college_memberships", "id", ids.membership],
          ["users", "id", ids.user],
        ] as const;
        for (const [table, column, value] of deletes) {
          // Only fixed test-owned table/column identifiers; UUID is parameterized.
          await pool.query(`DELETE FROM ${table} WHERE ${column}=$1`, [value]);
        }
      }
    } finally {
      await pool?.end();
      await closeDatabaseConnection();
    }
  });

  it("shows persisted same-college marked records and evidence coverage", async () => {
    const [attendance, readiness] = await Promise.all([
      listCollegeDepartmentInsights(adminA, "ATTENDANCE", {}),
      listCollegeDepartmentInsights(adminA, "PLACEMENT_READINESS", {}),
    ]);
    const a = attendance.items.find((row) => row.id === SEED_IDS.departmentA);
    const r = readiness.items.find((row) => row.id === SEED_IDS.departmentA);
    expect(a?.markedSessions).toBeGreaterThanOrEqual(1);
    expect(a?.absent).toBeGreaterThanOrEqual(1);
    expect(r?.learners).toBeGreaterThanOrEqual(1);
    expect(r?.evidenceProfiles).toBeGreaterThanOrEqual(1);
    expect(r?.preferenceProfiles).toBeGreaterThanOrEqual(1);
  });

  it("COL-attendance-R03 supports acting-college Super Admin only for attendance departments",async()=>{
    const scoped=await listCollegeDepartmentInsights(actingSuperAdmin,"ATTENDANCE",{});
    expect(scoped.items.some(row=>row.id===SEED_IDS.departmentA)).toBe(true);
    expect(scoped.items.some(row=>row.id===SEED_IDS.departmentB)).toBe(false);
    await expect(listCollegeDepartmentInsights(actingSuperAdmin,"PLACEMENT_READINESS",{}))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(listCollegeDepartmentInsights({...actingSuperAdmin,adminScope:null},
      "ATTENDANCE",{})).rejects.toBeInstanceOf(AuthorizationError);
    const other=await listCollegeDepartmentInsights({...actingSuperAdmin,
      adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeB}},
      "ATTENDANCE",{});
    expect(other.items.some(row=>row.id===SEED_IDS.departmentA)).toBe(false);
  });
  it("cannot see another college department or use a forged college filter", async () => {
    for (const kind of ["ATTENDANCE", "PLACEMENT_READINESS"] as const) {
      const foreign = await listCollegeDepartmentInsights(adminB, kind, {});
      expect(foreign.items.some((row) => row.id === SEED_IDS.departmentA)).toBe(false);
      await expect(listCollegeDepartmentInsights(adminA, kind, {
        collegeId: SEED_IDS.collegeB,
      })).rejects.toBeDefined();
    }
  });

  it("denies learner-role access before reading any department data", async () => {
    for (const kind of ["ATTENDANCE", "PLACEMENT_READINESS"] as const) {
      await expect(listCollegeDepartmentInsights(learner, kind, {}))
        .rejects.toBeInstanceOf(AuthorizationError);
    }
  });
});
