import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection } from "@/db/client";
import {
  getTpoCompaniesView,
  getTpoCompanyDetailView,
} from "@/modules/placements/tpo-companies-view-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("TPO companies tests require a disposable TEST_DATABASE_URL");
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

describe("TPO companies view against PostgreSQL", () => {
  it("lists companies and resolves each canonical detail", async () => {
    const view = await getTpoCompaniesView(tpo, {
      collegeId: SEED_IDS.collegeA,
    });
    expect(view.totalCompanies).toBeGreaterThanOrEqual(0);

    for (const row of view.page.items) {
      if (!row.companyId) continue;
      const detail = await getTpoCompanyDetailView(tpo, {
        collegeId: SEED_IDS.collegeA,
        companyId: row.companyId,
      });
      expect(detail?.company.companyId).toBe(row.companyId);
    }
  });

  it("returns null for an unknown company id", async () => {
    const detail = await getTpoCompanyDetailView(tpo, {
      collegeId: SEED_IDS.collegeA,
      companyId: randomUUID(),
    });
    expect(detail).toBeNull();
  });
});
