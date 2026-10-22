import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { applyToPlacementJob } from "@/modules/placements/application-service";
import { createPlacementCompany } from "@/modules/placements/company-service";
import { createPlacementJob } from "@/modules/placements/job-service";
import { publishPreparedPlacementJob } from "../support/publishable-job-fixture";
import { publishableJobTerms } from "../support/publishable-job-terms";
import { requireLearnerPlacementAccess } from "@/modules/placements/learner-participation-guard";
import {
  decideTpoLearnerParticipation,
  getTpoLearnerParticipation,
} from "@/modules/placements/tpo-participation-service";
import { buildTpoDebarDecision } from "@/modules/placements/tpo-debar-model";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { enableSeedLearnerPlacementAccess } from "../support/w04-placement-access-fixture";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled =
  Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB09_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled
  ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 })
  : null;

const tpo: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "w42-tpo-debar",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["TPO"],
  },
};
const learner: RequestContext = {
  user: {
    id: SEED_IDS.learnerUser,
    identityUid: "w42-learner",
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
const otherTpo: RequestContext = {
  ...tpo,
  membership: {
    ...tpo.membership!,
    id: SEED_IDS.facultyCollegeBMembership,
    collegeId: SEED_IDS.collegeB,
  },
};
let jobId: string | null = null;
let companyId: string | null = null;
let relationshipId: string | null = null;

describe.skipIf(!enabled)("W42 Debar: disposable PostgreSQL and apply gate", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("TEST_DATABASE_URL required");
    await enableSeedLearnerPlacementAccess(pool);
    const company = await createPlacementCompany(tpo, {
      collegeId: SEED_IDS.collegeA,
      name: "W42 Debar " + randomUUID(),
    });
    companyId = company.company.id;
    relationshipId = company.relationship.id;
    const job = await createPlacementJob(tpo, {
      ...publishableJobTerms,
      collegeId: SEED_IDS.collegeA,
      companyRelationshipId: company.relationship.id,
      title: "W42 Debar Integration",
      description: "Verify learner self-application blocking",
      employmentType: "FULL_TIME",
      workMode: "HYBRID",
      locations: ["Hyderabad"],
      applicationMode: "INTERNAL",
    });
    jobId = job.id;
    await publishPreparedPlacementJob(tpo, job.id);
  });

  afterAll(async () => {
    try {
      if (pool) {
        // This fixture is allowed only on the independently verified
        // disposable database. Restore the seeded learner access.
        await enableSeedLearnerPlacementAccess(pool);
        if (jobId) {
          await pool.query(
            "DELETE FROM placement_application_status_history " +
            "WHERE application_id IN (SELECT id FROM placement_applications WHERE job_id = $1)",
            [jobId],
          );
          await pool.query("DELETE FROM placement_applications WHERE job_id = $1", [jobId]);
          await pool.query(
            "DELETE FROM placement_job_round_events " +
            "WHERE round_id IN (SELECT id FROM placement_job_rounds WHERE job_id = $1)",
            [jobId],
          );
          await pool.query("DELETE FROM placement_job_rounds WHERE job_id = $1", [jobId]);
          await pool.query("DELETE FROM placement_job_eligibility_policies WHERE job_id = $1", [jobId]);
          await pool.query("DELETE FROM placement_job_role_options WHERE job_id = $1", [jobId]);
          await pool.query("DELETE FROM placement_jobs WHERE id = $1", [jobId]);
        }
        if (relationshipId) {
          await pool.query("DELETE FROM placement_company_relationships WHERE id = $1", [relationshipId]);
        }
        if (companyId) {
          await pool.query("DELETE FROM placement_companies WHERE id = $1", [companyId]);
        }
      }
    } finally {
      await pool?.end();
      await closeDatabaseConnection();
    }
  });

  it("denies a cross-college attempt to Debar this learner", async () => {
    const original = await getTpoLearnerParticipation(
      tpo,
      SEED_IDS.learnerCollegeAMembership,
    );
    await expect(decideTpoLearnerParticipation(
      otherTpo,
      SEED_IDS.learnerCollegeAMembership,
      buildTpoDebarDecision(
        { action: "DEBAR", reason: "Should not apply" },
        original.direct,
      ),
    )).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("blocks actual self-apply, logs the decision, then restores inherited access on removal", async () => {
    if (!pool || !jobId) throw new Error("Fixture not initialized");
    const original = await getTpoLearnerParticipation(
      tpo,
      SEED_IDS.learnerCollegeAMembership,
    );
    const debar = await decideTpoLearnerParticipation(
      tpo,
      SEED_IDS.learnerCollegeAMembership,
      buildTpoDebarDecision(
        { action: "DEBAR", reason: "  Documented misconduct  " },
        original.direct,
      ),
    );
    expect(debar).toMatchObject({
      changed: true,
      direct: {
        status: "INELIGIBLE",
        reason: "Debar: Documented misconduct",
      },
    });

    const logged = await pool.query(
      "SELECT metadata FROM activity_events " +
      "WHERE college_id = $1 AND subject_id = $2 " +
      "AND event_type = 'placements.participation.decided' " +
      "ORDER BY created_at DESC LIMIT 1",
      [SEED_IDS.collegeA, SEED_IDS.learnerCollegeAMembership],
    );
    expect(logged.rows[0]?.metadata?.nextStatus).toBe("INELIGIBLE");
    expect(JSON.stringify(logged.rows[0]?.metadata)).not.toContain("Documented misconduct");

    await expect(requireLearnerPlacementAccess(learner))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(applyToPlacementJob(learner, jobId, {}))
      .rejects.toBeInstanceOf(AuthorizationError);

    const remove = await decideTpoLearnerParticipation(
      tpo,
      SEED_IDS.learnerCollegeAMembership,
      buildTpoDebarDecision(
        { action: "REMOVE_DEBAR" },
        debar.direct,
      ),
    );
    expect(remove).toMatchObject({
      changed: true,
      direct: { status: null, reason: null },
    });
    const inherited = await getTpoLearnerParticipation(
      tpo,
      SEED_IDS.learnerCollegeAMembership,
    );
    expect(inherited.direct.status).toBeNull();
    // Clearing an override does not silently set ELIGIBLE.
    expect(inherited.effective.status).toBe("NOT_DECIDED");
    await expect(requireLearnerPlacementAccess(learner))
      .rejects.toBeInstanceOf(AuthorizationError);

    // An explicit eligibility decision is needed after clearing the
    // learner override when no class/batch decision exists.
    await decideTpoLearnerParticipation(
      tpo,
      SEED_IDS.learnerCollegeAMembership,
      { status: "ELIGIBLE", expected: remove.direct },
    );
    await expect(requireLearnerPlacementAccess(learner)).resolves.toBeDefined();
    const application = await applyToPlacementJob(learner, jobId, {});
    expect(application.membershipId).toBe(SEED_IDS.learnerCollegeAMembership);
  });
});
