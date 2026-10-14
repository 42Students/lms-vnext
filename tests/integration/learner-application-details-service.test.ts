import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  getOwnLearnerApplicationCompany,
  getOwnLearnerApplicationHistory,
} from "@/modules/placements/learner-application-detail-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { enableSeedLearnerPlacementAccess } from "../support/w04-placement-access-fixture";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Learner application detail tests require disposable TEST_DATABASE_URL");
}
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 });

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

describe("Learner application history and employer read denial on PostgreSQL", () => {
  const unknown = randomUUID();

  it("returns null, not another membership's data, for unknown application IDs", async () => {
    await expect(getOwnLearnerApplicationHistory(learner, unknown))
      .resolves.toBeNull();
    await expect(getOwnLearnerApplicationCompany(learner, unknown))
      .resolves.toBeNull();
  });

  it("rejects a faculty member from both reads", async () => {
    await expect(getOwnLearnerApplicationHistory(faculty, unknown))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(getOwnLearnerApplicationCompany(faculty, unknown))
      .rejects.toBeInstanceOf(AuthorizationError);
  });

  it("rejects forged membership-role claims not backed by persisted roles", async () => {
    const forged: RequestContext = {
      ...faculty,
      membership: {
        ...faculty.membership!,
        roles: ["LEARNER"],
      },
    };
    await expect(getOwnLearnerApplicationHistory(forged, unknown))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(getOwnLearnerApplicationCompany(forged, unknown))
      .rejects.toBeInstanceOf(AuthorizationError);
  });

  it("rejects a forged college scope on an otherwise real learner", async () => {
    const forged: RequestContext = {
      ...learner,
      membership: {
        ...learner.membership!,
        collegeId: SEED_IDS.collegeB,
      },
    };
    await expect(getOwnLearnerApplicationHistory(forged, unknown))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(getOwnLearnerApplicationCompany(forged, unknown))
      .rejects.toBeInstanceOf(AuthorizationError);
  });

  it("rejects forged signed-in user identity against a real membership", async () => {
    const forged: RequestContext = {
      ...learner,
      user: { ...learner.user, id: SEED_IDS.facultyUser },
    };
    await expect(getOwnLearnerApplicationHistory(forged, unknown))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(getOwnLearnerApplicationCompany(forged, unknown))
      .rejects.toBeInstanceOf(AuthorizationError);
  });
});
