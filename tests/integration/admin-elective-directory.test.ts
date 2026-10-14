import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { listSuperAdminElectives } from "@/modules/electives/admin-directory-service";
import { AuthorizationError } from "@/modules/permissions/policy";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
const enabled = Boolean(process.env.TEST_DATABASE_URL) && process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 }) : null;
const admin: RequestContext = { user: { id: SEED_IDS.superAdminUser, identityUid: "elective-admin",
  platformStatus: "ACTIVE", systemRoles: ["SUPER_ADMIN"] }, membership: null,
  adminScope: { organizationId: SEED_IDS.organization, collegeId: SEED_IDS.collegeA } };
describe.skipIf(!enabled)("Super Admin elective directory in isolated PostgreSQL", () => {
  afterAll(async () => {
    await pool?.end();
    await closeDatabaseConnection();
  });
  it("returns in-test college A slot but masks it under college B and denies wrong role", async () => {
    const key = randomUUID().slice(0, 12);
    const department = await pool!.query<{ id: string }>(
      "insert into departments (college_id, name) values ($1, $2) returning id",
      [SEED_IDS.collegeA, "Admin Electives " + key]);
    const program = await pool!.query<{ id: string }>(
      "insert into programs (department_id, name, code, duration_terms) values ($1, $2, $3, 8) returning id",
      [department.rows[0]!.id, "Elective Program " + key, "E" + key]);
    const slot = await pool!.query<{ id: string }>(
      "insert into elective_slots (college_id, program_id, semester_number, name) values ($1, $2, 3, $3) returning id",
      [SEED_IDS.collegeA, program.rows[0]!.id, "Elective Slot " + key]);
    const own = await listSuperAdminElectives(admin, { q: "Elective Slot " + key });
    expect(own.items.map(row => row.id)).toContain(slot.rows[0]!.id);
    const foreign = { ...admin, adminScope: { organizationId: SEED_IDS.organization, collegeId: SEED_IDS.collegeB } };
    expect((await listSuperAdminElectives(foreign, { q: "Elective Slot " + key })).items).toHaveLength(0);
    const wrong: RequestContext = { ...admin, user: { ...admin.user, systemRoles: [] } };
    await expect(listSuperAdminElectives(wrong, {})).rejects.toBeInstanceOf(AuthorizationError);
    expect((await listSuperAdminElectives({ ...admin, adminScope: null }, {})).state).toBe("CHOOSE_COLLEGE");
  });
});
