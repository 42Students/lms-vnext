import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import {
  addTpoFollowup,
  createTpoLead,
  finishTpoFollowup,
  moveTpoFollowup,
} from "@/modules/placements/tpo-crm-service";
import { calendarFollowupCreateSchema, calendarFollowupMoveSchema } from "@/modules/placements/tpo-calendar-followup-model";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB09_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled
  ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 })
  : null;

const tpoA: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "w38-tpo-calendar",
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
const tpoB: RequestContext = {
  ...tpoA,
  membership: {
    ...tpoA.membership!,
    id: SEED_IDS.facultyCollegeBMembership,
    collegeId: SEED_IDS.collegeB,
  },
};

const createdLeads: string[] = [];
const createdFollowups: string[] = [];

describe.skipIf(!enabled)("W38 calendar follow-ups: disposable PostgreSQL", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("TEST_DATABASE_URL is missing");
    const { rows } = await pool.query(
      "SELECT to_regclass('public.placement_tpo_leads') AS leads, " +
      "to_regclass('public.placement_tpo_followups') AS followups",
    );
    if (!rows[0]?.leads || !rows[0]?.followups) {
      throw new Error("Registered DB09 CRM tables are required");
    }
  });

  afterAll(async () => {
    try {
      if (pool) {
        for (const id of createdFollowups.reverse()) {
          await pool.query("DELETE FROM placement_tpo_followups WHERE id = $1", [id]);
        }
        for (const id of createdLeads.reverse()) {
          await pool.query("DELETE FROM placement_tpo_leads WHERE id = $1", [id]);
        }
      }
    } finally {
      await pool?.end();
      await closeDatabaseConnection();
    }
  });

  it("creates, reschedules and rejects movement after completion", async () => {
    const lead = await createTpoLead(tpoA, {
      collegeId: SEED_IDS.collegeA,
      name: "Calendar Lead",
      email: `calendar-${randomUUID()}@example.org`,
    });
    createdLeads.push(lead.id);

    const createdInput = calendarFollowupCreateSchema.parse({
      leadId: lead.id,
      dueAt: "2026-10-16T09:30:00+05:30",
      note: "Follow up from calendar",
    });
    const created = await addTpoFollowup(tpoA, createdInput.leadId, {
      collegeId: SEED_IDS.collegeA,
      dueAt: createdInput.dueAt,
      note: createdInput.note,
    });
    createdFollowups.push(created.id);

    expect(created.collegeId).toBe(SEED_IDS.collegeA);
    expect(created.dueAt.toISOString()).toBe("2026-10-16T04:00:00.000Z");

    const movedInput = calendarFollowupMoveSchema.parse({
      dueAt: "2026-10-18T15:45:00+05:30",
    });
    const moved = await moveTpoFollowup(tpoA, created.id, {
      collegeId: SEED_IDS.collegeA,
      dueAt: movedInput.dueAt,
    });
    expect(moved.dueAt.toISOString()).toBe("2026-10-18T10:15:00.000Z");

    await finishTpoFollowup(tpoA, SEED_IDS.collegeA, created.id);
    await expect(moveTpoFollowup(tpoA, created.id, {
      collegeId: SEED_IDS.collegeA,
      dueAt: "2026-10-19T09:30:00+05:30",
    })).rejects.toMatchObject({ code: "TPO_CRM_FOLLOWUP_ALREADY_DONE" });
  });

  it("rejects another college's lead and follow-up without writing to it", async () => {
    const lead = await createTpoLead(tpoA, {
      collegeId: SEED_IDS.collegeA,
      name: "Private Calendar Lead",
      email: `calendar-private-${randomUUID()}@example.org`,
    });
    createdLeads.push(lead.id);
    const followup = await addTpoFollowup(tpoA, lead.id, {
      collegeId: SEED_IDS.collegeA,
      dueAt: "2026-11-01T09:30:00+05:30",
    });
    createdFollowups.push(followup.id);

    await expect(addTpoFollowup(tpoB, lead.id, {
      collegeId: SEED_IDS.collegeB,
      dueAt: "2026-11-02T09:30:00+05:30",
    })).rejects.toMatchObject({ code: "TPO_CRM_LEAD_NOT_FOUND" });

    await expect(moveTpoFollowup(tpoB, followup.id, {
      collegeId: SEED_IDS.collegeB,
      dueAt: "2026-11-02T09:30:00+05:30",
    })).rejects.toMatchObject({ code: "TPO_CRM_FOLLOWUP_NOT_FOUND" });

    const stored = await pool!.query(
      "SELECT due_at FROM placement_tpo_followups WHERE id = $1 AND college_id = $2",
      [followup.id, SEED_IDS.collegeA],
    );
    expect(stored.rows).toHaveLength(1);
    expect(stored.rows[0].due_at.toISOString()).toBe("2026-11-01T04:00:00.000Z");
  });
});
