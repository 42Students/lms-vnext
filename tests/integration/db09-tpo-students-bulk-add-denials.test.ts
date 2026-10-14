import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { bulkAddLearnersToDrive } from "@/modules/placements/bulk-drive-service";
import { requirePlacementManageScope } from "@/modules/placements/scope";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = process.env.DB09_ISOLATED_TEST_DATABASE === "1" &&
  Boolean(process.env.TEST_DATABASE_URL);
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });

const tpo: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "db09-tpo-student-bulk-add",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["TPO"],
  },
};
const input = () => ({
  confirmed: true as const,
  roleOptionId: randomUUID(),
  membershipIds: [SEED_IDS.learnerCollegeAMembership],
});

afterAll(async () => { await closeDatabaseConnection(); });

describe.skipIf(!enabled)("Students roster bulk-add PostgreSQL authorization", () => {
  it("rejects wrong-role even when it can otherwise manage a college", async () => {
    const wrong: RequestContext = {
      ...tpo,
      membership: { ...tpo.membership!, roles: ["COLLEGE_ADMIN"] },
    };
    await expect(bulkAddLearnersToDrive(wrong, randomUUID(), input()))
      .rejects.toBeInstanceOf(AuthorizationError);
  });

  it("denies foreign college scope and a stale/missing drive", async () => {
    const foreign: RequestContext = {
      ...tpo,
      membership: { ...tpo.membership!, collegeId: SEED_IDS.collegeB },
    };
    await expect(requirePlacementManageScope(foreign, SEED_IDS.collegeA))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(bulkAddLearnersToDrive(tpo, randomUUID(), input()))
      .rejects.toMatchObject({ code: "PLACEMENT_JOB_NOT_FOUND" });
  });

  it("rejects forged tenant fields and missing confirmation before a write", async () => {
    await expect(bulkAddLearnersToDrive(tpo, randomUUID(), {
      ...input(), collegeId: SEED_IDS.collegeB,
    })).rejects.toBeDefined();
    await expect(bulkAddLearnersToDrive(tpo, randomUUID(), {
      ...input(), confirmed: false,
    })).rejects.toBeDefined();
  });
});
