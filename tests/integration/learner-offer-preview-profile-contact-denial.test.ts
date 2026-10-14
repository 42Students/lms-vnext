import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getOwnLearnerOfferBrowse } from "@/modules/placements/learner-offers-browse-service";
import { getOwnLearnerAcademicSummary } from "@/modules/people/learner-academic-summary-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { enableSeedLearnerPlacementAccess } from "../support/w04-placement-access-fixture";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Learner preview/contact scope tests need a disposable TEST_DATABASE_URL");
}

const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 });
const learner: RequestContext = {
  user: { id: SEED_IDS.learnerUser, identityUid: "seed-learner", platformStatus: "ACTIVE", systemRoles: [] },
  membership: {
    id: SEED_IDS.learnerCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["LEARNER"],
  },
};
const faculty: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "seed-faculty", platformStatus: "ACTIVE", systemRoles: [] },
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

describe("Learner offer preview / profile contact source tenant denial", () => {
  it("reads only own persisted offers and current own-college academic identity", async () => {
    const offers = await getOwnLearnerOfferBrowse(learner, "all");
    expect(offers.items.every(item => item.offer.applicationId.length > 0)).toBe(true);
    expect(offers.counts.all).toBe(offers.items.length);
    const profile = await getOwnLearnerAcademicSummary(learner);
    expect(profile.title.length).toBeGreaterThan(0);
  });

  it("denies faculty and forged roles through both source services", async () => {
    const forged: RequestContext = {
      ...faculty, membership: { ...faculty.membership!, roles: ["LEARNER"] },
    };
    for (const context of [faculty, forged]) {
      await expect(getOwnLearnerOfferBrowse(context, "all"))
        .rejects.toBeInstanceOf(AuthorizationError);
      await expect(getOwnLearnerAcademicSummary(context))
        .rejects.toBeInstanceOf(AuthorizationError);
    }
  });

  it("denies cross-college claims and swapped signed-in principals", async () => {
    const wrongCollege: RequestContext = {
      ...learner, membership: { ...learner.membership!, collegeId: SEED_IDS.collegeB },
    };
    const wrongUser: RequestContext = {
      ...learner, user: { ...learner.user, id: SEED_IDS.facultyUser },
    };
    for (const context of [wrongCollege, wrongUser]) {
      await expect(getOwnLearnerOfferBrowse(context, "all"))
        .rejects.toBeInstanceOf(AuthorizationError);
      await expect(getOwnLearnerAcademicSummary(context))
        .rejects.toBeInstanceOf(AuthorizationError);
    }
  });
});
