import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { createTpoLead } from "@/modules/placements/tpo-crm-service";
import { importTpoLeadsCsv } from "@/modules/placements/tpo-lead-csv-import-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = process.env.DB09_ISOLATED_TEST_DATABASE === "1" &&
  Boolean(process.env.TEST_DATABASE_URL);
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled
  ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 })
  : null;

const tpo: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "db09-lead-import-tpo",
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
const csvHeader = "name,email,phone,companyName,designation,source\r\n";
const createdIds = new Set<string>();

/**
 * Cleanup only this test's lead IDs in an expressly isolated PostgreSQL.
 * The immutable audit DELETE trigger is disabled inside one maintenance
 * transaction and always re-enabled before any other service assertion.
 * The TRUNCATE protection remains enabled and other fixtures are untouched.
 */
async function cleanOwnFixtures() {
  if (!pool || createdIds.size === 0) return;
  const ids = [...createdIds];
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "ALTER TABLE placement_tpo_lead_activities DISABLE TRIGGER db09_lead_activity_immutable",
    );
    await client.query(
      "DELETE FROM placement_tpo_lead_activities WHERE lead_id = ANY($1::uuid[])",
      [ids],
    );
    await client.query(
      "ALTER TABLE placement_tpo_lead_activities ENABLE TRIGGER db09_lead_activity_immutable",
    );
    await client.query("DELETE FROM placement_tpo_leads WHERE id = ANY($1::uuid[])", [ids]);
    await client.query("COMMIT");
    createdIds.clear();
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

describe.skipIf(!enabled)("DB09 recruiter CSV import isolated PostgreSQL", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("Isolated PostgreSQL required");
    const [tables] = (await pool.query(
      "SELECT to_regclass('public.placement_tpo_leads') leads, " +
      "to_regclass('public.placement_tpo_lead_activities') activities",
    )).rows;
    expect(tables.leads).toBeTruthy();
    expect(tables.activities).toBeTruthy();
    const triggerNames = (await pool.query(
      "SELECT tgname FROM pg_trigger " +
      "WHERE tgrelid = 'placement_tpo_lead_activities'::regclass AND NOT tgisinternal",
    )).rows.map(row => row.tgname);
    expect(triggerNames).toContain("db09_lead_activity_actor_scope_guard");
    expect(triggerNames).toContain("db09_lead_activity_immutable");
  });

  afterEach(async () => {
    await cleanOwnFixtures();
  });

  afterAll(async () => {
    await cleanOwnFixtures();
    await pool?.end();
    await closeDatabaseConnection();
  });

  it("creates imported leads and immutable actor-audit pairs, reports existing/file duplicates and invalid rows", async () => {
    if (!pool) throw new Error("Isolated PostgreSQL required");
    const unique = randomUUID().slice(0, 12);
    const phoneDigits = String(BigInt("0x" + randomUUID().replaceAll("-", ""))).slice(-10);
    const existingEmail = "already-" + unique + "@example.org";
    const existing = await createTpoLead(tpo, {
      collegeId: SEED_IDS.collegeA,
      name: "Existing recruiter " + unique,
      email: existingEmail,
    });
    createdIds.add(existing.id);

    const firstEmail = "imported-" + unique + "@example.org";
    const csv = csvHeader +
      '"Recruiter, One",' + firstEmail + ',,Campus Partners,HR,REFERRAL\r\n' +
      "Duplicate database," + existingEmail + ",,Campus Partners,,\r\n" +
      "Repeat in file," + firstEmail + ",,Campus Partners,,\r\n" +
      "Phone Candidate,,+91 " + phoneDigits + ",Phone Corp,,LINKEDIN\r\n" +
      "Invalid name,,,,,\r\n";
    const result = await importTpoLeadsCsv(tpo, SEED_IDS.collegeA, {
      confirmed: true, csv,
    });
    expect(result.counts).toEqual({
      total: 5, created: 2, duplicate: 2, invalid: 1,
    });
    expect(result.results.map(item => item.status)).toEqual([
      "created", "duplicate", "duplicate", "created", "invalid",
    ]);
    for (const row of result.results) if (row.leadId) createdIds.add(row.leadId);
    const importedIds = result.results.filter(row => row.leadId).map(row => row.leadId);
    const rows = await pool.query(
      "SELECT l.id, l.email_norm, l.phone_norm, l.owner_membership_id, " +
      "a.type, a.note, a.created_by_user_id FROM placement_tpo_leads l " +
      "JOIN placement_tpo_lead_activities a ON a.college_id=l.college_id AND a.lead_id=l.id " +
      "WHERE l.id=ANY($1::uuid[]) ORDER BY l.id",
      [importedIds],
    );
    expect(rows.rows).toHaveLength(2);
    for (const record of rows.rows) {
      expect(record.owner_membership_id).toBe(SEED_IDS.facultyCollegeAMembership);
      expect(record.type).toBe("NOTE");
      expect(record.note).toBe("Recruiter lead imported from CSV");
      expect(record.created_by_user_id).toBe(SEED_IDS.facultyUser);
    }
    expect(rows.rows.some(row => row.email_norm === firstEmail)).toBe(true);
    expect(rows.rows.some(row => row.phone_norm === phoneDigits)).toBe(true);
  });

  it("rejects learner roles and cross-college payloads without inserting rows", async () => {
    if (!pool) throw new Error("Isolated PostgreSQL required");
    const email = "denied-" + randomUUID().slice(0, 12) + "@example.org";
    const input = { confirmed: true, csv: csvHeader + "Denied," + email + ",,,," };
    const learner: RequestContext = {
      ...tpo, membership: { ...tpo.membership!, roles: ["LEARNER"] },
    };
    await expect(importTpoLeadsCsv(learner, SEED_IDS.collegeA, input))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(importTpoLeadsCsv(tpo, SEED_IDS.collegeB, input))
      .rejects.toBeInstanceOf(AuthorizationError);
    const count = await pool.query(
      "SELECT count(*)::integer AS n FROM placement_tpo_leads WHERE email_norm=$1",
      [email],
    );
    expect(count.rows[0]?.n).toBe(0);
  });

  it("rolls back every inserted lead if the actor-audit trigger denies one", async () => {
    if (!pool) throw new Error("Isolated PostgreSQL required");
    const email = "rollback-" + randomUUID().slice(0, 12) + "@example.org";
    const forged: RequestContext = {
      ...tpo, user: { ...tpo.user, id: SEED_IDS.learnerUser },
    };
    await expect(importTpoLeadsCsv(forged, SEED_IDS.collegeA, {
      confirmed: true,
      csv: csvHeader + "Must Rollback," + email + ",,,,",
    })).rejects.toBeDefined();
    const count = await pool.query(
      "SELECT count(*)::integer AS n FROM placement_tpo_leads WHERE email_norm=$1",
      [email],
    );
    expect(count.rows[0]?.n).toBe(0);
  });
});
