import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import { AuthorizationError } from "@/modules/permissions/policy";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  getTpoStudentPlacementHistory,
} from "@/modules/placements/tpo-student-history-service";
import {
  getTpoRoundDriveDay,
} from "@/modules/placements/tpo-round-drive-day-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("TPO learner history/no-show tests require disposable TEST_DATABASE_URL");
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

describe("TPO learner history and no-show PostgreSQL boundaries", () => {
  it("refuses a non-TPO reader even with college-admin membership", async () => {
    const nonTpo: RequestContext = {
      ...tpo,
      membership: { ...tpo.membership!, roles: ["COLLEGE_ADMIN"] },
    };
    await expect(getTpoStudentPlacementHistory(nonTpo, {
      membershipId: SEED_IDS.learnerCollegeAMembership,
    })).rejects.toBeDefined();
    await expect(getTpoRoundDriveDay(nonTpo, randomUUID())).rejects.toBeDefined();
  });

  it("returns no learner history for unknown membership and denies a forged college scope", async () => {
    await expect(getTpoStudentPlacementHistory(tpo, {
      membershipId: randomUUID(),
    })).resolves.toBeNull();

    const foreign: RequestContext = {
      ...tpo,
      membership: { ...tpo.membership!, collegeId: SEED_IDS.collegeB },
    };
    // The persisted membership belongs to college A, so a context claiming
    // college B is refused before any learner lookup (no existence leak).
    await expect(getTpoStudentPlacementHistory(foreign, {
      membershipId: SEED_IDS.learnerCollegeAMembership,
    })).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("reads only the seeded active college learner with a role", async () => {
    const history = await getTpoStudentPlacementHistory(tpo, {
      membershipId: SEED_IDS.learnerCollegeAMembership,
    });
    expect(history?.learner.membershipId).toBe(SEED_IDS.learnerCollegeAMembership);
    expect(history?.page).toBe(1);
  });

  it("does not reveal missing or foreign round details", async () => {
    await expect(getTpoRoundDriveDay(tpo, randomUUID()))
      .rejects.toMatchObject({ code: "PLACEMENT_ROUND_NOT_FOUND" });
  });
});
