import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getOwnLearnerOfferBrowse } from "@/modules/placements/learner-offers-browse-service";
import { getLearnerPlacementJourneyWithActivity } from "@/modules/placements/learner-recent-placement-activity-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { enableSeedLearnerPlacementAccess } from "../support/w04-placement-access-fixture";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Learner offers and activity tests require disposable TEST_DATABASE_URL");
}

const pool = new Pool({
  connectionString: process.env.TEST_DATABASE_URL,
  max: 1,
});

const learner: RequestContext = {
  user: {
    id: SEED_IDS.learnerUser,
    identityUid: "seed-learner",
    platformStatus: "ACTIVE",
    systemRoles: [],
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
    id: SEED_IDS.facultyUser,
    identityUid: "seed-faculty",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["FACULTY"],
  },
};

beforeAll(async () => {
  await enableSeedLearnerPlacementAccess(pool);
});

afterAll(async () => {
  await pool.end();
  await closeDatabaseConnection();
});

describe("Own learner offers and activity PostgreSQL scopes", () => {
  it("reads only valid own-member records (or honest empties) from registered tables", async () => {
    const offers = await getOwnLearnerOfferBrowse(learner, "all");
    expect(offers.view).toBe("all");
    expect(offers.counts.all).toBe(offers.items.length);
    const journey = await getLearnerPlacementJourneyWithActivity(learner);
    expect(Array.isArray(journey.rows)).toBe(true);
    expect(Array.isArray(journey.activity)).toBe(true);
    expect(journey.activity.length).toBeLessThanOrEqual(8);
  });

  it("rejects a same-college faculty member from both reads", async () => {
    await expect(getOwnLearnerOfferBrowse(faculty))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(getLearnerPlacementJourneyWithActivity(faculty))
      .rejects.toBeInstanceOf(AuthorizationError);
  });

  it("rejects a forged learner role on a faculty membership", async () => {
    const forged: RequestContext = {
      ...faculty,
      membership: { ...faculty.membership!, roles: ["LEARNER"] },
    };
    await expect(getOwnLearnerOfferBrowse(forged))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(getLearnerPlacementJourneyWithActivity(forged))
      .rejects.toBeInstanceOf(AuthorizationError);
  });

  it("rejects a forged college on a genuine learner membership", async () => {
    const forged: RequestContext = {
      ...learner,
      membership: { ...learner.membership!, collegeId: SEED_IDS.collegeB },
    };
    await expect(getOwnLearnerOfferBrowse(forged))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(getLearnerPlacementJourneyWithActivity(forged))
      .rejects.toBeInstanceOf(AuthorizationError);
  });

  it("rejects a swapped signed-in user on the learner membership", async () => {
    const forged: RequestContext = {
      ...learner,
      user: { ...learner.user, id: SEED_IDS.facultyUser },
    };
    await expect(getOwnLearnerOfferBrowse(forged))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(getLearnerPlacementJourneyWithActivity(forged))
      .rejects.toBeInstanceOf(AuthorizationError);
  });

  it("rejects unsupported status query input through Zod", async () => {
    await expect(getOwnLearnerOfferBrowse(learner, "not-a-real-view"))
      .rejects.toBeDefined();
  });
});
