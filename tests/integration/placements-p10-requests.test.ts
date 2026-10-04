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
import { applyToPlacementJob } from "@/modules/placements/application-service";
import { createPlacementCompany } from "@/modules/placements/company-service";
import {
  createPlacementJob,
  publishPlacementJob,
} from "@/modules/placements/job-service";
import { issuePlacementOffer } from "@/modules/placements/offer-service";
import {
  actOnPlacementRound,
  createPlacementRound,
} from "@/modules/placements/round-service";
import {
  applyPlacementRoundResult,
  stagePlacementRoundResult,
} from "@/modules/placements/result-service";
import {
  actOnPlacementLearnerRequest,
  createPlacementLearnerRequest,
  listOwnPlacementLearnerRequests,
} from "@/modules/placements/request-service";
import { decidePlacementScreening } from "@/modules/placements/screening-service";
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
  await pool.query("delete from in_app_notifications");
  await pool.query("delete from activity_events");
  await pool.query("delete from placement_learner_requests");
  await pool.query("delete from placement_joining_history");
  await pool.query("delete from placement_joining_outcomes");
  await pool.query("delete from placement_offer_status_history");
  await pool.query("delete from placement_offers");
  await pool.query("delete from placement_round_results");
  await pool.query("delete from placement_job_round_events");
  await pool.query("delete from placement_job_rounds");
  await pool.query("delete from placement_application_screening_history");
  await pool.query("delete from placement_application_screenings");
  await pool.query("delete from placement_application_status_history");
  await pool.query("delete from placement_applications");
  await pool.query("delete from placement_eligibility_overrides");
  await pool.query("delete from placement_job_eligibility_policies");
  await pool.query("delete from placement_candidate_academic_evidence");
  await pool.query("delete from placement_jobs");
  await pool.query("delete from placement_recruiter_college_grants");
  await pool.query("delete from placement_recruiter_profiles");
  await pool.query("delete from placement_company_relationships");
  await pool.query("delete from placement_companies");
}

async function preparePassedApplication() {
  const company =
    await createPlacementCompany(tpo, {
      collegeId: SEED_IDS.collegeA,
      name: "Request Systems",
      primaryDomain:
        "request-systems.example",
    });

  const job = await createPlacementJob(
    tpo,
    {
      collegeId: SEED_IDS.collegeA,
      companyRelationshipId:
        company.relationship.id,
      title: "Request Engineer",
      description:
        "Learner request fixture",
      employmentType: "FULL_TIME",
      workMode: "HYBRID",
      applicationMode: "INTERNAL",
    },
  );

  const round =
    await createPlacementRound(
      tpo,
      job.id,
      {
        kind: "INTERVIEW",
        name: "Final interview",
      },
    );

  await publishPlacementJob(
    tpo,
    job.id,
  );

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
        "Shortlisted",
    },
  );

  await actOnPlacementRound(
    tpo,
    round.id,
    {
      action: "SCHEDULE",
      scheduledAt: new Date(
        "2026-10-24T04:30:00.000Z",
      ),
      timezone: "Asia/Kolkata",
      mode: "VIRTUAL",
      meetingUrl:
        "https://meet.example/request",
    },
  );

  await actOnPlacementRound(
    tpo,
    round.id,
    { action: "COMPLETE" },
  );

  const staged =
    await stagePlacementRoundResult(
      tpo,
      round.id,
      {
        applicationId:
          application.id,
        outcome: "PASS",
        scorePercent: 92,
      },
    );

  await applyPlacementRoundResult(
    tpo,
    staged.id,
  );

  return {
    company,
    job,
    round,
    application,
  };
}

beforeEach(async () => {
  await cleanup();
});

afterAll(async () => {
  await cleanup();
  await pool.end();
  await closeDatabaseConnection();
});

