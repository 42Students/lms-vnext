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
  listOwnPlacementApplications,
  listPlacementJobApplications,
  withdrawPlacementApplication,
} from "@/modules/placements/application-service";
import { createPlacementCompany } from "@/modules/placements/company-service";
import {
  upsertJobEligibilityPolicy,
  upsertVerifiedAcademicEvidence,
} from "@/modules/placements/eligibility-service";
import {
  createPlacementJob,
  publishPlacementJob,
} from "@/modules/placements/job-service";
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

const otherMembership = {
  id: "7a000000-0000-4000-8000-000000000001",
  roleId:
    "7a000000-0000-4000-8000-000000000002",
};

const otherLearner: RequestContext = {
  user: learner.user,
  membership: {
    id: otherMembership.id,
    collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["LEARNER"],
  },
};

async function cleanup() {
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
  await pool.query(
    "delete from membership_roles where id = $1",
    [otherMembership.roleId],
  );
  await pool.query(
    "delete from college_memberships where id = $1",
    [otherMembership.id],
  );
}

async function createJob(options?: {
  applicationMode?:
    | "INTERNAL"
    | "HYBRID"
    | "EXTERNAL_ONLY";
  externalApplicationUrl?: string;
  applicationDeadline?: Date;
}) {
  const company = await createPlacementCompany(
    tpo,
    {
      collegeId: SEED_IDS.collegeA,
      name: "Application Systems",
      primaryDomain: "applications.example",
    },
  );

  return createPlacementJob(tpo, {
    collegeId: SEED_IDS.collegeA,
    companyRelationshipId:
      company.relationship.id,
    title: "Application Engineer",
    description: "Application lifecycle test role",
    employmentType: "FULL_TIME",
    workMode: "HYBRID",
    locations: ["Hyderabad"],
    applicationMode:
      options?.applicationMode ?? "INTERNAL",
    externalApplicationUrl:
      options?.externalApplicationUrl,
    applicationDeadline:
      options?.applicationDeadline,
  });
}

beforeEach(async () => {
  await cleanup();
  await enableSeedLearnerPlacementAccess(pool);
  await pool.query(
    `insert into college_memberships
      (id, user_id, college_id, status)
     values ($1, $2, $3, 'ACTIVE')`,
    [
      otherMembership.id,
      SEED_IDS.learnerUser,
      SEED_IDS.collegeB,
    ],
  );
  await pool.query(
    `insert into membership_roles
      (id, membership_id, role)
     values ($1, $2, 'LEARNER')`,
    [otherMembership.roleId, otherMembership.id],
  );
});

afterAll(async () => {
  await cleanup();
  await pool.end();
  await closeDatabaseConnection();
});

