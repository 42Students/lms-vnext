import { afterAll, describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection } from "@/db/client";
import { getSuperAdminPlatformSettings } from "@/modules/platform-settings/service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Platform settings tests require a disposable TEST_DATABASE_URL");
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

describe("platform settings against PostgreSQL", () => {
  it("returns fixed values and fallbacks without a selected college", async () => {
    const result = await getSuperAdminPlatformSettings(superAdmin);
    expect(result.selectedCollegeName).toBeNull();
    expect(result.sections.map((s) => s.id)).toEqual([
      "course-progress",
      "attendance",
      "placements",
      "sms",
      "operations",
    ]);
  });

  it("reads the selected college's policy rows", async () => {
    const result = await getSuperAdminPlatformSettings({
      ...superAdmin,
      adminScope: {
        organizationId: SEED_IDS.organization,
        collegeId: SEED_IDS.collegeA,
      },
    });
    expect(result.selectedCollegeName).not.toBeNull();
  });

  it("rejects a non-super-admin", async () => {
    await expect(
      getSuperAdminPlatformSettings({
        ...superAdmin,
        user: { ...superAdmin.user, systemRoles: [] },
      }),
    ).rejects.toBeDefined();
  });
});