describe("Placement P10 learner requests", () => {
  it("approves an offer extension atomically and notifies the learner", async () => {
    const { application } =
      await preparePassedApplication();

    const offer =
      await issuePlacementOffer(
        tpo,
        application.id,
        {
          roleTitle:
            "Software Engineer",
          annualCtcInr: 1_200_000,
          expiresAt: new Date(
            "2026-11-01T18:29:59.000Z",
          ),
        },
      );

    const requestedExpiry =
      new Date(
        "2026-11-08T18:29:59.000Z",
      );
    const created =
      await createPlacementLearnerRequest(
        learner,
        {
          applicationId:
            application.id,
          requestType:
            "OFFER_EXTENSION",
          offerId: offer.id,
          reason:
            "Need time to complete family discussion",
          requestedExpiresAt:
            requestedExpiry,
        },
        new Date(
          "2026-10-25T00:00:00.000Z",
        ),
      );

    const repeated =
      await createPlacementLearnerRequest(
        learner,
        {
          applicationId:
            application.id,
          requestType:
            "OFFER_EXTENSION",
          offerId: offer.id,
          reason:
            "Need time to complete family discussion",
          requestedExpiresAt:
            requestedExpiry,
        },
        new Date(
          "2026-10-25T00:00:00.000Z",
        ),
      );
    expect(repeated.id).toBe(
      created.id,
    );

    const approved =
      await actOnPlacementLearnerRequest(
        tpo,
        created.id,
        {
          action: "APPROVE",
          reason:
            "Approved after recruiter confirmation",
        },
        new Date(
          "2026-10-26T00:00:00.000Z",
        ),
      );

    expect(approved.status).toBe(
      "APPROVED",
    );
    expect(
      approved.effectAppliedAt,
    ).not.toBeNull();

    const offerRow =
      await pool.query<{
        expires_at: Date;
      }>(
        "select expires_at from placement_offers where id = $1",
        [offer.id],
      );
    expect(
      offerRow.rows[0]!.expires_at.toISOString(),
    ).toBe(
      requestedExpiry.toISOString(),
    );

    const notifications =
      await pool.query(
        `select n.id
           from in_app_notifications n
           join activity_events e
             on e.id = n.event_id
          where n.user_id = $1
            and e.dedupe_key = $2`,
        [
          SEED_IDS.learnerUser,
          `placement-request:${created.id}:approved`,
        ],
      );
    expect(
      notifications.rowCount,
    ).toBe(1);

    const own =
      await listOwnPlacementLearnerRequests(
        learner,
      );
    expect(own[0]).toMatchObject({
      request: {
        id: created.id,
        status: "APPROVED",
      },
    });

    const repeatedApproval =
      await actOnPlacementLearnerRequest(
        tpo,
        created.id,
        { action: "APPROVE" },
      );
    expect(
      repeatedApproval.status,
    ).toBe("APPROVED");
  });

  it("approves application withdrawal through the request transaction", async () => {
    const { application } =
      await preparePassedApplication();

    const request =
      await createPlacementLearnerRequest(
        learner,
        {
          applicationId:
            application.id,
          requestType:
            "APPLICATION_WITHDRAWAL",
          reason:
            "I am no longer pursuing this opportunity",
        },
      );

    await actOnPlacementLearnerRequest(
      tpo,
      request.id,
      {
        action: "APPROVE",
      },
    );

    const applicationRow =
      await pool.query<{
        status: string;
        withdrawn_at: Date | null;
      }>(
        `select status, withdrawn_at
           from placement_applications
          where id = $1`,
        [application.id],
      );
    expect(
      applicationRow.rows[0],
    ).toMatchObject({
      status: "WITHDRAWN",
    });
    expect(
      applicationRow.rows[0]!
        .withdrawn_at,
    ).not.toBeNull();

    const history =
      await pool.query(
        `select id
           from placement_application_status_history
          where application_id = $1
            and from_status = 'SUBMITTED'
            and to_status = 'WITHDRAWN'`,
        [application.id],
      );
    expect(history.rowCount).toBe(1);
  });

  it("never records APPROVED when no domain effect exists", async () => {
    const { application } =
      await preparePassedApplication();

    const request =
      await createPlacementLearnerRequest(
        learner,
        {
          applicationId:
            application.id,
          requestType:
            "CORRECTION",
          reason:
            "My placement record needs a correction",
          correctionField:
            "candidateName",
          requestedValue:
            "Corrected display name",
        },
      );

    await expect(
      actOnPlacementLearnerRequest(
        tpo,
        request.id,
        {
          action: "APPROVE",
        },
      ),
    ).rejects.toMatchObject({
      code:
        "PLACEMENT_REQUEST_EFFECT_UNSUPPORTED",
    });

    const persisted =
      await pool.query<{
        status: string;
        effect_applied_at:
          Date | null;
      }>(
        `select status, effect_applied_at
           from placement_learner_requests
          where id = $1`,
        [request.id],
      );
    expect(
      persisted.rows[0],
    ).toMatchObject({
      status: "PENDING",
      effect_applied_at: null,
    });

    const rejected =
      await actOnPlacementLearnerRequest(
        tpo,
        request.id,
        {
          action: "REJECT",
          reason:
            "Please update the canonical learner profile instead",
        },
      );
    expect(rejected.status).toBe(
      "REJECTED",
    );
  });

  it("keeps create and cancel learner-scoped", async () => {
    const { application } =
      await preparePassedApplication();

    await expect(
      createPlacementLearnerRequest(
        tpo,
        {
          applicationId:
            application.id,
          requestType:
            "OTHER",
          reason:
            "Manager cannot impersonate learner request creation",
        },
      ),
    ).rejects.toBeInstanceOf(
      AuthorizationError,
    );

    const request =
      await createPlacementLearnerRequest(
        learner,
        {
          applicationId:
            application.id,
          requestType: "OTHER",
          reason:
            "Need clarification from the placement team",
        },
      );

    await expect(
      actOnPlacementLearnerRequest(
        tpo,
        request.id,
        { action: "CANCEL" },
      ),
    ).rejects.toBeInstanceOf(
      AuthorizationError,
    );

    const cancelled =
      await actOnPlacementLearnerRequest(
        learner,
        request.id,
        { action: "CANCEL" },
      );
    expect(cancelled.status).toBe(
      "CANCELLED",
    );
  });
});
