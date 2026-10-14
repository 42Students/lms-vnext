import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { manageCollegeStudyMember } from "@/modules/groups/college-member-management-service";
import { AuthorizationError } from "@/modules/permissions/policy";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = !!process.env.TEST_DATABASE_URL && process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL }) : null;
const id = { group: randomUUID(), user: randomUUID(), membership: randomUUID(), role: randomUUID() };
const label = "remove-lock-" + id.group.slice(0, 8);
const admin: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "remove-lock-admin",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.collegeAdminMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const other: RequestContext = { ...admin,
  membership: { ...admin.membership!, collegeId: SEED_IDS.collegeB } };
const learner: RequestContext = { ...admin,
  membership: { ...admin.membership!, roles: ["LEARNER"] } };

describe.skipIf(!enabled)("Study group atomic Remove & Lock isolated PG", () => {
  beforeAll(async () => {
    await pool!.query("INSERT INTO users(id,identity_uid,display_name) VALUES($1,$2,$3)",
      [id.user, "remove-lock-" + id.user, label]);
    await pool!.query("INSERT INTO college_memberships(id,user_id,college_id) VALUES($1,$2,$3)",
      [id.membership, id.user, SEED_IDS.collegeA]);
    await pool!.query("INSERT INTO membership_roles(id,membership_id,role) VALUES($1,$2,'LEARNER')",
      [id.role, id.membership]);
    await pool!.query("INSERT INTO lms_groups(id,kind,college_id,name,status,capacity,created_by_user_id,created_by_type,config_json) " +
      "VALUES($1,'STUDY_GROUP',$2,$3,'ACTIVE',1,$4,'COLLEGE_ADMIN','{}'::jsonb)",
      [id.group, SEED_IDS.collegeA, label, SEED_IDS.collegeAdminUser]);
  });
  afterAll(async () => { await pool?.end(); await closeDatabaseConnection(); });
  it("removes and locks atomically and promotes eligible waitlist with audit", async () => {
    const first = await manageCollegeStudyMember(admin, id.group, {
      action: "ADD", membershipId: SEED_IDS.learnerCollegeAMembership,
    });
    expect(first.state).toBe("ACTIVE");
    const second = await manageCollegeStudyMember(admin, id.group, {
      action: "ADD", membershipId: id.membership,
    });
    expect(second.state).toBe("WAITLISTED");
    await expect(manageCollegeStudyMember(admin, id.group, {
      action: "REMOVE_AND_LOCK", membershipId: first.membershipId,
      expectedVersion: first.version + 1, confirm: true,
    })).rejects.toMatchObject({ code: "GROUP_MEMBER_STALE" });
    const removed = await manageCollegeStudyMember(admin, id.group, {
      action: "REMOVE_AND_LOCK", membershipId: first.membershipId,
      expectedVersion: first.version, confirm: true,
    });
    expect(removed.state).toBe("REMOVED");
    expect(removed.isLocked).toBe(true);
    const active = await pool!.query(
      "SELECT state FROM lms_group_members WHERE group_id=$1 AND membership_id=$2",
      [id.group, id.membership],
    );
    expect(active.rows[0].state).toBe("ACTIVE");
    const audit = await pool!.query(
      "SELECT id FROM activity_events WHERE subject_id=$1 AND event_type='academics.group.updated'",
      [removed.id],
    );
    expect(audit.rowCount).toBeGreaterThan(0);
    await expect(manageCollegeStudyMember(admin, id.group, {
      action: "REMOVE_AND_LOCK", membershipId: first.membershipId,
      expectedVersion: first.version, confirm: true,
    })).rejects.toMatchObject({ code: "GROUP_MEMBER_NOT_FOUND" });
  });
  it("does not leak a foreign group and denies wrong role", async () => {
    await expect(manageCollegeStudyMember(other, id.group, {
      action: "REMOVE_AND_LOCK", membershipId: id.membership, expectedVersion: 1, confirm: true,
    })).rejects.toMatchObject({ code: "GROUP_NOT_MANAGEABLE" });
    await expect(manageCollegeStudyMember(learner, id.group, {
      action: "REMOVE_AND_LOCK", membershipId: id.membership, expectedVersion: 1, confirm: true,
    })).rejects.toBeInstanceOf(AuthorizationError);
  });
  // Keep fixture rows on the isolated DB: append-only activity/member-event rows reference them.
});
