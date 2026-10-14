import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  createConfirmedTpoCompanyInteraction,
  TpoCompanyInteractionConflict,
} from "@/modules/placements/tpo-company-interaction-service";
import { TpoCrmError } from "@/modules/placements/tpo-crm-service";
import { getTpoCompanyContactLog } from "@/modules/placements/tpo-company-contact-log-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = process.env.DB09_ISOLATED_TEST_DATABASE === "1" &&
  Boolean(process.env.TEST_DATABASE_URL);
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled
  ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 })
  : null;

const createdCompanies = new Set<string>();
const createdRelationships = new Set<string>();
const createdLeads = new Set<string>();

const tpo: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "db09-company-interactions-tpo",
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
  if (!pool) throw new Error("Disposable PostgreSQL is required");
  const token = randomUUID();
  const company = (await pool.query<{ id: string }>(
    "INSERT INTO placement_companies (name, created_by_user_id) " +
      "VALUES ($1, $2) RETURNING id",
    ["DB09 contact " + token, SEED_IDS.facultyUser],
  )).rows[0];
  if (!company) throw new Error("Company fixture insert failed");
  createdCompanies.add(company.id);
  const rel = (await pool.query<{ id: string }>(
    "INSERT INTO placement_company_relationships " +
      "(college_id, company_id, created_by_user_id) VALUES ($1, $2, $3) RETURNING id",
    [collegeId, company.id, SEED_IDS.facultyUser],
  )).rows[0];
  if (!rel) throw new Error("Company relationship fixture insert failed");
  createdRelationships.add(rel.id);
  const lead = (await pool.query<{ id: string; updated_at: Date }>(
    "INSERT INTO placement_tpo_leads " +
      "(college_id, company_relationship_id, name, email_norm) " +
      "VALUES ($1, $2, $3, $4) RETURNING id, updated_at",
    [collegeId, rel.id, "Contact " + token, "contact-" + token + "@example.org"],
  )).rows[0];
  if (!lead) throw new Error("Lead fixture insert failed");
  createdLeads.add(lead.id);
  return {
    companyId: company.id,
    leadId: lead.id,
    expectedLeadUpdatedAt: lead.updated_at.toISOString(),
  };
}

function payload(leadId: string, expectedLeadUpdatedAt: string) {
  return {
    confirmed: true as const,
    leadId,
    expectedLeadUpdatedAt,
    type: "MEETING" as const,
    outcome: "REACHED",
    note: "Recruiter discussed interview slots",
  };
}

