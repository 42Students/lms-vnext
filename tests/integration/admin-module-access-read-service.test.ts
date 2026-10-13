import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection } from "@/db/client";
import {
  getSuperAdminCollegeModuleAccess,
  listSuperAdminFeatureControls,
} from "@/modules/module-access/admin-read-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Module access tests require a disposable TEST_DATABASE_URL");
}

const superAdmin: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser,
    identityUid: "seed-super",
    platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"],
  },
  membership: null,
};

afterAll(async () => {
  await closeDatabaseConnection();
});

describe("module access admin read against PostgreSQL", () => {
  it("lists the college matrix", async () => {
    const result = await listSuperAdminFeatureControls(superAdmin, {});
    expect(result.items.length).toBeLessThanOrEqual(20);
    for (const item of result.items) expect(item.modules).toHaveLength(3);
  });

  it("executes the descendant override union against the real schema", async () => {
    const detail = await getSuperAdminCollegeModuleAccess(superAdmin, SEED_IDS.collegeA, {});
    expect(detail).not.toBeNull();
    expect(detail!.modules).toHaveLength(3);
    expect(detail!.total).toBeGreaterThanOrEqual(0);
  });

  it("returns null for an unknown college and rejects non-super-admins", async () => {
    expect(await getSuperAdminCollegeModuleAccess(superAdmin, randomUUID(), {})).toBeNull();
    await expect(
      listSuperAdminFeatureControls(
        { ...superAdmin, user: { ...superAdmin.user, systemRoles: [] } },
        {},
      ),
    ).rejects.toBeDefined();
  });
});
