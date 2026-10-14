import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { listCollegePromotionOptions, previewCollegeBatchPromotion } from "@/modules/academics/college-batch-promotion-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
const enabled = Boolean(process.env.TEST_DATABASE_URL) && process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 }) : null;
const admin: RequestContext = { user: { id: SEED_IDS.superAdminUser, identityUid: "sa-batch-preview",
  platformStatus: "ACTIVE", systemRoles: ["SUPER_ADMIN"] }, membership: null,
  adminScope: { organizationId: SEED_IDS.organization, collegeId: SEED_IDS.collegeA } };
describe.skipIf(!enabled)("Super Admin read-only batch promotion preview PostgreSQL", () => {
  afterAll(async () => { await pool?.end(); await closeDatabaseConnection(); });
  it("lists and previews own in-test cohort, masks foreign college and denies wrong role", async () => {
    const suffix = randomUUID().slice(0, 10);
    const dep = await pool!.query<{ id: string }>(
      "insert into departments (college_id,name) values ($1,$2) returning id",
      [SEED_IDS.collegeA, "Promotion Dept " + suffix]);
    const program = await pool!.query<{ id: string }>(
      "insert into programs (department_id,name,code,duration_terms) values ($1,$2,$3,8) returning id",
      [dep.rows[0]!.id, "Promotion Program " + suffix, "PR" + suffix]);
    const period = await pool!.query<{ id: string }>(
      "insert into academic_periods (college_id,name,code,start_date,end_date) values ($1,$2,$3,'2026-07-01','2027-06-30') returning id",
      [SEED_IDS.collegeA, "Promotion Year " + suffix, "PY" + suffix]);
    const cohort = await pool!.query<{ id: string }>(
      "insert into cohorts (program_id,name,code,start_period_id) values ($1,$2,$3,$4) returning id",
      [program.rows[0]!.id, "Promotion Cohort " + suffix, "PC" + suffix, period.rows[0]!.id]);
    const options = await listCollegePromotionOptions(admin, { programId: program.rows[0]!.id });
    expect(options.cohorts.map(row => row.id)).toContain(cohort.rows[0]!.id);
    const preview = await previewCollegeBatchPromotion(admin, { cohortId: cohort.rows[0]!.id });
    expect(preview.canProceed).toBe(false);
    expect(preview.blockers).toContain("NO_LEARNERS");
    const other = { ...admin, adminScope: { organizationId: SEED_IDS.organization, collegeId: SEED_IDS.collegeB } };
    expect((await listCollegePromotionOptions(other, { programId: program.rows[0]!.id })).cohorts).toHaveLength(0);
    await expect(previewCollegeBatchPromotion(other, { cohortId: cohort.rows[0]!.id }))
      .rejects.toMatchObject({ code: "BATCH_NOT_FOUND" });
    await expect(listCollegePromotionOptions({ ...admin, user: { ...admin.user, systemRoles: [] } }, {}))
      .rejects.toBeInstanceOf(AuthorizationError);
  });
});
