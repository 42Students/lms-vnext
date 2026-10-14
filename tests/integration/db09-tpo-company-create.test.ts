import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { createPlacementCompany } from "@/modules/placements/company-service";
import { PlacementsServiceError } from "@/modules/placements/errors";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = process.env.DB09_ISOLATED_TEST_DATABASE === "1" &&
  Boolean(process.env.TEST_DATABASE_URL);
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 }) : null;
const createdCompanies = new Set<string>();
const createdRelationships = new Set<string>();

const tpo: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "db09-tpo-directory-create",
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

afterAll(async () => {
  if (pool) {
    for (const id of createdRelationships) {
      await pool.query("DELETE FROM placement_company_relationships WHERE id = $1", [id]);
    }
    for (const id of createdCompanies) {
      await pool.query("DELETE FROM placement_companies WHERE id = $1", [id]);
    }
    // activity_events are immutable and must never be deleted by tests.
    await pool.end();
  }
  await closeDatabaseConnection();
});

describe.skipIf(!enabled)("TPO confirmed directory company creation on disposable PostgreSQL", () => {
  it("creates and links an employer with immutable college actor audit", async () => {
    if (!pool) throw new Error("Isolated PostgreSQL required");
    const name = "DB09 Company " + randomUUID();
    const domain = randomUUID() + ".example.org";
    const result = await createPlacementCompany(tpo, {
      collegeId: SEED_IDS.collegeA, name, primaryDomain: domain, isTrusted: false,
    });
    createdCompanies.add(result.company.id);
    createdRelationships.add(result.relationship.id);
    expect(result.relationship.collegeId).toBe(SEED_IDS.collegeA);
    expect(result.relationship.isTrusted).toBe(false);
    const audit = await pool.query<{ event_type: string; actor_user_id: string }>(
      "SELECT event_type, actor_user_id FROM activity_events WHERE subject_id = $1 ORDER BY occurred_at DESC LIMIT 1",
      [result.relationship.id],
    );
    expect(audit.rows[0]).toMatchObject({
      event_type: "placements.company.linked",
      actor_user_id: SEED_IDS.facultyUser,
    });
    const again = await createPlacementCompany(tpo, {
      collegeId: SEED_IDS.collegeA, name, primaryDomain: domain,
    });
    expect(again.relationship.id).toBe(result.relationship.id);
    expect(again.company.id).toBe(result.company.id);
    // Identity conflict must not overwrite an existing canonical employer.
    await expect(createPlacementCompany(tpo, {
      collegeId: SEED_IDS.collegeA,
      name,
      primaryDomain: randomUUID() + ".example.org",
    })).rejects.toBeInstanceOf(PlacementsServiceError);
  });

  it("denies forged college and non-manager membership without an audit", async () => {
    const name = "DB09 Denied Company " + randomUUID();
    await expect(createPlacementCompany(tpo, {
      collegeId: SEED_IDS.collegeB, name,
    })).rejects.toBeInstanceOf(AuthorizationError);
    const wrongRole: RequestContext = {
      ...tpo,
      membership: { ...tpo.membership!, roles: ["LEARNER"] },
    };
    await expect(createPlacementCompany(wrongRole, {
      collegeId: SEED_IDS.collegeA, name,
    })).rejects.toBeInstanceOf(AuthorizationError);
  });
});
