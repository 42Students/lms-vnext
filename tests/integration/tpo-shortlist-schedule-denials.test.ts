import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getTpoScheduleConflicts } from "@/modules/placements/tpo-schedule-conflicts-service";
import { getTpoDriveShortlist } from "@/modules/placements/tpo-shortlist-service";
import { requirePlacementManageScope } from "@/modules/placements/scope";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("TPO scheduling and shortlist tests require disposable TEST_DATABASE_URL");
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

afterAll(async () => { await closeDatabaseConnection(); });

describe("TPO schedule and shortlist database authorization", () => {
  it("refuses a college-admin-only membership even for a seeded college", async () => {
    const admin: RequestContext = {
      ...tpo, membership: { ...tpo.membership!, roles: ["COLLEGE_ADMIN"] },
    };
    await expect(getTpoScheduleConflicts(admin, {}))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(getTpoDriveShortlist(admin, { jobId: randomUUID() }))
      .rejects.toBeInstanceOf(AuthorizationError);
  });

  it("returns the same not-found error for unknown and foreign job IDs", async () => {
    await expect(getTpoDriveShortlist(tpo, { jobId: randomUUID() }))
      .rejects.toMatchObject({ code: "PLACEMENT_JOB_NOT_FOUND" });
  });

  it("does not authorize mismatched college scope", async () => {
    const foreign: RequestContext = {
      ...tpo, membership: { ...tpo.membership!, collegeId: SEED_IDS.collegeB },
    };
    await expect(requirePlacementManageScope(foreign, SEED_IDS.collegeA))
      .rejects.toBeInstanceOf(AuthorizationError);
  });

  it("blocks cross-college and non-TPO reads before showing inline warnings/shortlist", async () => {
    const foreign: RequestContext = {
      ...tpo,
      membership: { ...tpo.membership!, collegeId: SEED_IDS.collegeB },
    };
    await expect(requirePlacementManageScope(foreign, SEED_IDS.collegeA))
      .rejects.toBeInstanceOf(AuthorizationError);
    const withoutRole: RequestContext = {
      ...tpo,
      membership: { ...tpo.membership!, roles: ["LEARNER"] },
    };
    await expect(getTpoScheduleConflicts(withoutRole, { days: 90 }))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(getTpoDriveShortlist(withoutRole, { jobId: randomUUID() }))
      .rejects.toBeInstanceOf(AuthorizationError);
  });

  it("returns a bounded tenant-owned schedule projection", async () => {
    const result = await getTpoScheduleConflicts(tpo, { days: 7 },
      new Date("2026-10-14T00:00:00.000Z"));
    expect(result.days).toBe(7);
    expect(result.totalScheduled).toBeGreaterThanOrEqual(0);
    expect(result.assessedCount).toBeLessThanOrEqual(result.totalScheduled);
  });
});
