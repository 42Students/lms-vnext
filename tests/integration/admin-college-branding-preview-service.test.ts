import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

import { closeDatabaseConnection, getDb } from "@/db/client";
import { collegeBranding } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getSuperAdminCollegeBrandingPreview } from "@/modules/colleges/admin-branding-preview-service";
import {
  safeTpoBrandColor,
  safeTpoBrandLogoUrl,
} from "@/modules/placements/tpo-branding-model";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("College branding preview tests require a disposable TEST_DATABASE_URL");
}

const superAdmin: RequestContext = {
  user: {
    id: SEED_IDS.superAdminUser,
    identityUid: "branding-preview-admin",
    platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"],
  },
  membership: null,
};

afterAll(async () => {
  await closeDatabaseConnection();
});

describe("Super Admin college branding preview against PostgreSQL", () => {
  it("reads only the seeded college's actual stored branding, or honest defaults", async () => {
    const result = await getSuperAdminCollegeBrandingPreview(
      superAdmin,
      SEED_IDS.collegeA,
    );
    expect(result).not.toBeNull();
    expect(result!.college.id).toBe(SEED_IDS.collegeA);
    expect(result!.college.name.length).toBeGreaterThan(0);
    expect(result!.styleVariables["--lms-primary"]).toBe(result!.primary);

    const [stored] = await getDb()
      .select({
        logoUrl: collegeBranding.logoUrl,
        primaryColor: collegeBranding.primaryColor,
      })
      .from(collegeBranding)
      .where(eq(collegeBranding.collegeId, SEED_IDS.collegeA))
      .limit(1);

    expect(result!.brandingStored).toBe(Boolean(stored));
    expect(result!.logoUrl).toBe(safeTpoBrandLogoUrl(stored?.logoUrl));
    if (stored?.primaryColor) {
      expect(result!.primaryOverride).toBe(safeTpoBrandColor(stored.primaryColor));
    }
    expect(Object.keys(result!.college)).not.toContain("logoObjectPath");
  });

  it("returns null for unknown persisted college", async () => {
    await expect(
      getSuperAdminCollegeBrandingPreview(superAdmin, randomUUID()),
    ).resolves.toBeNull();
  });

  it("rejects non-Super-Admin requests", async () => {
    await expect(
      getSuperAdminCollegeBrandingPreview(
        {
          ...superAdmin,
          user: { ...superAdmin.user, systemRoles: [] },
        },
        SEED_IDS.collegeA,
      ),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("rejects an otherwise valid Super Admin scoped to another college", async () => {
    await expect(
      getSuperAdminCollegeBrandingPreview(
        {
          ...superAdmin,
          adminScope: {
            organizationId: SEED_IDS.organization,
            collegeId: SEED_IDS.collegeB,
          },
        },
        SEED_IDS.collegeA,
      ),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("allows an explicitly selected matching college scope", async () => {
    const result = await getSuperAdminCollegeBrandingPreview(
      {
        ...superAdmin,
        adminScope: {
          organizationId: SEED_IDS.organization,
          collegeId: SEED_IDS.collegeA,
        },
      },
      SEED_IDS.collegeA,
    );
    expect(result?.college.id).toBe(SEED_IDS.collegeA);
  });
});
