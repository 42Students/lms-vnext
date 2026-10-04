import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { createPlacementCompany } from "@/modules/placements/company-service";
import {
  getJobEligibilityPolicy,
  upsertJobEligibilityPolicy,
} from "@/modules/placements/eligibility-service";
import {
  createPlacementJob,
  getPlacementJob,
} from "@/modules/placements/job-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

const databaseUrl =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL or DATABASE_URL is required for DB integration tests",
  );
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
});

const tpoA: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "seed-shared-faculty",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["FACULTY", "TPO"],
  },
};

const tpoB: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "seed-shared-faculty",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeBMembership,
    collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["FACULTY", "TPO"],
  },
};

async function cleanup() {
  await pool.query(
    "delete from placement_job_eligibility_policies",
  );
  await pool.query("delete from placement_jobs");
  await pool.query(
    "delete from placement_company_relationships",
  );
  await pool.query("delete from placement_companies");
}

async function createDraft() {
  const company = await createPlacementCompany(
    tpoA,
    {
      collegeId: SEED_IDS.collegeA,
      name: "Draft Edit Systems",
      primaryDomain: "draft-edit.example",
    },
  );

  return createPlacementJob(tpoA, {
    collegeId: SEED_IDS.collegeA,
    companyRelationshipId:
      company.relationship.id,
    title: "Draft Engineer",
    description:
      "Draft edit integration role",
    employmentType: "FULL_TIME",
    workMode: "HYBRID",
    applicationMode: "INTERNAL",
  });
}

beforeEach(async () => {
  await cleanup();
});

afterAll(async () => {
  await cleanup();
  await pool.end();
  await closeDatabaseConnection();
});

describe("Placement draft edit reads", () => {
  it("returns normalized policy values for the tenant-scoped draft editor", async () => {
    const job = await createDraft();

    const defaultPolicy =
      await getJobEligibilityPolicy(
        tpoA,
        job.id,
      );
    expect(defaultPolicy).toMatchObject({
      jobId: job.id,
      allowedProgramIds: [],
      allowedCohortIds: [],
      minCgpa: null,
      missingEvidencePolicy:
        "ALLOW_WITH_FLAG",
    });

    await upsertJobEligibilityPolicy(
      tpoA,
      job.id,
      {
        minCgpa: 7.25,
        maxActiveBacklogs: 1,
        minTenthPercentage: 60.5,
        minTwelfthPercentage: 61.25,
        maxGapYears: 2,
        allowedPassingYears: [2026, 2027],
        missingEvidencePolicy:
          "REQUIRE_COMPLETE",
      },
    );

    const [loadedJob, policy] =
      await Promise.all([
        getPlacementJob(tpoA, job.id),
        getJobEligibilityPolicy(
          tpoA,
          job.id,
        ),
      ]);

    expect(loadedJob).toMatchObject({
      id: job.id,
      collegeId: SEED_IDS.collegeA,
      status: "DRAFT",
      title: "Draft Engineer",
    });
    expect(policy).toMatchObject({
      allowedProgramIds: [],
      allowedCohortIds: [],
      minCgpa: 7.25,
      maxActiveBacklogs: 1,
      minTenthPercentage: 60.5,
      minTwelfthPercentage: 61.25,
      maxGapYears: 2,
      allowedPassingYears: [2026, 2027],
      missingEvidencePolicy:
        "REQUIRE_COMPLETE",
    });
  });

  it("denies cross-college draft and policy reads", async () => {
    const job = await createDraft();

    await expect(
      getPlacementJob(tpoB, job.id),
    ).rejects.toThrow(
      "Missing permission: placements.manage",
    );
    await expect(
      getJobEligibilityPolicy(
        tpoB,
        job.id,
      ),
    ).rejects.toThrow(
      "Missing permission: placements.manage",
    );
  });
});
