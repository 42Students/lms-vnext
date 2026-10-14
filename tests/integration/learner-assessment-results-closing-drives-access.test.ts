import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";

import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getOwnLearnerAssessmentResults } from "@/modules/placements/learner-assessment-results-service";
import { getOwnLearnerDriveBrowse } from "@/modules/placements/learner-closing-drives-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { enableSeedLearnerPlacementAccess } from "../support/w04-placement-access-fixture";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("These tests require a disposable TEST_DATABASE_URL");
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

describe("Learner assessment results and drive browse boundaries on PostgreSQL", () => {
  it("returns only own persisted results and published drives (or honest empties)", async () => {
    const results = await getOwnLearnerAssessmentResults(learner, "all");
    expect(results.view).toBe("all");
    expect(results.counts.all).toBe(results.items.length);
    expect(results.items.every((item) => item.appliedAt instanceof Date)).toBe(true);
    const drives = await getOwnLearnerDriveBrowse(
      learner,
      new Date("2026-10-14T00:00:00Z"),
    );
    expect(drives.snapshotNowIso).toBe("2026-10-14T00:00:00.000Z");
    expect(Array.isArray(drives.rows)).toBe(true);
    expect(drives.rows.every((row) => row.job.collegeId === SEED_IDS.collegeA)).toBe(true);
  });

  it("denies same-college Faculty/TPO callers", async () => {
    await expect(getOwnLearnerAssessmentResults(faculty))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(getOwnLearnerDriveBrowse(faculty))
      .rejects.toBeInstanceOf(AuthorizationError);
  });

  it("denies forged role claims not backed by persisted membership roles", async () => {
    const forged: RequestContext = {
      ...faculty,
      membership: { ...faculty.membership!, roles: ["LEARNER"] },
    };
    await expect(getOwnLearnerAssessmentResults(forged))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(getOwnLearnerDriveBrowse(forged))
      .rejects.toBeInstanceOf(AuthorizationError);
  });

  it("denies a valid learner with a forged college ID or signed-in user", async () => {
    const crossed: RequestContext = {
      ...learner,
      membership: { ...learner.membership!, collegeId: SEED_IDS.collegeB },
    };
    const wrongUser: RequestContext = {
      ...learner,
      user: { ...learner.user, id: SEED_IDS.facultyUser },
    };
    for (const context of [crossed, wrongUser]) {
      await expect(getOwnLearnerAssessmentResults(context))
        .rejects.toBeInstanceOf(AuthorizationError);
      await expect(getOwnLearnerDriveBrowse(context))
        .rejects.toBeInstanceOf(AuthorizationError);
    }
  });

  it("rejects unknown results-view query values before reading persistence", async () => {
    await expect(getOwnLearnerAssessmentResults(learner, "another-person"))
      .rejects.toBeDefined();
  });
});
