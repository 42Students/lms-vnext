import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  createTpoCompanyFeedback,
  getTpoCompanyFeedback,
} from "@/modules/placements/tpo-company-feedback-service";
import { getTpoJoiningTracker } from "@/modules/placements/tpo-joining-tracker-service";
import { requirePlacementManageScope } from "@/modules/placements/scope";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("TPO feedback and joining denial tests require a disposable TEST_DATABASE_URL");
}

const tpo: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser,
    identityUid: "seed-tpo",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.collegeAdminMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["TPO"],
  },
};

afterAll(async () => { await closeDatabaseConnection(); });

describe("TPO company feedback and joining PostgreSQL boundaries", () => {
  it("refuses a college admin without the TPO role before fetching data", async () => {
    const other: RequestContext = {
      ...tpo,
      membership: { ...tpo.membership!, roles: ["COLLEGE_ADMIN"] },
    };
    await expect(getTpoJoiningTracker(other, { jobId: randomUUID() }))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(getTpoCompanyFeedback(other, { companyId: randomUUID() }))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(createTpoCompanyFeedback(other, randomUUID(), {
      leadId: randomUUID(), note: "A contact meeting note",
    })).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("hides missing or foreign drive/company identifiers", async () => {
    await expect(getTpoJoiningTracker(tpo, { jobId: randomUUID() }))
      .rejects.toMatchObject({ code: "PLACEMENT_JOB_NOT_FOUND" });
    await expect(getTpoCompanyFeedback(tpo, { companyId: randomUUID() }))
      .resolves.toBeNull();
    await expect(createTpoCompanyFeedback(tpo, randomUUID(), {
      leadId: randomUUID(), note: "A contact meeting note",
    })).resolves.toBeNull();
  });

  it("does not permit cross-college placement management", async () => {
    const other: RequestContext = {
      ...tpo,
      membership: { ...tpo.membership!, collegeId: SEED_IDS.collegeB },
    };
    await expect(requirePlacementManageScope(other, SEED_IDS.collegeA))
      .rejects.toBeInstanceOf(AuthorizationError);
  });
});