describe("Placement P5 applications", () => {
  it("enforces eligibility, creates one stable application and supports manager/self reads", async () => {
    const job = await createJob();
    await upsertJobEligibilityPolicy(
      tpo,
      job.id,
      {
        minCgpa: 8,
        missingEvidencePolicy:
          "REQUIRE_COMPLETE",
      },
    );
    await publishPlacementJob(tpo, job.id);

    await expect(
      applyToPlacementJob(
        learner,
        job.id,
        {},
      ),
    ).rejects.toMatchObject({
      code: "PLACEMENT_APPLICATION_NEEDS_DATA",
    });

    await upsertVerifiedAcademicEvidence(
      tpo,
      SEED_IDS.learnerCollegeAMembership,
      { cgpa: 7.5 },
    );
    await expect(
      applyToPlacementJob(
        learner,
        job.id,
        {},
      ),
    ).rejects.toMatchObject({
      code: "PLACEMENT_APPLICATION_INELIGIBLE",
    });

    await upsertVerifiedAcademicEvidence(
      tpo,
      SEED_IDS.learnerCollegeAMembership,
      { cgpa: 8.4 },
    );
    const created = await applyToPlacementJob(
      learner,
      job.id,
      {},
    );
    expect(created).toMatchObject({
      jobId: job.id,
      membershipId:
        SEED_IDS.learnerCollegeAMembership,
      channel: "INTERNAL",
      status: "SUBMITTED",
      eligibilityStatus: "ELIGIBLE",
    });

    const duplicate = await applyToPlacementJob(
      learner,
      job.id,
      {},
    );
    expect(duplicate.id).toBe(created.id);

    const mine =
      await listOwnPlacementApplications(
        learner,
      );
    expect(mine).toHaveLength(1);
    expect(mine[0]?.application.id).toBe(
      created.id,
    );

    const managed =
      await listPlacementJobApplications(
        tpo,
        job.id,
      );
    expect(managed).toHaveLength(1);
    expect(
      managed[0]?.candidate.membershipId,
    ).toBe(
      SEED_IDS.learnerCollegeAMembership,
    );
  });

  it("makes hybrid channel choice explicit and requires confirmation for external applications", async () => {
    const job = await createJob({
      applicationMode: "HYBRID",
      externalApplicationUrl:
        "https://jobs.example/apply",
    });
    await publishPlacementJob(tpo, job.id);

    await expect(
      applyToPlacementJob(
        learner,
        job.id,
        {},
      ),
    ).rejects.toMatchObject({
      code: "PLACEMENT_APPLICATION_CHANNEL_REQUIRED",
    });

    await expect(
      applyToPlacementJob(
        learner,
        job.id,
        { channel: "EXTERNAL" },
      ),
    ).rejects.toMatchObject({
      code:
        "PLACEMENT_APPLICATION_EXTERNAL_CONFIRMATION_REQUIRED",
    });

    const application =
      await applyToPlacementJob(
        learner,
        job.id,
        {
          channel: "EXTERNAL",
          externalConfirmation: true,
        },
      );
    expect(application.channel).toBe(
      "EXTERNAL",
    );

    await expect(
      applyToPlacementJob(
        learner,
        job.id,
        { channel: "INTERNAL" },
      ),
    ).rejects.toMatchObject({
      code: "PLACEMENT_APPLICATION_CHANNEL_CONFLICT",
    });
  });

  it("treats withdrawal as a stable terminal application state", async () => {
    const job = await createJob();
    await publishPlacementJob(tpo, job.id);

    const application =
      await applyToPlacementJob(
        learner,
        job.id,
        {},
      );
    const withdrawn =
      await withdrawPlacementApplication(
        learner,
        application.id,
      );
    expect(withdrawn.status).toBe(
      "WITHDRAWN",
    );
    expect(withdrawn.withdrawnAt).toBeInstanceOf(
      Date,
    );

    const history = await pool.query(
      `select from_status, to_status
       from placement_application_status_history
       where application_id = $1
       order by created_at asc`,
      [application.id],
    );
    expect(history.rows).toEqual([
      {
        from_status: null,
        to_status: "SUBMITTED",
      },
      {
        from_status: "SUBMITTED",
        to_status: "WITHDRAWN",
      },
    ]);

    const repeated =
      await withdrawPlacementApplication(
        learner,
        application.id,
      );
    expect(repeated.id).toBe(application.id);

    const repeatedHistory = await pool.query(
      `select count(*)::int as count
       from placement_application_status_history
       where application_id = $1`,
      [application.id],
    );
    expect(
      repeatedHistory.rows[0]?.count,
    ).toBe(2);

    await expect(
      applyToPlacementJob(
        learner,
        job.id,
        {},
      ),
    ).rejects.toMatchObject({
      code:
        "PLACEMENT_APPLICATION_ALREADY_WITHDRAWN",
    });
  });

  it("blocks expired jobs and cross-college learner substitution", async () => {
    const expired = await createJob({
      applicationDeadline: new Date(
        Date.now() - 60_000,
      ),
    });
    await publishPlacementJob(
      tpo,
      expired.id,
    );

    await expect(
      applyToPlacementJob(
        learner,
        expired.id,
        {},
      ),
    ).rejects.toMatchObject({
      code:
        "PLACEMENT_APPLICATION_DEADLINE_PASSED",
    });

    const open = await createJob();
    await publishPlacementJob(tpo, open.id);

    await expect(
      applyToPlacementJob(
        otherLearner,
        open.id,
        {},
      ),
    ).rejects.toThrow(
      "Missing permission: placements.read",
    );
  });
});
