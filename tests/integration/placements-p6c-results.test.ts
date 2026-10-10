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
import {
  actOnPlacementRound,
  createPlacementRound,
} from "@/modules/placements/round-service";
import {
  applyPlacementRoundResult,
  listOwnAppliedPlacementResults,
  listPlacementRoundResults,
  stagePlacementRoundResult,
} from "@/modules/placements/result-service";
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

async function createDrive(roundKinds: Array<
  "TALK" | "TEST" | "VENDOR_TEST" | "GD" | "INTERVIEW"
> = ["TEST"]) {
  const company = await createPlacementCompany(
    tpo,
    {
      collegeId: SEED_IDS.collegeA,
      name: "Result Systems",
      primaryDomain: "results.example",
    },
  );
  const job = await createPlacementJob(tpo, {
    collegeId: SEED_IDS.collegeA,
    companyRelationshipId:
      company.relationship.id,
    title: "Result Engineer",
    description:
      "Result staging integration role",
    employmentType: "FULL_TIME",
    workMode: "HYBRID",
    applicationMode: "INTERNAL",
  });

  const rounds = [];
  for (
    let index = 0;
    index < roundKinds.length;
    index += 1
  ) {
    const kind = roundKinds[index]!;
    rounds.push(
      await createPlacementRound(tpo, job.id, {
        kind,
        name: `Round ${index + 1}`,
      }),
    );
  }

  await publishPlacementJob(tpo, job.id);
  const application = await applyToPlacementJob(
    learner,
    job.id,
    {},
  );
  await decidePlacementScreening(
    tpo,
    application.id,
    {
      decision: "SHORTLISTED",
      candidateMessage:
        "Shortlisted for the placement process",
    },
  );

  return { job, application, rounds };
}

