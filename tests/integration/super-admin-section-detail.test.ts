import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { resolveSuperAdminSectionDetail } from "@/modules/admin-ui/super-admin-section-detail";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = !!process.env.TEST_DATABASE_URL && process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 }) : null;
const admin: RequestContext = {
  user: { id: SEED_IDS.superAdminUser, identityUid: "section-detail-test", platformStatus: "ACTIVE", systemRoles: ["SUPER_ADMIN"] },
  membership: null,
  adminScope: { organizationId: SEED_IDS.organization, collegeId: SEED_IDS.collegeA },
};
const ids = { period: randomUUID(), program: randomUUID(), cohort: randomUUID(), section: randomUUID() };
const label = "admin-sec-" + ids.section.slice(0, 8);
describe.skipIf(!enabled)("Super Admin section URL PostgreSQL safety", () => {
  beforeAll(async () => {
    await pool!.query("insert into academic_periods (id,college_id,name,code,start_date,end_date) values ($1,$2,$3::text,$3::text,'2026-07-01','2026-12-31')", [ids.period, SEED_IDS.collegeA, label]);
    await pool!.query("insert into programs (id,department_id,name,code,duration_terms) values ($1,$2,$3::text,$3::text,8)", [ids.program, SEED_IDS.departmentA, label]);
    await pool!.query("insert into cohorts (id,program_id,name,code,start_period_id) values ($1,$2,$3::text,$3::text,$4)", [ids.cohort, ids.program, label, ids.period]);
    await pool!.query("insert into sections (id,cohort_id,academic_period_id,name,code) values ($1,$2,$3,$4::text,$4::text)", [ids.section, ids.cohort, ids.period, label]);
  });
  afterAll(async () => {
    try {
      for (const [table, id] of [["sections",ids.section],["cohorts",ids.cohort],["programs",ids.program],["academic_periods",ids.period]] as const)
        await pool?.query(`delete from ${table} where id=$1`, [id]);
    } finally { await pool?.end(); await closeDatabaseConnection(); }
  });
  it("returns own section and conceals unknown and foreign selections", async () => {
    expect((await resolveSuperAdminSectionDetail(admin, ids.section))?.id).toBe(ids.section);
    expect(await resolveSuperAdminSectionDetail(admin, randomUUID())).toBeNull();
    expect(await resolveSuperAdminSectionDetail(admin, "malformed")).toBeNull();
    expect(await resolveSuperAdminSectionDetail({ ...admin, adminScope: { organizationId: SEED_IDS.organization, collegeId: SEED_IDS.collegeB } }, ids.section)).toBeNull();
  });
  it("denies wrong-role reads before any resource lookup", async () => {
    await expect(resolveSuperAdminSectionDetail({ ...admin, user: { ...admin.user, systemRoles: [] } }, ids.section))
      .rejects.toBeInstanceOf(AuthorizationError);
  });
});
