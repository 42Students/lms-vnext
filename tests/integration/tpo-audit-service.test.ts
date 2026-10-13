import { afterAll, describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection } from "@/db/client";
import { getTpoAuditLog } from "@/modules/placements/tpo-audit-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("TPO audit tests require a disposable TEST_DATABASE_URL");
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

describe("TPO audit log against PostgreSQL", () => {
  it("executes every audit source query without error", async () => {
    const result = await getTpoAuditLog(tpo, {});
    expect(result.summary.total).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.items)).toBe(true);
  });

  it("filters by kind, date and search", async () => {
    for (const kind of [
      "ACTIVITY",
      "APPLICATION",
      "SCREENING",
      "ROUND",
      "RESULT",
      "OFFER",
      "JOINING",
      "SHARE",
    ]) {
      const result = await getTpoAuditLog(tpo, {
        kind,
        from: "2020-01-01",
        to: "2040-01-01",
        q: "a",
      });
      expect(result.page).toBe(1);
    }
  });
});
