import { afterAll, describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection } from "@/db/client";
import { getTpoPlacementBranding } from "@/modules/placements/tpo-branding-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Branding tests require a disposable TEST_DATABASE_URL");
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

describe("TPO branding against PostgreSQL", () => {
  it("reads own college branding", async () => {
    const b = await getTpoPlacementBranding(tpo);
    expect(b.collegeName.length).toBeGreaterThan(0);
    expect(["PERSISTED", "SOURCE_DEFAULT"]).toContain(b.brandingSource);
  });

  it("rejects a non-TPO membership", async () => {
    await expect(
      getTpoPlacementBranding({
        ...tpo,
        membership: { ...tpo.membership!, roles: ["COLLEGE_ADMIN"] },
      }),
    ).rejects.toBeDefined();
  });
});
