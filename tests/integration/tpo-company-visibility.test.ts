import { afterAll, describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection } from "@/db/client";
import { getCompanyVisibilitySettings } from "@/modules/placements/tpo-policy-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Visibility tests require a disposable TEST_DATABASE_URL");
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

describe("company visibility reader against PostgreSQL", () => {
  it("returns five boolean flags for the TPO college", async () => {
    const v = await getCompanyVisibilitySettings(tpo, SEED_IDS.collegeA);
    for (const key of [
      "showCgpaExact",
      "showTenthTwelfth",
      "showProjectLinks",
      "showAssessmentScores",
      "showAttendance",
    ] as const) {
      expect(typeof v[key]).toBe("boolean");
    }
  });

  it("rejects another college", async () => {
    await expect(
      getCompanyVisibilitySettings(tpo, SEED_IDS.collegeB),
    ).rejects.toBeDefined();
  });
});
