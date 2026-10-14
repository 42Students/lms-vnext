import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getOwnLearnerPlacementRulesView } from "@/modules/placements/learner-placement-rules-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { enableSeedLearnerPlacementAccess } from "../support/w04-placement-access-fixture";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Placement Rules integration tests require disposable TEST_DATABASE_URL");
}

const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 });
const learner: RequestContext = {
  user: {
    id: SEED_IDS.learnerUser, identityUid: "seed-learner",
    platformStatus: "ACTIVE", systemRoles: [],
  },
  membership: {
    id: SEED_IDS.learnerCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["LEARNER"],
  },
};
const faculty: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser, identityUid: "seed-faculty",
    platformStatus: "ACTIVE", systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["FACULTY"],
  },
};
beforeAll(async () => { await enableSeedLearnerPlacementAccess(pool); });
afterAll(async () => { await pool.end(); await closeDatabaseConnection(); });

describe("Learner Placement Rules authenticated PostgreSQL denials", () => {
  it("returns only already authorized evidence and preferences or honest empties", async () => {
    const result = await getOwnLearnerPlacementRulesView(learner, {});
    expect(result.preparation.criteria).toHaveLength(5);
    expect(result.preparation.totalCount).toBe(5);
    expect(result.back.href).toBe("/learn/my-placements");
  });
  it("rejects a same-college faculty member and forged learner role", async () => {
    const forged: RequestContext = {
      ...faculty,
      membership: { ...faculty.membership!, roles: ["LEARNER"] },
    };
    for (const context of [faculty, forged]) {
      await expect(getOwnLearnerPlacementRulesView(context, {}))
        .rejects.toBeInstanceOf(AuthorizationError);
    }
  });
  it("rejects cross-college membership claims and swapped account principals", async () => {
    const otherCollege: RequestContext = {
      ...learner, membership: { ...learner.membership!, collegeId: SEED_IDS.collegeB },
    };
    const swappedUser: RequestContext = {
      ...learner, user: { ...learner.user, id: SEED_IDS.facultyUser },
    };
    for (const context of [otherCollege, swappedUser]) {
      await expect(getOwnLearnerPlacementRulesView(context, {}))
        .rejects.toBeInstanceOf(AuthorizationError);
    }
  });
  it("rejects suspended membership and disabled principal before any evidence is read", async () => {
    const suspended: RequestContext = {
      ...learner, membership: { ...learner.membership!, status: "SUSPENDED" },
    };
    const disabled: RequestContext = {
      ...learner, user: { ...learner.user, platformStatus: "DISABLED" },
    };
    for (const context of [suspended, disabled]) {
      await expect(getOwnLearnerPlacementRulesView(context, {}))
        .rejects.toBeInstanceOf(AuthorizationError);
    }
  });

  it("rejects invalid query input before reading any membership evidence", async () => {
    await expect(getOwnLearnerPlacementRulesView(learner, { from: "javascript:alert(1)" }))
      .rejects.toBeDefined();
    await expect(getOwnLearnerPlacementRulesView(learner, { userId: SEED_IDS.facultyUser }))
      .rejects.toBeDefined();
  });
});
