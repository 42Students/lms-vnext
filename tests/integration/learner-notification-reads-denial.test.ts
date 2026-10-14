import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getOwnLearnerNotificationHistory } from "@/modules/activity/learner-notification-history-service";
import { getOwnLearnerPlacementAlerts } from "@/modules/placements/learner-placement-alerts-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { enableSeedLearnerPlacementAccess } from "../support/w04-placement-access-fixture";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Learner notification denial tests require disposable TEST_DATABASE_URL");
}
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 });

const learner: RequestContext = {
  user: {
    id: SEED_IDS.learnerUser, identityUid: "seed-learner",
    platformStatus: "ACTIVE", systemRoles: [],
  },
  membership: {
    id: SEED_IDS.learnerCollegeAMembership,
    organizationId: SEED_IDS.organization,
    collegeId: SEED_IDS.collegeA,
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
    organizationId: SEED_IDS.organization,
    collegeId: SEED_IDS.collegeA,
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

describe("Learner notification history and placement alerts DB boundaries", () => {
  it("reads only the authenticated recipient's real notifications (or honest empties)", async () => {
    const history = await getOwnLearnerNotificationHistory(learner, {});
    expect(history.items.every((row) => row.notification.userId === learner.user.id)).toBe(true);
    const alerts = await getOwnLearnerPlacementAlerts(learner);
    expect(Array.isArray(alerts)).toBe(true);
    expect(alerts.length).toBeLessThanOrEqual(8);
  });

  it("denies same-college faculty and forged learner role claims", async () => {
    const forged: RequestContext = {
      ...faculty,
      membership: { ...faculty.membership!, roles: ["LEARNER"] },
    };
    for (const context of [faculty, forged]) {
      await expect(getOwnLearnerNotificationHistory(context, {}))
        .rejects.toBeInstanceOf(AuthorizationError);
      await expect(getOwnLearnerPlacementAlerts(context))
        .rejects.toBeInstanceOf(AuthorizationError);
    }
  });

  it("denies cross-college context and swapped signed-in user", async () => {
    const crossed: RequestContext = {
      ...learner,
      membership: { ...learner.membership!, collegeId: SEED_IDS.collegeB },
    };
    const swapped: RequestContext = {
      ...learner,
      user: { ...learner.user, id: SEED_IDS.facultyUser },
    };
    for (const context of [crossed, swapped]) {
      await expect(getOwnLearnerNotificationHistory(context, {}))
        .rejects.toBeInstanceOf(AuthorizationError);
      await expect(getOwnLearnerPlacementAlerts(context))
        .rejects.toBeInstanceOf(AuthorizationError);
    }
  });

  it("rejects malformed cursors before querying rows", async () => {
    await expect(getOwnLearnerNotificationHistory(learner, {
      beforeAt: "2026-10-14T00:00:00Z",
    })).rejects.toBeDefined();
    await expect(getOwnLearnerNotificationHistory(learner, {
      userId: SEED_IDS.facultyUser,
    })).rejects.toBeDefined();
  });
});
