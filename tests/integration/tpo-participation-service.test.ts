import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection } from "@/db/client";
import { getTpoLearnerParticipation } from "@/modules/placements/tpo-participation-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Participation tests require a disposable TEST_DATABASE_URL");
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

describe("TPO participation read against PostgreSQL", () => {
  it("denies a learner without exactly one active enrollment (seed has none)", async () => {
    await expect(
      getTpoLearnerParticipation(tpo, SEED_IDS.learnerCollegeAMembership),
    ).rejects.toBeDefined();
  });

  it("denies an unknown membership and a malformed id", async () => {
    await expect(getTpoLearnerParticipation(tpo, randomUUID())).rejects.toBeDefined();
    await expect(getTpoLearnerParticipation(tpo, "not-a-uuid")).rejects.toBeDefined();
  });

  it("denies a TPO of another college", async () => {
    await expect(
      getTpoLearnerParticipation(
        { ...tpo, membership: { ...tpo.membership!, collegeId: SEED_IDS.collegeB } },
        SEED_IDS.learnerCollegeAMembership,
      ),
    ).rejects.toBeDefined();
  });
});
