import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getOwnLearnerAcademicSummary } from "@/modules/people/learner-academic-summary-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Academic summary DB denial tests require disposable TEST_DATABASE_URL");
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

describe("Learner academic identity real PostgreSQL membership denial", () => {
  it("uses only current own college enrollment or an explicit empty state", async () => {
    const summary = await getOwnLearnerAcademicSummary(learner);
    expect(summary.title.length).toBeGreaterThan(0);
    if (summary.enrollment) {
      expect(summary.enrollment.program.length).toBeGreaterThan(0);
    }
  });

  it("rejects non-learners even when signed into the same college", async () => {
    await expect(getOwnLearnerAcademicSummary(faculty))
      .rejects.toBeInstanceOf(AuthorizationError);
  });

  it("rejects a forged learner role on an actual Faculty membership", async () => {
    const forged: RequestContext = {
      ...faculty,
      membership: { ...faculty.membership!, roles: ["LEARNER"] },
    };
    await expect(getOwnLearnerAcademicSummary(forged))
      .rejects.toBeInstanceOf(AuthorizationError);
  });

  it("rejects cross-college membership claims and swapped signed-in users", async () => {
    const crossed: RequestContext = {
      ...learner,
      membership: { ...learner.membership!, collegeId: SEED_IDS.collegeB },
    };
    const swapped: RequestContext = {
      ...learner,
      user: { ...learner.user, id: SEED_IDS.facultyUser },
    };
    await expect(getOwnLearnerAcademicSummary(crossed))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(getOwnLearnerAcademicSummary(swapped))
      .rejects.toBeInstanceOf(AuthorizationError);
  });

  it("rejects inactive learner membership or disabled principal", async () => {
    const suspended: RequestContext = {
      ...learner,
      membership: { ...learner.membership!, status: "SUSPENDED" },
    };
    const disabled: RequestContext = {
      ...learner,
      user: { ...learner.user, platformStatus: "DISABLED" },
    };
    await expect(getOwnLearnerAcademicSummary(suspended))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(getOwnLearnerAcademicSummary(disabled))
      .rejects.toBeInstanceOf(AuthorizationError);
  });
});
