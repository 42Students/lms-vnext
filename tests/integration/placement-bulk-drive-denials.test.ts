import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { colleges } from "@/db/schema";
import { closeDatabaseConnection, getDb } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  bulkAddLearnersToDrive,
  listBulkDriveCandidates,
} from "@/modules/placements/bulk-drive-service";
import { requirePlacementManageScope } from "@/modules/placements/scope";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Bulk Add-to-Drive tests require a disposable TEST_DATABASE_URL");
}

const tpo: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser, identityUid: "seed-shared-faculty",
    platformStatus: "ACTIVE", systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeAMembership,
    collegeId: SEED_IDS.collegeA, organizationId: SEED_IDS.organization,
    status: "ACTIVE", roles: ["TPO"],
  },
};
const missingJob = "00000000-0000-4000-8000-000000000099";
const role = "00000000-0000-4000-8000-000000000098";
const learner = "00000000-0000-4000-8000-000000000097";

afterAll(async () => { await closeDatabaseConnection(); });

describe("Bulk Add-to-Drive PostgreSQL denial paths", () => {
  it("confirms the isolated database contains the seeded college", async () => {
    const rows = await getDb().select({ id: colleges.id })
      .from(colleges).where(eq(colleges.id, SEED_IDS.collegeA));
    expect(rows).toHaveLength(1);
  });
  it("denies non-TPO callers, even if they are college admins", async () => {
    const other: RequestContext = {
      ...tpo, membership: { ...tpo.membership!, roles: ["COLLEGE_ADMIN"] },
    };
    await expect(bulkAddLearnersToDrive(other, missingJob, {
      roleOptionId: role, membershipIds: [learner], confirmed: true,
    })).rejects.toBeInstanceOf(AuthorizationError);
    await expect(listBulkDriveCandidates(other, missingJob))
      .rejects.toBeInstanceOf(AuthorizationError);
  });
  it("denies access to another college using persisted scope validation", async () => {
    const foreign: RequestContext = {
      ...tpo,
      membership: { ...tpo.membership!, collegeId: SEED_IDS.collegeB },
    };
    await expect(requirePlacementManageScope(foreign, SEED_IDS.collegeA))
      .rejects.toBeInstanceOf(AuthorizationError);
  });
});