async function cleanup() {
  if (!pool) return;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (createdLeads.size) {
      const ids = [...createdLeads];
      await client.query(
        "ALTER TABLE placement_tpo_lead_activities " +
          "DISABLE TRIGGER db09_lead_activity_immutable",
      );
      await client.query(
        "DELETE FROM placement_tpo_lead_activities WHERE lead_id = ANY($1::uuid[])",
        [ids],
      );
      await client.query(
        "ALTER TABLE placement_tpo_lead_activities " +
          "ENABLE TRIGGER db09_lead_activity_immutable",
      );
      await client.query(
        "DELETE FROM placement_tpo_leads WHERE id = ANY($1::uuid[])",
        [ids],
      );
    }
    if (createdRelationships.size) {
      await client.query(
        "DELETE FROM placement_company_relationships WHERE id = ANY($1::uuid[])",
        [[...createdRelationships]],
      );
    }
    if (createdCompanies.size) {
      await client.query(
        "DELETE FROM placement_companies WHERE id = ANY($1::uuid[])",
        [[...createdCompanies]],
      );
    }
    await client.query("COMMIT");
    createdLeads.clear();
    createdRelationships.clear();
    createdCompanies.clear();
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

describe.skipIf(!enabled)("DB09 TPO company contact interaction PostgreSQL", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("Disposable PostgreSQL is required");
    const row = (await pool.query(
      "SELECT to_regclass('public.placement_tpo_leads') AS leads, " +
        "to_regclass('public.placement_tpo_lead_activities') AS activities, " +
        "to_regclass('public.placement_company_relationships') AS relationships",
    )).rows[0];
    if (!row) throw new Error("DB09 migration readiness query failed");
    expect(row.leads).toBeTruthy();
    expect(row.activities).toBeTruthy();
    expect(row.relationships).toBeTruthy();
    const names = (await pool.query(
      "SELECT tgname FROM pg_trigger WHERE tgrelid = " +
        "'placement_tpo_lead_activities'::regclass AND NOT tgisinternal",
    )).rows.map((item) => item.tgname);
    expect(names).toContain("db09_lead_activity_immutable");
    expect(names).toContain("db09_lead_activity_actor_scope_guard");
  });

  afterEach(async () => { await cleanup(); });
  afterAll(async () => {
    await cleanup();
    await pool?.end();
    await closeDatabaseConnection();
  });

  it("commits exactly one immutable actor audit and exposes its safe projection", async () => {
    if (!pool) throw new Error("Disposable PostgreSQL is required");
    const data = await fixture();
    const created = await createConfirmedTpoCompanyInteraction(
      tpo, data.companyId, payload(data.leadId, data.expectedLeadUpdatedAt),
    );
    expect(created.leadId).toBe(data.leadId);
    expect(created.type).toBe("MEETING");
    const rows = (await pool.query(
      "SELECT id, college_id, lead_id, type, outcome, note, is_system, created_by_user_id " +
        "FROM placement_tpo_lead_activities WHERE lead_id=$1",
      [data.leadId],
    )).rows;
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: created.id,
      college_id: SEED_IDS.collegeA,
      lead_id: data.leadId,
      type: "MEETING",
      outcome: "REACHED",
      note: "Recruiter discussed interview slots",
      is_system: false,
      created_by_user_id: SEED_IDS.facultyUser,
    });

    const log = await getTpoCompanyContactLog(tpo, { companyId: data.companyId });
    expect(log?.rows.some((row) => row.id === created.id)).toBe(true);
    expect(log?.contacts.some((contact) => contact.id === data.leadId)).toBe(true);
    const lead = (await pool.query(
      "SELECT manual_stage, updated_at FROM placement_tpo_leads WHERE id=$1",
      [data.leadId],
    )).rows[0];
    if (!lead) throw new Error("Contact fixture disappeared");
    expect(lead.manual_stage).toBe("NEW");
    expect((lead.updated_at as Date).getTime())
      .toBeGreaterThan(new Date(data.expectedLeadUpdatedAt).getTime());
    await expect(createConfirmedTpoCompanyInteraction(
      tpo, data.companyId, payload(data.leadId, data.expectedLeadUpdatedAt),
    )).rejects.toBeInstanceOf(TpoCompanyInteractionConflict);
    const unchangedAudits = (await pool.query<{ total: number }>(
      "SELECT count(*)::integer AS total FROM placement_tpo_lead_activities WHERE lead_id=$1",
      [data.leadId],
    )).rows[0];
    expect(unchangedAudits?.total).toBe(1);

    await expect(pool.query(
      "UPDATE placement_tpo_lead_activities SET note='tampered' WHERE id=$1",
      [created.id],
    )).rejects.toThrow();
  });

  it("rejects wrong role and foreign college/relationship without writing audits", async () => {
    if (!pool) throw new Error("Disposable PostgreSQL is required");
    const local = await fixture();
    const foreign = await fixture(SEED_IDS.collegeB);
    const wrongRole: RequestContext = {
      ...tpo,
      membership: { ...tpo.membership!, roles: ["LEARNER"] },
    };
    await expect(createConfirmedTpoCompanyInteraction(
      wrongRole, local.companyId,
      payload(local.leadId, local.expectedLeadUpdatedAt),
    )).rejects.toBeInstanceOf(AuthorizationError);
    await expect(createConfirmedTpoCompanyInteraction(
      tpo, foreign.companyId,
      payload(foreign.leadId, foreign.expectedLeadUpdatedAt),
    )).rejects.toBeInstanceOf(TpoCrmError);
    await expect(createConfirmedTpoCompanyInteraction(
      tpo, local.companyId,
      payload(foreign.leadId, foreign.expectedLeadUpdatedAt),
    )).rejects.toBeInstanceOf(TpoCrmError);
    const count = (await pool.query<{ total: number }>(
      "SELECT count(*)::integer AS total FROM placement_tpo_lead_activities " +
        "WHERE lead_id = ANY($1::uuid[])",
      [[local.leadId, foreign.leadId]],
    )).rows[0];
    expect(count?.total).toBe(0);
  });

  it("denies stale selection and unconfirmed writes, leaving no activity", async () => {
    if (!pool) throw new Error("Disposable PostgreSQL is required");
    const data = await fixture();
    await pool.query(
      "UPDATE placement_tpo_leads SET updated_at=updated_at + interval '10 seconds' WHERE id=$1",
      [data.leadId],
    );
    await expect(createConfirmedTpoCompanyInteraction(
      tpo, data.companyId,
      payload(data.leadId, data.expectedLeadUpdatedAt),
    )).rejects.toBeInstanceOf(TpoCompanyInteractionConflict);
    await expect(createConfirmedTpoCompanyInteraction(
      tpo, data.companyId,
      { ...payload(data.leadId, data.expectedLeadUpdatedAt), confirmed: false },
    )).rejects.toBeDefined();
    const count = (await pool.query<{ total: number }>(
      "SELECT count(*)::integer AS total FROM placement_tpo_lead_activities WHERE lead_id=$1",
      [data.leadId],
    )).rows[0];
    expect(count?.total).toBe(0);
  });
});
