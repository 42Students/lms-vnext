import { afterAll, describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection } from "@/db/client";
import {
  getTpoStudentsIntelligence,
  listTpoStudentRequests,
} from "@/modules/placements/tpo-students-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("TPO students tests require a disposable TEST_DATABASE_URL");
}

const adminA: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser,
    identityUid: "seed-college-admin",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.collegeAdminMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["COLLEGE_ADMIN"],
  },
};

const learnerA: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser,
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

afterAll(async () => {
  await closeDatabaseConnection();
});

describe("TPO students read services against PostgreSQL", () => {
  it("runs the college-wide intelligence read for the signed-in college", async () => {
    const result = await getTpoStudentsIntelligence(adminA, {
      collegeId: SEED_IDS.collegeA,
    });

    expect(result.collegeId).toBe(SEED_IDS.collegeA);
    expect(result.summary.activeLearners).toBeGreaterThanOrEqual(0);
    expect(result.summary.readinessUnverified).toBe(true);
    expect(result.roster.page).toBe(1);
    expect(Array.isArray(result.branches)).toBe(true);
  });

  it("refuses another college and a learner", async () => {
    await expect(
      getTpoStudentsIntelligence(adminA, {
        collegeId: SEED_IDS.collegeB,
      }),
    ).rejects.toThrow();

    await expect(
      getTpoStudentsIntelligence(learnerA, {
        collegeId: SEED_IDS.collegeA,
      }),
    ).rejects.toThrow();
  });

  it("runs the global student requests read and refuses another college", async () => {
    const result = await listTpoStudentRequests(adminA, {
      collegeId: SEED_IDS.collegeA,
    });

    expect(result.collegeId).toBe(SEED_IDS.collegeA);
    expect(result.summary.total).toBeGreaterThanOrEqual(0);

    await expect(
      listTpoStudentRequests(adminA, {
        collegeId: SEED_IDS.collegeB,
      }),
    ).rejects.toThrow();
  });
});
