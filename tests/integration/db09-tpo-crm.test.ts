import { randomUUID } from "node:crypto";
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
  checkTpoLeadContact,
  createTpoLead,
  finishTpoFollowup,
  getTpoLead,
  listDueTpoFollowups,
  listTpoLeadActivities,
  listTpoLeadFollowups,
  listTpoLeads,
  logTpoLeadActivity,
  markTpoLeadNotNow,
  markTpoLeadContacted,
  moveTpoFollowup,
  updateTpoLead,
} from "@/modules/placements/tpo-crm-service";
import {
  issueTpoRecruiterInvite,
  markRecruiterInviteNotHiring,
  previewRecruiterInvite,
  unsubscribeRecruiterInvite,
  TpoRecruiterInviteServiceError,
} from "@/modules/placements/tpo-recruiter-invite-service";
import {
  getTpoCompanyMemory,
  listTpoCompanies,
} from "@/modules/placements/tpo-company-memory-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const databaseUrl = process.env.TEST_DATABASE_URL;
const enabled =
  process.env.DB09_ISOLATED_TEST_DATABASE === "1" &&
  Boolean(databaseUrl);
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
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
// The seeded faculty also needs a persisted TPO role for this isolated CRM
// fixture. A request-context roles array alone never grants real authority.
let insertedTpoRoleId: string | null = null;
const inviteCompanyId=randomUUID();
const inviteRelationshipId=randomUUID();
async function linkInviteLead(leadId:string){
 if(!pool)throw new Error("Disposable DB09 test database missing");
 const attached=await pool.query(
  "UPDATE placement_tpo_leads SET company_relationship_id=$1 WHERE college_id=$2 AND id=$3 RETURNING id",
  [inviteRelationshipId,SEED_IDS.collegeA,leadId],
 );
 expect(attached.rowCount).toBe(1);
}

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
    expect(triggers).toContain("db09_lead_activity_actor_scope_guard");
    expect(triggers).toContain("db09_lead_activity_no_truncate");
    const seededActor = await pool.query(
      "SELECT cm.id FROM college_memberships cm " +
      "INNER JOIN users u ON u.id = cm.user_id " +
      "WHERE cm.id = $1 AND cm.college_id = $2 AND cm.user_id = $3 " +
      "AND cm.status = 'ACTIVE' AND u.platform_status = 'ACTIVE'",
      [SEED_IDS.facultyCollegeAMembership, SEED_IDS.collegeA, SEED_IDS.facultyUser],
    );
    expect(seededActor.rows).toHaveLength(1);
    const granted = await pool.query<{ id: string }>(
      "INSERT INTO membership_roles(membership_id, role) VALUES($1, 'TPO') " +
      "ON CONFLICT (membership_id, role) DO NOTHING RETURNING id",
      [SEED_IDS.facultyCollegeAMembership],
    );
    insertedTpoRoleId = granted.rows[0]?.id ?? null;
    const persistedGrant = await pool.query(
      "SELECT id FROM membership_roles WHERE membership_id = $1 AND role = 'TPO'",
      [SEED_IDS.facultyCollegeAMembership],
    );
    expect(persistedGrant.rows).toHaveLength(1);
    // A public invitation requires a real authorized college/employer link.
    // The CRM fixture owns this verified company and cleans it up afterwards.
    await pool.query(
      "INSERT INTO placement_companies(id,name,created_by_user_id,verified_at,verified_by_user_id) VALUES($1,$2,$3,now(),$3)",
      [inviteCompanyId,"DB09 CRM Invite Employer",SEED_IDS.facultyUser],
    );
    await pool.query(
      "INSERT INTO placement_company_relationships(id,college_id,company_id,created_by_user_id,owner_membership_id) VALUES($1,$2,$3,$4,$5)",
      [inviteRelationshipId,SEED_IDS.collegeA,inviteCompanyId,SEED_IDS.facultyUser,SEED_IDS.facultyCollegeAMembership],
    );
  });

  beforeEach(async () => {
    if (!pool) return;
    // Migration 0048 correctly forbids TRUNCATE of immutable audit history.
    // On the independently verified disposable fixture ONLY, temporarily
    // suspend *that exact truncate trigger* inside a single rollback-safe
    // maintenance transaction; re-enable it before any service assertion.
    // Never disable row-level append-only, tenant or actor guards.
    // CASCADE clears only dependent fixture tables in this verified isolated
    // database, keeping every app-level immutable history guard enabled.
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "ALTER TABLE placement_tpo_lead_activities DISABLE TRIGGER db09_lead_activity_no_truncate",
      );
      await client.query(
        "TRUNCATE recruiter_invite_code, placement_tpo_email_campaign_recipients, placement_tpo_lead_activities, placement_tpo_followups, placement_tpo_leads CASCADE",
      );
      await client.query(
        "ALTER TABLE placement_tpo_lead_activities ENABLE TRIGGER db09_lead_activity_no_truncate",
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    const enabledTrigger = await pool.query(
      "SELECT tgenabled FROM pg_trigger " +
      "WHERE tgrelid = 'placement_tpo_lead_activities'::regclass " +
      "AND tgname = 'db09_lead_activity_no_truncate'",
    );
    expect(enabledTrigger.rows).toEqual([{ tgenabled: "O" }]);
  });

  afterAll(async () => {
    try {
      if (pool && insertedTpoRoleId) {
        // Do not delete any TPO role that predated this disposable fixture.
        await pool.query("DELETE FROM membership_roles WHERE id = $1", [insertedTpoRoleId]);
      }
    } finally {
      if(pool){
        await pool.query("DELETE FROM placement_company_relationships WHERE id=$1",[inviteRelationshipId]);
        await pool.query("DELETE FROM placement_companies WHERE id=$1",[inviteCompanyId]);
      }
      await pool?.end();
      await closeDatabaseConnection();
    }
  });

  it("preserves immutable lead history against direct TRUNCATE", async () => {
    if (!pool) throw new Error("Isolated database missing");
    await expect(
      pool.query("TRUNCATE placement_tpo_lead_activities"),
    ).rejects.toMatchObject({ code: "23514" });
  });

  it("atomically creates an audited lead and records idempotent Not Now changes", async () => {
    const lead = await createTpoLead(tpo, {
      collegeId: SEED_IDS.collegeA,
      name: "Audited recruiter",
      email: "audited-lead@example.org",
      source: "ALUMNI",
    });
    const createdActivities = await listTpoLeadActivities(
      tpo, SEED_IDS.collegeA, lead.id,
    );
    expect(createdActivities.filter(x =>
      x.type === "NOTE" &&
      !x.isSystem &&
      x.note === "Recruiter lead created" &&
      x.createdByUserId === SEED_IDS.facultyUser
    )).toHaveLength(1);

    const paused = await markTpoLeadNotNow(tpo, lead.id, {
      collegeId: SEED_IDS.collegeA,
      reason: "Campus hiring deferred",
      revisitDate: "2027-04-11",
    });
    expect(paused.manualStage).toBe("NOT_NOW");
    expect(paused.notNowReason).toBe("Campus hiring deferred");
    expect(paused.notNowUntil).toBe("2027-04-11");

    await markTpoLeadNotNow(tpo, lead.id, {
      collegeId: SEED_IDS.collegeA,
      reason: "Campus hiring deferred",
      revisitDate: "2027-04-11",
    });
    let activities = await listTpoLeadActivities(tpo, SEED_IDS.collegeA, lead.id);
    expect(activities.filter(x =>
      x.type === "NOTE" && x.note === "Manual stage changed to Not Now"
    )).toHaveLength(1);

    await markTpoLeadNotNow(tpo, lead.id, {
      collegeId: SEED_IDS.collegeA,
      reason: "Hiring moved",
      revisitDate: "2027-05-11",
    });
    activities = await listTpoLeadActivities(tpo, SEED_IDS.collegeA, lead.id);
    expect(activities.filter(x =>
      x.type === "NOTE" && x.note === "Not Now reason or revisit date updated"
    )).toHaveLength(1);
    expect((await getTpoLead(tpo, SEED_IDS.collegeA, lead.id)).notNowReason)
      .toBe("Hiring moved");
  });

  it("rolls back lead creation when the persisted audit actor is unauthorized", async () => {
    if (!pool) throw new Error("Isolated database missing");
    const email = "rollback-actor@example.org";
    const forged: RequestContext = {
      ...tpo,
      user: { ...tpo.user, id: SEED_IDS.learnerUser },
    };
    await expect(createTpoLead(forged, {
      collegeId: SEED_IDS.collegeA,
      name: "Must roll back",
      email,
    })).rejects.toBeDefined();
    const result = await pool.query(
      "SELECT id FROM placement_tpo_leads WHERE college_id = $1 AND email_norm = $2",
      [SEED_IDS.collegeA, email],
    );
    expect(result.rows).toHaveLength(0);
  });

  it("denies a foreign-college and nonstaff Not Now update without audit rows", async () => {
    const lead = await createTpoLead(tpo, {
      collegeId: SEED_IDS.collegeA,
      name: "Protected lead",
      email: "protected-not-now@example.org",
    });
    const before = await listTpoLeadActivities(tpo, SEED_IDS.collegeA, lead.id);
    await expect(markTpoLeadNotNow(learner, lead.id, {
      collegeId: SEED_IDS.collegeA,
      reason: "Unauthorized",
    })).rejects.toBeInstanceOf(AuthorizationError);
    await expect(markTpoLeadNotNow(tpo, lead.id, {
      collegeId: SEED_IDS.collegeB,
      reason: "Cross-college attempt",
    })).rejects.toBeInstanceOf(AuthorizationError);
    const after = await listTpoLeadActivities(tpo, SEED_IDS.collegeA, lead.id);
    expect(after).toHaveLength(before.length);
    expect((await getTpoLead(tpo, SEED_IDS.collegeA, lead.id)).manualStage)
      .toBe("NEW");
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
    expect(lead.companyName).toBe("Example");
    expect(lead.manualStage).toBe("NEW");
    const activity = await logTpoLeadActivity(tpo, lead.id, {
      collegeId: SEED_IDS.collegeA,
      type: "CALL", outcome: "Connected",
      note: "Discussed intake",
    });
    expect(activity.type).toBe("CALL");
    expect((await listTpoLeads(tpo, SEED_IDS.collegeA))[0]?.manualStage)
      .toBe("CONTACTED");
    // Lead creation itself is an immutable NOTE activity.
    expect(await listTpoLeadActivities(tpo, SEED_IDS.collegeA, lead.id))
      .toHaveLength(2);

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
      "UPDATE placement_tpo_leads SET invite_token_hash = $1, invite_sent_at = now() WHERE id = $2",
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

  it("rejects malformed invite hashes and forged activity actors at the database boundary", async () => {
    if (!pool) throw new Error("Isolated database missing");
    const lead = await createTpoLead(tpo, {
      collegeId: SEED_IDS.collegeA,
      name: "DB guard lead",
      email: "db-guard@example.org",
    });

    await expect(pool.query(
      "UPDATE placement_tpo_leads SET invite_token_hash = $1, invite_sent_at = now() WHERE id = $2",
      ["not-a-sha256-digest", lead.id],
    )).rejects.toMatchObject({ code: "23514" });

    await expect(pool.query(
      "INSERT INTO placement_tpo_lead_activities " +
      "(college_id, lead_id, type, is_system, created_by_user_id) " +
      "VALUES ($1, $2, 'NOTE', false, $3)",
      [SEED_IDS.collegeA, lead.id, SEED_IDS.superAdminUser],
    )).rejects.toMatchObject({ code: "23514" });

    await expect(pool.query(
      "INSERT INTO placement_tpo_lead_activities " +
      "(college_id, lead_id, type, is_system, created_by_user_id) " +
      "VALUES ($1, $2, 'SYSTEM', true, $3)",
      [SEED_IDS.collegeA, lead.id, SEED_IDS.facultyUser],
    )).rejects.toMatchObject({ code: "23514" });
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
      "(college_id, lead_id, type, created_by_user_id) VALUES ($1, $2, 'CALL', $3)",
      [SEED_IDS.collegeB, lead.id, SEED_IDS.facultyUser],
    )).rejects.toMatchObject({ code: "23503" });

    await expect(pool.query(
      "INSERT INTO placement_tpo_followups " +
      "(college_id, lead_id, due_at, owner_membership_id) " +
      "VALUES ($1, $2, now(), $3)",
      [SEED_IDS.collegeA, lead.id, SEED_IDS.facultyCollegeBMembership],
    )).rejects.toMatchObject({ code: "23514" });

    const event = await logTpoLeadActivity(tpo, lead.id, {
      collegeId: SEED_IDS.collegeA, type: "NOTE",
      note: "Audit history remains immutable",
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

  it("can check a recruiter duplicate without disclosing a raw invite hash", async () => {
    if (!pool) throw new Error("Isolated database missing");
    const created = await createTpoLead(tpo, {
      collegeId: SEED_IDS.collegeA,
      name: "Existing contact",
      email: "  One@Example.Org ",
      phone: "+91 98765 43210",
    });
    await pool.query(
      "UPDATE placement_tpo_leads SET invite_token_hash = $1, invite_sent_at = now() WHERE id = $2",
      ["b".repeat(64), created.id],
    );
    for (const contact of ["one@example.org", "+91 98765 43210"]) {
      const match = await checkTpoLeadContact(tpo, {
        collegeId: SEED_IDS.collegeA, contact,
      });
      expect(match?.id).toBe(created.id);
      expect(match).not.toHaveProperty("inviteTokenHash");
    }
    expect(await checkTpoLeadContact(tpo, {
      collegeId: SEED_IDS.collegeA, contact: "unknown@example.org",
    })).toBeNull();
    const detail = await getTpoLead(tpo, SEED_IDS.collegeA, created.id);
    expect(detail).not.toHaveProperty("inviteTokenHash");
    expect(detail.id).toBe(created.id);
  });

  it("edits recruiter contact atomically while preserving omitted details and lifecycle", async () => {
    const created = await createTpoLead(tpo, {
      collegeId: SEED_IDS.collegeA,
      name: "Edit contact",
      email: "existing@example.org",
      phone: "+91 98765 43210",
      source: "Alumni",
      designation: "HR Director",
    });
    await markTpoLeadNotNow(tpo, created.id, {
      collegeId: SEED_IDS.collegeA,
      reason: "Revisit later",
      revisitDate: "2027-02-01",
    });

    const updated = await updateTpoLead(tpo, created.id, {
      collegeId: SEED_IDS.collegeA,
      name: "Corrected recruiter",
      email: "new@example.org",
      source: null,
    });
    expect(updated.name).toBe("Corrected recruiter");
    expect(updated.emailNorm).toBe("new@example.org");
    expect(updated.phoneNorm).toBe("9876543210");
    expect(updated.source).toBe("MANUAL");
    expect(updated.designation).toBe("HR Director");
    expect(updated.manualStage).toBe("NOT_NOW");
    expect(updated.notNowUntil).toBe("2027-02-01");

    await expect(updateTpoLead(tpo, created.id, {
      collegeId: SEED_IDS.collegeA,
      email: null, phone: null,
    })).rejects.toMatchObject({ code: "TPO_CRM_CONTACT_REQUIRED" });

    const afterFailed = await getTpoLead(tpo, SEED_IDS.collegeA, created.id);
    expect(afterFailed.emailNorm).toBe("new@example.org");
    expect(afterFailed.phoneNorm).toBe("9876543210");
    const singleContact = await updateTpoLead(tpo, created.id, {
      collegeId: SEED_IDS.collegeA,
      phone: null,
    });
    expect(singleContact.phoneNorm).toBeNull();
    expect(singleContact.emailNorm).toBe("new@example.org");
  });

  it("makes a racing duplicate edit lose without corrupting either contact", async () => {
    const [a, b] = await Promise.all([
      createTpoLead(tpo, {
        collegeId: SEED_IDS.collegeA,
        name: "A", email: "a@example.org",
      }),
      createTpoLead(tpo, {
        collegeId: SEED_IDS.collegeA,
        name: "B", email: "b@example.org",
      }),
    ]);
    const settled = await Promise.allSettled([
      updateTpoLead(tpo, a.id, {
        collegeId: SEED_IDS.collegeA, email: "shared@example.org",
      }),
      updateTpoLead(tpo, b.id, {
        collegeId: SEED_IDS.collegeA, email: "SHARED@EXAMPLE.ORG",
      }),
    ]);
    expect(settled.filter(x => x.status === "fulfilled")).toHaveLength(1);
    const loser = settled.find(x => x.status === "rejected");
    expect(loser).toMatchObject({
      status: "rejected",
      reason: { code: "TPO_CRM_LEAD_DUPLICATE" },
    });
    const all = await listTpoLeads(tpo, SEED_IDS.collegeA);
    expect(all.filter(x => x.emailNorm === "shared@example.org")).toHaveLength(1);
    expect(all).toHaveLength(2);
  });

  it("denies unauthorized lead lookup, detail and edits even by known IDs", async () => {
    const created = await createTpoLead(tpo, {
      collegeId: SEED_IDS.collegeA,
      name: "Isolated lead", email: "isolate@example.org",
    });
    await expect(checkTpoLeadContact(learner, {
      collegeId: SEED_IDS.collegeA, contact: "isolate@example.org",
    })).rejects.toBeInstanceOf(AuthorizationError);
    await expect(getTpoLead(learner, SEED_IDS.collegeA, created.id))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(updateTpoLead(learner, created.id, {
      collegeId: SEED_IDS.collegeA, name: "Forged",
    })).rejects.toBeInstanceOf(AuthorizationError);
    await expect(getTpoLead(tpo, SEED_IDS.collegeB, created.id))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(updateTpoLead(tpo, created.id, {
      collegeId: SEED_IDS.collegeB, name: "Cross college",
    })).rejects.toBeInstanceOf(AuthorizationError);
  });


  it("records only one auditable manual Contacted transition and clears Not Now metadata", async () => {
    const created = await createTpoLead(tpo, {
      collegeId: SEED_IDS.collegeA,
      name: "Manual stage",
      email: "manual@example.org",
    });
    const first = await markTpoLeadContacted(
      tpo, SEED_IDS.collegeA, created.id,
    );
    const repeated = await markTpoLeadContacted(
      tpo, SEED_IDS.collegeA, created.id,
    );
    expect(first.manualStage).toBe("CONTACTED");
    expect(repeated.manualStage).toBe("CONTACTED");
    const activities = await listTpoLeadActivities(tpo, SEED_IDS.collegeA, created.id);
    expect(activities.filter(x => x.type === "NOTE" && x.note === "Manual stage changed to Contacted")).toHaveLength(1);
    expect(activities[0]?.isSystem).toBe(false);
    expect(activities[0]?.createdByUserId).toBe(SEED_IDS.facultyUser);

    await markTpoLeadNotNow(tpo, created.id, {
      collegeId: SEED_IDS.collegeA,
      reason: "Not hiring yet",
      revisitDate: "2027-01-20",
    });
    const resumed = await markTpoLeadContacted(tpo, SEED_IDS.collegeA, created.id);
    expect(resumed.manualStage).toBe("CONTACTED");
    expect(resumed.notNowReason).toBeNull();
    expect(resumed.notNowUntil).toBeNull();
    expect((await listTpoLeadActivities(
      tpo, SEED_IDS.collegeA, created.id,
)).filter(x => x.type === "NOTE" && x.note === "Manual stage changed to Contacted")).toHaveLength(2);
  });

  it("limits recruiter activity to newest 200 and prioritizes unfinished follow-ups", async () => {
    if (!pool) throw new Error("Isolated database missing");
    const lead = await createTpoLead(tpo, {
      collegeId: SEED_IDS.collegeA, name: "Activity history",
      email: "activity-limit@example.org",
    });
    for (let i = 0; i < 205; i++) {
      await logTpoLeadActivity(tpo, lead.id, {
        collegeId: SEED_IDS.collegeA,
        type: "NOTE", note: "Entry " + String(i),
      });
    }
    const activities = await listTpoLeadActivities(
      tpo, SEED_IDS.collegeA, lead.id,
    );
    expect(activities).toHaveLength(200);
    expect(activities.map(x => x.note)).not.toContain("Entry 0");
    expect(activities.some(x => x.note === "Entry 204")).toBe(true);

    const completed = await addTpoFollowup(tpo, lead.id, {
      collegeId: SEED_IDS.collegeA,
      dueAt: "2026-10-20T10:00:00+05:30",
    });
    await finishTpoFollowup(tpo, SEED_IDS.collegeA, completed.id);
    const active = await addTpoFollowup(tpo, lead.id, {
      collegeId: SEED_IDS.collegeA,
      dueAt: "2026-11-20T10:00:00+05:30",
    });
    const followups = await listTpoLeadFollowups(
      tpo, SEED_IDS.collegeA, lead.id,
    );
    expect(followups.map(x => x.id)).toEqual([active.id, completed.id]);
    await expect(listTpoLeadFollowups(
      tpo, SEED_IDS.collegeB, lead.id,
    )).rejects.toBeInstanceOf(AuthorizationError);
  });


  it("rotates recruiter invite tokens, previews without consuming, and hides old links", async () => {
    const lead = await createTpoLead(tpo, {
      collegeId: SEED_IDS.collegeA,
      name: "Invite Rotation",
      email: "rotate@example.org",
      companyName: "Rotation Corp",
    });
    await linkInviteLead(lead.id);
    const first = await issueTpoRecruiterInvite(
      tpo, SEED_IDS.collegeA, lead.id,
      new Date("2026-10-10T08:00:00.000Z"),
    );
    expect(first.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(first.emailAvailable).toBe(true);
    expect(first.emailed).toBe(false);
    const preview1 = await previewRecruiterInvite(
      first.token, new Date("2026-10-10T08:01:00.000Z"),
    );
    const preview2 = await previewRecruiterInvite(
      first.token, new Date("2026-10-10T08:02:00.000Z"),
    );
    expect(preview1).toEqual(preview2);
    expect(preview1.contactName).toBe("Invite Rotation");

    const second = await issueTpoRecruiterInvite(
      tpo, SEED_IDS.collegeA, lead.id,
      new Date("2026-10-10T09:00:00.000Z"),
    );
    expect(second.token).not.toBe(first.token);
    await expect(previewRecruiterInvite(
      first.token, new Date("2026-10-10T09:01:00.000Z"),
    )).rejects.toBeInstanceOf(TpoRecruiterInviteServiceError);
    await expect(previewRecruiterInvite(
      second.token, new Date("2026-10-10T09:01:00.000Z"),
    )).resolves.toMatchObject({ collegeName: expect.any(String) });
  });

  it("denies cross-role or cross-college invite issuance", async () => {
    const lead = await createTpoLead(tpo, {
      collegeId: SEED_IDS.collegeA,
      name: "Invite Isolation",
      email: "isolation-invite@example.org",
    });
    await expect(issueTpoRecruiterInvite(
      learner, SEED_IDS.collegeA, lead.id,
    )).rejects.toBeInstanceOf(AuthorizationError);
    await expect(issueTpoRecruiterInvite(
      tpo, SEED_IDS.collegeB, lead.id,
    )).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("spends a public invite exactly once when Not Hiring races", async () => {
    const lead = await createTpoLead(tpo, {
      collegeId: SEED_IDS.collegeA,
      name: "Invite Race",
      email: "invite-race@example.org",
    });
    await linkInviteLead(lead.id);
    const invite = await issueTpoRecruiterInvite(
      tpo, SEED_IDS.collegeA, lead.id,
      new Date("2026-10-10T08:00:00.000Z"),
    );
    const settled = await Promise.allSettled([
      markRecruiterInviteNotHiring(
        invite.token, new Date("2026-10-10T08:05:00.000Z"),
      ),
      markRecruiterInviteNotHiring(
        invite.token, new Date("2026-10-10T08:05:00.000Z"),
      ),
    ]);
    expect(settled.filter(x => x.status === "fulfilled")).toHaveLength(1);
    expect(settled.filter(x => x.status === "rejected")).toHaveLength(1);
    const detail = await getTpoLead(tpo, SEED_IDS.collegeA, lead.id);
    expect(detail.manualStage).toBe("NOT_NOW");
    expect(detail.notNowReason).toContain("not hiring");
    expect(detail.notNowUntil).toBe("2027-04-10");
    await expect(previewRecruiterInvite(
      invite.token, new Date("2026-10-10T08:06:00.000Z"),
    )).rejects.toMatchObject({ code: "TPO_RECRUITER_INVITE_NOT_FOUND" });
  });

  it("unsubscribes once, invalidates the capability token and blocks reissue", async () => {
    const lead = await createTpoLead(tpo, {
      collegeId: SEED_IDS.collegeA,
      name: "Invite Unsubscribe",
      email: "invite-unsubscribe@example.org",
    });
    await linkInviteLead(lead.id);
    const invite = await issueTpoRecruiterInvite(
      tpo, SEED_IDS.collegeA, lead.id,
      new Date("2026-10-10T08:00:00.000Z"),
    );
    await expect(unsubscribeRecruiterInvite(
      invite.token, new Date("2026-10-10T08:05:00.000Z"),
    )).resolves.toEqual({ status: "UNSUBSCRIBED" });
    await expect(previewRecruiterInvite(
      invite.token, new Date("2026-10-10T08:06:00.000Z"),
    )).rejects.toMatchObject({ code: "TPO_RECRUITER_INVITE_NOT_FOUND" });
    await expect(issueTpoRecruiterInvite(
      tpo, SEED_IDS.collegeA, lead.id,
    )).rejects.toMatchObject({ code: "TPO_RECRUITER_INVITE_NOT_ALLOWED" });
  });


  it("groups legal-suffix aliases into one tenant-scoped Company Memory view", async () => {
    const first = await createTpoLead(tpo, {
      collegeId: SEED_IDS.collegeA,
      name: "Alice HR",
      email: "alice-company@example.org",
      companyName: "Acme Pvt. Ltd.",
    });
    const second = await createTpoLead(tpo, {
      collegeId: SEED_IDS.collegeA,
      name: "Bob HR",
      email: "bob-company@example.org",
      companyName: "ACME LIMITED",
    });
    await logTpoLeadActivity(tpo, first.id, {
      collegeId: SEED_IDS.collegeA,
      type: "CALL", outcome: "Connected",
      note: "Discussed campus hiring",
    });

    const companies = await listTpoCompanies(tpo, SEED_IDS.collegeA);
    const acme = companies.find(row => row.key === "acme");
    expect(acme).toBeDefined();
    expect(acme?.contacts).toBe(2);
    expect(acme?.studentsPlaced).toBeNull();
    expect(acme?.studentsPlacedEvidence)
      .toBe("PENDING_W04_COUNTS_AS_PLACED_POLICY");

    const detail = await getTpoCompanyMemory(
      tpo, SEED_IDS.collegeA, "acme corporation",
    );
    expect(detail.people.map(person => person.id).sort())
      .toEqual([first.id, second.id].sort());
    expect(detail.timeline).toHaveLength(3);
    expect(detail.timeline.filter(event => event.note === "Recruiter lead created"))
      .toHaveLength(2);
    expect(detail.timeline.find(event => event.note === "Discussed campus hiring")?.person)
      .toBe("Alice HR");
    expect(detail.documents).toEqual([]);
    expect(detail.documentsStatus)
      .toBe("PENDING_DB09_SHARE_LINK_PERSISTENCE");
  });

  it("keeps Company Memory tenant-scoped and returns not-found without cross-college leakage", async () => {
    await createTpoLead(tpo, {
      collegeId: SEED_IDS.collegeA,
      name: "Private Contact",
      email: "private-company@example.org",
      companyName: "Tenant Only Ltd",
    });

    await expect(listTpoCompanies(learner, SEED_IDS.collegeA))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(getTpoCompanyMemory(
      tpo, SEED_IDS.collegeB, "Tenant Only",
    )).rejects.toBeInstanceOf(AuthorizationError);
  });

});
