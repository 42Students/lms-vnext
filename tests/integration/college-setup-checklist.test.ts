import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getCollegeSetupChecklist } from "@/modules/admin-ui/college-setup-checklist-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = !!process.env.TEST_DATABASE_URL && process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL }) : null;
const admin: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "setup-admin",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.collegeAdminMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const otherCollege: RequestContext = {
  ...admin, user: { ...admin.user, id: SEED_IDS.facultyUser },
  membership: { id: SEED_IDS.facultyCollegeBMembership, collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const learner: RequestContext = {
  ...admin, membership: { ...admin.membership!, roles: ["LEARNER"] },
};
const id = randomUUID();
const name = "w-college-setup-" + id.slice(0, 8);

describe.skipIf(!enabled)("College setup steps backed by real scoped PostgreSQL counts", () => {
  afterAll(async () => {
    try { if (pool) await pool.query("DELETE FROM departments WHERE id=$1", [id]); }
    finally { await pool?.end(); await closeDatabaseConnection(); }
  });
  it("increments only owning-college departments from a real persisted fixture", async () => {
    const [before, foreignBefore] = await Promise.all([
      getCollegeSetupChecklist(admin, {}), getCollegeSetupChecklist(otherCollege, {}),
    ]);
    await pool!.query("INSERT INTO departments(id,college_id,name) VALUES($1,$2,$3)",
      [id, SEED_IDS.collegeA, name]);
    const [after, foreignAfter] = await Promise.all([
      getCollegeSetupChecklist(admin, {}), getCollegeSetupChecklist(otherCollege, {}),
    ]);
    expect(after.counts.departments).toBe(before.counts.departments + 1);
    expect(foreignAfter.counts.departments).toBe(foreignBefore.counts.departments);
    expect(after.phases.flatMap(phase => phase.steps)
      .find(step => step.key === "departments")?.href).toBe("/college/departments");
  });
  it("denies learner role and caller-selected college", async () => {
    await expect(getCollegeSetupChecklist(learner, {}))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(getCollegeSetupChecklist(admin, { collegeId: SEED_IDS.collegeB }))
      .rejects.toBeDefined();
  });
});
