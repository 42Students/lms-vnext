import { publishableJobTerms } from "../support/publishable-job-terms";
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
import { resolveRequestContext } from "@/modules/identity/context-service";
import { can } from "@/modules/permissions/policy";
import { applyToPlacementJob } from "@/modules/placements/application-service";
import { createPlacementCompany } from "@/modules/placements/company-service";
import {
  createPlacementJob,
} from "@/modules/placements/job-service";
import { publishPreparedPlacementJob } from "../support/publishable-job-fixture";
import { linkRecruiterOwnedJob } from "../support/persisted-job-recruiter-fixture";
import {
  grantPlacementRecruiter as grantPlacementRecruiterRaw,
  listOwnRecruiterPlacementJobs,
  revokePlacementRecruiterGrant,
} from "@/modules/placements/recruiter-service";
import {
  actOnPlacementRound,
  createPlacementRound,
} from "@/modules/placements/round-service";
import {
  applyPlacementRoundResult,
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

const recruiterUserId =
  "60000000-0000-4000-8000-000000000001";

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

const tpoB: RequestContext = {
  user: tpo.user,
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
  // College stage history holds the same FK even after its current state was
  // cleared. Delete historical children before the current stage projection.
  await pool.query(
    "delete from placement_college_application_stage_history",
  );
  await pool.query(
    "delete from placement_college_application_stages",
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
    "delete from placement_recruiter_drive_requests where recruiter_user_id = $1",
    [recruiterUserId],
  );
  await pool.query("delete from placement_jobs");
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
    "delete from in_app_notifications where user_id = $1",
    [recruiterUserId],
  );
  // An activity written by this recruiter can notify a TPO or learner,
  // not just the recruiter. Clear those linked receipts before their parent.
  await pool.query(
    "delete from in_app_notifications where event_id in (select id from activity_events where actor_user_id = $1)",
    [recruiterUserId],
  );
  await pool.query(
    "delete from activity_events where actor_user_id = $1",
    [recruiterUserId],
  );
  await pool.query(
    "delete from users where id = $1",
    [recruiterUserId],
  );
}

async function createRecruiterUser() {
  await pool.query(
    "insert into users (id, identity_uid, email, display_name) values ($1, $2, $3, $4)",
    [
      recruiterUserId,
      "seed-placement-recruiter",
      "recruiter@example.com",
      "Seed Recruiter",
    ],
  );
}

// T-S1-01: context hydration fails closed for NULL-validity / unverified
// grants, and the legacy grant service still inserts defaults. Activate here.
async function grantPlacementRecruiter(
  ...args: Parameters<typeof grantPlacementRecruiterRaw>
) {
  const result = await grantPlacementRecruiterRaw(...args);
  await pool.query(
    `update placement_recruiter_college_grants
        set verification_status='VERIFIED', valid_until=now()+interval '30 days'
      where status='ACTIVE' and valid_until is null`,
  );
  return result;
}

beforeEach(async () => {
  await cleanup();
  await enableSeedLearnerPlacementAccess(pool);
  await createRecruiterUser();
});

afterAll(async () => {
  await cleanup();
  await pool.end();
  await closeDatabaseConnection();
});

