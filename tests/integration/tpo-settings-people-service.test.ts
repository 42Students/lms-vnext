import { afterAll, describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection } from "@/db/client";
import {
  getTpoPlacementTeam,
  getTpoTrustedCompanies,
} from "@/modules/placements/tpo-settings-people-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("TPO people tests require a disposable TEST_DATABASE_URL");
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

afterAll(async () => {
  await closeDatabaseConnection();
});

describe("TPO settings people service against PostgreSQL", () => {
  it("reads team and trusted companies for the own college", async () => {
    const team = await getTpoPlacementTeam(tpo, SEED_IDS.collegeA);
    expect(team.summary.total).toBe(team.members.length);
    const trusted = await getTpoTrustedCompanies(tpo, SEED_IDS.collegeA);
    expect(trusted.summary.totalCompanies).toBe(trusted.companies.length);
  });

  it("rejects another college id for a TPO", async () => {
    await expect(
      getTpoPlacementTeam(tpo, SEED_IDS.collegeB),
    ).rejects.toBeDefined();
    await expect(
      getTpoTrustedCompanies(tpo, SEED_IDS.collegeB),
    ).rejects.toBeDefined();
  });
});
