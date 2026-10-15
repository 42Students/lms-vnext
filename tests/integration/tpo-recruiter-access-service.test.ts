import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection } from "@/db/client";
import { listTpoRecruiterAccess } from "@/modules/placements/tpo-recruiter-access-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Recruiter access tests require a disposable TEST_DATABASE_URL");
}

const tpo: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser,
    identityUid: "seed-tpo",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.collegeAdminMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["TPO"],
  },
};

const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 });
let addedRoleId: string | undefined;

// The service re-reads a persisted active TPO role (not just request claims).
beforeAll(async () => {
  const row = await pool.query<{ id: string }>(
    "INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING RETURNING id",
    [SEED_IDS.collegeAdminMembership],
  );
  addedRoleId = row.rows[0]?.id;
});

afterAll(async () => {
  if (addedRoleId) await pool.query("DELETE FROM membership_roles WHERE id=$1", [addedRoleId]);
  await pool.end();
  await closeDatabaseConnection();
});

describe("TPO recruiter access against PostgreSQL", () => {
  it("reads grants of the own college with each status filter", async () => {
    for (const status of ["ALL", "ACTIVE", "REVOKED"]) {
      const r = await listTpoRecruiterAccess(tpo, { status });
      expect(r.page).toBe(1);
    }
  });

  it("rejects a non-TPO membership", async () => {
    await expect(
      listTpoRecruiterAccess(
        { ...tpo, membership: { ...tpo.membership!, roles: ["COLLEGE_ADMIN"] } },
        {},
      ),
    ).rejects.toBeDefined();
  });
});
