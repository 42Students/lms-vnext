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
  withdrawPlacementApplication,
} from "@/modules/placements/application-service";
import { createPlacementCompany } from "@/modules/placements/company-service";
import {
  createPlacementJob,
  publishPlacementJob,
} from "@/modules/placements/job-service";
import {
  decidePlacementScreening,
  getPlacementScreening,
  listPlacementScreeningQueue,
} from "@/modules/placements/screening-service";
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

async function createPublishedJob() {
  const company = await createPlacementCompany(
    tpo,
    {
      collegeId: SEED_IDS.collegeA,
      name: "Screening Systems",
      primaryDomain: "screening.example",
    },
  );
  const job = await createPlacementJob(tpo, {
    collegeId: SEED_IDS.collegeA,
    companyRelationshipId:
      company.relationship.id,
    title: "Screening Engineer",
    description:
      "Screening state-machine test role",
    employmentType: "FULL_TIME",
    workMode: "HYBRID",
    applicationMode: "INTERNAL",
  });
  return publishPlacementJob(tpo, job.id);
}

async function createApplication() {
  const job = await createPublishedJob();
  const application = await applyToPlacementJob(
    learner,
    job.id,
    {},
  );
  return { job, application };
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

describe("Placement P6A screening", () => {
  it("creates a pending screening queue item and exposes only learner-safe state", async () => {
    const { job, application } =
      await createApplication();

    const queue =
      await listPlacementScreeningQueue(
        tpo,
        job.id,
      );
    expect(queue).toHaveLength(1);
    expect(queue[0]?.screening).toMatchObject({
      applicationId: application.id,
      status: "PENDING",
    });

    const publicView =
      await getPlacementScreening(
        learner,
        application.id,
      );
    expect(publicView).toMatchObject({
      applicationId: application.id,
      status: "UNDER_REVIEW",
      candidateMessage: null,
    });
    expect(publicView).not.toHaveProperty(
      "internalReason",
    );
  });

  it("audits hold-to-shortlist transitions without leaking internal notes", async () => {
    const { application } =
      await createApplication();

    await decidePlacementScreening(
      tpo,
      application.id,
      {
        decision: "HOLD",
        internalReason:
          "Recruiter requested manual review",
      },
    );

    const holdView =
      await getPlacementScreening(
        learner,
        application.id,
      );
    expect(holdView).toMatchObject({
      status: "UNDER_REVIEW",
      candidateMessage: null,
    });
    expect(holdView).not.toHaveProperty(
      "internalReason",
    );

    const shortlisted =
      await decidePlacementScreening(
        tpo,
        application.id,
        {
          decision: "SHORTLISTED",
          candidateMessage:
            "Shortlisted for the next stage",
        },
      );
    expect(shortlisted.status).toBe(
      "SHORTLISTED",
    );

    const repeated =
      await decidePlacementScreening(
        tpo,
        application.id,
        {
          decision: "SHORTLISTED",
        },
      );
    expect(repeated.status).toBe(
      "SHORTLISTED",
    );

    const managerView =
      await getPlacementScreening(
        tpo,
        application.id,
      );
    if (!("history" in managerView)) {
      throw new Error(
        "Manager screening view must include history",
      );
    }
    expect(managerView.history).toHaveLength(2);
    expect(
      managerView.history.map((item) => [
        item.fromStatus,
        item.toStatus,
      ]),
    ).toEqual([
      ["PENDING", "HOLD"],
      ["HOLD", "SHORTLISTED"],
    ]);

    await expect(
      decidePlacementScreening(
        tpo,
        application.id,
        {
          decision: "REJECTED",
          candidateMessage:
            "Not selected after review",
        },
      ),
    ).rejects.toMatchObject({
      code:
        "PLACEMENT_SCREENING_INVALID_TRANSITION",
    });
  });

  it("keeps rejection internals private while exposing candidate-safe wording", async () => {
    const { application } =
      await createApplication();

    await decidePlacementScreening(
      tpo,
      application.id,
      {
        decision: "REJECTED",
        candidateMessage:
          "Not shortlisted for this opportunity",
        internalReason:
          "Role-specific recruiter assessment",
      },
    );

    const publicView =
      await getPlacementScreening(
        learner,
        application.id,
      );
    expect(publicView).toMatchObject({
      status: "REJECTED",
      candidateMessage:
        "Not shortlisted for this opportunity",
    });
    expect(publicView).not.toHaveProperty(
      "internalReason",
    );

    const managerView =
      await getPlacementScreening(
        tpo,
        application.id,
      );
    if (!("screening" in managerView)) {
      throw new Error(
        "Manager screening view must include internal state",
      );
    }
    expect(
      managerView.screening.internalReason,
    ).toBe(
      "Role-specific recruiter assessment",
    );
  });

  it("removes withdrawn applications from the active queue and blocks later decisions", async () => {
    const { job, application } =
      await createApplication();
    await withdrawPlacementApplication(
      learner,
      application.id,
    );

    await expect(
      listPlacementScreeningQueue(tpo, job.id),
    ).resolves.toEqual([]);

    await expect(
      decidePlacementScreening(
        tpo,
        application.id,
        {
          decision: "SHORTLISTED",
        },
      ),
    ).rejects.toMatchObject({
      code:
        "PLACEMENT_SCREENING_APPLICATION_INACTIVE",
    });
  });

  it("rejects a screening manager from another college", async () => {
    const { job, application } =
      await createApplication();

    await expect(
      listPlacementScreeningQueue(
        otherCollegeTpo,
        job.id,
      ),
    ).rejects.toThrow(
      "Missing permission: placements.manage",
    );

    await expect(
      decidePlacementScreening(
        otherCollegeTpo,
        application.id,
        {
          decision: "SHORTLISTED",
        },
      ),
    ).rejects.toThrow(
      "Missing permission: placements.manage",
    );
  });
});