describe("Placement P7 recruiter identity and grants", () => {
  it("hydrates exact employer grants without creating college memberships", async () => {
    const companyA =
      await createPlacementCompany(tpo, {
        collegeId: SEED_IDS.collegeA,
        name: "Recruiter Systems",
        primaryDomain:
          "recruiter-systems.example",
      });

    const grantA =
      await grantPlacementRecruiter(tpo, {
        companyRelationshipId:
          companyA.relationship.id,
        email: "recruiter@example.com",
        title: "Talent Partner",
      });

    const jobA = await createPlacementJob(
      tpo,
      {
    ...publishableJobTerms,
        collegeId: SEED_IDS.collegeA,
        companyRelationshipId:
          companyA.relationship.id,
        title: "Recruiter Platform Engineer",
        description:
          "Recruiter visibility boundary fixture",
        employmentType: "FULL_TIME",
        workMode: "HYBRID",
        applicationMode: "INTERNAL",
      },
    );
    await publishPreparedPlacementJob(tpo, jobA.id);
    // Recruiter-visible drives are the recruiter's own approved requests.
    await linkRecruiterOwnedJob({
      recruiterUserId, collegeId: SEED_IDS.collegeA,
      companyRelationshipId: companyA.relationship.id,
      jobId: jobA.id, decidedByUserId: tpo.user.id,
    });

    const contextA =
      await resolveRequestContext({
        identityUid:
          "seed-placement-recruiter",
      });

    expect(contextA.membership).toBeNull();
    expect(contextA.recruiter).toMatchObject({
      userId: recruiterUserId,
      companyId: companyA.company.id,
      companyName: "Recruiter Systems",
      title: "Talent Partner",
    });
    expect(
      contextA.recruiter?.grants,
    ).toHaveLength(1);
    expect(
      can(
        contextA,
        "placements.recruiter.read",
        {
          collegeId: SEED_IDS.collegeA,
          placementCompanyRelationshipId:
            companyA.relationship.id,
        },
      ),
    ).toBe(true);
    expect(
      can(
        contextA,
        "placements.recruiter.read",
        {
          collegeId: SEED_IDS.collegeB,
          placementCompanyRelationshipId:
            companyA.relationship.id,
        },
      ),
    ).toBe(false);

    const visibleJobs =
      await listOwnRecruiterPlacementJobs(
        contextA,
      );
    expect(visibleJobs).toHaveLength(1);
    expect(visibleJobs[0]).toMatchObject({
      relationshipId:
        companyA.relationship.id,
      collegeId: SEED_IDS.collegeA,
      companyName: "Recruiter Systems",
    });
    expect(visibleJobs[0]?.job.id).toBe(
      jobA.id,
    );
    expect(
      visibleJobs[0],
    ).not.toHaveProperty("isTrusted");
    expect(
      visibleJobs[0],
    ).not.toHaveProperty(
      "ownerMembershipId",
    );

    const companyB =
      await createPlacementCompany(tpoB, {
        collegeId: SEED_IDS.collegeB,
        name: "Recruiter Systems",
        primaryDomain:
          "recruiter-systems.example",
      });
    expect(companyB.company.id).toBe(
      companyA.company.id,
    );

    await grantPlacementRecruiter(tpoB, {
      companyRelationshipId:
        companyB.relationship.id,
      email: "recruiter@example.com",
    });

    const multiCollege =
      await resolveRequestContext({
        identityUid:
          "seed-placement-recruiter",
      });
    expect(
      multiCollege.recruiter?.grants.map(
        (grant) => grant.collegeId,
      ),
    ).toEqual(
      expect.arrayContaining([
        SEED_IDS.collegeA,
        SEED_IDS.collegeB,
      ]),
    );

    const otherCompany =
      await createPlacementCompany(tpoB, {
        collegeId: SEED_IDS.collegeB,
        name: "Different Employer",
        primaryDomain:
          "different-employer.example",
      });
    await expect(
      grantPlacementRecruiter(tpoB, {
        companyRelationshipId:
          otherCompany.relationship.id,
        email: "recruiter@example.com",
      }),
    ).rejects.toMatchObject({
      code:
        "PLACEMENT_RECRUITER_COMPANY_CONFLICT",
    });

    await revokePlacementRecruiterGrant(
      tpo,
      grantA.grant.id,
    );
    const afterRevoke =
      await resolveRequestContext({
        identityUid:
          "seed-placement-recruiter",
      });
    expect(
      afterRevoke.recruiter?.grants.some(
        (grant) =>
          grant.collegeId ===
          SEED_IDS.collegeA,
      ),
    ).toBe(false);
  });

  it("allows recruiter result staging but keeps final application with TPO", async () => {
    const company =
      await createPlacementCompany(tpo, {
        collegeId: SEED_IDS.collegeA,
        name: "Interview Systems",
        primaryDomain:
          "interview-systems.example",
      });
    await grantPlacementRecruiter(tpo, {
      companyRelationshipId:
        company.relationship.id,
      email: "recruiter@example.com",
    });

    const job = await createPlacementJob(
      tpo,
      {
    ...publishableJobTerms,
        collegeId: SEED_IDS.collegeA,
        companyRelationshipId:
          company.relationship.id,
        title: "Interview Engineer",
        description:
          "Recruiter result staging fixture",
        employmentType: "FULL_TIME",
        workMode: "REMOTE",
        applicationMode: "INTERNAL",
      },
    );
    const round =
      await createPlacementRound(
        tpo,
        job.id,
        {
          kind: "INTERVIEW",
          name: "HR interview",
        },
      );
    await publishPreparedPlacementJob(tpo, job.id);
    await linkRecruiterOwnedJob({
      recruiterUserId, collegeId: SEED_IDS.collegeA,
      companyRelationshipId: company.relationship.id,
      jobId: job.id, decidedByUserId: tpo.user.id,
    });
    const application =
      await applyToPlacementJob(
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
          "Shortlisted for HR interview",
      },
    );
    await actOnPlacementRound(
      tpo,
      round.id,
      {
        action: "SCHEDULE",
        scheduledAt: new Date(Date.now()+12*86_400_000),
        timezone: "Asia/Kolkata",
        mode: "VIRTUAL",
        meetingUrl:
          "https://meet.example/hr-interview",
      },
    );

    const recruiter =
      await resolveRequestContext({
        identityUid:
          "seed-placement-recruiter",
      });

    await expect(
      stagePlacementRoundResult(
        recruiter,
        round.id,
        {
          applicationId: application.id,
          outcome: "PASS",
          scorePercent: 90,
          internalComment:
            "College-private note",
        },
      ),
    ).rejects.toMatchObject({
      code:
        "PLACEMENT_RECRUITER_INTERNAL_COMMENT_FORBIDDEN",
    });

    const hrStaged =
      await stagePlacementRoundResult(
        recruiter,
        round.id,
        {
          applicationId: application.id,
          outcome: "PASS",
          scorePercent: 90,
        },
      );
    expect(hrStaged).toMatchObject({
      status: "STAGED",
      source: "HR",
    });

    const staged =
      await stagePlacementRoundResult(
        tpo,
        round.id,
        {
          applicationId: application.id,
          outcome: "PASS",
          scorePercent: 91,
          internalComment:
            "Placement-team approved update",
        },
      );
    expect(staged).toMatchObject({
      status: "STAGED",
      source: "TPO",
    });

    await expect(
      stagePlacementRoundResult(
        recruiter,
        round.id,
        {
          applicationId: application.id,
          outcome: "PASS",
          scorePercent: 92,
        },
      ),
    ).rejects.toMatchObject({
      code:
        "PLACEMENT_RECRUITER_RESULT_CONFLICT",
    });

    await expect(
      applyPlacementRoundResult(
        recruiter,
        staged.id,
      ),
    ).rejects.toThrow(
      "Missing permission: placements.manage",
    );

    await actOnPlacementRound(
      tpo,
      round.id,
      { action: "COMPLETE" },
    );
    await expect(
      applyPlacementRoundResult(
        tpo,
        staged.id,
      ),
    ).resolves.toMatchObject({
      status: "APPLIED",
      source: "TPO",
    });
  });
});
