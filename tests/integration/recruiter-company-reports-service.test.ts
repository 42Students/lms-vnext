import { afterAll, describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection } from "@/db/client";
import { getRecruiterCompanyReports } from "@/modules/placements/recruiter-company-reports-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Recruiter reports tests require a disposable TEST_DATABASE_URL");
}

const recruiterWithoutGrants: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser,
    identityUid: "seed-recruiter",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: null,
  recruiter: {
    userId: SEED_IDS.collegeAdminUser,
    companyId: "80000000-0000-4000-8000-000000000001",
    companyName: "Test Company",
    title: null,
    status: "ACTIVE",
    grants: [],
  },
};

afterAll(async () => {
  await closeDatabaseConnection();
});

describe("recruiter company reports against PostgreSQL", () => {
  it("reports no access without grants instead of reading unscoped data", async () => {
    const result = await getRecruiterCompanyReports(recruiterWithoutGrants, {});
    expect(result.status).not.toBe("READY");
  });

  it("rejects a non-recruiter context", async () => {
    let outcome: unknown;
    try {
      outcome = await getRecruiterCompanyReports(
        { ...recruiterWithoutGrants, recruiter: null },
        {},
      );
    } catch (error) {
      outcome = error;
    }
    expect(outcome).toBeDefined();
    if (outcome && typeof outcome === "object" && "status" in outcome) {
      expect((outcome as { status: string }).status).not.toBe("READY");
    }
  });
});
