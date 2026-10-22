import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection } from "@/db/client";
import { getSuperAdminCollegeReadiness } from "@/modules/colleges/readiness-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Readiness tests require a disposable TEST_DATABASE_URL");
}

const superAdmin: RequestContext = {
  user: {
    id: SEED_IDS.superAdminUser,
    identityUid: "seed-super",
    platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"],
  },
  membership: null,
};

afterAll(async () => {
  await closeDatabaseConnection();
});

describe("college readiness against PostgreSQL", () => {
  it("evaluates all ten checks for a seeded college", async () => {
    const result = await getSuperAdminCollegeReadiness(superAdmin, SEED_IDS.collegeA);
    expect(result).not.toBeNull();
    expect(result!.evaluation.counts.total).toBe(10);
    expect(
      result!.evaluation.counts.passed +
        result!.evaluation.counts.failed +
        result!.evaluation.counts.unknown,
    ).toBe(10);
  });

  it("returns null for an unknown college", async () => {
    expect(await getSuperAdminCollegeReadiness(superAdmin, randomUUID())).toBeNull();
  });

  it("rejects a non-super-admin", async () => {
    await expect(
      getSuperAdminCollegeReadiness(
        { ...superAdmin, user: { ...superAdmin.user, systemRoles: [] } },
        SEED_IDS.collegeA,
      ),
    ).rejects.toBeDefined();
  });

  it("rejects a super admin scoped to a different college", async () => {
    await expect(
      getSuperAdminCollegeReadiness(
        {
          ...superAdmin,
          adminScope: {
            organizationId: SEED_IDS.organization,
            collegeId: SEED_IDS.collegeB,
          },
        },
        SEED_IDS.collegeA,
      ),
    ).rejects.toBeDefined();
  });
});
