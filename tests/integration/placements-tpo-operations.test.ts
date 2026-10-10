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
import { replacePlacementEvaluationConfig } from "@/modules/placements/evaluation-config-service";
import {
  createPlacementJob,
  publishPlacementJob,
} from "@/modules/placements/job-service";
import {
  stagePlacementRoundResult,
} from "@/modules/placements/result-service";
import { actOnPlacementRound } from "@/modules/placements/round-service";
import { decidePlacementScreening } from "@/modules/placements/screening-service";
import { getPlacementTpoOperations } from "@/modules/placements/tpo-operations-service";
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

const tpo: RequestContext = {
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
    roles: ["FACULTY", "MENTOR", "TPO"],
  },
};

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

const otherCollegeTpo: RequestContext = {
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

const roundId =
  "55555555-5555-4555-8555-555555555555";

async function cleanup() {
  await pool.query(
    "delete from in_app_notifications",
  );
  await pool.query(
    "delete from activity_events",
  );
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
  await pool.query("delete from placement_jobs");
  await pool.query(
    "delete from placement_company_relationships",
  );
  await pool.query("delete from placement_companies");
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

describe("Placement TPO operations", () => {
  it("prioritizes cross-job work into one deterministic queue", async () => {
    const company = await createPlacementCompany(
      tpo,
      {
        collegeId: SEED_IDS.collegeA,
        name: "TPO Operations Systems",
        primaryDomain: "tpo-operations.example",
      },
    );

    const driveDraft = await createPlacementJob(
      tpo,
      {
        collegeId: SEED_IDS.collegeA,
        companyRelationshipId:
          company.relationship.id,
        title: "Results Engineer",
        description:
          "Results queue test role",
        employmentType: "FULL_TIME",
        workMode: "HYBRID",
        applicationMode: "INTERNAL",
      },
    );
    await replacePlacementEvaluationConfig(
      tpo,
      driveDraft.id,
      {
        rounds: [
          {
            id: roundId,
            kind: "TEST",
            name: "Aptitude test",
          },
        ],
      },
    );
    const driveJob =
      await publishPlacementJob(
        tpo,
        driveDraft.id,
      );
    const driveApplication =
      await applyToPlacementJob(
        learner,
        driveJob.id,
        {},
      );
    await decidePlacementScreening(
      tpo,
      driveApplication.id,
      {
        decision: "SHORTLISTED",
        candidateMessage:
          "Shortlisted for the drive",
      },
    );
    await actOnPlacementRound(
      tpo,
      roundId,
      {
        action: "SCHEDULE",
        scheduledAt:
          new Date("2026-10-20T04:30:00.000Z"),
        timezone: "Asia/Kolkata",
        mode: "ON_CAMPUS",
        venue: "Main Auditorium",
      },
    );
    await actOnPlacementRound(
      tpo,
      roundId,
      { action: "COMPLETE" },
    );
    await stagePlacementRoundResult(
      tpo,
      roundId,
      {
        applicationId:
          driveApplication.id,
        outcome: "PASS",
        scorePercent: 80,
      },
    );

    const screeningDraft =
      await createPlacementJob(
        tpo,
        {
          collegeId: SEED_IDS.collegeA,
          companyRelationshipId:
            company.relationship.id,
          title: "Screening Engineer",
          description:
            "Screening queue test role",
          employmentType: "FULL_TIME",
          workMode: "ONSITE",
          applicationMode: "INTERNAL",
        },
      );
    const screeningJob =
      await publishPlacementJob(
        tpo,
        screeningDraft.id,
      );
    await applyToPlacementJob(
      learner,
      screeningJob.id,
      {},
    );

    const draftJob =
      await createPlacementJob(
        tpo,
        {
          collegeId: SEED_IDS.collegeA,
          companyRelationshipId:
            company.relationship.id,
          title: "Draft Engineer",
          description:
            "Draft queue test role",
          employmentType: "INTERNSHIP",
          workMode: "REMOTE",
          applicationMode: "INTERNAL",
        },
      );

    const operations =
      await getPlacementTpoOperations(
        tpo,
        SEED_IDS.collegeA,
        new Date("2026-10-19T00:00:00.000Z"),
      );

    expect(operations.analytics).toMatchObject({
      season: {
        id: SEED_IDS.placementSeasonA,
      },
      jobs: {
        total: 3,
        draft: 1,
        published: 2,
        closed: 0,
      },
      funnel: {
        applications: 2,
        shortlisted: 1,
        offered: 0,
        accepted: 0,
        joined: 0,
      },
    });

    expect(operations.summary).toMatchObject({
      totalJobs: 3,
      draftJobs: 1,
      publishedJobs: 2,
      submittedApplications: 2,
      pendingScreening: 1,
      stagedResults: 1,
      jobsNeedingAttention: 3,
    });
    expect(
      operations.workQueue.map(
        (item) => [item.jobId, item.code],
      ),
    ).toEqual(
      expect.arrayContaining([
        [
          driveJob.id,
          "RESULTS_AWAITING_APPLY",
        ],
        [
          screeningJob.id,
          "SCREENING_PENDING",
        ],
        [
          screeningJob.id,
          "EVALUATION_PLAN_MISSING",
        ],
        [draftJob.id, "JOB_DRAFT"],
      ]),
    );
    expect(
      operations.workQueue[0]?.priority,
    ).toBe("HIGH");
  });

  it("keeps the TPO operations center tenant-scoped", async () => {
    await expect(
      getPlacementTpoOperations(
        otherCollegeTpo,
        SEED_IDS.collegeA,
      ),
    ).rejects.toThrow(
      "Missing permission: placements.manage",
    );
  });
});
