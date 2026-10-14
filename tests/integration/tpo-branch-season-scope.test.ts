import { afterAll, describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection } from "@/db/client";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getTpoBranchSeasonDashboard } from "@/modules/placements/tpo-branch-season-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = process.env.DB12_ISOLATED_TEST_DATABASE === "1" &&
  Boolean(process.env.TEST_DATABASE_URL);
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });

const tpo: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser, identityUid: "tpo-branch-season-test",
    platformStatus: "ACTIVE", systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeAMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["TPO"],
  },
};

describe.skipIf(!enabled)("TPO branch-season reader against disposable PostgreSQL", () => {
  afterAll(closeDatabaseConnection);
  it("only resolves the signed-in college season with honest unknowns", async () => {
    const result = await getTpoBranchSeasonDashboard(tpo, {
      seasonId: SEED_IDS.placementSeasonA,
    });
    expect(result.season?.id).toBe(SEED_IDS.placementSeasonA);
    expect(result.rows.every((row) =>
      row.registered !== null || result.registrationAvailable,
    )).toBe(true);
  });
  it("denies foreign season, wrong role and inactive membership", async () => {
    await expect(getTpoBranchSeasonDashboard(tpo, {
      seasonId: SEED_IDS.placementSeasonB,
    })).rejects.toMatchObject({ code: "PLACEMENT_SEASON_NOT_FOUND" });
    await expect(getTpoBranchSeasonDashboard({
      ...tpo, membership: { ...tpo.membership!, roles: ["COLLEGE_ADMIN"] },
    }, {})).rejects.toBeInstanceOf(AuthorizationError);
    await expect(getTpoBranchSeasonDashboard({
      ...tpo, membership: { ...tpo.membership!, status: "SUSPENDED" },
    }, {})).rejects.toBeInstanceOf(AuthorizationError);
  });
});
