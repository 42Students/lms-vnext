import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection } from "@/db/client";
import {
  getTpoPlacementRulesSettings,
  getTpoPlacementSeasonSettings,
} from "@/modules/placements/tpo-settings-read-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("TPO settings tests require a disposable TEST_DATABASE_URL");
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

const nonTpo: RequestContext = {
  ...tpo,
  membership: { ...tpo.membership!, roles: ["COLLEGE_ADMIN"] },
};

const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 });
let grantedTpoRoleId: string | null = null;

// The services re-check the persisted TPO role, so the seeded college admin
// membership temporarily holds a real TPO role (removed afterwards).
beforeAll(async () => {
  const inserted = await pool.query<{ id: string }>(
    "INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING RETURNING id",
    [SEED_IDS.collegeAdminMembership],
  );
  grantedTpoRoleId = inserted.rows[0]?.id ?? null;
});

afterAll(async () => {
  if (grantedTpoRoleId) {
    await pool.query("DELETE FROM membership_roles WHERE id=$1", [grantedTpoRoleId]);
  }
  await pool.end();
  await closeDatabaseConnection();
});

describe("TPO settings read service against PostgreSQL", () => {
  it("reads seasons and rules for the TPO college", async () => {
    const seasons = await getTpoPlacementSeasonSettings(tpo);
    expect(seasons.summary.total).toBe(seasons.seasons.length);

    const rules = await getTpoPlacementRulesSettings(tpo, {});
    expect(rules.page).toBe(1);
    expect(["PERSISTED", "SOURCE_DEFAULT"]).toContain(rules.collegeRules.source);
    expect(rules.jobs.length).toBeLessThanOrEqual(25);
  });

  it("rejects a non-TPO membership", async () => {
    await expect(getTpoPlacementSeasonSettings(nonTpo)).rejects.toBeDefined();
    await expect(getTpoPlacementRulesSettings(nonTpo, {})).rejects.toBeDefined();
  });
});
