import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import { SEED_IDS } from "../../scripts/db-seed-data";
import type { RequestContext } from "@/modules/identity/context";
import {
  applyPlacementEligibilityBulkAction,
  undoPlacementEligibilityBulkAction,
} from "@/modules/placements/eligibility-action-service";

const enabled = process.env.DB08_SCHEMA_READY === "1";
const dbUrl = process.env.TEST_DATABASE_URL;
// The schema and Drizzle journal migration are deliberately not yet merged.
// Never run against production or allow this suite to masquerade as passing.
if (enabled && (!dbUrl || process.env.DB08_ISOLATED_TEST_DATABASE !== "1")) {
  throw new Error(
    "DB08 requires TEST_DATABASE_URL and DB08_ISOLATED_TEST_DATABASE=1; " +
    "only enable after the numbered migration has replayed on disposable PostgreSQL",
  );
}
const pool = enabled ? new Pool({ connectionString: dbUrl, max: 4 }) : null;

const tpo: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "seed-shared-faculty",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["FACULTY", "TPO"],
  },
};
const affectedIds: string[] = [];
const userIds: string[] = [];
const membershipIds: string[] = [];

async function createLearner(collegeId = SEED_IDS.collegeA) {
  const id = randomUUID(), userId = randomUUID();
  userIds.push(userId);
  membershipIds.push(id);
  if (!pool) throw new Error("DB08 PostgreSQL pool is unavailable");
  await pool.query(
    "INSERT INTO users (id,identity_uid,display_name) VALUES ($1,$2,'DB08 action test')",
    [userId, "db08-" + userId],
  );
  await pool.query(
    "INSERT INTO college_memberships (id,user_id,college_id) VALUES ($1,$2,$3)",
    [id, userId, collegeId],
  );
  await pool.query(
    "INSERT INTO membership_roles (membership_id,role) VALUES ($1,'LEARNER')",
    [id],
  );
  return id;
}

function nextActionId() {
  const id = randomUUID();
  affectedIds.push(id);
  return id;
}

beforeEach(() => {
  affectedIds.length = 0;
  userIds.length = 0;
  membershipIds.length = 0;
});

afterEach(async () => {
  if (!pool) return;
  if (membershipIds.length) {
    await pool.query(
      "DELETE FROM placement_eligibility_decisions WHERE scope_type='MEMBERSHIP' AND scope_id=ANY($1::uuid[])",
      [membershipIds],
    );
  }
  if (affectedIds.length) {
    await pool.query(
      "DELETE FROM placement_eligibility_events WHERE action_id=ANY($1::uuid[])",
      [affectedIds],
    );
    await pool.query(
      "DELETE FROM placement_eligibility_actions WHERE id=ANY($1::uuid[])",
      [affectedIds],
    );
  }
  if (membershipIds.length) {
    await pool.query("DELETE FROM membership_roles WHERE membership_id=ANY($1::uuid[])", [membershipIds]);
    await pool.query("DELETE FROM college_memberships WHERE id=ANY($1::uuid[])", [membershipIds]);
  }
  if (userIds.length) {
    await pool.query("DELETE FROM users WHERE id=ANY($1::uuid[])", [userIds]);
  }
});

afterAll(async () => {
  if (pool) await pool.end();
  if (enabled) await closeDatabaseConnection();
});

