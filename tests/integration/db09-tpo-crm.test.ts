import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  TpoCrmError,
  addTpoFollowup,
  createTpoLead,
  finishTpoFollowup,
  listDueTpoFollowups,
  listTpoLeadActivities,
  listTpoLeads,
  logTpoLeadActivity,
  markTpoLeadNotNow,
  moveTpoFollowup,
} from "@/modules/placements/tpo-crm-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

const databaseUrl = process.env.TEST_DATABASE_URL;
const enabled =
  process.env.DB09_ISOLATED_TEST_DATABASE === "1" &&
  Boolean(databaseUrl);
const pool = enabled ? new Pool({ connectionString: databaseUrl, max: 4 }) : null;

const tpo: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "db09-crm-tpo",
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
  ...tpo,
  membership: { ...tpo.membership!, roles: ["LEARNER"] },
};

describe.skipIf(!enabled)("DB09 recruiter CRM isolated PostgreSQL integrity", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("Isolated database missing");
    const [check] = (await pool.query(
      "SELECT to_regclass('public.placement_tpo_leads') AS leads, " +
      "to_regclass('public.placement_tpo_lead_activities') AS activities, " +
      "to_regclass('public.placement_tpo_followups') AS followups",
    )).rows;
    if (!check.leads || !check.activities || !check.followups) {
      throw new Error("Apply DB09 CRM unregistered SQL in isolated database");
    }
    const triggers = (await pool.query(
      "SELECT tgname FROM pg_trigger WHERE tgrelid = " +
      "'placement_tpo_lead_activities'::regclass AND NOT tgisinternal",
    )).rows.map(x => x.tgname);
    expect(triggers).toContain("db09_lead_activity_immutable");
  });

  beforeEach(async () => {
    if (!pool) return;
    // ONLY a disposable isolated database. Append-only trigger correctly
    // rejects row DELETE; TRUNCATE is deliberately used by test cleanup.
    await pool.query(
      "TRUNCATE placement_tpo_lead_activities, placement_tpo_followups, placement_tpo_leads",
    );
  });

  afterAll(async () => {
    await pool?.end();
    await closeDatabaseConnection();
  });

  it("creates tenant-scoped lead, lists it, and transitions NEW to CONTACTED on real activity", async () => {
    const lead = await createTpoLead(tpo, {
      collegeId: SEED_IDS.collegeA,
      name: "Placement Contact",
      email: "Recruiter@Example.COM",
      phone: "+91 98765 43210",
    });
    expect(lead.emailNorm).toBe("recruiter@example.com");
    expect(lead.phoneNorm).toBe("9876543210");
    expect(lead.manualStage).toBe("NEW");
    const activity = await logTpoLeadActivity(tpo, lead.id, {
      collegeId: SEED_IDS.collegeA,
      type: "CALL",
      note: "Discussed intake",
    });
    expect(activity.type).toBe("CALL");
    expect((await listTpoLeads(tpo, SEED_IDS.collegeA))[0]?.manualStage)
      .toBe("CONTACTED");
    expect(await listTpoLeadActivities(tpo, SEED_IDS.collegeA, lead.id))
      .toHaveLength(1);

    await markTpoLeadNotNow(tpo, lead.id, {
      collegeId: SEED_IDS.collegeA,
      reason: "Try next quarter",
      revisitDate: "2027-01-10",
    });
    await logTpoLeadActivity(tpo, lead.id, {
      collegeId: SEED_IDS.collegeA,
      type: "NOTE",
      note: "Keep dormant",
    });
    expect((await listTpoLeads(tpo, SEED_IDS.collegeA))[0]?.manualStage)
      .toBe("NOT_NOW");
  });

  it("never returns a hashed invite token in TPO lead APIs", async () => {
    if (!pool) throw new Error("Isolated database missing");
    const lead = await createTpoLead(tpo, {
      collegeId: SEED_IDS.collegeA,
      name: "Invite Shield",
      email: "invite-shield@example.org",
    });
    await pool.query(
      "UPDATE placement_tpo_leads SET invite_token_hash = $1 WHERE id = $2",
      ["a".repeat(64), lead.id],
    );
    const [listed] = await listTpoLeads(tpo, SEED_IDS.collegeA);
    expect(listed).not.toHaveProperty("inviteTokenHash");
    expect(lead).not.toHaveProperty("inviteTokenHash");
  });

  it("deduplicates competing lead creation by normalized email", async () => {
    const results = await Promise.allSettled([
      createTpoLead(tpo, {
        collegeId: SEED_IDS.collegeA,
        name: "Recruiter A", email: "one@example.org",
      }),
      createTpoLead(tpo, {
        collegeId: SEED_IDS.collegeA,
        name: "Recruiter B", email: "ONE@EXAMPLE.ORG",
      }),
    ]);
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter(r => r.status === "rejected")).toHaveLength(1);
    const rejected = results.find(r => r.status === "rejected");
    if (rejected?.status !== "rejected") throw new Error("Missing rejection");
    expect(rejected.reason).toBeInstanceOf(TpoCrmError);
    expect(rejected.reason.code).toBe("TPO_CRM_LEAD_DUPLICATE");
  });

  it("tracks follow-up due, move and completion; refuses moving done follow-ups", async () => {
    const lead = await createTpoLead(tpo, {
      collegeId: SEED_IDS.collegeA, name: "Followup", phone: "9876543210",
    });
    const followup = await addTpoFollowup(tpo, lead.id, {
      collegeId: SEED_IDS.collegeA,
      dueAt: "2026-10-15T09:30:00+05:30",
    });
    expect(await listDueTpoFollowups(
      tpo, SEED_IDS.collegeA, new Date("2026-10-15T05:00:00Z"),
    )).toHaveLength(1);
    const moved = await moveTpoFollowup(tpo, followup.id, {
      collegeId: SEED_IDS.collegeA,
      dueAt: "2026-10-20T09:30:00+05:30",
    });
    expect(moved.id).toBe(followup.id);
    const done = await finishTpoFollowup(tpo, SEED_IDS.collegeA, followup.id);
    expect(done.doneAt).not.toBeNull();
    await expect(moveTpoFollowup(tpo, followup.id, {
      collegeId: SEED_IDS.collegeA,
      dueAt: "2026-10-22T09:30:00+05:30",
    })).rejects.toMatchObject({
      code: "TPO_CRM_FOLLOWUP_ALREADY_DONE",
    });
    expect(await listDueTpoFollowups(
      tpo, SEED_IDS.collegeA, new Date("2027-01-01T00:00:00Z"),
    )).toHaveLength(0);
  });

  it("denies learner access and forged college on service layer", async () => {
    await expect(createTpoLead(learner, {
      collegeId: SEED_IDS.collegeA,
      name: "Blocked", email: "blocked@example.org",
    })).rejects.toBeInstanceOf(AuthorizationError);
    await expect(createTpoLead(tpo, {
      collegeId: SEED_IDS.collegeB,
      name: "Wrong College", email: "wrong@example.org",
    })).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("rejects cross-college event, follow-up owner, and event-history rewrite via SQL", async () => {
    if (!pool) throw new Error("Isolated database missing");
    const lead = await createTpoLead(tpo, {
      collegeId: SEED_IDS.collegeA,
      name: "Integrity Lead", email: "integrity@example.org",
    });
    await expect(pool.query(
      "INSERT INTO placement_tpo_lead_activities " +
      "(college_id, lead_id, type) VALUES ($1, $2, 'CALL')",
      [SEED_IDS.collegeB, lead.id],
    )).rejects.toMatchObject({ code: "23503" });

    await expect(pool.query(
      "INSERT INTO placement_tpo_followups " +
      "(college_id, lead_id, due_at, owner_membership_id) " +
      "VALUES ($1, $2, now(), $3)",
      [SEED_IDS.collegeA, lead.id, SEED_IDS.facultyCollegeBMembership],
    )).rejects.toMatchObject({ code: "23514" });

    const event = await logTpoLeadActivity(tpo, lead.id, {
      collegeId: SEED_IDS.collegeA, type: "NOTE",
    });
    await expect(pool.query(
      "UPDATE placement_tpo_lead_activities SET note = 'tamper' WHERE id = $1",
      [event.id],
    )).rejects.toMatchObject({ code: "23514" });
    await expect(pool.query(
      "DELETE FROM placement_tpo_lead_activities WHERE id = $1",
      [event.id],
    )).rejects.toMatchObject({ code: "23514" });
  });
});
