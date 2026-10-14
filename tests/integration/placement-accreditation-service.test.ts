import { afterAll, describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection } from "@/db/client";
import { getPlacementAccreditationReport } from "@/modules/placements/report-accreditation-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Accreditation tests require a disposable TEST_DATABASE_URL");
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

describe("accreditation report against PostgreSQL", () => {
  it("builds the CSV from migrated tables for the TPO college", async () => {
    const result = await getPlacementAccreditationReport(tpo, {
      collegeId: SEED_IDS.collegeA,
    });
    expect(result.csv.length).toBeGreaterThan(0);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it("rejects another college", async () => {
    await expect(
      getPlacementAccreditationReport(tpo, { collegeId: SEED_IDS.collegeB }),
    ).rejects.toBeDefined();
  });
});
