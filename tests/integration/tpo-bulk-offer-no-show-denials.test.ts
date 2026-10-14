import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection } from "@/db/client";
import { AuthorizationError } from "@/modules/permissions/policy";
import { bulkWithdrawPlacementOffers } from "@/modules/placements/bulk-offer-withdrawal-service";
import { getTpoRoundDriveDay } from "@/modules/placements/tpo-round-drive-day-service";
import { requirePlacementManageScope } from "@/modules/placements/scope";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("TPO bulk offer withdrawal denials require disposable TEST_DATABASE_URL");
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

function payload(id: string) {
  return {
    confirmed: true,
    reason: "Company has cancelled the role",
    offers: [{ id, expectedStatus: "ISSUED" }],
  };
}

afterAll(async () => { await closeDatabaseConnection(); });

describe("TPO bulk withdrawal and no-show PostgreSQL denial paths", () => {
  it("rejects college admins and learners without a TPO role", async () => {
    for (const roles of [["COLLEGE_ADMIN"], ["LEARNER"]] as const) {
      const other: RequestContext = {
        ...tpo,
        membership: { ...tpo.membership!, roles },
      };
      await expect(bulkWithdrawPlacementOffers(
        other, randomUUID(), payload(randomUUID()),
      )).rejects.toBeInstanceOf(AuthorizationError);
    }
  });

  it("hides an unknown or foreign drive before inspecting offer IDs", async () => {
    await expect(bulkWithdrawPlacementOffers(
      tpo, randomUUID(), payload(randomUUID()),
    )).rejects.toMatchObject({ code: "PLACEMENT_JOB_NOT_FOUND" });
    const foreign: RequestContext = {
      ...tpo,
      membership: { ...tpo.membership!, collegeId: SEED_IDS.collegeB },
    };
    await expect(requirePlacementManageScope(
      foreign, SEED_IDS.collegeA,
    )).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("does not reveal a nonexistent round through the authorized no-show source", async () => {
    await expect(getTpoRoundDriveDay(tpo, randomUUID()))
      .rejects.toMatchObject({ code: "PLACEMENT_ROUND_NOT_FOUND" });
    const noTpo: RequestContext = {
      ...tpo,
      membership: { ...tpo.membership!, roles: ["COLLEGE_ADMIN"] },
    };
    await expect(getTpoRoundDriveDay(noTpo, randomUUID()))
      .rejects.toBeInstanceOf(AuthorizationError);
  });
});
