import { afterAll, describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection } from "@/db/client";
import { getOwnTpoProfile } from "@/modules/placements/tpo-self-profile-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("TPO profile tests require a disposable TEST_DATABASE_URL");
}

const asTpo = (userId: string, membershipId: string): RequestContext => ({
  user: { id: userId, identityUid: "seed", platformStatus: "ACTIVE", systemRoles: [] },
  membership: {
    id: membershipId,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["TPO"],
  },
});

afterAll(async () => {
  await closeDatabaseConnection();
});

describe("TPO self profile against PostgreSQL", () => {
  it("rejects a TPO context whose database membership has no TPO role", async () => {
    await expect(
      getOwnTpoProfile(asTpo(SEED_IDS.collegeAdminUser, SEED_IDS.collegeAdminMembership)),
    ).rejects.toBeDefined();
  });

  it("rejects a mismatched user and membership pair", async () => {
    await expect(
      getOwnTpoProfile(asTpo("00000000-0000-4000-8000-000000000000", SEED_IDS.collegeAdminMembership)),
    ).rejects.toBeDefined();
  });
});
