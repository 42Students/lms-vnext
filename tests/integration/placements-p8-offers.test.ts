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
import { applyToPlacementJob } from "@/modules/placements/application-service";
import { createPlacementCompany } from "@/modules/placements/company-service";
import {
  createPlacementJob,
  publishPlacementJob,
} from "@/modules/placements/job-service";
import {
  actOnPlacementOffer,
  issuePlacementOffer,
  listOwnPlacementOffers,
  recordPlacementJoiningOutcome,
} from "@/modules/placements/offer-service";
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
  await pool.query(
    "delete from in_app_notifications",
  );
  await pool.query(
    "delete from activity_events",
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

async function preparePassedApplication() {
  const company =
    await createPlacementCompany(tpo, {
      collegeId: SEED_IDS.collegeA,
      name: "Offer Systems",
      primaryDomain:
        "offer-systems.example",
    });

  const job = await createPlacementJob(
    tpo,
    {
      collegeId: SEED_IDS.collegeA,
      companyRelationshipId:
        company.relationship.id,
      title: "Offer Engineer",
      description:
        "Offer lifecycle fixture",
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
        "Shortlisted for the final interview",
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

describe("Placement P8 offers and joining", () => {
  it("issues an idempotent offer, lets the learner accept, and preserves corrected joining history", async () => {
    const { application } =
      await preparePassedApplication();

    const issued =
      await issuePlacementOffer(
        tpo,
        application.id,
        {
          roleTitle:
            "Software Engineer",
          annualCtcInr: 1_200_000,
          joiningDate: "2027-01-10",
          expiresAt: new Date(
            "2026-11-01T18:29:59.000Z",
          ),
        },
      );

    expect(issued).toMatchObject({
      version: 1,
      status: "ISSUED",
      roleTitle: "Software Engineer",
      annualCtcInr: 1_200_000,
      joiningDate: "2027-01-10",
    });

    const repeated =
      await issuePlacementOffer(
        tpo,
        application.id,
        {
          roleTitle:
            "Software Engineer",
          annualCtcInr: 1_200_000,
          joiningDate: "2027-01-10",
          expiresAt: new Date(
            "2026-11-01T18:29:59.000Z",
          ),
        },
      );
    expect(repeated.id).toBe(issued.id);

    const issuedEvents =
      await pool.query<{ id: string }>(
        "select id from activity_events where dedupe_key = $1",
        [
          `placement-offer:${issued.id}:issued`,
        ],
      );
    expect(issuedEvents.rowCount).toBe(1);

    const notifications =
      await pool.query<{ id: string }>(
        `select n.id
           from in_app_notifications n
           inner join activity_events e
             on e.id = n.event_id
          where n.user_id = $1
            and e.dedupe_key = $2`,
        [
          SEED_IDS.learnerUser,
          `placement-offer:${issued.id}:issued`,
        ],
      );
    expect(notifications.rowCount).toBe(1);

    await expect(
      issuePlacementOffer(
        tpo,
        application.id,
        {
          roleTitle:
            "Senior Software Engineer",
          annualCtcInr: 1_400_000,
        },
      ),
    ).rejects.toMatchObject({
      code:
        "PLACEMENT_OFFER_ACTIVE_EXISTS",
    });

    const accepted =
      await actOnPlacementOffer(
        learner,
        issued.id,
        { action: "ACCEPT" },
      );
    expect(accepted.status).toBe(
      "ACCEPTED",
    );

    const offers =
      await listOwnPlacementOffers(
        learner,
      );
    expect(offers[0]).toMatchObject({
      offer: {
        id: issued.id,
        status: "ACCEPTED",
      },
      joining: {
        status: "PENDING",
      },
    });

    const deferred =
      await recordPlacementJoiningOutcome(
        tpo,
        issued.id,
        {
          status: "DEFERRED",
          joiningDate: "2027-02-01",
          reason:
            "University completion date moved",
        },
      );
    expect(deferred).toMatchObject({
      status: "DEFERRED",
      joiningDate: "2027-02-01",
    });

    await expect(
      recordPlacementJoiningOutcome(
        tpo,
        issued.id,
        {
          status: "JOINED",
          joiningDate: "2027-02-03",
        },
      ),
    ).rejects.toMatchObject({
      code:
        "PLACEMENT_JOINING_CORRECTION_REASON_REQUIRED",
    });

    const joined =
      await recordPlacementJoiningOutcome(
        tpo,
        issued.id,
        {
          status: "JOINED",
          joiningDate: "2027-02-03",
          correctionReason:
            "Confirmed actual joining date",
        },
      );
    expect(joined).toMatchObject({
      status: "JOINED",
      joiningDate: "2027-02-03",
    });

    const lifecycleEvents =
      await pool.query<{
        event_type: string;
      }>(
        `select event_type
           from activity_events
          where subject_id = $1
          order by occurred_at asc`,
        [issued.id],
      );
    expect(
      lifecycleEvents.rows.map(
        (row) => row.event_type,
      ),
    ).toEqual(
      expect.arrayContaining([
        "placements.offer.issued",
        "placements.offer.responded",
        "placements.joining.recorded",
      ]),
    );

    await expect(
      actOnPlacementOffer(
        tpo,
        issued.id,
        {
          action: "WITHDRAW",
          reason:
            "Attempted post-joining withdrawal",
        },
      ),
    ).rejects.toMatchObject({
      code:
        "PLACEMENT_OFFER_INVALID_TRANSITION",
    });
  });

  it("keeps declined offers durable and allows a later version", async () => {
    const { application } =
      await preparePassedApplication();

    const first =
      await issuePlacementOffer(
        tpo,
        application.id,
        {
          roleTitle:
            "Graduate Engineer",
          annualCtcInr: 900_000,
        },
      );

    const declined =
      await actOnPlacementOffer(
        learner,
        first.id,
        {
          action: "DECLINE",
          reason:
            "Pursuing higher studies",
        },
      );
    expect(declined.status).toBe(
      "DECLINED",
    );

    const second =
      await issuePlacementOffer(
        tpo,
        application.id,
        {
          roleTitle:
            "Graduate Engineer",
          annualCtcInr: 1_000_000,
        },
      );

    expect(second.version).toBe(2);
    expect(second.id).not.toBe(
      first.id,
    );
  });

  it("blocks offers before final applied pass and expired learner acceptance", async () => {
    const company =
      await createPlacementCompany(tpo, {
        collegeId: SEED_IDS.collegeA,
        name: "Early Offer Systems",
        primaryDomain:
          "early-offer.example",
      });
    const job =
      await createPlacementJob(tpo, {
        collegeId: SEED_IDS.collegeA,
        companyRelationshipId:
          company.relationship.id,
        title: "Early Offer Engineer",
        description:
          "Offer readiness fixture",
        employmentType: "FULL_TIME",
        workMode: "REMOTE",
        applicationMode: "INTERNAL",
      });
    await createPlacementRound(
      tpo,
      job.id,
      {
        kind: "INTERVIEW",
        name: "Interview",
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

    await expect(
      issuePlacementOffer(
        tpo,
        application.id,
        {
          roleTitle: "Engineer",
        },
      ),
    ).rejects.toMatchObject({
      code:
        "PLACEMENT_OFFER_NOT_READY",
    });

    const passed =
      await preparePassedApplication();
    const expired =
      await issuePlacementOffer(
        tpo,
        passed.application.id,
        {
          roleTitle: "Engineer",
          expiresAt: new Date(
            "2026-11-01T00:00:00.000Z",
          ),
        },
      );

    await expect(
      actOnPlacementOffer(
        learner,
        expired.id,
        { action: "ACCEPT" },
        new Date(
          "2026-11-02T00:00:00.000Z",
        ),
      ),
    ).rejects.toMatchObject({
      code:
        "PLACEMENT_OFFER_EXPIRED",
    });
  });
});
