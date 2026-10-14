import { randomUUID } from "node:crypto";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  TpoCompanyTrustConflict,
  updateConfirmedTpoCompanyTrust,
} from "@/modules/placements/tpo-company-trust-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = process.env.DB09_ISOLATED_TEST_DATABASE === "1" &&
  Boolean(process.env.TEST_DATABASE_URL);
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled
  ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 })
  : null;
const companies = new Set<string>();
const relationships = new Set<string>();

const tpo: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "tpo-trust-test",
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

async function fixture(collegeId = SEED_IDS.collegeA) {
  if (!pool) throw new Error("Isolated test database is required");
  const token = randomUUID();
  const company = (await pool.query<{ id: string }>(
    "INSERT INTO placement_companies (name, created_by_user_id) " +
      "VALUES ($1, $2) RETURNING id",
    ["Trusted fixture " + token, SEED_IDS.facultyUser],
  )).rows[0];
  if (!company) throw new Error("Company fixture missing");
  companies.add(company.id);
  const relationship = (await pool.query<{ id: string }>(
    "INSERT INTO placement_company_relationships " +
      "(college_id, company_id, created_by_user_id) " +
      "VALUES ($1, $2, $3) RETURNING id",
    [collegeId, company.id, SEED_IDS.facultyUser],
  )).rows[0];
  if (!relationship) throw new Error("Relationship fixture missing");
  relationships.add(relationship.id);
  return relationship.id;
}

function payload(relationshipId: string) {
  return {
    relationshipId,
    expectedTrusted: false,
    nextTrusted: true,
    reason: "Recruiter identity checked in the college",
    confirmed: true as const,
  };
}

/**
 * Cleanup only mutable fixture tables. PLACEMENTS activity_events is append-only
 * and deliberately not deleted or altered. The disposable database is
 * destroyed by the test harness after the suite.
 */
async function cleanup() {
  if (!pool) return;
  if (relationships.size > 0) {
    await pool.query(
      "DELETE FROM placement_company_relationships WHERE id = ANY($1::uuid[])",
      [[...relationships]],
    );
    relationships.clear();
  }
  if (companies.size > 0) {
    await pool.query(
      "DELETE FROM placement_companies WHERE id = ANY($1::uuid[])",
      [[...companies]],
    );
    companies.clear();
  }
}

describe.skipIf(!enabled)("TPO company trust on isolated PostgreSQL", () => {
  afterEach(async () => { await cleanup(); });
  afterAll(async () => {
    await cleanup();
    await pool?.end();
    await closeDatabaseConnection();
  });

  it("updates relationship under a row lock and records one actor audit", async () => {
    if (!pool) throw new Error("Isolated test DB required");
    const relationshipId = await fixture();
    const value = await updateConfirmedTpoCompanyTrust(tpo, payload(relationshipId));
    expect(value).toMatchObject({ relationshipId, isTrusted: true });

    const company = (await pool.query<{ is_trusted: boolean }>(
      "SELECT is_trusted FROM placement_company_relationships WHERE id = $1",
      [relationshipId],
    )).rows[0];
    expect(company?.is_trusted).toBe(true);

    const audit = (await pool.query<{ event_type: string; actor_user_id: string; metadata: { fromTrusted: boolean; toTrusted: boolean } }>(
      "SELECT event_type, actor_user_id, metadata " +
        "FROM activity_events WHERE module = 'PLACEMENTS' AND subject_type = " +
        "'placement_company_relationship' AND subject_id = $1",
      [relationshipId],
    )).rows;
    expect(audit).toHaveLength(1);
    expect(audit[0]?.event_type).toBe("PLACEMENTS_COMPANY_TRUST_CHANGED");
    expect(audit[0]?.actor_user_id).toBe(SEED_IDS.facultyUser);
    expect(audit[0]?.metadata).toMatchObject({ fromTrusted: false, toTrusted: true });

    await expect(updateConfirmedTpoCompanyTrust(tpo, payload(relationshipId)))
      .rejects.toBeInstanceOf(TpoCompanyTrustConflict);
    const count = (await pool.query<{ total: string }>(
      "SELECT count(*)::text AS total FROM activity_events WHERE " +
        "subject_type = 'placement_company_relationship' AND subject_id = $1",
      [relationshipId],
    )).rows[0];
    expect(count?.total).toBe("1");
  });

  it("rejects a different college without leaking the relationship", async () => {
    const relationshipId = await fixture(SEED_IDS.collegeB);
    await expect(updateConfirmedTpoCompanyTrust(tpo, payload(relationshipId)))
      .rejects.toMatchObject({ code: "PLACEMENT_COMPANY_RELATIONSHIP_NOT_FOUND" });
  });

  it("rejects a non-TPO actor with a legitimate same-college relationship", async () => {
    const relationshipId = await fixture();
    const wrong: RequestContext = {
      ...tpo,
      membership: { ...tpo.membership!, roles: ["COLLEGE_ADMIN"] },
    };
    await expect(updateConfirmedTpoCompanyTrust(wrong, payload(relationshipId)))
      .rejects.toBeInstanceOf(AuthorizationError);
  });
});
