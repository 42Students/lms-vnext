import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { closeDatabaseConnection } from "@/db/client";
import { manageCollegeStudyMember } from "@/modules/groups/college-member-management-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = !!process.env.TEST_DATABASE_URL &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL }) : null;
const admin: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "study-group-admin", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.collegeAdminMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const other: RequestContext = {
  user: { ...admin.user, id: SEED_IDS.facultyUser },
  membership: { id: SEED_IDS.facultyCollegeBMembership, collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const learner: RequestContext = { ...admin,
  membership: { ...admin.membership!, roles: ["LEARNER"] } };
const group = randomUUID();
const otherGroup = randomUUID();

describe.skipIf(!enabled)("College Admin STUDY_GROUP membership writes, isolated PG", () => {
  beforeAll(async () => {
    if (!pool) throw Error("isolated DB required");
    const label = "w-study-members-" + group.slice(0, 8);
    await pool.query(
      "INSERT INTO lms_groups(id,kind,college_id,name,status,capacity,created_by_user_id,created_by_type,config_json) " +
      "VALUES($1,'STUDY_GROUP',$2,$3,'ACTIVE',1,$4,'COLLEGE_ADMIN','{}'::jsonb)," +
      "($5,'STUDY_GROUP',$6,$3,'ACTIVE',1,$4,'COLLEGE_ADMIN','{}'::jsonb)",
      [group, SEED_IDS.collegeA, label, SEED_IDS.collegeAdminUser, otherGroup, SEED_IDS.collegeB],
    );
  });
  afterAll(async () => {
    try {
      if (pool) {
        await pool.query("DELETE FROM activity_events WHERE subject_type='lms_group_member' AND metadata->>'groupId' = $1", [group]);
        await pool.query("DELETE FROM lms_group_member_events WHERE group_id IN ($1,$2)", [group, otherGroup]);
        await pool.query("DELETE FROM lms_group_members WHERE group_id IN ($1,$2)", [group, otherGroup]);
        await pool.query("DELETE FROM lms_groups WHERE id IN ($1,$2)", [group, otherGroup]);
      }
    } finally { await pool?.end(); await closeDatabaseConnection(); }
  });
  it("adds, locks, unlocks and removes; captures immutable history", async () => {
    const id = SEED_IDS.learnerCollegeAMembership;
    const added = await manageCollegeStudyMember(admin, group, { action: "ADD", membershipId: id });
    expect(added.state).toBe("ACTIVE");
    const locked = await manageCollegeStudyMember(admin, group, { action: "LOCK", membershipId: id, locked: true });
    expect(locked.isLocked).toBe(true);
    const unlocked = await manageCollegeStudyMember(admin, group, { action: "LOCK", membershipId: id, locked: false });
    expect(unlocked.isLocked).toBe(false);
    const removed = await manageCollegeStudyMember(admin, group, { action: "REMOVE", membershipId: id });
    expect(removed.state).toBe("REMOVED");
    const events = await pool!.query(
      "SELECT to_state,reason FROM lms_group_member_events WHERE group_id=$1 ORDER BY created_at,id",
      [group],
    );
    expect(events.rows.length).toBeGreaterThanOrEqual(4);
    const count = await pool!.query("SELECT active_count FROM lms_groups WHERE id=$1", [group]);
    expect(count.rows[0].active_count).toBe(0);
  });
  it("rejects another college and non-admin and forged company/college fields", async () => {
    for (const context of [other, learner]) {
      await expect(manageCollegeStudyMember(context, group, {
        action: "ADD", membershipId: SEED_IDS.learnerCollegeAMembership,
      })).rejects.toBeDefined();
    }
    await expect(manageCollegeStudyMember(admin, otherGroup, {
      action: "ADD", membershipId: SEED_IDS.learnerCollegeAMembership,
    })).rejects.toBeDefined();
    await expect(manageCollegeStudyMember(admin, group, {
      action: "ADD", membershipId: SEED_IDS.learnerCollegeAMembership, collegeId: SEED_IDS.collegeB,
    })).rejects.toBeDefined();
  });
});
