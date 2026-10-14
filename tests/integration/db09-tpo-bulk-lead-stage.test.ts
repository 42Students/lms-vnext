import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { createTpoLead } from "@/modules/placements/tpo-crm-service";
import { bulkChangeTpoLeadStages } from "@/modules/placements/tpo-bulk-lead-stage-service";
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
    identityUid: "db09-bulk-stages-tpo",
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
    await client.query(
      "DELETE FROM placement_tpo_leads WHERE id = ANY($1::uuid[])",
      [ids],
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
  const name = "Bulk stage " + randomUUID();
  const lead = await createTpoLead(tpo, {
    collegeId: SEED_IDS.collegeA,
    name,
    email: "bulk-" + randomUUID() + "@example.org",
  });
  createdIds.add(lead.id);
  return lead.id;
}

describe.skipIf(!enabled)("DB09 confirmed bulk lead stage PostgreSQL", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("Disposable PostgreSQL is required");
    const [registrations] = (await pool.query(
      "SELECT to_regclass('public.placement_tpo_leads') AS leads, " +
      "to_regclass('public.placement_tpo_lead_activities') AS activities",
    )).rows;
    expect(registrations.leads).toBeTruthy();
    expect(registrations.activities).toBeTruthy();
    const triggers = (await pool.query(
      "SELECT tgname FROM pg_trigger WHERE tgrelid=" +
      "'placement_tpo_lead_activities'::regclass AND NOT tgisinternal",
    )).rows.map((item) => item.tgname);
    expect(triggers).toContain("db09_lead_activity_immutable");
    expect(triggers).toContain("db09_lead_activity_actor_scope_guard");
  });

  afterEach(async () => { await cleanup(); });
  afterAll(async () => {
    await cleanup();
    await pool?.end();
    await closeDatabaseConnection();
  });

  it("transitions Contacted and Not Now with immutable actor audits and honest row results", async () => {
    if (!pool) throw new Error("Disposable PostgreSQL is required");
    const first = await fixture();
    const second = await fixture();
    const missing = randomUUID();
    const result = await bulkChangeTpoLeadStages(tpo, {
      action: "CONTACTED", confirmed: true,
      selections: [
        { id: second, expectedStage: "NEW" },
        { id: missing, expectedStage: "NEW" },
        { id: first, expectedStage: "NEW" },
      ],
    });
    expect(result.counts).toEqual({
      total: 3, updated: 2, unchanged: 0, ineligible: 1,
    });
    expect(result.results.map((row) => row.leadId)).toEqual([second, missing, first]);

    const notNow = await bulkChangeTpoLeadStages(tpo, {
      action: "NOT_NOW", confirmed: true,
      selections: [{ id: first, expectedStage: "CONTACTED" }],
      reason: "Hiring deferred until next quarter",
      revisitDate: "2026-12-18",
    });
    expect(notNow.counts.updated).toBe(1);
    const unchanged = await bulkChangeTpoLeadStages(tpo, {
      action: "NOT_NOW", confirmed: true,
      selections: [{ id: first, expectedStage: "NOT_NOW" }],
      reason: "Hiring deferred until next quarter",
      revisitDate: "2026-12-18",
    });
    expect(unchanged.counts.unchanged).toBe(1);

    const stale = await bulkChangeTpoLeadStages(tpo, {
      action: "CONTACTED", confirmed: true,
      selections: [{ id: first, expectedStage: "CONTACTED" }],
    });
    expect(stale.counts.ineligible).toBe(1);
    const rows = await pool.query(
      "SELECT l.id, l.manual_stage, l.not_now_reason, l.not_now_until::date::text AS not_now_until, " +
      "a.note, a.type, a.created_by_user_id FROM placement_tpo_leads l " +
      "JOIN placement_tpo_lead_activities a ON a.college_id=l.college_id AND a.lead_id=l.id " +
      "WHERE l.id = ANY($1::uuid[]) ORDER BY l.id, a.created_at",
      [[first, second]],
    );
    const byId = (id: string) => rows.rows.filter((row) => row.id === id);
    expect(byId(first)).toHaveLength(3);
    expect(byId(second)).toHaveLength(2);
    expect(byId(first).every((row) => row.type === "NOTE")).toBe(true);
    expect(byId(first).every((row) => row.created_by_user_id === SEED_IDS.facultyUser)).toBe(true);
    expect(byId(first)[0]?.manual_stage).toBe("NOT_NOW");
    expect(byId(first)[0]?.not_now_until).toBe("2026-12-18");
    expect(byId(first)[0]?.not_now_reason).toBe("Hiring deferred until next quarter");
    expect(byId(first).some((row) => row.note === "Bulk manual stage changed to Contacted")).toBe(true);
    expect(byId(first).some((row) => row.note === "Bulk manual stage changed to Not Now")).toBe(true);
  });

  it("denies non-TPO, rejects invalid confirmation, and hides foreign college leads", async () => {
    if (!pool) throw new Error("Disposable PostgreSQL is required");
    const id = await fixture();
    const request = {
      action: "CONTACTED", confirmed: true,
      selections: [{ id, expectedStage: "NEW" }],
    };
    const learner: RequestContext = {
      ...tpo, membership: { ...tpo.membership!, roles: ["LEARNER"] },
    };
    await expect(bulkChangeTpoLeadStages(learner, request))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(bulkChangeTpoLeadStages(tpo, { ...request, confirmed: false }))
      .rejects.toBeDefined();
    const foreign: RequestContext = {
      ...tpo, membership: { ...tpo.membership!, collegeId: SEED_IDS.collegeB },
    };
    const other = await bulkChangeTpoLeadStages(foreign, request);
    expect(other.counts).toEqual({ total: 1, updated: 0, unchanged: 0, ineligible: 1 });
    const [stored] = (await pool.query(
      "SELECT manual_stage FROM placement_tpo_leads WHERE id=$1",
      [id],
    )).rows;
    expect(stored.manual_stage).toBe("NEW");
    const [count] = (await pool.query(
      "SELECT count(*)::integer AS n FROM placement_tpo_lead_activities WHERE lead_id=$1",
      [id],
    )).rows;
    expect(count.n).toBe(1);
  });

  it("rolls back every bulk stage change when immutable audit rejects a forged actor", async () => {
    if (!pool) throw new Error("Disposable PostgreSQL is required");
    const first = await fixture();
    const second = await fixture();
    const forged: RequestContext = {
      ...tpo, user: { ...tpo.user, id: SEED_IDS.learnerUser },
    };
    await expect(bulkChangeTpoLeadStages(forged, {
      action: "CONTACTED", confirmed: true,
      selections: [
        { id: first, expectedStage: "NEW" },
        { id: second, expectedStage: "NEW" },
      ],
    })).rejects.toBeDefined();
    const records = await pool.query(
      "SELECT manual_stage FROM placement_tpo_leads WHERE id=ANY($1::uuid[])",
      [[first, second]],
    );
    expect(records.rows.map((row) => row.manual_stage)).toEqual(["NEW", "NEW"]);
    const audits = await pool.query(
      "SELECT count(*)::integer AS n FROM placement_tpo_lead_activities " +
      "WHERE lead_id=ANY($1::uuid[])",
      [[first, second]],
    );
    expect(audits.rows[0]?.n).toBe(2);
  });
});
