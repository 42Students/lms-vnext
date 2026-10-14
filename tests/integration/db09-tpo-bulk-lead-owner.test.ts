import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { createTpoLead } from "@/modules/placements/tpo-crm-service";
import {
  bulkAssignTpoLeadOwner,
  listTpoLeadOwners,
} from "@/modules/placements/tpo-bulk-lead-owner-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = process.env.DB09_ISOLATED_TEST_DATABASE === "1" &&
  Boolean(process.env.TEST_DATABASE_URL);
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled
  ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 })
  : null;
const createdIds = new Set<string>();

const tpo: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "db09-bulk-owner-tpo",
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

async function cleanup() {
  if (!pool || createdIds.size === 0) return;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "ALTER TABLE placement_tpo_lead_activities DISABLE TRIGGER db09_lead_activity_immutable",
    );
    await client.query(
      "DELETE FROM placement_tpo_lead_activities WHERE lead_id = ANY($1::uuid[])",
      [[...createdIds]],
    );
    await client.query(
      "ALTER TABLE placement_tpo_lead_activities ENABLE TRIGGER db09_lead_activity_immutable",
    );
    await client.query(
      "DELETE FROM placement_tpo_leads WHERE id = ANY($1::uuid[])",
      [[...createdIds]],
    );
    await client.query("COMMIT");
    createdIds.clear();
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function fixture() {
  const lead = await createTpoLead(tpo, {
    collegeId: SEED_IDS.collegeA,
    name: "Owner fixture " + randomUUID(),
    email: "owner-" + randomUUID() + "@example.org",
  });
  createdIds.add(lead.id);
  return lead.id;
}