async function scheduleRound(
  roundId: string,
) {
  return actOnPlacementRound(tpo, roundId, {
    action: "SCHEDULE",
    scheduledAt: new Date(
      "2026-10-20T04:30:00.000Z",
    ),
    timezone: "Asia/Kolkata",
    mode: "VIRTUAL",
    meetingUrl:
      "https://meet.example/results-round",
  });
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

describe("Placement P6C staged results", () => {
  it("keeps staged results private until an authorized apply after round completion", async () => {
    const { application, rounds } =
      await createDrive(["INTERVIEW"]);
    const round = rounds[0]!;
    await scheduleRound(round.id);

    const staged =
      await stagePlacementRoundResult(
        tpo,
        round.id,
        {
          applicationId: application.id,
          outcome: "FAIL",
          scorePercent: 62,
          reasonCategory: "TECHNICAL",
          candidateMessage:
            "Not cleared in the technical round",
          internalComment:
            "Private panel calibration note",
        },
      );
    expect(staged.status).toBe("STAGED");

    await expect(
      listOwnAppliedPlacementResults(learner),
    ).resolves.toEqual([]);

    await expect(
      applyPlacementRoundResult(
        tpo,
        staged.id,
      ),
    ).rejects.toMatchObject({
      code:
        "PLACEMENT_RESULT_ROUND_NOT_READY",
    });

    await actOnPlacementRound(
      tpo,
      round.id,
      { action: "COMPLETE" },
    );
    const applied =
      await applyPlacementRoundResult(
        tpo,
        staged.id,
      );
    expect(applied.status).toBe("APPLIED");

    const publicResults =
      await listOwnAppliedPlacementResults(
        learner,
      );
    expect(publicResults).toHaveLength(1);
    expect(publicResults[0]).toMatchObject({
      resultId: staged.id,
      outcome: "FAIL",
      scorePercent: 62,
      reasonCategory: "TECHNICAL",
      candidateMessage:
        "Not cleared in the technical round",
    });
    expect(publicResults[0]).not.toHaveProperty(
      "internalComment",
    );
    expect(publicResults[0]).not.toHaveProperty(
      "source",
    );
  });

  it("preserves staged correction history and makes applied results immutable", async () => {
    const { application, rounds } =
      await createDrive(["TEST"]);
    const round = rounds[0]!;
    await scheduleRound(round.id);

    const first =
      await stagePlacementRoundResult(
        tpo,
        round.id,
        {
          applicationId: application.id,
          outcome: "PASS",
          scorePercent: 80,
        },
      );
    const same =
      await stagePlacementRoundResult(
        tpo,
        round.id,
        {
          applicationId: application.id,
          outcome: "PASS",
          scorePercent: 80,
        },
      );
    expect(same.id).toBe(first.id);

    const corrected =
      await stagePlacementRoundResult(
        tpo,
        round.id,
        {
          applicationId: application.id,
          outcome: "PASS",
          scorePercent: 86,
          internalComment:
            "Corrected evaluator total",
        },
      );
    expect(corrected.version).toBe(2);

    const history =
      await listPlacementRoundResults(
        tpo,
        round.id,
      );
    expect(history).toHaveLength(2);
    expect(
      history.find(
        (item) => item.id === first.id,
      )?.status,
    ).toBe("SUPERSEDED");

    await actOnPlacementRound(
      tpo,
      round.id,
      { action: "COMPLETE" },
    );
    await expect(
      applyPlacementRoundResult(
        tpo,
        first.id,
      ),
    ).rejects.toMatchObject({
      code: "PLACEMENT_RESULT_NOT_FOUND",
    });

    await applyPlacementRoundResult(
      tpo,
      corrected.id,
    );

    await expect(
      stagePlacementRoundResult(
        tpo,
        round.id,
        {
          applicationId: application.id,
          outcome: "PASS",
          scorePercent: 90,
        },
      ),
    ).rejects.toMatchObject({
      code:
        "PLACEMENT_RESULT_ALREADY_APPLIED",
    });
  });

  it("allows a later evaluative round only after every prior evaluative round has an applied pass", async () => {
    const { application, rounds } =
      await createDrive([
        "TALK",
        "TEST",
        "INTERVIEW",
      ]);
    const talk = rounds[0]!;
    const test = rounds[1]!;
    const interview = rounds[2]!;

    await scheduleRound(talk.id);
    await expect(
      stagePlacementRoundResult(
        tpo,
        talk.id,
        {
          applicationId: application.id,
          outcome: "PASS",
        },
      ),
    ).rejects.toMatchObject({
      code:
        "PLACEMENT_RESULT_INVALID_ROUND_TYPE",
    });

    await scheduleRound(test.id);
    const pass =
      await stagePlacementRoundResult(
        tpo,
        test.id,
        {
          applicationId: application.id,
          outcome: "PASS",
          scorePercent: 78,
        },
      );

    await scheduleRound(interview.id);
    await expect(
      stagePlacementRoundResult(
        tpo,
        interview.id,
        {
          applicationId: application.id,
          outcome: "PASS",
        },
      ),
    ).rejects.toMatchObject({
      code: "PLACEMENT_RESULT_NOT_PARTICIPANT",
    });

    await actOnPlacementRound(
      tpo,
      test.id,
      { action: "COMPLETE" },
    );
    await applyPlacementRoundResult(
      tpo,
      pass.id,
    );

    await expect(
      stagePlacementRoundResult(
        tpo,
        interview.id,
        {
          applicationId: application.id,
          outcome: "PASS",
        },
      ),
    ).resolves.toMatchObject({
      outcome: "PASS",
      status: "STAGED",
    });
  });

  it("does not advance a failed candidate into the next evaluative round", async () => {
    const { application, rounds } =
      await createDrive([
        "TEST",
        "INTERVIEW",
      ]);
    const test = rounds[0]!;
    const interview = rounds[1]!;

    await scheduleRound(test.id);
    const failed =
      await stagePlacementRoundResult(
        tpo,
        test.id,
        {
          applicationId: application.id,
          outcome: "FAIL",
          candidateMessage:
            "Not cleared in the assessment",
        },
      );
    await actOnPlacementRound(
      tpo,
      test.id,
      { action: "COMPLETE" },
    );
    await applyPlacementRoundResult(
      tpo,
      failed.id,
    );

    await scheduleRound(interview.id);
    await expect(
      stagePlacementRoundResult(
        tpo,
        interview.id,
        {
          applicationId: application.id,
          outcome: "PASS",
        },
      ),
    ).rejects.toMatchObject({
      code: "PLACEMENT_RESULT_NOT_PARTICIPANT",
    });
  });

  it("blocks result operations across college boundaries", async () => {
    const { application, rounds } =
      await createDrive(["TEST"]);
    const round = rounds[0]!;
    await scheduleRound(round.id);

    await expect(
      listPlacementRoundResults(
        otherCollegeTpo,
        round.id,
      ),
    ).rejects.toThrow(
      "Missing permission: placements.manage",
    );

    await expect(
      stagePlacementRoundResult(
        otherCollegeTpo,
        round.id,
        {
          applicationId: application.id,
          outcome: "PASS",
        },
      ),
    ).rejects.toThrow(
      "Missing permission: placements.manage",
    );
  });
});
