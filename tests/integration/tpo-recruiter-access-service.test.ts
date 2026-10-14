import { afterAll, describe, expect, it } from "vitest";
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

afterAll(async () => {
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
