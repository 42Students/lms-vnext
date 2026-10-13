import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection } from "@/db/client";
import { getTpoRoundDriveDay } from "@/modules/placements/tpo-round-drive-day-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Round drive day tests require a disposable TEST_DATABASE_URL");
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

describe("TPO round drive day against PostgreSQL", () => {
  it("returns not-found for unknown and malformed round ids", async () => {
    await expect(getTpoRoundDriveDay(tpo, randomUUID())).rejects.toMatchObject({
      code: "PLACEMENT_ROUND_NOT_FOUND",
    });
    await expect(getTpoRoundDriveDay(tpo, "not-a-uuid")).rejects.toMatchObject({
      code: "PLACEMENT_ROUND_NOT_FOUND",
    });
  });

  it("rejects a non-TPO membership", async () => {
    await expect(
      getTpoRoundDriveDay(
        { ...tpo, membership: { ...tpo.membership!, roles: ["COLLEGE_ADMIN"] } },
        randomUUID(),
      ),
    ).rejects.toBeDefined();
  });
});