describe.skipIf(!enabled)("DB08-A eligibility action database contracts (migration-required)", () => {
  it("persists one event for a retried action and removes its decision on undo", async () => {
    const member = await createLearner();
    const input = {
      actionId: nextActionId(),
      collegeId: SEED_IDS.collegeA,
      changes: [{
        scopeType: "MEMBERSHIP",
        scopeId: member,
        status: "INELIGIBLE",
        reason: "Not enrolled",
      }],
    };
    const first = await applyPlacementEligibilityBulkAction(tpo, input);
    expect(first).toMatchObject({ status: "APPLIED", affected: 1, replayed: false });
    const retry = await applyPlacementEligibilityBulkAction(tpo, input);
    expect(retry).toMatchObject({ status: "APPLIED", replayed: true });
    const rows = await pool!.query(
      "SELECT count(*)::int AS n FROM placement_eligibility_events WHERE action_id=$1",
      [input.actionId],
    );
    expect(rows.rows[0].n).toBe(1);
    expect(await undoPlacementEligibilityBulkAction(tpo, {
      collegeId: input.collegeId,
      actionId: input.actionId,
    })).toMatchObject({ status: "UNDONE", replayed: false });
    expect(await undoPlacementEligibilityBulkAction(tpo, {
      collegeId: input.collegeId,
      actionId: input.actionId,
    })).toMatchObject({ status: "UNDONE", replayed: true });
    const remaining = await pool!.query(
      "SELECT count(*)::int AS n FROM placement_eligibility_decisions WHERE scope_id=$1",
      [member],
    );
    expect(remaining.rows[0].n).toBe(0);
  });

  it("rejects stale undo but permits LIFO rollback with restored provenance", async () => {
    const member = await createLearner();
    const a = nextActionId(), b = nextActionId();
    await applyPlacementEligibilityBulkAction(tpo, {
      actionId: a, collegeId: SEED_IDS.collegeA,
      changes: [{ scopeType: "MEMBERSHIP", scopeId: member, status: "ELIGIBLE" }],
    });
    await applyPlacementEligibilityBulkAction(tpo, {
      actionId: b, collegeId: SEED_IDS.collegeA,
      changes: [{ scopeType: "MEMBERSHIP", scopeId: member, status: "INELIGIBLE", reason: "Rule violation" }],
    });
    await expect(undoPlacementEligibilityBulkAction(tpo, {
      actionId: a, collegeId: SEED_IDS.collegeA,
    })).rejects.toMatchObject({ code: "PLACEMENT_ELIGIBILITY_STALE_UNDO" });
    await undoPlacementEligibilityBulkAction(tpo, {
      actionId: b, collegeId: SEED_IDS.collegeA,
    });
    const restored = await pool!.query(
      "SELECT status, last_action_id FROM placement_eligibility_decisions WHERE scope_id=$1",
      [member],
    );
    expect(restored.rows[0]).toMatchObject({ status: "ELIGIBLE", last_action_id: a });
    await undoPlacementEligibilityBulkAction(tpo, {
      actionId: a, collegeId: SEED_IDS.collegeA,
    });
  });

  it("denies cross-college target substitution without persisting an action", async () => {
    const member = await createLearner(SEED_IDS.collegeB);
    const actionId = nextActionId();
    await expect(applyPlacementEligibilityBulkAction(tpo, {
      collegeId: SEED_IDS.collegeA,
      actionId,
      changes: [{ scopeType: "MEMBERSHIP", scopeId: member, status: "ELIGIBLE" }],
    })).rejects.toMatchObject({ code: "PLACEMENT_ELIGIBILITY_SCOPE_MISMATCH" });
    const count = await pool!.query(
      "SELECT count(*)::int AS n FROM placement_eligibility_actions WHERE id=$1",
      [actionId],
    );
    expect(count.rows[0].n).toBe(0);
  });

  it("blocks mismatched idempotency payloads and replay after undo", async () => {
    const member = await createLearner();
    const actionId = nextActionId();
    const payload = {
      collegeId: SEED_IDS.collegeA,
      actionId,
      changes: [{ scopeType: "MEMBERSHIP", scopeId: member, status: "ELIGIBLE" }],
    };
    await applyPlacementEligibilityBulkAction(tpo, payload);
    await expect(applyPlacementEligibilityBulkAction(tpo, {
      ...payload,
      changes: [{
        scopeType: "MEMBERSHIP",
        scopeId: member,
        status: "INELIGIBLE",
        reason: "New policy",
      }],
    })).rejects.toMatchObject({ code: "PLACEMENT_ELIGIBILITY_ACTION_CONFLICT" });
    await undoPlacementEligibilityBulkAction(tpo, {
      collegeId: payload.collegeId,
      actionId,
    });
    await expect(applyPlacementEligibilityBulkAction(tpo, payload))
      .resolves.toMatchObject({ status: "UNDONE", replayed: true });
  });

  it("rejects a multi-scope action atomically if one membership belongs to another college", async () => {
    const local = await createLearner();
    const foreign = await createLearner(SEED_IDS.collegeB);
    const actionId = nextActionId();
    await expect(applyPlacementEligibilityBulkAction(tpo, {
      collegeId: SEED_IDS.collegeA,
      actionId,
      changes: [
        { scopeType: "MEMBERSHIP", scopeId: local, status: "ELIGIBLE" },
        { scopeType: "MEMBERSHIP", scopeId: foreign, status: "INELIGIBLE", reason: "Excluded" },
      ],
    })).rejects.toMatchObject({ code: "PLACEMENT_ELIGIBILITY_SCOPE_MISMATCH" });
    const actions = await pool!.query(
      "SELECT count(*)::int AS n FROM placement_eligibility_actions WHERE id=$1",
      [actionId],
    );
    const decisions = await pool!.query(
      "SELECT count(*)::int AS n FROM placement_eligibility_decisions WHERE scope_id=$1",
      [local],
    );
    expect(actions.rows[0].n).toBe(0);
    expect(decisions.rows[0].n).toBe(0);
  });

  it("enforces cross-college action/event composite foreign keys in raw SQL", async () => {
    const member = await createLearner();
    const actionId = nextActionId();
    await applyPlacementEligibilityBulkAction(tpo, {
      collegeId: SEED_IDS.collegeA,
      actionId,
      changes: [{ scopeType: "MEMBERSHIP", scopeId: member, status: "ELIGIBLE" }],
    });
    await expect(pool!.query(
      `INSERT INTO placement_eligibility_events
        (action_id,college_id,scope_type,scope_id,after_status,actor_user_id)
       VALUES ($1,$2,'MEMBERSHIP',$3,'ELIGIBLE',$4)`,
      [actionId, SEED_IDS.collegeB, member, SEED_IDS.facultyUser],
    )).rejects.toMatchObject({ code: "23503" });
  });

  it("rejects a learner trying to set their own eligibility", async () => {
    const member = await createLearner();
    const learner: RequestContext = {
      user: {
        id: SEED_IDS.learnerUser,
        identityUid: "seed-learner",
        platformStatus: "ACTIVE",
        systemRoles: [],
      },
      membership: {
        id: SEED_IDS.learnerCollegeAMembership,
        collegeId: SEED_IDS.collegeA,
        organizationId: SEED_IDS.organization,
        status: "ACTIVE",
        roles: ["LEARNER"],
      },
    };
    await expect(applyPlacementEligibilityBulkAction(learner, {
      actionId: nextActionId(),
      collegeId: SEED_IDS.collegeA,
      changes: [{ scopeType: "MEMBERSHIP", scopeId: member, status: "ELIGIBLE" }],
    })).rejects.toThrow("Missing permission: placements.manage");
  });
});
