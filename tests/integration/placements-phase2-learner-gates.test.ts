import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { createPlacementCompany } from "@/modules/placements/company-service";
import { createPlacementJob, publishPlacementJob } from "@/modules/placements/job-service";
import { applyToPlacementJob } from "@/modules/placements/application-service";
import { listLearnerPlacementJobs } from "@/modules/placements/learner-job-service";
import { loadPlacementHeldOfferFacts } from "@/modules/placements/held-offer-facts-service";
import { submitOwnExternalOffer, reviewExternalOffer } from "@/modules/placements/external-offer-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { enableSeedLearnerPlacementAccess } from "../support/w04-placement-access-fixture";

/**
 * P-S1-02/03/05/06/07: real PostgreSQL service and tenant-boundary witnesses.
 * Authored only, never claimed executed. Do not run against shared databases.
 */
const url = process.env.TEST_DATABASE_URL;
if (!url || url !== process.env.DATABASE_URL ||
    process.env.DB08_ISOLATED_TEST_DATABASE !== "1") {
  throw new Error("Phase 2 placements integration requires the identical disposable TEST_DATABASE_URL/DATABASE_URL and DB08_ISOLATED_TEST_DATABASE=1");
}
const pool = new Pool({ connectionString: url, max: 3 });

const learner: RequestContext = {
  user: {
    id: SEED_IDS.learnerUser, identityUid: "seed-learner",
    platformStatus: "ACTIVE", systemRoles: [],
  },
  membership: {
    id: SEED_IDS.learnerCollegeAMembership,
    collegeId: SEED_IDS.collegeA, organizationId: SEED_IDS.organization,
    status: "ACTIVE", roles: ["LEARNER"],
  },
};
const tpo: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser, identityUid: "seed-faculty",
    platformStatus: "ACTIVE", systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeAMembership,
    collegeId: SEED_IDS.collegeA, organizationId: SEED_IDS.organization,
    status: "ACTIVE", roles: ["FACULTY","TPO"],
  },
};

/** Database is disposable and isolated. Clean child records before parents. */
async function clean() {
  await pool.query("DELETE FROM in_app_notifications");
  await pool.query("DELETE FROM activity_events");
  await pool.query("DELETE FROM placement_joining_history");
  await pool.query("DELETE FROM placement_joining_outcomes");
  await pool.query("DELETE FROM placement_offer_status_history");
  await pool.query("DELETE FROM placement_offers");
  await pool.query("DELETE FROM placement_round_results");
  await pool.query("DELETE FROM placement_job_round_events");
  await pool.query("DELETE FROM placement_job_rounds");
  await pool.query("DELETE FROM placement_application_screening_history");
  await pool.query("DELETE FROM placement_application_screenings");
  await pool.query("DELETE FROM placement_application_status_history");
  await pool.query("DELETE FROM placement_applications");
  await pool.query("DELETE FROM placement_eligibility_overrides");
  await pool.query("DELETE FROM placement_job_eligibility_policies");
  await pool.query("DELETE FROM placement_candidate_academic_evidence");
  await pool.query("TRUNCATE TABLE placement_external_offer_events");
  await pool.query("DELETE FROM placement_external_offers");
  await pool.query("TRUNCATE TABLE placement_debarment_history, placement_debarment_drive_events");
  await pool.query("DELETE FROM placement_debarments");
  await pool.query("DELETE FROM placement_jobs");
  await pool.query("DELETE FROM placement_company_relationships");
  await pool.query("DELETE FROM placement_companies");
}

async function makeJob(title: string) {
  const uid = randomUUID();
  const company = await createPlacementCompany(tpo, {
    collegeId: SEED_IDS.collegeA,
    name: title + " " + uid,
    primaryDomain: "phase2-" + uid + ".example",
  });
  const job = await createPlacementJob(tpo, {
    collegeId: SEED_IDS.collegeA,
    companyRelationshipId: company.relationship.id,
    title, description: "Phase 2 isolated placement acceptance",
    employmentType: "FULL_TIME", workMode: "HYBRID",
    applicationMode: "INTERNAL",
  });
  await publishPlacementJob(tpo, job.id);
  return job;
}

beforeEach(async () => {
  await clean();
  await enableSeedLearnerPlacementAccess(pool);
  const own = await pool.query<{ cohort_id: string }>(
    "SELECT cohort_id FROM learner_program_enrollments WHERE membership_id=$1 AND status='ACTIVE' LIMIT 1",
    [SEED_IDS.learnerCollegeAMembership],
  );
  const cohortId = own.rows[0]?.cohort_id;
  if (!cohortId) throw new Error("Phase 2 fixture must have one active cohort");
  // Explicit placement consent, never inferred from the seed enrollment.
  await pool.query(`
    INSERT INTO placement_batch_registrations
      (college_id,cohort_id,membership_id,choice,consent_version,consent_at,source,recorded_by_user_id)
    VALUES ($1,$2,$3,'PLACEMENTS','phase2-test',now(),'BACKFILL',$4)
    ON CONFLICT (membership_id,cohort_id)
    DO UPDATE SET choice='PLACEMENTS',consent_version='phase2-test',
      consent_at=now(),source='BACKFILL',recorded_by_user_id=$4
  `, [SEED_IDS.collegeA, cohortId, SEED_IDS.learnerCollegeAMembership,
      SEED_IDS.collegeAdminUser]);
  await pool.query(`
    INSERT INTO placement_college_rules(college_id,max_held_offers,uplift_pct)
    VALUES($1,1,40) ON CONFLICT (college_id)
    DO UPDATE SET max_held_offers=1,uplift_pct=40
  `, [SEED_IDS.collegeA]);
});
afterAll(async () => {
  await clean();
  await pool.end();
  await closeDatabaseConnection();
});

describe("Section A: placement write/read integration boundaries", () => {
  it("P-S1-05 counts only VERIFIED off-campus offers in held capacity and apply", async () => {
    const job = await makeJob("External held cap");
    const before = await listLearnerPlacementJobs(learner);
    expect(before.find(row => row.job.id === job.id)?.canApply).toBe(true);

    const pending = await submitOwnExternalOffer(learner, {
      companyName: "External verified offer", ctcLpa: "12.50",
    });
    const unverified = await loadPlacementHeldOfferFacts(
      SEED_IDS.collegeA, SEED_IDS.learnerCollegeAMembership,
    );
    expect(unverified).toHaveLength(0);

    await reviewExternalOffer(tpo, {offerId: pending.id, action:"VERIFY"});
    const facts = await loadPlacementHeldOfferFacts(
      SEED_IDS.collegeA, SEED_IDS.learnerCollegeAMembership,
    );
    expect(facts).toContainEqual({
      kind:"OFFER",status:"ACCEPTED",annualCtcInr:1_250_000,
    });

    const listing = await listLearnerPlacementJobs(learner);
    expect(listing.find(row => row.job.id === job.id)?.canApply).toBe(false);
    await expect(applyToPlacementJob(learner, job.id, {}))
      .rejects.toMatchObject({code:"PLACEMENT_APPLICATION_INELIGIBLE"});

    await reviewExternalOffer(tpo, {
      offerId: pending.id, action:"REVOKE", reason:"External offer rescinded",
    });
    const after = await listLearnerPlacementJobs(learner);
    expect(after.find(row => row.job.id === job.id)?.canApply).toBe(true);
  });
});
