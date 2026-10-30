import { publishableJobTerms } from "../support/publishable-job-terms";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { applyToPlacementJob } from "@/modules/placements/application-service";
import { createPlacementCompany } from "@/modules/placements/company-service";
import { createPlacementJob } from "@/modules/placements/job-service";
import { publishPreparedPlacementJob } from "../support/publishable-job-fixture";
import { issuePlacementOffer, listOwnPlacementOffers } from "@/modules/placements/offer-service";
import { actOnPlacementRound, createPlacementRound } from "@/modules/placements/round-service";
import { applyPlacementRoundResult, stagePlacementRoundResult } from "@/modules/placements/result-service";
import { decidePlacementScreening } from "@/modules/placements/screening-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { enableSeedLearnerPlacementAccess } from "../support/w04-placement-access-fixture";
import { deletePlacementRowTrees } from "../support/placement-job-tree-cleanup";

const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("TEST_DATABASE_URL or DATABASE_URL is required for DB integration tests");
const pool = new Pool({ connectionString: databaseUrl, max: 1 });

const tpo: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "seed-shared-faculty", platformStatus: "ACTIVE", systemRoles: [] },
  membership: {
    id: SEED_IDS.facultyCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["FACULTY", "TPO"],
  },
};
const learner: RequestContext = {
  user: { id: SEED_IDS.learnerUser, identityUid: "seed-learner", platformStatus: "ACTIVE", systemRoles: [] },
  membership: {
    id: SEED_IDS.learnerCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["LEARNER"],
  },
};
const foreignTpo: RequestContext = {
  ...tpo,
  membership: { ...tpo.membership!, id: SEED_IDS.facultyCollegeBMembership, collegeId: SEED_IDS.collegeB },
};

const TABLES = [
  "in_app_notifications",
  "activity_events",
  "placement_joining_history",
  "placement_joining_outcomes",
  "placement_offer_status_history",
  "placement_offers",
  "placement_round_results",
  "placement_job_round_events",
  "placement_job_rounds",
  "placement_application_screening_history",
  "placement_application_screenings",
  "placement_application_status_history",
  "placement_applications",
  "placement_eligibility_overrides",
  "placement_job_eligibility_policies",
  "placement_candidate_academic_evidence",
  "placement_jobs",
  "placement_recruiter_college_grants",
  "placement_recruiter_profiles",
  "placement_company_relationships",
  "placement_companies",
];

async function cleanup() {
  // New college stage/history dependencies are included by the live FK graph,
  // so test cleanup cannot delete applications before their child rows.
  await pool.query("delete from in_app_notifications");
  await pool.query("delete from activity_events");
  await deletePlacementRowTrees(pool);
  for (const table of TABLES.slice(2)) await pool.query("delete from " + table);
}

async function passedApplication() {
  const company = await createPlacementCompany(tpo, { collegeId: SEED_IDS.collegeA, name: "Loi Systems", primaryDomain: "loi-systems.example" });
  const job = await createPlacementJob(tpo, {
    ...publishableJobTerms,
    collegeId: SEED_IDS.collegeA,
    companyRelationshipId: company.relationship.id,
    title: "Loi Engineer",
    description: "LOI fixture",
    employmentType: "FULL_TIME",
    workMode: "HYBRID",
    applicationMode: "INTERNAL",
  });
  const round = await createPlacementRound(tpo, job.id, { kind: "INTERVIEW", name: "Final interview" });
  await publishPreparedPlacementJob(tpo, job.id);
  const application = await applyToPlacementJob(learner, job.id, {});
  await decidePlacementScreening(tpo, application.id, { decision: "SHORTLISTED", candidateMessage: "Shortlisted" });
  await actOnPlacementRound(tpo, round.id, {
    action: "SCHEDULE",
    scheduledAt: new Date("2026-10-24T04:30:00.000Z"),
    timezone: "Asia/Kolkata",
    mode: "VIRTUAL",
    meetingUrl: "https://meet.example/final",
  });
  await actOnPlacementRound(tpo, round.id, { action: "COMPLETE" });
  const staged = await stagePlacementRoundResult(tpo, round.id, { applicationId: application.id, outcome: "PASS", scorePercent: 90 });
  await applyPlacementRoundResult(tpo, staged.id);
  return application;
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

describe("placement offer kind (letter of intent)", () => {
  it("records an LOI distinctly, defaults to OFFER, stays idempotent per kind and notifies the learner", async () => {
    const application = await passedApplication();
    // The minimum response window is measured from issue time (48h default).
    const input = { roleTitle: "Software Engineer", annualCtcInr: 1_000_000, expiresAt: new Date(Date.now() + 14 * 86_400_000) };
    const loi = await issuePlacementOffer(tpo, application.id, { ...input, kind: "LOI" });
    expect(loi).toMatchObject({ kind: "LOI", status: "ISSUED", version: 1 });
    expect((await issuePlacementOffer(tpo, application.id, { ...input, kind: "LOI" })).id).toBe(loi.id);
    // The same terms as a different kind are a conflicting active record, not a silent replay.
    await expect(issuePlacementOffer(tpo, application.id, input)).rejects.toMatchObject({ code: "PLACEMENT_OFFER_ACTIVE_EXISTS" });
    const own = await listOwnPlacementOffers(learner);
    expect(own.map((row) => row.offer.kind)).toEqual(["LOI"]);
    const notice = await pool.query<{ title: string }>(
      "select title from in_app_notifications where user_id=$1 and title=$2",
      [SEED_IDS.learnerUser, "Letter of intent received"],
    );
    // Offer issuance can coexist with earlier application-status notices.
    // Verify this exact learner received the LOI without relying on unordered rows.
    expect(notice.rows).toEqual([{title: "Letter of intent received"}]);
    const audit = await pool.query<{ summary: string; kind: string }>(
      "select summary, metadata->>'kind' as kind from activity_events where dedupe_key=$1",
      ["placement-offer:" + loi.id + ":issued"],
    );
    expect(audit.rows[0]).toMatchObject({ kind: "LOI" });
    expect(audit.rows[0]?.summary).toContain("Letter of intent");
  });

  it("defaults an omitted kind to OFFER, rejects unknown kinds and foreign colleges", async () => {
    const application = await passedApplication();
    await expect(issuePlacementOffer(tpo, application.id, { roleTitle: "Engineer", kind: "CONTRACT" } as never)).rejects.toBeDefined();
    await expect(issuePlacementOffer(foreignTpo, application.id, { roleTitle: "Engineer" })).rejects.toBeDefined();
    const offer = await issuePlacementOffer(tpo, application.id, { roleTitle: "Engineer" });
    expect(offer.kind).toBe("OFFER");
    await expect(pool.query("update placement_offers set kind='OTHER' where id=$1", [offer.id])).rejects.toBeDefined();
  });
});
