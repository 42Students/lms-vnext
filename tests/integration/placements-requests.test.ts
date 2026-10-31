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
import { applyToPlacementJob } from "@/modules/placements/application-service";
import { createPlacementCompany } from "@/modules/placements/company-service";
import { getPlacementDriveDay } from "@/modules/placements/drive-day-service";
import {
  createPlacementJob,
} from "@/modules/placements/job-service";
import { publishPreparedPlacementJob } from "../support/publishable-job-fixture";
import {
  issuePlacementOffer,
  listOwnPlacementOffers,
} from "@/modules/placements/offer-service";
import {
  actOnPlacementRequest,
  createPlacementRequest,
  listOwnPlacementRequests,
} from "@/modules/placements/request-service";
import {
  actOnPlacementRound,
  createPlacementRound,
  getPlacementRound,
} from "@/modules/placements/round-service";
import {
  applyPlacementRoundResult,
  stagePlacementRoundResult,
} from "@/modules/placements/result-service";
import { decidePlacementScreening } from "@/modules/placements/screening-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { enableSeedLearnerPlacementAccess } from "../support/w04-placement-access-fixture";

const databaseUrl = process.env.TEST_DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "Explicit disposable TEST_DATABASE_URL is required for this destructive integration fixture",
  );
}

// Fail closed before any destructive fixture cleanup; never use the application DB.
assertDb018DisposableTarget(process.env, {serviceBound: true});

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
    "delete from in_app_notifications",
  );
  await pool.query(
    "delete from activity_events",
  );
  await pool.query(
    "delete from placement_application_round_exceptions",
  );
  await pool.query(
    "delete from placement_learner_requests",
  );
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
    "delete from placement_tpo_application_stages",
  );
  await pool.query(
    "delete from placement_job_round_events",
  );
  // The DB014 parent-retention trigger must remain active. On this explicitly
  // disposable PG fixture, remove only test attendance evidence before deleting
  // its referenced rounds; production retention rules are untouched.
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
  // Application-specific College Admin pipeline stages and their audit
  // history retain foreign keys to applications even after TPO stages clear.
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
  await pool.query("delete from placement_drive_day_coordinator_assignments");
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
}

async function createApplication(
  suffix: string,
) {
  const company =
    await createPlacementCompany(tpo, {
      collegeId: SEED_IDS.collegeA,
      name: "Request Systems " + suffix,
      primaryDomain:
        "requests-" +
        suffix.toLowerCase() +
        ".example",
    });
  const job = await createPlacementJob(
    tpo,
    {
      ...publishableJobTerms,
      collegeId: SEED_IDS.collegeA,
      companyRelationshipId:
        company.relationship.id,
      title: "Request Engineer " + suffix,
      description:
        "Learner request integration fixture",
      employmentType: "FULL_TIME",
      workMode: "HYBRID",
      applicationMode: "INTERNAL",
    },
  );
  await publishPreparedPlacementJob(tpo, job.id, {
    round: { kind: "INTERVIEW", name: "Evaluative interview" },
  });
  const application =
    await applyToPlacementJob(
      learner,
      job.id,
      {},
    );
  return {
    company,
    job,
    application,
  };
}

