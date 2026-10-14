import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection } from "@/db/client";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getTpoDriveCloseout } from "@/modules/placements/tpo-drive-closeout-service";
import {
  getTpoCandidateScheduleReadiness,
} from "@/modules/placements/tpo-candidate-schedule-service";
import { listPlacementJobOffers } from "@/modules/placements/offer-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = process.env.DB09_ISOLATED_TEST_DATABASE === "1" &&
  Boolean(process.env.TEST_DATABASE_URL);
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });

const tpo: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "tpo-closeout-denial",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.facultyCollegeAMembership,
    collegeId: SEED_IDS.collegeA, organizationId: SEED_IDS.organization,
    status: "ACTIVE", roles: ["TPO"] },
};

describe.skipIf(!enabled)("TPO closeout and candidate schedule college boundaries", () => {
  afterAll(async () => { await closeDatabaseConnection(); });

  it("rejects a non-TPO role before any source is returned", async () => {
    const denied: RequestContext = {
      ...tpo, membership: { ...tpo.membership!, roles: ["LEARNER"] },
    };
    await expect(getTpoDriveCloseout(denied, randomUUID()))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(getTpoCandidateScheduleReadiness(denied, randomUUID()))
      .rejects.toBeInstanceOf(AuthorizationError);
  });

  it("does not return a foreign or unknown drive", async () => {
    await expect(getTpoDriveCloseout(tpo, randomUUID()))
      .rejects.toMatchObject({ code: "PLACEMENT_JOB_NOT_FOUND" });
    await expect(getTpoCandidateScheduleReadiness(tpo, randomUUID()))
      .rejects.toMatchObject({ code: "PLACEMENT_JOB_NOT_FOUND" });
    const otherCollege: RequestContext = {
      ...tpo, membership: { ...tpo.membership!, collegeId: SEED_IDS.collegeB },
    };
    await expect(getTpoDriveCloseout(otherCollege, randomUUID()))
      .rejects.toBeDefined();
    await expect(getTpoCandidateScheduleReadiness(otherCollege, randomUUID()))
      .rejects.toBeDefined();
  });

  it("rejects malformed job inputs, rather than inventing an empty history", async () => {
    await expect(getTpoDriveCloseout(tpo, "not-a-uuid")).rejects.toBeDefined();
    await expect(getTpoCandidateScheduleReadiness(tpo, "not-a-uuid"))
      .rejects.toBeDefined();
  });

  it("existing offer readers cannot expose a nonexistent job", async () => {
    await expect(listPlacementJobOffers(tpo, randomUUID()))
      .rejects.toMatchObject({ code: "PLACEMENT_JOB_NOT_FOUND" });
  });
});
