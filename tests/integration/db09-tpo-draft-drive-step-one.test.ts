import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { createPlacementCompany } from "@/modules/placements/company-service";
import { createTpoDraftDriveStepOne } from "@/modules/placements/tpo-draft-drive-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = process.env.DB09_ISOLATED_TEST_DATABASE === "1" &&
  Boolean(process.env.TEST_DATABASE_URL);
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 }) : null;
const jobs = new Set<string>();
const companies = new Set<string>();
const relationships = new Set<string>();

const tpo: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "db09-tpo-draft-step-one",
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

async function fixture(collegeId: string = SEED_IDS.collegeA) {
  const company = await createPlacementCompany(tpo, {
    collegeId, name: "DB09 Draft Co " + randomUUID(), isTrusted: false,
  });
  companies.add(company.company.id);
  relationships.add(company.relationship.id);
  return company.relationship.id;
}
const request = (companyRelationshipId: string, seasonId: string = SEED_IDS.placementSeasonA) => ({
  confirmed: true as const,
  companyRelationshipId,
  seasonId,
  title: "Test draft " + randomUUID(),
  description: "DB09 draft step-one audit",
  employmentType: "FULL_TIME" as const,
  workMode: "ONSITE" as const,
  applicationDeadline: "2026-12-18T10:00:00+05:30",
});

afterAll(async () => {
  if (pool) {
    for (const id of jobs) {
      await pool.query("DELETE FROM placement_job_role_options WHERE job_id=$1", [id]);
      await pool.query("DELETE FROM placement_jobs WHERE id=$1", [id]);
    }
    for (const id of relationships) {
      await pool.query("DELETE FROM placement_company_relationships WHERE id=$1", [id]);
    }
    for (const id of companies) {
      await pool.query("DELETE FROM placement_companies WHERE id=$1", [id]);
    }
    // Append-only activity events are immutable and intentionally retained.
    await pool.end();
  }
  await closeDatabaseConnection();
});

describe.skipIf(!enabled)("TPO quick draft creation on DB09 isolated PostgreSQL", () => {
  it("creates an unpublished job and primary role in one audited transaction", async () => {
    if (!pool) throw new Error("Disposable PG required");
    const relationId = await fixture();
    const result = await createTpoDraftDriveStepOne(tpo, request(relationId));
    jobs.add(result.id);
    expect(result.status).toBe("DRAFT");
    const rows = await pool.query<{ title: string; is_primary: boolean }>(
      "SELECT title, is_primary FROM placement_job_role_options WHERE job_id = $1", [result.id],
    );
    expect(rows.rows).toHaveLength(1);
    expect(rows.rows[0]?.is_primary).toBe(true);
    const audit = await pool.query<{ event_type: string; actor_user_id: string }>(
      "SELECT event_type, actor_user_id FROM activity_events WHERE subject_id=$1 " +
      "ORDER BY occurred_at DESC LIMIT 1", [result.id],
    );
    expect(audit.rows[0]).toMatchObject({
      event_type: "placements.job.draft_created",
      actor_user_id: SEED_IDS.facultyUser,
    });
  });

  it("denies wrong role, foreign relationship and stale season selection", async () => {
    const relationId = await fixture();
    const wrongRole: RequestContext = {
      ...tpo, membership: { ...tpo.membership!, roles: ["LEARNER"] },
    };
    await expect(createTpoDraftDriveStepOne(wrongRole, request(relationId)))
      .rejects.toBeInstanceOf(AuthorizationError);
    const foreign: RequestContext = {
      ...tpo, membership: { ...tpo.membership!, collegeId: SEED_IDS.collegeB },
    };
    await expect(createTpoDraftDriveStepOne(foreign, request(relationId)))
      .rejects.toBeDefined();
    await expect(createTpoDraftDriveStepOne(tpo, request(relationId, randomUUID())))
      .rejects.toBeDefined();
  });
});
