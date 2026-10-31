import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { Pool } from "pg";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { createPlacementCompany } from "@/modules/placements/company-service";
import {
  getPlacementEvaluationConfig,
  replacePlacementEvaluationConfig,
} from "@/modules/placements/evaluation-config-service";
import { createPlacementJob } from "@/modules/placements/job-service";
import { actOnPlacementRound } from "@/modules/placements/round-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Placement integration cleanup requires disposable TEST_DATABASE_URL");
}
assertDb018DisposableTarget(process.env, { serviceBound: true });
const databaseUrl = process.env.TEST_DATABASE_URL;

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

const firstId =
  "11111111-1111-4111-8111-111111111111";
const secondId =
  "22222222-2222-4222-8222-222222222222";

async function cleanup() {
  await pool.query(
    "delete from placement_round_results",
  );
  await pool.query(
    "delete from placement_job_round_events",
  );
  // Preserve registered round-retention/FK checks; clear disposable children.
  await pool.query("delete from placement_round_candidate_slots");
  await pool.query("delete from placement_round_attendance");
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
  // This registered FK child is retained by the newer college pipeline;
  // clean it before applications without relaxing referential integrity.
  // Immutable history references the stage row; delete test-only children first.
  await pool.query("delete from placement_college_application_stage_history");
  await pool.query("delete from placement_college_application_stages");
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

async function createJob() {
  const company = await createPlacementCompany(
    tpo,
    {
      collegeId: SEED_IDS.collegeA,
      name: "Evaluation Config Systems",
      primaryDomain: "evaluation-config.example",
    },
  );
  return createPlacementJob(tpo, {
    collegeId: SEED_IDS.collegeA,
    companyRelationshipId:
      company.relationship.id,
    title: "Evaluation Engineer",
    description:
      "Atomic evaluation-plan integration role",
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

describe("Placement evaluation configuration", () => {
  it("creates, reorders and retries a stable round plan without duplicate audit noise", async () => {
    const job = await createJob();
    const initialInput = {
      rounds: [
        {
          id: firstId,
          kind: "TEST" as const,
          name: "Aptitude test",
          durationMinutes: 60,
        },
        {
          id: secondId,
          kind: "INTERVIEW" as const,
          name: "Technical interview",
        },
      ],
    };

    const initial =
      await replacePlacementEvaluationConfig(
        tpo,
        job.id,
        initialInput,
      );
    expect(initial).toMatchObject({
      state: "DRAFT",
      editable: true,
    });
    expect(
      initial.rounds.map((round) => [
        round.id,
        round.sequence,
      ]),
    ).toEqual([
      [firstId, 1],
      [secondId, 2],
    ]);

    const auditBeforeRetry = await pool.query(
      "select count(*)::int as count from placement_job_round_events",
    );
    await replacePlacementEvaluationConfig(
      tpo,
      job.id,
      initialInput,
    );
    const auditAfterRetry = await pool.query(
      "select count(*)::int as count from placement_job_round_events",
    );
    expect(auditAfterRetry.rows[0]?.count).toBe(
      auditBeforeRetry.rows[0]?.count,
    );

    const reordered =
      await replacePlacementEvaluationConfig(
        tpo,
        job.id,
        {
          rounds: [
            {
              id: secondId,
              kind: "INTERVIEW",
              name: "Technical panel",
            },
            {
              id: firstId,
              kind: "TEST",
              name: "Aptitude test",
              durationMinutes: 60,
            },
          ],
        },
      );
    expect(
      reordered.rounds.map((round) => [
        round.id,
        round.sequence,
        round.name,
      ]),
    ).toEqual([
      [secondId, 1, "Technical panel"],
      [firstId, 2, "Aptitude test"],
    ]);
  });

  it("retires removed draft rounds instead of destroying their audit history", async () => {
    const job = await createJob();
    await replacePlacementEvaluationConfig(
      tpo,
      job.id,
      {
        rounds: [
          {
            id: firstId,
            kind: "TEST",
            name: "Aptitude test",
          },
          {
            id: secondId,
            kind: "INTERVIEW",
            name: "Technical interview",
          },
        ],
      },
    );

    const config =
      await replacePlacementEvaluationConfig(
        tpo,
        job.id,
        {
          rounds: [
            {
              id: secondId,
              kind: "INTERVIEW",
              name: "Technical interview",
            },
          ],
        },
      );
    expect(config.rounds).toHaveLength(1);
    expect(config.rounds[0]?.id).toBe(secondId);
    expect(config.rounds[0]?.sequence).toBe(1);

    const retired = await pool.query(
      "select status from placement_job_rounds where id = $1",
      [firstId],
    );
    expect(retired.rows[0]?.status).toBe(
      "CANCELLED",
    );
  });

  it("locks the evaluation plan as soon as round execution starts", async () => {
    const job = await createJob();
    await replacePlacementEvaluationConfig(
      tpo,
      job.id,
      {
        rounds: [
          {
            id: firstId,
            kind: "INTERVIEW",
            name: "Technical interview",
          },
        ],
      },
    );
    await actOnPlacementRound(
      tpo,
      firstId,
      {
        action: "SCHEDULE",
        scheduledAt:
          new Date("2035-10-20T04:30:00.000Z"),
        timezone: "Asia/Kolkata",
        mode: "VIRTUAL",
        meetingUrl:
          "https://meet.example/evaluation",
      },
    );

    const readOnly =
      await getPlacementEvaluationConfig(
        tpo,
        job.id,
      );
    expect(readOnly).toMatchObject({
      state: "LOCKED",
      editable: false,
    });

    await expect(
      replacePlacementEvaluationConfig(
        tpo,
        job.id,
        {
          rounds: [
            {
              id: firstId,
              kind: "INTERVIEW",
              name: "Unsafe late rename",
            },
          ],
        },
      ),
    ).rejects.toMatchObject({
      code: "PLACEMENT_EVALUATION_CONFIG_LOCKED",
    });
  });

  it("keeps evaluation configuration tenant-scoped", async () => {
    const job = await createJob();

    await expect(
      getPlacementEvaluationConfig(
        otherCollegeTpo,
        job.id,
      ),
    ).rejects.toThrow(
      "Missing permission: placements.manage",
    );
    await expect(
      replacePlacementEvaluationConfig(
        otherCollegeTpo,
        job.id,
        { rounds: [] },
      ),
    ).rejects.toThrow(
      "Missing permission: placements.manage",
    );
  });
});
