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
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  getCandidatePreferences,
  upsertCandidatePreferences,
} from "@/modules/placements/candidate-preferences-service";
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

const secondMembership = {
  membershipId:
    "77000000-0000-4000-8000-000000000001",
  roleId:
    "77000000-0000-4000-8000-000000000002",
};

const learnerInCollegeB: RequestContext = {
  ...learner,
  membership: {
    id: secondMembership.membershipId,
    collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["LEARNER"],
  },
};

async function cleanup() {
  await pool.query(
    "delete from placement_candidate_preferences where membership_id in ($1, $2)",
    [
      SEED_IDS.learnerCollegeAMembership,
      secondMembership.membershipId,
    ],
  );
  await pool.query(
    "delete from membership_roles where id = $1",
    [secondMembership.roleId],
  );
  await pool.query(
    "delete from college_memberships where id = $1",
    [secondMembership.membershipId],
  );
}

beforeEach(async () => {
  await cleanup();
  await enableSeedLearnerPlacementAccess(pool);
  await pool.query(
    `insert into college_memberships
      (id, user_id, college_id, status)
     values ($1, $2, $3, 'ACTIVE')`,
    [
      secondMembership.membershipId,
      SEED_IDS.learnerUser,
      SEED_IDS.collegeB,
    ],
  );
  await pool.query(
    `insert into membership_roles
      (id, membership_id, role)
     values ($1, $2, 'LEARNER')`,
    [
      secondMembership.roleId,
      secondMembership.membershipId,
    ],
  );
});

afterAll(async () => {
  await cleanup();
  await pool.end();
  await closeDatabaseConnection();
});

describe("Placement candidate preferences", () => {
  it("returns safe defaults before the learner has saved preferences", async () => {
    await expect(
      getCandidatePreferences(learner),
    ).resolves.toMatchObject({
      membershipId:
        SEED_IDS.learnerCollegeAMembership,
      preferredRoleTitles: [],
      preferredLocations: [],
      preferredEmploymentTypes: [],
      preferredWorkMode: "NO_PREFERENCE",
      shiftPreference: "NO_PREFERENCE",
      minimumAnnualCtcInr: null,
      relocationPreference: "NO_PREFERENCE",
      notifyMatchingJobs: true,
      notifyApplicationUpdates: true,
    });
  });

  it("persists normalized preferences only for the active learner membership", async () => {
    const saved = await upsertCandidatePreferences(
      learner,
      {
        preferredRoleTitles: [
          " Software Engineer ",
          "software engineer",
          "Data Engineer",
        ],
        preferredLocations: [
          "Hyderabad",
          "Bengaluru",
        ],
        preferredEmploymentTypes: [
          "FULL_TIME",
          "INTERNSHIP",
        ],
        preferredWorkMode: "HYBRID",
        shiftPreference: "FLEXIBLE",
        minimumAnnualCtcInr: 900000,
        relocationPreference: "YES",
        notifyMatchingJobs: false,
      },
    );

    expect(saved).toMatchObject({
      membershipId:
        SEED_IDS.learnerCollegeAMembership,
      preferredRoleTitles: [
        "Software Engineer",
        "Data Engineer",
      ],
      preferredWorkMode: "HYBRID",
      minimumAnnualCtcInr: 900000,
      notifyMatchingJobs: false,
      notifyApplicationUpdates: true,
    });

    await upsertCandidatePreferences(
      learnerInCollegeB,
      {
        preferredRoleTitles: ["Civil Engineer"],
      },
    );

    await expect(
      getCandidatePreferences(learnerInCollegeB),
    ).resolves.toMatchObject({
      membershipId: secondMembership.membershipId,
      preferredRoleTitles: ["Civil Engineer"],
    });

    await expect(
      getCandidatePreferences(learner),
    ).resolves.toMatchObject({
      membershipId:
        SEED_IDS.learnerCollegeAMembership,
      preferredRoleTitles: [
        "Software Engineer",
        "Data Engineer",
      ],
    });
  });

  it("does not let a TPO use learner self-service preferences", async () => {
    await expect(
      getCandidatePreferences(tpo),
    ).rejects.toBeInstanceOf(AuthorizationError);

    await expect(
      upsertCandidatePreferences(tpo, {
        preferredRoleTitles: ["Should fail"],
      }),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });
});
