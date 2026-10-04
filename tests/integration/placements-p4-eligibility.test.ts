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
  createPlacementJob,
} from "@/modules/placements/job-service";
import {
  evaluatePlacementEligibility,
  getManagedAcademicEvidence,
  setEligibilityOverride,
  upsertJobEligibilityPolicy,
  upsertOwnAcademicEvidence,
  upsertVerifiedAcademicEvidence,
} from "@/modules/placements/eligibility-service";
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
  id: "79000000-0000-4000-8000-000000000001",
  roleId: "79000000-0000-4000-8000-000000000002",
};

async function cleanup() {
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

async function createJob() {
  const company = await createPlacementCompany(
    tpo,
    {
      collegeId: SEED_IDS.collegeA,
      name: "Eligibility Systems",
      primaryDomain: "eligibility.example",
    },
  );

  return createPlacementJob(tpo, {
    collegeId: SEED_IDS.collegeA,
    companyRelationshipId:
      company.relationship.id,
    title: "Eligibility Engineer",
    description: "Eligibility test role",
    employmentType: "FULL_TIME",
    workMode: "HYBRID",
    locations: ["Hyderabad"],
    applicationMode: "INTERNAL",
  });
}

beforeEach(async () => {
  await cleanup();
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

describe("Placement P4 eligibility", () => {
  it("distinguishes missing evidence, hard failure and verified eligibility", async () => {
    const job = await createJob();
    await upsertJobEligibilityPolicy(
      tpo,
      job.id,
      {
        minCgpa: 7.5,
        maxActiveBacklogs: 0,
        minTenthPercentage: 60,
      },
    );

    await expect(
      evaluatePlacementEligibility(
        learner,
        job.id,
      ),
    ).resolves.toMatchObject({
      status:
        "ELIGIBLE_WITH_MISSING_EVIDENCE",
      checks: expect.arrayContaining([
        expect.objectContaining({
          criterion: "CGPA",
          status: "MISSING",
        }),
      ]),
    });

    await upsertOwnAcademicEvidence(learner, {
      cgpa: 7.1,
      activeBacklogs: 0,
      tenthPercentage: 82,
    });
    await expect(
      evaluatePlacementEligibility(
        learner,
        job.id,
      ),
    ).resolves.toMatchObject({
      status: "INELIGIBLE",
      checks: expect.arrayContaining([
        expect.objectContaining({
          criterion: "CGPA",
          status: "FAIL",
        }),
      ]),
    });

    await upsertVerifiedAcademicEvidence(
      tpo,
      SEED_IDS.learnerCollegeAMembership,
      {
        cgpa: 8.2,
        activeBacklogs: 0,
        tenthPercentage: 82,
      },
    );
    await expect(
      evaluatePlacementEligibility(
        learner,
        job.id,
      ),
    ).resolves.toMatchObject({
      status: "ELIGIBLE",
    });

    await expect(
      upsertOwnAcademicEvidence(learner, {
        cgpa: 9,
      }),
    ).rejects.toMatchObject({
      code: "PLACEMENT_ACADEMIC_EVIDENCE_VERIFIED",
    });
  });

  it("lets managers read normalized candidate evidence only inside their placement tenant", async () => {
    await upsertOwnAcademicEvidence(learner, {
      cgpa: 8.15,
      activeBacklogs: 1,
      tenthPercentage: 82.75,
      twelfthPercentage: 79.5,
      gapYears: 0,
      passingYear: 2026,
    });

    await expect(
      getManagedAcademicEvidence(
        tpo,
        SEED_IDS.learnerCollegeAMembership,
      ),
    ).resolves.toMatchObject({
      membershipId:
        SEED_IDS.learnerCollegeAMembership,
      source: "SELF",
      cgpa: 8.15,
      activeBacklogs: 1,
      tenthPercentage: 82.75,
      twelfthPercentage: 79.5,
      passingYear: 2026,
    });

    await upsertVerifiedAcademicEvidence(
      tpo,
      SEED_IDS.learnerCollegeAMembership,
      {
        cgpa: 8.25,
        activeBacklogs: 0,
        tenthPercentage: 83,
        twelfthPercentage: 80,
        gapYears: 0,
        passingYear: 2026,
      },
    );

    await expect(
      getManagedAcademicEvidence(
        tpo,
        SEED_IDS.learnerCollegeAMembership,
      ),
    ).resolves.toMatchObject({
      source: "VERIFIED",
      cgpa: 8.25,
      activeBacklogs: 0,
      tenthPercentage: 83,
      twelfthPercentage: 80,
    });

    await expect(
      getManagedAcademicEvidence(
        tpo,
        otherMembership.id,
      ),
    ).rejects.toThrow(
      "Missing permission: placements.manage",
    );
  });

  it("supports explicit reasoned overrides without deleting underlying evidence", async () => {
    const job = await createJob();
    await upsertJobEligibilityPolicy(
      tpo,
      job.id,
      {
        minCgpa: 9,
        missingEvidencePolicy:
          "REQUIRE_COMPLETE",
      },
    );
    await upsertVerifiedAcademicEvidence(
      tpo,
      SEED_IDS.learnerCollegeAMembership,
      { cgpa: 7.5 },
    );

    await setEligibilityOverride(
      tpo,
      job.id,
      SEED_IDS.learnerCollegeAMembership,
      {
        decision: "INCLUDE",
        reason:
          "Approved documented exception by placement cell",
      },
    );

    await expect(
      evaluatePlacementEligibility(
        learner,
        job.id,
      ),
    ).resolves.toMatchObject({
      status: "ELIGIBLE",
      override: {
        decision: "INCLUDE",
      },
    });
  });

  it("rejects cross-college learner substitution", async () => {
    const job = await createJob();

    await expect(
      evaluatePlacementEligibility(
        tpo,
        job.id,
        otherMembership.id,
      ),
    ).rejects.toMatchObject({
      code: "PLACEMENT_LEARNER_MEMBERSHIP_NOT_FOUND",
    });

    await expect(
      setEligibilityOverride(
        tpo,
        job.id,
        otherMembership.id,
        {
          decision: "INCLUDE",
          reason: "Must not cross tenant boundary",
        },
      ),
    ).rejects.toMatchObject({
      code: "PLACEMENT_LEARNER_MEMBERSHIP_NOT_FOUND",
    });
  });
});
