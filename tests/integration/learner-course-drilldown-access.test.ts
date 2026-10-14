import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  getOwnLearnerCourseAttendanceHistory,
  getOwnLearnerCourseProgressBreakdown,
} from "@/modules/courses/learner-course-drilldown-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Course drilldown integration tests require disposable TEST_DATABASE_URL");
}

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

afterAll(async () => {
  await closeDatabaseConnection();
});

describe("Learner-owned course progress and attendance read denials", () => {
  const unknown = randomUUID();

  it("returns not-found data for unknown deliveries without cross-tenant search", async () => {
    await expect(getOwnLearnerCourseProgressBreakdown(learner, unknown))
      .resolves.toBeNull();
    await expect(getOwnLearnerCourseAttendanceHistory(learner, unknown))
      .resolves.toBeNull();
  });
  it("denies same-college Faculty from both Learner-only readers", async () => {
    await expect(getOwnLearnerCourseProgressBreakdown(faculty, unknown))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(getOwnLearnerCourseAttendanceHistory(faculty, unknown))
      .rejects.toBeInstanceOf(AuthorizationError);
  });
  it("rejects role claims that do not exist in persisted membership roles", async () => {
    const forged: RequestContext = {
      ...faculty,
      membership: { ...faculty.membership!, roles: ["LEARNER"] },
    };
    await expect(getOwnLearnerCourseProgressBreakdown(forged, unknown))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(getOwnLearnerCourseAttendanceHistory(forged, unknown))
      .rejects.toBeInstanceOf(AuthorizationError);
  });
  it("denies forged college and signed-in identity despite valid learner membership", async () => {
    const cases: RequestContext[] = [
      {
        ...learner,
        membership: { ...learner.membership!, collegeId: SEED_IDS.collegeB },
      },
      {
        ...learner,
        user: { ...learner.user, id: SEED_IDS.facultyUser },
      },
    ];
    for (const context of cases) {
      await expect(getOwnLearnerCourseProgressBreakdown(context, unknown))
        .rejects.toBeInstanceOf(AuthorizationError);
      await expect(getOwnLearnerCourseAttendanceHistory(context, unknown))
        .rejects.toBeInstanceOf(AuthorizationError);
    }
  });
  it("validates delivery UUID at the service boundary", async () => {
    await expect(getOwnLearnerCourseProgressBreakdown(learner, "not-a-uuid"))
      .rejects.toBeDefined();
    await expect(getOwnLearnerCourseAttendanceHistory(learner, "not-a-uuid"))
      .rejects.toBeDefined();
  });
});
