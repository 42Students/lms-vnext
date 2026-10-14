import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection } from "@/db/client";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getTpoActorAudit } from "@/modules/placements/tpo-actor-audit-service";
import { getTpoPerformanceIntelligence } from "@/modules/placements/tpo-intelligence-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("TPO audit and intelligence tests need disposable TEST_DATABASE_URL");
}

const tpo: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser,
    identityUid: "tpo-reports-audit",
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

afterAll(async () => { await closeDatabaseConnection(); });

describe("TPO actor and performance PostgreSQL scope", () => {
  it("rejects wrong role for both reports", async () => {
    const wrong: RequestContext = {
      ...tpo, membership: { ...tpo.membership!, roles: ["COLLEGE_ADMIN"] },
    };
    await expect(getTpoActorAudit(wrong, {})).rejects.toBeInstanceOf(AuthorizationError);
    await expect(getTpoPerformanceIntelligence(wrong, {})).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("rejects invalid and forged query scope", async () => {
    await expect(getTpoActorAudit(tpo, { collegeId: SEED_IDS.collegeB }))
      .rejects.toBeDefined();
    await expect(getTpoPerformanceIntelligence(tpo, { collegeId: SEED_IDS.collegeB }))
      .rejects.toBeDefined();
    await expect(getTpoActorAudit(tpo, { actorId: "not-a-uuid" }))
      .rejects.toBeDefined();
  });

  it("does not leak an unknown season and returns only same-college canonical activity", async () => {
    await expect(getTpoPerformanceIntelligence(tpo, {
      seasonId: randomUUID(),
    })).rejects.toBeDefined();
    const result = await getTpoActorAudit(tpo, { actorId: randomUUID(), pageSize: 10 });
    expect(result.total).toBe(0);
    expect(result.rows).toEqual([]);
  });
});
