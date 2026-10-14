import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  getTpoCompanyLifecycle, saveTpoCompanyLifecycle, TpoCompanyLifecycleError,
} from "@/modules/placements/tpo-company-lifecycle-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = process.env.DB09_ISOLATED_TEST_DATABASE === "1" &&
  Boolean(process.env.TEST_DATABASE_URL);
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 }) : null;
const tpo: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "db09-company-lifecycle",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.facultyCollegeAMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["TPO"] },
};
const fixtures: string[] = [];
let tpoRoleId: string | null = null;
async function fixture(collegeId: string = SEED_IDS.collegeA) {
  if (!pool) throw new Error("Disposable DB required");
  const token = randomUUID();
  const company = await pool.query<{ id: string }>(
    "INSERT INTO placement_companies(name,created_by_user_id) VALUES($1,$2) RETURNING id",
    ["Lifecycle-" + token, SEED_IDS.facultyUser],
  );
  const companyId = company.rows[0]?.id;
  if (!companyId) throw new Error("company creation failed");
  fixtures.push(companyId);
  await pool.query(
    "INSERT INTO placement_company_relationships(college_id,company_id,created_by_user_id) VALUES($1,$2,$3)",
    [collegeId, companyId, SEED_IDS.facultyUser],
  );
  return companyId;
}
function change(companyId: string, expectedUpdatedAt: string,
  action: "ARCHIVE" | "RESTORE" | "EDIT_TRUST", nextTrusted?: boolean) {
  return {
    companyId, expectedUpdatedAt, action, confirmed: true,
    reason: "Authorized test lifecycle change",
    ...(nextTrusted === undefined ? {} : { nextTrusted }),
  };
}

describe.skipIf(!enabled)("TPO company relationship lifecycle on isolated PostgreSQL", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("pool required");
    const inserted = await pool.query<{ id: string }>(
      "INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING RETURNING id",
      [SEED_IDS.facultyCollegeAMembership],
    );
    tpoRoleId = inserted.rows[0]?.id ?? null;
  });
  afterAll(async () => {
    if (pool) {
      // Do NOT delete immutable activity_events. Their actor evidence remains
      // in this disposable database until the isolated harness destroys it.
      for (const id of fixtures) {
        await pool.query("DELETE FROM placement_company_relationships WHERE company_id=$1", [id]);
        await pool.query("DELETE FROM placement_companies WHERE id=$1", [id]);
      }
      if (tpoRoleId) {
        await pool.query("DELETE FROM membership_roles WHERE id=$1", [tpoRoleId]);
      }
      await pool.end();
    }
    await closeDatabaseConnection();
  });
  it("writes trust/archive/restore with immutable actor audit", async () => {
    if (!pool) throw new Error("pool required");
    const companyId = await fixture();
    const initial = await getTpoCompanyLifecycle(tpo, companyId);
    if (!initial) throw new Error("fixture not visible");
    const edited = await saveTpoCompanyLifecycle(tpo, change(
      companyId, initial.updatedAt, "EDIT_TRUST", true,
    ));
    expect(edited.isTrusted).toBe(true);
    await expect(saveTpoCompanyLifecycle(tpo, change(
      companyId, initial.updatedAt, "ARCHIVE",
    ))).rejects.toBeInstanceOf(TpoCompanyLifecycleError);
    const archived = await saveTpoCompanyLifecycle(tpo, change(
      companyId, edited.updatedAt, "ARCHIVE",
    ));
    expect(archived.status).toBe("ARCHIVED");
    const restored = await saveTpoCompanyLifecycle(tpo, change(
      companyId, archived.updatedAt, "RESTORE",
    ));
    expect(restored.status).toBe("ACTIVE");
    const audit = await pool.query<{ count: number }>(
      "SELECT count(*)::integer AS count FROM activity_events WHERE subject_id=$1 AND event_type='PLACEMENTS_COMPANY_LIFECYCLE_CHANGED'",
      [initial.relationshipId],
    );
    expect(audit.rows[0]?.count).toBe(3);
  });
  it("rejects foreign college, missing company and wrong role", async () => {
    const companyId = await fixture();
    const initial = await getTpoCompanyLifecycle(tpo, companyId);
    if (!initial) throw new Error("missing initial");
    const foreign: RequestContext = {
      ...tpo, membership: { ...tpo.membership!, collegeId: SEED_IDS.collegeB },
    };
    await expect(getTpoCompanyLifecycle(foreign, companyId)).resolves.toBeNull();
    await expect(saveTpoCompanyLifecycle(foreign, change(
      companyId, initial.updatedAt, "ARCHIVE",
    ))).rejects.toBeInstanceOf(TpoCompanyLifecycleError);
    const wrong: RequestContext = {
      ...tpo, membership: { ...tpo.membership!, roles: ["LEARNER"] },
    };
    await expect(saveTpoCompanyLifecycle(wrong, change(
      companyId, initial.updatedAt, "ARCHIVE",
    ))).rejects.toBeInstanceOf(AuthorizationError);
    await expect(saveTpoCompanyLifecycle(tpo, change(
      randomUUID(), initial.updatedAt, "ARCHIVE",
    ))).rejects.toBeInstanceOf(TpoCompanyLifecycleError);
  });
});
