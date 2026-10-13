import { afterAll, describe, expect, it } from "vitest";
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

afterAll(async () => {
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
