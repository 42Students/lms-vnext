import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { runCollegeStudentCsv } from "@/modules/people/college-student-csv-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 }) : null;
const ids = { period: randomUUID(), program: randomUUID(), cohort: randomUUID() };
const label = "student-csv-" + ids.period.slice(0, 8);
const csv = "displayName,phoneE164,email,programId,cohortId\n" +
  ["CSV Test", "+919876543210", "", ids.program, ids.cohort].join(",");

const admin: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "import-admin",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.collegeAdminMembership,
    collegeId: SEED_IDS.collegeA, organizationId: SEED_IDS.organization,
    status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const foreign: RequestContext = {
  user: { ...admin.user, id: SEED_IDS.facultyUser },
  membership: { id: SEED_IDS.facultyCollegeBMembership,
    collegeId: SEED_IDS.collegeB, organizationId: SEED_IDS.organization,
    status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const faculty: RequestContext = {
  ...admin, membership: { ...admin.membership!, roles: ["FACULTY"] },
};

describe.skipIf(!enabled)("College Student CSV preflight, disposable PostgreSQL", () => {
  beforeAll(async () => {
    await pool!.query("INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) " +
      "VALUES($1,$2,$3,$3,'2026-07-01','2026-12-31')",
      [ids.period, SEED_IDS.collegeA, label]);
    await pool!.query("INSERT INTO programs(id,department_id,name,code,duration_terms) " +
      "VALUES($1,$2,$3,$3,8)", [ids.program, SEED_IDS.departmentA, label]);
    await pool!.query("INSERT INTO cohorts(id,program_id,name,code,start_period_id) " +
      "VALUES($1,$2,$3,$3,$4)", [ids.cohort, ids.program, label, ids.period]);
  });

  afterAll(async () => {
    try {
      if (pool) {
        await pool.query("DELETE FROM cohorts WHERE id=$1", [ids.cohort]);
        await pool.query("DELETE FROM programs WHERE id=$1", [ids.program]);
        await pool.query("DELETE FROM academic_periods WHERE id=$1", [ids.period]);
      }
    } finally { await pool?.end(); await closeDatabaseConnection(); }
  });

  it("previews real owned program and cohort without creating people", async () => {
    const report = await runCollegeStudentCsv(admin, { action: "PREVIEW", csv });
    expect(report.preview).toBe(true);
    expect(report.valid).toBe(1);
    expect(report.invalid).toBe(0);
    expect(report.results[0]?.status).toBe("VALID");
  });

  it("does not leak a college A cohort to a college B admin", async () => {
    const report = await runCollegeStudentCsv(foreign, { action: "PREVIEW", csv });
    expect(report.results[0]?.status).toBe("INVALID");
    expect(report.results[0]?.detail).toContain("PROGRAM_COHORT_UNAVAILABLE");
  });

  it("denies wrong role and rejects unconfirmed writes/forged tenant IDs", async () => {
    await expect(runCollegeStudentCsv(faculty, { action: "PREVIEW", csv }))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(runCollegeStudentCsv(admin, { action: "IMPORT", csv, confirm: false }))
      .rejects.toBeDefined();
    await expect(runCollegeStudentCsv(admin, { action: "PREVIEW", csv,
      collegeId: SEED_IDS.collegeB })).rejects.toBeDefined();
  });
});
