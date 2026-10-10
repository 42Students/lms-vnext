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
import { applyToPlacementJob } from "@/modules/placements/application-service";
import { createPlacementCompany } from "@/modules/placements/company-service";
import {
  createPlacementJob,
  publishPlacementJob,
} from "@/modules/placements/job-service";
import { listLearnerPlacementJobs } from "@/modules/placements/learner-job-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { enableSeedLearnerPlacementAccess } from "../support/w04-placement-access-fixture";

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

const facultyOnly: RequestContext = {
  ...tpoA,
  membership: {
    ...tpoA.membership!,
    roles: ["FACULTY"],
  },
};

async function cleanup() {
  await pool.query(
    "delete from placement_round_results",
  );
  await pool.query(
    "delete from placement_job_round_events",
  );
  await pool.query(
    "delete from placement_job_rounds",
  );
  await pool.query(
    "delete from placement_application_screening_history",
  );
  await pool.query(
    "delete from placement_application_screenings",
  );
  await pool.query(
    "delete from placement_application_status_history",
  );
  await pool.query(
    "delete from placement_applications",
  );
  await pool.query(
    "delete from placement_eligibility_overrides",
  );
  await pool.query(
    "delete from placement_job_eligibility_policies",
  );
  await pool.query(
    "delete from placement_candidate_academic_evidence",
  );
  await pool.query(
    "delete from placement_candidate_preferences",
  );
  await pool.query("delete from placement_jobs");
  await pool.query(
    "delete from placement_company_relationships",
  );
  await pool.query("delete from placement_companies");
}

async function createPublishedJob(
  context: RequestContext,
  collegeId: string,
  companyName: string,
  domain: string,
  title: string,
) {
  const company = await createPlacementCompany(
    context,
    {
      collegeId,
      name: companyName,
      primaryDomain: domain,
    },
  );
  const draft = await createPlacementJob(
    context,
    {
      collegeId,
      companyRelationshipId:
        company.relationship.id,
      title,
      description:
        "Learner placement feed integration role",
      employmentType: "FULL_TIME",
      workMode: "HYBRID",
      locations: ["Hyderabad"],
      minimumAnnualCtcInr: 800000,
      maximumAnnualCtcInr: 1000000,
      applicationMode: "INTERNAL",
    },
  );
  return publishPlacementJob(context, draft.id);
}

beforeEach(async () => {
  await cleanup();
  await enableSeedLearnerPlacementAccess(pool);
});

afterAll(async () => {
  await cleanup();
  await pool.end();
  await closeDatabaseConnection();
});

describe("Learner placement job feed", () => {
  it("shows only published jobs in the learner's active college and carries application state", async () => {
    const collegeAJob =
      await createPublishedJob(
        tpoA,
        SEED_IDS.collegeA,
        "Learner Feed A",
        "learner-feed-a.example",
        "Platform Engineer",
      );
    await createPublishedJob(
      tpoB,
      SEED_IDS.collegeB,
      "Learner Feed B",
      "learner-feed-b.example",
      "Other College Engineer",
    );

    const before =
      await listLearnerPlacementJobs(
        learner,
        new Date("2026-10-04T00:00:00.000Z"),
      );
    expect(before).toHaveLength(1);
    expect(before[0]?.job.id).toBe(
      collegeAJob.id,
    );
    expect(before[0]).toMatchObject({
      application: null,
      deadlinePassed: false,
      canApply: true,
      eligibility: {
        status: "ELIGIBLE",
      },
    });

    const application =
      await applyToPlacementJob(
        learner,
        collegeAJob.id,
        {},
      );
    const after =
      await listLearnerPlacementJobs(
        learner,
      );
    expect(after).toHaveLength(1);
    expect(after[0]?.application).toMatchObject({
      id: application.id,
      status: "SUBMITTED",
      channel: "INTERNAL",
    });
    expect(after[0]?.canApply).toBe(false);
  });

  it("rejects non-learners instead of exposing the learner feed as a generic college read", async () => {
    await expect(
      listLearnerPlacementJobs(facultyOnly),
    ).rejects.toThrow(
      "Missing permission: placements.read",
    );
  });
});
