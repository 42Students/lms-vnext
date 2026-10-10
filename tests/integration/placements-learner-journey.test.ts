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
import { getLearnerPlacementJourney } from "@/modules/placements/learner-journey-service";
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
    roles: ["FACULTY", "TPO"],
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

const facultyOnly: RequestContext = {
  ...tpo,
  membership: {
    ...tpo.membership!,
    roles: ["FACULTY"],
  },
};

const roundId =
  "66666666-6666-4666-8666-666666666666";

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

async function createJourneyJob() {
  const company = await createPlacementCompany(
    tpo,
    {
      collegeId: SEED_IDS.collegeA,
      name: "Journey Systems",
      primaryDomain: "journey.example",
    },
  );
  const draft = await createPlacementJob(
    tpo,
    {
      collegeId: SEED_IDS.collegeA,
      companyRelationshipId:
        company.relationship.id,
      title: "Journey Engineer",
      description:
        "Learner journey integration role",
      employmentType: "FULL_TIME",
      workMode: "HYBRID",
      applicationMode: "INTERNAL",
    },
  );
  await replacePlacementEvaluationConfig(
    tpo,
    draft.id,
    {
      rounds: [
        {
          id: roundId,
          kind: "INTERVIEW",
          name: "Technical interview",
          durationMinutes: 45,
        },
      ],
    },
  );
  return publishPlacementJob(
    tpo,
    draft.id,
  );
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

describe("Learner placement journey", () => {
  it("hides internal screening state while exposing confirmed learner-facing decisions and applied results", async () => {
    const job = await createJourneyJob();
    const application =
      await applyToPlacementJob(
        learner,
        job.id,
        {},
      );

    const initial =
      await getLearnerPlacementJourney(
        learner,
      );
    expect(initial).toHaveLength(1);
    expect(initial[0]).toMatchObject({
      applicationId: application.id,
      applicationStatus: "SUBMITTED",
      job: {
        id: job.id,
        title: "Journey Engineer",
      },
      screening: {
        status: "UNDER_REVIEW",
        candidateMessage: null,
        decidedAt: null,
      },
      results: [],
    });

    await decidePlacementScreening(
      tpo,
      application.id,
      {
        decision: "HOLD",
        internalReason:
          "Waiting for recruiter review",
      },
    );
    const held =
      await getLearnerPlacementJourney(
        learner,
      );
    expect(held[0]?.screening).toEqual({
      status: "UNDER_REVIEW",
      candidateMessage: null,
      decidedAt: null,
    });

    await decidePlacementScreening(
      tpo,
      application.id,
      {
        decision: "SHORTLISTED",
        candidateMessage:
          "You are shortlisted for the technical interview.",
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
        mode: "VIRTUAL",
        meetingUrl:
          "https://meet.example/journey",
      },
    );
    const staged =
      await stagePlacementRoundResult(
        tpo,
        roundId,
        {
          applicationId:
            application.id,
          outcome: "PASS",
          scorePercent: 88,
        },
      );
    await actOnPlacementRound(
      tpo,
      roundId,
      { action: "COMPLETE" },
    );
    await applyPlacementRoundResult(
      tpo,
      staged.id,
    );

    const completed =
      await getLearnerPlacementJourney(
        learner,
      );
    expect(
      completed[0]?.screening,
    ).toMatchObject({
      status: "SHORTLISTED",
      candidateMessage:
        "You are shortlisted for the technical interview.",
    });
    expect(completed[0]?.results).toHaveLength(
      1,
    );
    expect(
      completed[0]?.results[0],
    ).toMatchObject({
      jobId: job.id,
      roundId,
      roundSequence: 1,
      roundName: "Technical interview",
      outcome: "PASS",
      scorePercent: 88,
    });
  });

  it("is learner-only rather than a generic same-college read model", async () => {
    await expect(
      getLearnerPlacementJourney(
        facultyOnly,
      ),
    ).rejects.toThrow(
      "Missing permission: placements.read",
    );
  });
});
