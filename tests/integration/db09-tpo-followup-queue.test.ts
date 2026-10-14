import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { createTpoLead } from "@/modules/placements/tpo-crm-service";
import {
  createConfirmedTpoFollowup,
  completeConfirmedTpoFollowup,
  getTpoDueFollowupQueue,
  getTpoFollowupQueueCsv,
} from "@/modules/placements/tpo-followup-queue-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = process.env.DB09_ISOLATED_TEST_DATABASE === "1" &&
  Boolean(process.env.TEST_DATABASE_URL);
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled
  ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 })
  : null;
const leadIds = new Set<string>();

const tpo: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "db09-followup-queue-tpo",
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
  if (!pool || leadIds.size === 0) return;
  const ids = [...leadIds];
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM placement_tpo_followups WHERE lead_id = ANY($1::uuid[])",
      [ids],
    );
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
    leadIds.clear();
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function fixture() {
  const token = randomUUID();
  const lead = await createTpoLead(tpo, {
    collegeId: SEED_IDS.collegeA,
    name: "Follow-up " + token,
    email: "followup-" + token + "@example.org",
  });
  leadIds.add(lead.id);
  return lead.id;
}

describe.skipIf(!enabled)("DB09 confirmed follow-up queue on isolated PostgreSQL", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("Disposable PostgreSQL is required");
    const [tables] = (await pool.query(
      "SELECT to_regclass('public.placement_tpo_leads') AS leads, " +
      "to_regclass('public.placement_tpo_followups') AS followups, " +
      "to_regclass('public.placement_tpo_lead_activities') AS activities",
    )).rows;
    expect(tables.leads).toBeTruthy();
    expect(tables.followups).toBeTruthy();
    expect(tables.activities).toBeTruthy();
    const triggers = (await pool.query(
      "SELECT tgname FROM pg_trigger WHERE tgrelid = " +
      "'placement_tpo_lead_activities'::regclass AND NOT tgisinternal",
    )).rows.map((row) => row.tgname);
    expect(triggers).toContain("db09_lead_activity_immutable");
    expect(triggers).toContain("db09_lead_activity_actor_scope_guard");
  });

  afterEach(async () => { await cleanup(); });
  afterAll(async () => {
    await cleanup();
    await pool?.end();
    await closeDatabaseConnection();
  });

  it("creates and completes due work with one immutable actor audit per action", async () => {
    if (!pool) throw new Error("Disposable PostgreSQL is required");
    const leadId = await fixture();
    const dueAt = new Date(Date.now() - 60_000).toISOString();
    const created = await createConfirmedTpoFollowup(tpo, {
      confirmed: true, leadId, dueAt, note: "Discuss interviews",
    });
    expect(created.leadId).toBe(leadId);
    const queue = await getTpoDueFollowupQueue(tpo);
    const exportData=await getTpoFollowupQueueCsv(tpo,{});
    expect(exportData.csv).toContain("Follow-up ID");
    expect(exportData.csv).toContain("Follow-up");
    expect(queue.rows.some((row) => row.id === created.id)).toBe(true);
    const mine=await getTpoDueFollowupQueue(tpo,undefined,{scope:"MINE"});
    expect(mine.rows.some(row=>row.id===created.id)).toBe(true);
    await expect(getTpoDueFollowupQueue(tpo,undefined,{scope:"FOREIGN"})).rejects.toBeDefined();
    const databaseDate = (await pool.query(
      "SELECT to_char(due_at AT TIME ZONE 'UTC', " +
      "'YYYY-MM-DD\"T\"HH24:MI:SS') AS due_text, done_at " +
      "FROM placement_tpo_followups WHERE id=$1",
      [created.id],
    )).rows[0];
    expect(databaseDate?.due_text).toBe(dueAt.slice(0, 19));
    expect(databaseDate?.done_at).toBeNull();

    await expect(completeConfirmedTpoFollowup(tpo, created.id, {
      confirmed: false, expectedDueAt: created.dueAt,
      outcome: "CONTACTED", note: "Recruiter replied",
    })).rejects.toBeDefined();
    const completed = await completeConfirmedTpoFollowup(tpo, created.id, {
      confirmed: true, expectedDueAt: created.dueAt,
      outcome: "CONTACTED", note: "Recruiter replied",
    });
    expect(completed).toEqual({ id: created.id, done: true });
    await expect(completeConfirmedTpoFollowup(tpo, created.id, {
      confirmed: true, expectedDueAt: created.dueAt,
      outcome: "CONTACTED", note: "Replay rejected",
    })).rejects.toBeDefined();
    const audits = (await pool.query(
      "SELECT type, outcome, note, created_by_user_id FROM placement_tpo_lead_activities " +
      "WHERE lead_id=$1 ORDER BY created_at, id",
      [leadId],
    )).rows;
    expect(audits).toHaveLength(3);
    expect(audits.filter((row) => row.outcome === "FOLLOWUP_CREATED")).toHaveLength(1);
    expect(audits.filter((row) => row.outcome === "FOLLOWUP_DONE")).toHaveLength(1);
    expect(audits.every((row) => row.type === "NOTE")).toBe(true);
    expect(audits.every((row) => row.created_by_user_id === SEED_IDS.facultyUser)).toBe(true);
    const after = await getTpoDueFollowupQueue(tpo);
    expect(after.rows.some((row) => row.id === created.id)).toBe(false);
  });

  it("separates due from next-seven-day tasks using persisted scheduled times",async()=>{
    const leadId=await fixture();
    const upcoming=new Date(Date.now()+3*86400000).toISOString();
    const task=await createConfirmedTpoFollowup(tpo,{confirmed:true,leadId,dueAt:upcoming});
    expect((await getTpoDueFollowupQueue(tpo)).rows.some(row=>row.id===task.id)).toBe(false);
    expect((await getTpoDueFollowupQueue(tpo,undefined,{window:"NEXT_7_DAYS"})).rows.some(row=>row.id===task.id)).toBe(true);
  });

  it("searches scoped lead names literally before applying the queue cap",async()=>{
    const leadId=await fixture();
    const task=await createConfirmedTpoFollowup(tpo,{confirmed:true,leadId,dueAt:new Date(Date.now()-60000).toISOString()});
    expect((await getTpoDueFollowupQueue(tpo,undefined,{q:"Follow-up"})).rows.some(row=>row.id===task.id)).toBe(true);
    expect((await getTpoDueFollowupQueue(tpo,undefined,{q:"%_not_real"})).rows.some(row=>row.id===task.id)).toBe(false);
  });

  it("paginates stored follow-ups without hiding records beyond page one",async()=>{
    const leadId=await fixture();
    const dueAt=new Date(Date.now()-60000).toISOString();
    const created=[];
    for(let i=0;i<28;i++)created.push(await createConfirmedTpoFollowup(tpo,{confirmed:true,leadId,dueAt}));
    const page1=await getTpoDueFollowupQueue(tpo,undefined,{q:"Follow-up",page:1});
    expect(page1.rows).toHaveLength(25);
    const other=await getTpoDueFollowupQueue(tpo,undefined,{q:"Follow-up",page:2});
    expect(other.total).toBeGreaterThanOrEqual(28);
    expect(other.rows.length).toBeGreaterThanOrEqual(3);
    expect(other.page).toBe(2);
    const allIds=[...page1.rows,...other.rows].map(x=>x.id);
    expect(new Set(allIds).size).toBe(allIds.length);
    expect(created.every(row=>allIds.includes(row.id))).toBe(true);
  });

  it("rejects wrong roles and foreign college reads and writes without changing records", async () => {
    if (!pool) throw new Error("Disposable PostgreSQL is required");
    const leadId = await fixture();
    const dueAt = new Date(Date.now() - 60_000).toISOString();
    const learner: RequestContext = {
      ...tpo, membership: { ...tpo.membership!, roles: ["LEARNER"] },
    };
    const foreign: RequestContext = {
      ...tpo, membership: { ...tpo.membership!, collegeId: SEED_IDS.collegeB },
    };
    await expect(createConfirmedTpoFollowup(learner, {
      confirmed: true, leadId, dueAt,
    })).rejects.toBeInstanceOf(AuthorizationError);
    await expect(getTpoDueFollowupQueue(learner)).rejects.toBeInstanceOf(AuthorizationError);
    await expect(getTpoFollowupQueueCsv(learner,{})).rejects.toBeInstanceOf(AuthorizationError);
    await expect(createConfirmedTpoFollowup(foreign, {
      confirmed: true, leadId, dueAt,
    })).rejects.toBeDefined();

    const created = await createConfirmedTpoFollowup(tpo, {
      confirmed: true, leadId, dueAt,
    });
    await expect(getTpoFollowupQueueCsv(foreign,{})).rejects.toBeInstanceOf(AuthorizationError);
    await expect(completeConfirmedTpoFollowup(learner, created.id, {
      confirmed: true, expectedDueAt: created.dueAt,
      outcome: "OTHER", note: "Wrong role",
    })).rejects.toBeInstanceOf(AuthorizationError);
    await expect(completeConfirmedTpoFollowup(foreign, created.id, {
      confirmed: true, expectedDueAt: created.dueAt,
      outcome: "OTHER", note: "Foreign membership",
    })).rejects.toBeDefined();
    const [stored] = (await pool.query(
      "SELECT done_at FROM placement_tpo_followups WHERE id=$1",
      [created.id],
    )).rows;
    expect(stored?.done_at).toBeNull();
    const audit = (await pool.query(
      "SELECT outcome FROM placement_tpo_lead_activities WHERE lead_id=$1",
      [leadId],
    )).rows;
    expect(audit.filter((row) => row.outcome === "FOLLOWUP_CREATED")).toHaveLength(1);
    expect(audit.filter((row) => row.outcome === "FOLLOWUP_DONE")).toHaveLength(0);
  });

  it("rolls back both completion and audit when actor scope is forged", async () => {
    if (!pool) throw new Error("Disposable PostgreSQL is required");
    const leadId = await fixture();
    const dueAt = new Date(Date.now() - 60_000).toISOString();
    const created = await createConfirmedTpoFollowup(tpo, {
      confirmed: true, leadId, dueAt,
    });
    const forged: RequestContext = {
      ...tpo, user: { ...tpo.user, id: SEED_IDS.learnerUser },
    };
    await expect(completeConfirmedTpoFollowup(forged, created.id, {
      confirmed: true, expectedDueAt: created.dueAt,
      outcome: "OTHER", note: "Forged actor",
    })).rejects.toBeDefined();
    const [stored] = (await pool.query(
      "SELECT done_at FROM placement_tpo_followups WHERE id=$1",
      [created.id],
    )).rows;
    expect(stored?.done_at).toBeNull();
  });
});
