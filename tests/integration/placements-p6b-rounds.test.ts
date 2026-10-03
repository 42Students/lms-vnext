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
  closePlacementJob,
  createPlacementJob,
  publishPlacementJob,
} from "@/modules/placements/job-service";
import {
  actOnPlacementRound,
  createPlacementRound,
  getPlacementRound,
  listPlacementRounds,
  reorderPlacementRounds,
  updatePlacementRound,
} from "@/modules/placements/round-service";
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

async function cleanup() {
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

async function createJob() {
  const company = await createPlacementCompany(
    tpo,
    {
      collegeId: SEED_IDS.collegeA,
      name: "Round Systems",
      primaryDomain: "rounds.example",
    },
  );
  return createPlacementJob(tpo, {
    collegeId: SEED_IDS.collegeA,
    companyRelationshipId:
      company.relationship.id,
    title: "Round Engineer",
    description:
      "Round lifecycle integration role",
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

describe("Placement P6B rounds", () => {
  it("assigns stable order and supports atomic reorder before scheduling", async () => {
    const job = await createJob();
    const first = await createPlacementRound(
      tpo,
      job.id,
      {
        kind: "TEST",
        name: "Aptitude test",
      },
    );
    const second = await createPlacementRound(
      tpo,
      job.id,
      {
        kind: "INTERVIEW",
        name: "Technical interview",
      },
    );
    expect([
      first.sequence,
      second.sequence,
    ]).toEqual([1, 2]);

    const reordered =
      await reorderPlacementRounds(
        tpo,
        job.id,
        {
          roundIds: [second.id, first.id],
        },
      );
    expect(
      reordered.map((round) => [
        round.id,
        round.sequence,
      ]),
    ).toEqual([
      [second.id, 1],
      [first.id, 2],
    ]);

    const detail = await getPlacementRound(
      tpo,
      second.id,
    );
    expect(
      detail.events.map(
        (event) => event.eventType,
      ),
    ).toEqual(["CREATED", "REORDERED"]);
  });

  it("keeps scheduling explicit, time-safe and auditable", async () => {
    const job = await createJob();
    const round = await createPlacementRound(
      tpo,
      job.id,
      {
        kind: "INTERVIEW",
        name: "Technical interview",
      },
    );

    const renamed = await updatePlacementRound(
      tpo,
      round.id,
      {
        name: "Technical panel",
        durationMinutes: 60,
      },
    );
    expect(renamed.name).toBe(
      "Technical panel",
    );

    const scheduled =
      await actOnPlacementRound(
        tpo,
        round.id,
        {
          action: "SCHEDULE",
          scheduledAt:
            new Date(
              "2026-10-20T04:30:00.000Z",
            ),
          timezone: "Asia/Kolkata",
          mode: "VIRTUAL",
          meetingUrl:
            "https://meet.example/technical",
          resultsDueAt:
            new Date(
              "2026-10-20T08:30:00.000Z",
            ),
        },
      );
    expect(scheduled.status).toBe(
      "SCHEDULED",
    );

    await expect(
      updatePlacementRound(
        tpo,
        round.id,
        { name: "Late rename" },
      ),
    ).rejects.toMatchObject({
      code: "PLACEMENT_ROUND_NOT_EDITABLE",
    });

    const rescheduled =
      await actOnPlacementRound(
        tpo,
        round.id,
        {
          action: "SCHEDULE",
          scheduledAt:
            new Date(
              "2026-10-21T04:30:00.000Z",
            ),
          timezone: "Asia/Kolkata",
          mode: "VIRTUAL",
          meetingUrl:
            "https://meet.example/technical-2",
        },
      );
    expect(
      rescheduled.scheduledAt?.toISOString(),
    ).toBe("2026-10-21T04:30:00.000Z");

    const completed =
      await actOnPlacementRound(
        tpo,
        round.id,
        { action: "COMPLETE" },
      );
    expect(completed.status).toBe(
      "COMPLETED",
    );

    await expect(
      actOnPlacementRound(
        tpo,
        round.id,
        {
          action: "CANCEL",
          reason: "Too late",
        },
      ),
    ).rejects.toMatchObject({
      code:
        "PLACEMENT_ROUND_INVALID_TRANSITION",
    });

    const detail = await getPlacementRound(
      tpo,
      round.id,
    );
    expect(
      detail.events.map(
        (event) => event.eventType,
      ),
    ).toEqual([
      "CREATED",
      "UPDATED",
      "SCHEDULED",
      "RESCHEDULED",
      "COMPLETED",
    ]);
  });

  it("retains cancelled history without consuming the active sequence", async () => {
    const job = await createJob();
    const cancelled =
      await createPlacementRound(
        tpo,
        job.id,
        {
          kind: "TALK",
          name: "Pre-placement talk",
        },
      );
    await actOnPlacementRound(
      tpo,
      cancelled.id,
      {
        action: "CANCEL",
        reason:
          "Recruiter removed the session",
      },
    );

    const replacement =
      await createPlacementRound(
        tpo,
        job.id,
        {
          kind: "TEST",
          name: "Aptitude test",
        },
      );
    expect(replacement.sequence).toBe(1);

    const rounds = await listPlacementRounds(
      tpo,
      job.id,
    );
    expect(rounds).toHaveLength(2);
    expect(
      rounds.find(
        (item) => item.id === cancelled.id,
      )?.status,
    ).toBe("CANCELLED");
  });

  it("makes closed jobs read-only for round operations", async () => {
    const job = await createJob();
    await publishPlacementJob(tpo, job.id);
    await closePlacementJob(tpo, job.id);

    await expect(
      createPlacementRound(
        tpo,
        job.id,
        {
          kind: "TEST",
          name: "Too late",
        },
      ),
    ).rejects.toMatchObject({
      code: "PLACEMENT_ROUND_JOB_READ_ONLY",
    });
  });

  it("blocks round management across colleges", async () => {
    const job = await createJob();
    const round = await createPlacementRound(
      tpo,
      job.id,
      {
        kind: "GD",
        name: "Group discussion",
      },
    );

    await expect(
      listPlacementRounds(
        otherCollegeTpo,
        job.id,
      ),
    ).rejects.toThrow(
      "Missing permission: placements.manage",
    );
    await expect(
      getPlacementRound(
        otherCollegeTpo,
        round.id,
      ),
    ).rejects.toThrow(
      "Missing permission: placements.manage",
    );
  });
});
