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
import {
  applyToPlacementJob,
} from "@/modules/placements/application-service";
import { createPlacementCompany } from "@/modules/placements/company-service";
import { getPlacementDriveDay } from "@/modules/placements/drive-day-service";
import { replacePlacementEvaluationConfig } from "@/modules/placements/evaluation-config-service";
import {
  createPlacementJob,
  publishPlacementJob,
} from "@/modules/placements/job-service";
import {
  applyPlacementRoundResult,
  stagePlacementRoundResult,
} from "@/modules/placements/result-service";
import { actOnPlacementRound } from "@/modules/placements/round-service";
import { decidePlacementScreening } from "@/modules/placements/screening-service";
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

const firstRoundId =
  "33333333-3333-4333-8333-333333333333";
const secondRoundId =
  "44444444-4444-4444-8444-444444444444";

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
  await pool.query("delete from placement_jobs");
  await pool.query(
    "delete from placement_company_relationships",
  );
  await pool.query("delete from placement_companies");
}

async function createDrive() {
  const company = await createPlacementCompany(
    tpo,
    {
      collegeId: SEED_IDS.collegeA,
      name: "Drive Day Systems",
      primaryDomain: "drive-day.example",
    },
  );
  const draftJob = await createPlacementJob(tpo, {
    collegeId: SEED_IDS.collegeA,
    companyRelationshipId:
      company.relationship.id,
    title: "Drive Day Engineer",
    description:
      "Operational drive-day integration role",
    employmentType: "FULL_TIME",
    workMode: "HYBRID",
    applicationMode: "INTERNAL",
  });
  await replacePlacementEvaluationConfig(
    tpo,
    draftJob.id,
    {
      rounds: [
        {
          id: firstRoundId,
          kind: "TEST",
          name: "Aptitude test",
          durationMinutes: 60,
        },
        {
          id: secondRoundId,
          kind: "INTERVIEW",
          name: "Technical interview",
          durationMinutes: 45,
        },
      ],
    },
  );
  const job = await publishPlacementJob(
    tpo,
    draftJob.id,
  );
  const application = await applyToPlacementJob(
    learner,
    job.id,
    {},
  );
  return { job, application };
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

describe("Placement drive day", () => {
  it("turns placement state into an operational progression view", async () => {
    const { job, application } =
      await createDrive();

    const screeningView =
      await getPlacementDriveDay(
        tpo,
        job.id,
      );
    expect(screeningView.summary).toMatchObject({
      submittedApplications: 1,
      pendingScreening: 1,
      shortlisted: 0,
    });
    expect(
      screeningView.attention.some(
        (item) =>
          item.code ===
          "SCREENING_QUEUE_PENDING",
      ),
    ).toBe(true);
    expect(
      screeningView.rounds[0]?.participantCount,
    ).toBe(0);

    await decidePlacementScreening(
      tpo,
      application.id,
      {
        decision: "SHORTLISTED",
        candidateMessage:
          "Shortlisted for the drive",
      },
    );
    await actOnPlacementRound(
      tpo,
      firstRoundId,
      {
        action: "SCHEDULE",
        scheduledAt:
          new Date("2026-10-20T04:30:00.000Z"),
        timezone: "Asia/Kolkata",
        mode: "ON_CAMPUS",
        venue: "Main Auditorium",
        resultsDueAt:
          new Date("2026-10-20T06:30:00.000Z"),
      },
    );

    const scheduled =
      await getPlacementDriveDay(
        tpo,
        job.id,
      );
    expect(
      scheduled.rounds[0]?.participantCount,
    ).toBe(1);
    expect(
      scheduled.rounds[1]?.participantCount,
    ).toBe(0);

    await actOnPlacementRound(
      tpo,
      firstRoundId,
      { action: "COMPLETE" },
    );
    const missing =
      await getPlacementDriveDay(
        tpo,
        job.id,
        new Date("2026-10-20T07:00:00.000Z"),
      );
    expect(
      missing.attention.some(
        (item) =>
          item.code ===
            "COMPLETED_RESULTS_MISSING" &&
          item.roundId === firstRoundId,
      ),
    ).toBe(true);
    expect(
      missing.attention.some(
        (item) =>
          item.code === "RESULTS_OVERDUE" &&
          item.roundId === firstRoundId,
      ),
    ).toBe(true);

    const stagedResult =
      await stagePlacementRoundResult(
        tpo,
        firstRoundId,
        {
          applicationId: application.id,
          outcome: "PASS",
          scorePercent: 84,
        },
      );
    const staged =
      await getPlacementDriveDay(
        tpo,
        job.id,
      );
    expect(
      staged.rounds[0]?.stagedResultCount,
    ).toBe(1);
    expect(
      staged.rounds[1]?.participantCount,
    ).toBe(0);

    await applyPlacementRoundResult(
      tpo,
      stagedResult.id,
    );
    const progressed =
      await getPlacementDriveDay(
        tpo,
        job.id,
      );
    expect(
      progressed.rounds[0]?.outcomes.pass,
    ).toBe(1);
    expect(
      progressed.rounds[1]?.participantCount,
    ).toBe(1);
  });

  it("keeps the drive-day command center tenant-scoped", async () => {
    const { job } = await createDrive();

    await expect(
      getPlacementDriveDay(
        otherCollegeTpo,
        job.id,
      ),
    ).rejects.toThrow(
      "Missing permission: placements.manage",
    );
  });
});
