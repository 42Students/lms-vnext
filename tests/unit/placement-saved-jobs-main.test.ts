import { describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import {
  isSavedPlacementJobVisible,
  listOwnPlacementSavedJobs,
  saveOwnPlacementJob,
  unsaveOwnPlacementJob,
} from "@/modules/placements/saved-job-service";

const jobId = "64000000-0000-4000-8000-000000000001";
const nonLearner: RequestContext = {
  user: {
    id: "30000000-0000-4000-8000-000000000003",
    identityUid: "db08-manager",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: "40000000-0000-4000-8000-000000000002",
    collegeId: "20000000-0000-4000-8000-000000000001",
    organizationId: "10000000-0000-4000-8000-000000000001",
    status: "ACTIVE",
    roles: ["TPO"],
  },
};

describe("DB19-P21 saved bookmark disclosure policy", () => {
  const history = {
    jobStatus: "CLOSED",
    legacyWasDeleted: null,
    legacyVisibilityType: null,
  };
  it("keeps legitimate closed, expired and archived bookmarks historical", () => {
    for (const jobStatus of ["CLOSED", "CANCELLED", "ARCHIVED", "EXPIRED"]) {
      expect(isSavedPlacementJobVisible({ ...history, jobStatus }, false))
        .toBe(true);
    }
  });
  it("does not reveal deleted or external-only bookmarks, even after closure", () => {
    expect(isSavedPlacementJobVisible({
      ...history, legacyWasDeleted: true,
    }, true)).toBe(false);
    expect(isSavedPlacementJobVisible({
      ...history, legacyVisibilityType: "EXTERNAL_ONLY",
    }, true)).toBe(false);
    expect(isSavedPlacementJobVisible({
      ...history, jobStatus: "PUBLISHED", legacyWasDeleted: true,
    }, true)).toBe(false);
  });
  it("requires current authorization for a published bookmark", () => {
    const published = {...history, jobStatus: "PUBLISHED"};
    expect(isSavedPlacementJobVisible(published, false)).toBe(false);
    expect(isSavedPlacementJobVisible(published, true)).toBe(true);
    expect(isSavedPlacementJobVisible({...history, jobStatus: "DRAFT"}, true))
      .toBe(false);
  });
});

describe("DB08 main saved-job guardrails (no database required)", () => {
  it("denies manager or TPO impersonation before any database operation", async () => {
    await expect(saveOwnPlacementJob(nonLearner, jobId))
      .rejects.toThrow("Missing permission: placements.read");
    await expect(unsaveOwnPlacementJob(nonLearner, jobId))
      .rejects.toThrow("Missing permission: placements.read");
    await expect(listOwnPlacementSavedJobs(nonLearner))
      .rejects.toThrow("Missing permission: placements.read");
  });

  it("denies invalid bookmark IDs before querying learner data", async () => {
    await expect(saveOwnPlacementJob(nonLearner, "not-a-uuid"))
      .rejects.toThrow();
    await expect(unsaveOwnPlacementJob(nonLearner, "not-a-uuid"))
      .rejects.toThrow();
  });
});