describe.skipIf(!enabled)("DB09 TPO bulk lead ownership PostgreSQL", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("Disposable PostgreSQL is required");
    const [relations] = (await pool.query(
      "SELECT to_regclass('public.placement_tpo_leads') AS leads, " +
      "to_regclass('public.placement_tpo_lead_activities') AS activities",
    )).rows;
    expect(relations.leads).toBeTruthy();
    expect(relations.activities).toBeTruthy();
    const triggers = (await pool.query(
      "SELECT tgname FROM pg_trigger WHERE tgrelid = " +
      "'placement_tpo_leads'::regclass AND NOT tgisinternal",
    )).rows.map((row) => row.tgname);
    expect(triggers).toContain("db09_lead_scoped_links_guard");
  });

  afterEach(async () => { await cleanup(); });
  afterAll(async () => {
    await cleanup();
    await pool?.end();
    await closeDatabaseConnection();
  });

  it("reassigns persisted owner with exactly one immutable actor audit per change", async () => {
    if (!pool) throw new Error("Disposable PostgreSQL is required");
    const a = await fixture();
    const b = await fixture();
    const nonexistent = randomUUID();
    const owners = await listTpoLeadOwners(tpo);
    expect(owners.some((owner) => owner.membershipId === SEED_IDS.collegeAdminMembership))
      .toBe(true);

    const payload = {
      confirmed: true,
      ownerMembershipId: SEED_IDS.collegeAdminMembership,
      selections: [
        { id: b, expectedOwnerMembershipId: SEED_IDS.facultyCollegeAMembership },
        { id: nonexistent, expectedOwnerMembershipId: null },
        { id: a, expectedOwnerMembershipId: SEED_IDS.facultyCollegeAMembership },
      ],
    };
    const changed = await bulkAssignTpoLeadOwner(tpo, payload);
    expect(changed.counts).toEqual({
      total: 3, updated: 2, unchanged: 0, ineligible: 1,
    });
    expect(changed.results.map((row) => row.leadId)).toEqual([b, nonexistent, a]);

    const again = await bulkAssignTpoLeadOwner(tpo, {
      ...payload,
      selections: [{ id: a, expectedOwnerMembershipId: SEED_IDS.collegeAdminMembership }],
    });
    expect(again.counts).toEqual({
      total: 1, updated: 0, unchanged: 1, ineligible: 0,
    });
    const stale = await bulkAssignTpoLeadOwner(tpo, {
      ...payload,
      selections: [{ id: a, expectedOwnerMembershipId: SEED_IDS.facultyCollegeAMembership }],
    });
    expect(stale.counts.ineligible).toBe(1);

    const rows = (await pool.query(
      "SELECT l.id, l.owner_membership_id, a.note, a.type, a.outcome, a.created_by_user_id " +
      "FROM placement_tpo_leads l JOIN placement_tpo_lead_activities a " +
      "ON a.college_id=l.college_id AND a.lead_id=l.id " +
      "WHERE l.id = ANY($1::uuid[]) ORDER BY l.id, a.created_at, a.id",
      [[a, b]],
    )).rows;
    expect(rows.filter((row) => row.id === a)).toHaveLength(2);
    expect(rows.filter((row) => row.id === b)).toHaveLength(2);
    expect(rows.every((row) => row.owner_membership_id === SEED_IDS.collegeAdminMembership))
      .toBe(true);
    const reassigned = rows.filter((row) => row.outcome === "OWNER_CHANGED");
    expect(reassigned).toHaveLength(2);
    expect(reassigned.every((row) => row.type === "NOTE")).toBe(true);
    expect(reassigned.every((row) => row.created_by_user_id === SEED_IDS.facultyUser))
      .toBe(true);
    expect(reassigned.every((row) =>
      String(row.note).includes(SEED_IDS.collegeAdminMembership))).toBe(true);

    await expect(pool.query(
      "UPDATE placement_tpo_lead_activities SET note='edited' " +
      "WHERE lead_id=$1 AND outcome='OWNER_CHANGED'",
      [a],
    )).rejects.toBeDefined();
  });

  it("rejects wrong-role, forged confirmation and foreign-college owner", async () => {
    if (!pool) throw new Error("Disposable PostgreSQL is required");
    const leadId = await fixture();
    const selection = [{
      id: leadId, expectedOwnerMembershipId: SEED_IDS.facultyCollegeAMembership,
    }];
    const body = {
      confirmed: true, ownerMembershipId: SEED_IDS.collegeAdminMembership, selections: selection,
    };
    const wrongRole: RequestContext = {
      ...tpo, membership: { ...tpo.membership!, roles: ["LEARNER"] },
    };
    await expect(bulkAssignTpoLeadOwner(wrongRole, body))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(listTpoLeadOwners(wrongRole))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(bulkAssignTpoLeadOwner(tpo, { ...body, confirmed: false }))
      .rejects.toBeDefined();

    await expect(bulkAssignTpoLeadOwner(tpo, {
      ...body, ownerMembershipId: SEED_IDS.facultyCollegeBMembership,
    })).rejects.toBeInstanceOf(AuthorizationError);

    const foreign: RequestContext = {
      ...tpo, membership: { ...tpo.membership!, collegeId: SEED_IDS.collegeB },
    };
    const foreignResult = await bulkAssignTpoLeadOwner(foreign, {
      ...body, ownerMembershipId: SEED_IDS.facultyCollegeBMembership,
    });
    expect(foreignResult.counts).toEqual({
      total: 1, updated: 0, unchanged: 0, ineligible: 1,
    });

    const [dbRow] = (await pool.query(
      "SELECT owner_membership_id FROM placement_tpo_leads WHERE id=$1",
      [leadId],
    )).rows;
    expect(dbRow.owner_membership_id).toBe(SEED_IDS.facultyCollegeAMembership);
    const auditCount = (await pool.query(
      "SELECT count(*)::int AS count FROM placement_tpo_lead_activities " +
      "WHERE lead_id=$1 AND outcome='OWNER_CHANGED'",
      [leadId],
    )).rows[0].count;
    expect(auditCount).toBe(0);
  });
});
