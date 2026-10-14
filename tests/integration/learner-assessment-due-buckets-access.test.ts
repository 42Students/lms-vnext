import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getOwnLearnerAssessmentBrowse } from "@/modules/placements/learner-assessment-browse-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { enableSeedLearnerPlacementAccess } from "../support/w04-placement-access-fixture";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Assessment due-bucket denial tests require disposable TEST_DATABASE_URL");
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
    status: "ACTIVE", roles: ["LEARNER"],
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
    status: "ACTIVE", roles: ["FACULTY"],
  },
};

beforeAll(async () => { await enableSeedLearnerPlacementAccess(pool); });
afterAll(async () => { await pool.end(); await closeDatabaseConnection(); });

describe("Own learner assessment scheduled rounds DB access", () => {
  it("reads only own application rounds, or an honest zero-record view", async () => {
    const bundle = await getOwnLearnerAssessmentBrowse(learner);
    expect(Array.isArray(bundle.rounds)).toBe(true);
    expect(bundle.rounds.every((row) => typeof row.applicationId === "string")).toBe(true);
  });
  it("denies faculty and forged learner role despite same-college access", async () => {
    const forged: RequestContext = {
      ...faculty, membership: { ...faculty.membership!, roles: ["LEARNER"] },
    };
    for (const context of [faculty, forged]) {
      await expect(getOwnLearnerAssessmentBrowse(context))
        .rejects.toBeInstanceOf(AuthorizationError);
    }
  });
  it("denies cross-college contexts, user swaps, and inactive accounts", async () => {
    const cross: RequestContext = {
      ...learner, membership: { ...learner.membership!, collegeId: SEED_IDS.collegeB },
    };
    const swap: RequestContext = {
      ...learner, user: { ...learner.user, id: SEED_IDS.facultyUser },
    };
    const disabled: RequestContext = {
      ...learner, user: { ...learner.user, platformStatus: "DISABLED" },
    };
    for (const context of [cross, swap, disabled]) {
      await expect(getOwnLearnerAssessmentBrowse(context))
        .rejects.toBeInstanceOf(AuthorizationError);
    }
  });
});
