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
  updatePlacementJob,
} from "@/modules/placements/job-service";
import {
  closePlacementSeason,
  createPlacementSeason,
  listPlacementSeasons,
} from "@/modules/placements/season-service";
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
    roles: ["FACULTY", "TPO"],
  },
};

async function cleanup() {
  await pool.query(
    "delete from placement_joining_history",
  );
  await pool.query(
    "delete from placement_joining_outcomes",
  );
  await pool.query(
    "delete from placement_offer_status_history",
  );
  await pool.query(
    "delete from placement_offers",
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
  await pool.query(
    "delete from placement_jobs",
  );
  await pool.query(
    "delete from placement_recruiter_college_grants",
  );
  await pool.query(
    "delete from placement_recruiter_profiles",
  );
  await pool.query(
    "delete from placement_company_relationships",
  );
  await pool.query(
    "delete from placement_companies",
  );
  await pool.query(
    "delete from placement_seasons where id not in ($1, $2)",
    [
      SEED_IDS.placementSeasonA,
      SEED_IDS.placementSeasonB,
    ],
  );
  await pool.query(
    `update placement_seasons
       set status = 'ACTIVE',
           closed_by_user_id = null,
           closed_at = null,
           updated_at = now()
     where id in ($1, $2)`,
    [
      SEED_IDS.placementSeasonA,
      SEED_IDS.placementSeasonB,
    ],
  );
}

beforeEach(async () => {
  await cleanup();
});

afterAll(async () => {
  await cleanup();
  await pool.end();
  await closeDatabaseConnection();
});

describe("Placement P9 seasons", () => {
  it("binds new drives to the active season and keeps historical seasons read-only", async () => {
    const company =
      await createPlacementCompany(tpo, {
        collegeId: SEED_IDS.collegeA,
        name: "Season Systems",
        primaryDomain:
          "season-systems.example",
      });

    const job = await createPlacementJob(
      tpo,
      {
        collegeId: SEED_IDS.collegeA,
        companyRelationshipId:
          company.relationship.id,
        title: "Season Engineer",
        description:
          "Season boundary fixture",
        employmentType: "FULL_TIME",
        workMode: "HYBRID",
        applicationMode: "INTERNAL",
      },
    );

    expect(job.seasonId).toBe(
      SEED_IDS.placementSeasonA,
    );

    await expect(
      createPlacementSeason(tpo, {
        collegeId: SEED_IDS.collegeA,
        name: "Overlapping Season",
        code: "OVERLAP",
        startDate: "2027-07-01",
        endDate: "2028-06-30",
      }),
    ).rejects.toMatchObject({
      code:
        "PLACEMENT_SEASON_ACTIVE_EXISTS",
    });

    await expect(
      closePlacementSeason(
        tpo,
        SEED_IDS.placementSeasonA,
      ),
    ).rejects.toMatchObject({
      code:
        "PLACEMENT_SEASON_HAS_ACTIVE_JOBS",
    });

    await publishPlacementJob(
      tpo,
      job.id,
    );
    await closePlacementJob(
      tpo,
      job.id,
    );

    const closed =
      await closePlacementSeason(
        tpo,
        SEED_IDS.placementSeasonA,
      );
    expect(closed.status).toBe(
      "CLOSED",
    );

    await expect(
      updatePlacementJob(
        tpo,
        job.id,
        { title: "Historical edit" },
      ),
    ).rejects.toMatchObject({
      code:
        "PLACEMENT_SEASON_NOT_ACTIVE",
    });

    await expect(
      createPlacementJob(tpo, {
        collegeId: SEED_IDS.collegeA,
        companyRelationshipId:
          company.relationship.id,
        title: "No Season Engineer",
        description:
          "Must fail without an active season",
        employmentType: "FULL_TIME",
        workMode: "REMOTE",
        applicationMode: "INTERNAL",
      }),
    ).rejects.toMatchObject({
      code:
        "PLACEMENT_SEASON_REQUIRED",
    });

    const next =
      await createPlacementSeason(tpo, {
        collegeId: SEED_IDS.collegeA,
        name: "2027-28 Placements",
        code: "2027-28",
        startDate: "2027-07-01",
        endDate: "2028-06-30",
      });

    const nextJob =
      await createPlacementJob(tpo, {
        collegeId: SEED_IDS.collegeA,
        seasonId: next.id,
        companyRelationshipId:
          company.relationship.id,
        title: "Next Season Engineer",
        description:
          "Employer relationship carries forward without operational state",
        employmentType: "FULL_TIME",
        workMode: "ONSITE",
        applicationMode: "INTERNAL",
      });

    expect(nextJob.seasonId).toBe(
      next.id,
    );

    const seasons =
      await listPlacementSeasons(
        tpo,
        SEED_IDS.collegeA,
      );
    expect(
      seasons.map((season) => ({
        code: season.code,
        status: season.status,
      })),
    ).toEqual(
      expect.arrayContaining([
        {
          code: "SEED-2026-27-A",
          status: "CLOSED",
        },
        {
          code: "2027-28",
          status: "ACTIVE",
        },
      ]),
    );
  });

  it("rejects a season from another college even when it is active", async () => {
    const company =
      await createPlacementCompany(tpo, {
        collegeId: SEED_IDS.collegeA,
        name: "Cross Season Systems",
        primaryDomain:
          "cross-season.example",
      });

    await expect(
      createPlacementJob(tpo, {
        collegeId: SEED_IDS.collegeA,
        seasonId:
          SEED_IDS.placementSeasonB,
        companyRelationshipId:
          company.relationship.id,
        title: "Cross Season Engineer",
        description:
          "Tenant-season mismatch fixture",
        employmentType: "FULL_TIME",
        workMode: "REMOTE",
        applicationMode: "INTERNAL",
      }),
    ).rejects.toMatchObject({
      code:
        "PLACEMENT_SEASON_NOT_ACTIVE",
    });
  });
});