async function createJob(
  suffix: string,
) {
  const company =
    await createPlacementCompany(tpo, {
      collegeId: SEED_IDS.collegeA,
      name: "Request Flow " + suffix,
      primaryDomain:
        "request-flow-" +
        suffix.toLowerCase() +
        ".example",
    });
  const job = await createPlacementJob(
    tpo,
    {
      ...publishableJobTerms,
      collegeId: SEED_IDS.collegeA,
      companyRelationshipId:
        company.relationship.id,
      title: "Flow Engineer " + suffix,
      description:
        "Request workflow fixture",
      employmentType: "FULL_TIME",
      workMode: "REMOTE",
      applicationMode: "INTERNAL",
    },
  );
  return {
    company,
    job,
  };
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

describe("Placement learner requests and exceptions", () => {
  it("approves withdrawal atomically, scopes managers, and rejects conflicting duplicate payloads", async () => {
    const { application } =
      await createApplication("Withdraw");

    const request =
      await createPlacementRequest(
        learner,
        {
          requestType:
            "APPLICATION_WITHDRAWAL",
          applicationId:
            application.id,
          reason:
            "Accepted another opportunity",
        },
      );

    const repeated =
      await createPlacementRequest(
        learner,
        {
          requestType:
            "APPLICATION_WITHDRAWAL",
          applicationId:
            application.id,
          reason:
            "Accepted another opportunity",
        },
      );
    expect(repeated.id).toBe(
      request.id,
    );

    await expect(
      createPlacementRequest(
        learner,
        {
          requestType:
            "APPLICATION_WITHDRAWAL",
          applicationId:
            application.id,
          reason:
            "Different pending reason",
        },
      ),
    ).rejects.toMatchObject({
      code:
        "PLACEMENT_REQUEST_CONFLICT",
    });

    await expect(
      actOnPlacementRequest(
        otherCollegeTpo,
        request.id,
        { action: "APPROVE" },
      ),
    ).rejects.toThrow(
      "Missing permission: placements.manage",
    );

    const approved =
      await actOnPlacementRequest(
        tpo,
        request.id,
        {
          action: "APPROVE",
          note:
            "Learner confirmed the withdrawal",
        },
      );
    expect(approved.status).toBe(
      "APPROVED",
    );

    const applicationRow =
      await pool.query<{
        status: string;
        withdrawn_at: Date | null;
      }>(
        "select status, withdrawn_at from placement_applications where id = $1",
        [application.id],
      );
    expect(
      applicationRow.rows[0]?.status,
    ).toBe("WITHDRAWN");
    expect(
      applicationRow.rows[0]
        ?.withdrawn_at,
    ).not.toBeNull();

    const history =
      await pool.query<{
        from_status: string | null;
        to_status: string;
      }>(
        "select from_status, to_status from placement_application_status_history where application_id = $1 order by created_at asc",
        [application.id],
      );
    expect(
      history.rows.at(-1),
    ).toMatchObject({
      from_status: "SUBMITTED",
      to_status: "WITHDRAWN",
    });

    const ownRequests =
      await listOwnPlacementRequests(
        learner,
      );
    expect(
      ownRequests[0]?.request,
    ).toMatchObject({
      id: request.id,
      status: "APPROVED",
    });
  });

  it("allows reschedule only for an actual progressed participant and preserves the shared round schedule", async () => {
    const { job } =
      await createJob(
        "Reschedule",
      );

    const firstRound =
      await createPlacementRound(
        tpo,
        job.id,
        {
          kind: "TEST",
          name: "Aptitude test",
        },
      );
    const secondRound =
      await createPlacementRound(
        tpo,
        job.id,
        {
          kind: "INTERVIEW",
          name: "Technical interview",
          durationMinutes: 60,
        },
      );

    await publishPreparedPlacementJob(
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
          "Proceed to assessment",
      },
    );

    await actOnPlacementRound(
      tpo,
      firstRound.id,
      {
        action: "SCHEDULE",
        scheduledAt: new Date(
          "2035-10-20T04:30:00.000Z",
        ),
        timezone: "Asia/Kolkata",
        mode: "VIRTUAL",
        meetingUrl:
          "https://meet.example/aptitude",
      },
    );
    await actOnPlacementRound(
      tpo,
      secondRound.id,
      {
        action: "SCHEDULE",
        scheduledAt: new Date(
          "2035-10-21T04:30:00.000Z",
        ),
        timezone: "Asia/Kolkata",
        mode: "ON_CAMPUS",
        venue: "Block A",
      },
    );

    await expect(
      createPlacementRequest(
        learner,
        {
          requestType:
            "ROUND_RESCHEDULE",
          applicationId:
            application.id,
          roundId: secondRound.id,
          reason:
            "University examination clash",
          scheduledAt: new Date(
            "2035-10-22T04:30:00.000Z",
          ),
          timezone: "Asia/Kolkata",
          mode: "VIRTUAL",
          meetingUrl:
            "https://meet.example/exception",
        },
      ),
    ).rejects.toMatchObject({
      code:
        "PLACEMENT_REQUEST_EFFECT_INVALID",
    });

    await actOnPlacementRound(
      tpo,
      firstRound.id,
      { action: "COMPLETE" },
    );
    const staged =
      await stagePlacementRoundResult(
        tpo,
        firstRound.id,
        {
          applicationId:
            application.id,
          outcome: "PASS",
          scorePercent: 88,
        },
      );
    await applyPlacementRoundResult(
      tpo,
      staged.id,
    );

    const request =
      await createPlacementRequest(
        learner,
        {
          requestType:
            "ROUND_RESCHEDULE",
          applicationId:
            application.id,
          roundId: secondRound.id,
          reason:
            "University examination clash",
          scheduledAt: new Date(
            "2035-10-22T04:30:00.000Z",
          ),
          timezone: "Asia/Kolkata",
          mode: "VIRTUAL",
          meetingUrl:
            "https://meet.example/exception",
        },
      );

    await actOnPlacementRequest(
      tpo,
      request.id,
      {
        action: "APPROVE",
        note:
          "Verified university exam schedule",
      },
    );

    const sharedRound =
      await getPlacementRound(
        tpo,
        secondRound.id,
      );
    expect(
      sharedRound.round.scheduledAt?.toISOString(),
    ).toBe(
      "2035-10-21T04:30:00.000Z",
    );
    expect(
      sharedRound.round.venue,
    ).toBe("Block A");

    const drive =
      await getPlacementDriveDay(
        tpo,
        job.id,
      );
    const second =
      drive.rounds.find(
        (item) =>
          item.id === secondRound.id,
      );
    const participant =
      second?.participants.find(
        (item) =>
          item.applicationId ===
          application.id,
      );
    expect(
      participant?.scheduleException
        ?.scheduledAt.toISOString(),
    ).toBe(
      "2035-10-22T04:30:00.000Z",
    );
    expect(
      participant?.scheduleException
        ?.meetingUrl,
    ).toBe(
      "https://meet.example/exception",
    );
  });

  it("extends an issued offer on approval and withdraws only after closing an unaccepted offer", async () => {
    const { job } =
      await createJob("Offer");
    const round =
      await createPlacementRound(
        tpo,
        job.id,
        {
          kind: "INTERVIEW",
          name: "Final interview",
        },
      );

    await publishPreparedPlacementJob(
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
          "Final interview",
      },
    );
    await actOnPlacementRound(
      tpo,
      round.id,
      {
        action: "SCHEDULE",
        scheduledAt: new Date(
          "2035-10-25T04:30:00.000Z",
        ),
        timezone: "Asia/Kolkata",
        mode: "VIRTUAL",
        meetingUrl:
          "https://meet.example/final",
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
          scorePercent: 94,
        },
      );
    await applyPlacementRoundResult(
      tpo,
      staged.id,
    );

    const offer =
      await issuePlacementOffer(
        tpo,
        application.id,
        {
          roleTitle:
            "Graduate Engineer",
          annualCtcInr: 1_100_000,
          expiresAt: new Date(
            "2035-11-01T18:29:59.000Z",
          ),
        },
      );

    const extension =
      await createPlacementRequest(
        learner,
        {
          requestType:
            "OFFER_EXTENSION",
          applicationId:
            application.id,
          offerId: offer.id,
          reason:
            "Need time to complete university formalities",
          requestedExpiresAt: new Date(
            "2035-11-05T18:29:59.000Z",
          ),
        },
      );

    const before =
      await listOwnPlacementOffers(
        learner,
      );
    expect(
      before[0]?.offer.expiresAt?.toISOString(),
    ).toBe(
      "2035-11-01T18:29:59.000Z",
    );

    const approved =
      await actOnPlacementRequest(
        tpo,
        extension.id,
        {
          action: "APPROVE",
          note:
            "Extension approved",
        },
      );
    expect(approved.status).toBe(
      "APPROVED",
    );

    const after =
      await listOwnPlacementOffers(
        learner,
      );
    expect(
      after[0]?.offer.expiresAt?.toISOString(),
    ).toBe(
      "2035-11-05T18:29:59.000Z",
    );

    // An ISSUED offer has been released but not accepted. The learner may
    // request withdrawal; only the placement cell may approve it, and that
    // approval must atomically decline the unaccepted offer.
    const withdrawal =
      await createPlacementRequest(
        learner,
        {
          requestType:
            "APPLICATION_WITHDRAWAL",
          applicationId:
            application.id,
          reason:
            "Unable to join after receiving the offer",
        },
      );
    expect(withdrawal.status).toBe("PENDING");

    const withdrawn =
      await actOnPlacementRequest(
        tpo,
        withdrawal.id,
        {
          action: "APPROVE",
          note: "Unaccepted offer closed before withdrawal",
        },
      );
    expect(withdrawn.status).toBe("APPROVED");

    const offerStatus = await pool.query<{ status: string }>(
      "select status from placement_offers where id = $1",
      [offer.id],
    );
    expect(offerStatus.rows[0]?.status).toBe("DECLINED");

    const applicationStatus = await pool.query<{ status: string }>(
      "select status from placement_applications where id = $1",
      [application.id],
    );
    expect(applicationStatus.rows[0]?.status).toBe("WITHDRAWN");

    const declineHistory = await pool.query<{ to_status: string }>(
      "select to_status from placement_offer_status_history where offer_id = $1 order by created_at desc",
      [offer.id],
    );
    expect(declineHistory.rows[0]?.to_status).toBe("DECLINED");

    const events =
      await pool.query<{
        event_type: string;
      }>(
        "select event_type from activity_events where subject_id = $1 order by occurred_at asc",
        [extension.id],
      );
    expect(
      events.rows.map(
        (row) => row.event_type,
      ),
    ).toEqual(
      expect.arrayContaining([
        "placements.request.submitted",
        "placements.request.decided",
      ]),
    );
  });
});
