import { publishableJobTerms } from "../support/publishable-job-terms";
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
import {
  applyToPlacementJob,
  listPlacementJobApplications,
} from "@/modules/placements/application-service";
import { createPlacementCompany } from "@/modules/placements/company-service";
import {
  createPlacementJob,
  updatePlacementJob,
} from "@/modules/placements/job-service";
import { publishPreparedPlacementJob } from "../support/publishable-job-fixture";
import { listLearnerPlacementJobs } from "@/modules/placements/learner-job-service";
import {
  archivePlacementRoleOption,
  createPlacementRoleOption,
  listPlacementRoleOptions,
  updatePlacementRoleOption,
} from "@/modules/placements/role-option-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { enableSeedLearnerPlacementAccess } from "../support/w04-placement-access-fixture";

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
    roles: ["FACULTY", "TPO"],
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
  // Application stages are children of the applicant row, and must be
  // cleaned first in the isolated test database.
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
  await pool.query(
    "delete from placement_companies",
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

describe("Placement multi-role drives", () => {
  it("keeps a primary compatibility role and binds each learner application to an exact role option", async () => {
    const company =
      await createPlacementCompany(tpo, {
        collegeId: SEED_IDS.collegeA,
        name: "Multi Role Systems",
        primaryDomain:
          "multi-role-systems.example",
      });

    const draft = await createPlacementJob(
      tpo,
      {
      ...publishableJobTerms,
        collegeId: SEED_IDS.collegeA,
        companyRelationshipId:
          company.relationship.id,
        title: "Platform Engineer",
        description:
          "One drive with multiple role options.",
        employmentType: "FULL_TIME",
        workMode: "HYBRID",
        locations: ["Hyderabad"],
        minimumAnnualCtcInr: 900000,
        maximumAnnualCtcInr: 1200000,
        applicationMode: "INTERNAL",
      },
    );

    let roles =
      await listPlacementRoleOptions(
        tpo,
        draft.id,
      );
    expect(roles).toHaveLength(1);
    expect(roles[0]).toMatchObject({
      title: "Platform Engineer",
      isPrimary: true,
      status: "ACTIVE",
    });

    await updatePlacementJob(
      tpo,
      draft.id,
      {
        title: "Platform Engineer I",
        openings: 4,
      },
    );

    roles = await listPlacementRoleOptions(
      tpo,
      draft.id,
    );
    const primary = roles[0]!;
    expect(primary).toMatchObject({
      title: "Platform Engineer I",
      openings: 4,
      isPrimary: true,
    });

    const secondary =
      await createPlacementRoleOption(
        tpo,
        draft.id,
        {
          title: "Data Engineer",
          employmentType: "FULL_TIME",
          workMode: "HYBRID",
          locations: ["Hyderabad"],
          openings: 2,
          minimumAnnualCtcInr: 850000,
          maximumAnnualCtcInr: 1100000,
        },
      );

    const updatedSecondary =
      await updatePlacementRoleOption(
        tpo,
        draft.id,
        secondary.id,
        {
          workMode: "REMOTE",
          locations: ["Remote - India"],
        },
      );
    expect(updatedSecondary).toMatchObject({
      title: "Data Engineer",
      workMode: "REMOTE",
      locations: ["Remote - India"],
    });

    await expect(
      createPlacementRoleOption(
        tpo,
        draft.id,
        {
          title: "Data Engineer",
          employmentType: "FULL_TIME",
          workMode: "REMOTE",
        },
      ),
    ).rejects.toMatchObject({
      code: "PLACEMENT_ROLE_OPTION_DUPLICATE",
    });

    await expect(
      archivePlacementRoleOption(
        tpo,
        draft.id,
        primary.id,
      ),
    ).rejects.toMatchObject({
      code:
        "PLACEMENT_ROLE_OPTION_PRIMARY_REQUIRED",
    });

    const temporary =
      await createPlacementRoleOption(
        tpo,
        draft.id,
        {
          title: "Temporary Role",
          employmentType: "INTERNSHIP",
          workMode: "ONSITE",
        },
      );
    const archived =
      await archivePlacementRoleOption(
        tpo,
        draft.id,
        temporary.id,
      );
    expect(archived.status).toBe(
      "ARCHIVED",
    );

    await expect(
      listPlacementRoleOptions(
        otherCollegeTpo,
        draft.id,
      ),
    ).rejects.toThrow(
      "Missing permission: placements.manage",
    );

    await publishPreparedPlacementJob(
      tpo,
      draft.id,
    );

    await expect(
      applyToPlacementJob(
        learner,
        draft.id,
        {},
      ),
    ).rejects.toMatchObject({
      code: "PLACEMENT_ROLE_OPTION_REQUIRED",
    });

    const primaryApplication =
      await applyToPlacementJob(
        learner,
        draft.id,
        {
          roleOptionId: primary.id,
        },
      );
    const secondaryApplication =
      await applyToPlacementJob(
        learner,
        draft.id,
        {
          roleOptionId: secondary.id,
        },
      );

    expect(primaryApplication.id).not.toBe(
      secondaryApplication.id,
    );
    expect(primaryApplication.roleOptionId).toBe(
      primary.id,
    );
    expect(
      secondaryApplication.roleOptionId,
    ).toBe(secondary.id);

    const repeatedSecondary =
      await applyToPlacementJob(
        learner,
        draft.id,
        {
          roleOptionId: secondary.id,
        },
      );
    expect(repeatedSecondary.id).toBe(
      secondaryApplication.id,
    );

    const managed =
      await listPlacementJobApplications(
        tpo,
        draft.id,
      );
    expect(managed).toHaveLength(2);
    expect(
      managed
        .map((row) => row.roleOption.title)
        .sort(),
    ).toEqual([
      "Data Engineer",
      "Platform Engineer I",
    ]);

    const feed =
      await listLearnerPlacementJobs(
        learner,
      );
    const driveRoles = feed
      .filter(
        (item) =>
          item.job.id === draft.id,
      )
      .map(
        (item) => item.roleOption.title,
      )
      .sort();

    expect(driveRoles).toEqual([
      "Data Engineer",
      "Platform Engineer I",
    ]);
  });
});
