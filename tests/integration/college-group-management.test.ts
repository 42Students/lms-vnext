import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  changeCollegeStudyGroup,
  createCollegeStudyGroup,
  CollegeGroupManagementError,
} from "@/modules/groups/college-group-management-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled
  ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 })
  : null;

const admin: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser,
    identityUid: "group-management-admin",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.collegeAdminMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["COLLEGE_ADMIN"],
  },
};
const foreign: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "group-management-foreign",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeBMembership,
    collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["COLLEGE_ADMIN"],
  },
};
const learner: RequestContext = {
  ...admin,
  membership: { ...admin.membership!, roles: ["LEARNER"] },
};
const prefix = "MG-" + randomUUID().slice(0, 10);
const foreignAdminIds = { user: randomUUID(), membership: randomUUID() };
const secondLearnerIds = { user: randomUUID(), membership: randomUUID() };
const realForeignAdmin: RequestContext = {
  user: { id: foreignAdminIds.user, identityUid: "group-admin-" + foreignAdminIds.user, platformStatus: "ACTIVE", systemRoles: [] },
  membership: {
    id: foreignAdminIds.membership, collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"],
  },
};
const createdIds: string[] = [];

describe.skipIf(!enabled)("College study groups — PG create/edit/status/tenant guards", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("Disposable PostgreSQL required");
    await pool.query(
      "INSERT INTO users(id,identity_uid,display_name) VALUES($1,$2,$3)",
      [foreignAdminIds.user, realForeignAdmin.user.identityUid, prefix + "-foreign"],
    );
    await pool.query(
      "INSERT INTO college_memberships(id,user_id,college_id) VALUES($1,$2,$3)",
      [foreignAdminIds.membership, foreignAdminIds.user, SEED_IDS.collegeB],
    );
    await pool.query(
      "INSERT INTO membership_roles(membership_id,role) VALUES($1,'COLLEGE_ADMIN')",
      [foreignAdminIds.membership],
    );
    await pool.query(
      "INSERT INTO users(id,identity_uid,display_name) VALUES($1,$2,$3)",
      [secondLearnerIds.user, "group-learner-" + secondLearnerIds.user, prefix + "-learner"],
    );
    await pool.query(
      "INSERT INTO college_memberships(id,user_id,college_id) VALUES($1,$2,$3)",
      [secondLearnerIds.membership, secondLearnerIds.user, SEED_IDS.collegeA],
    );
    await pool.query(
      "INSERT INTO membership_roles(membership_id,role) VALUES($1,'LEARNER')",
      [secondLearnerIds.membership],
    );
  });

  afterAll(async () => {
    try {
      if (pool) {
        for (const id of [...createdIds].reverse()) {
          await pool.query("DELETE FROM activity_events WHERE subject_type = 'lms_group' AND subject_id = $1", [id]);
          await pool.query("DELETE FROM lms_group_members WHERE group_id = $1", [id]);
          await pool.query("DELETE FROM lms_groups WHERE id = $1", [id]);
        }
        await pool.query("DELETE FROM membership_roles WHERE membership_id=$1", [foreignAdminIds.membership]);
        await pool.query("DELETE FROM college_memberships WHERE id=$1", [foreignAdminIds.membership]);
        await pool.query("DELETE FROM users WHERE id=$1", [foreignAdminIds.user]);
        await pool.query("DELETE FROM membership_roles WHERE membership_id=$1", [secondLearnerIds.membership]);
        await pool.query("DELETE FROM college_memberships WHERE id=$1", [secondLearnerIds.membership]);
        await pool.query("DELETE FROM users WHERE id=$1", [secondLearnerIds.user]);
      }
    } finally {
      await pool?.end();
      await closeDatabaseConnection();
    }
  });

  it("creates, audits, changes metadata with version, transitions and archives", async () => {
    if (!pool) throw new Error("Disposable PostgreSQL required");
    const created = await createCollegeStudyGroup(admin, {
      name: prefix + "-A", description: "Original", capacity: 3,
    });
    createdIds.push(created.id);
    expect(created.status).toBe("DRAFT");
    expect(created.collegeId).toBe(SEED_IDS.collegeA);
    const edited = await changeCollegeStudyGroup(admin, created.id, {
      action: "EDIT", expectedVersion: created.version,
      name: prefix + "-Edited", description: "Updated", capacity: 2,
    });
    expect(edited.version).toBe(created.version + 1);
    const active = await changeCollegeStudyGroup(admin, created.id, {
      action: "STATUS", expectedVersion: edited.version, transition: "ACTIVATE",
    });
    const closed = await changeCollegeStudyGroup(admin, created.id, {
      action: "STATUS", expectedVersion: active.version, transition: "CLOSE",
    });
    const archived = await changeCollegeStudyGroup(admin, created.id, {
      action: "STATUS", expectedVersion: closed.version, transition: "ARCHIVE",
    });
    expect(archived.status).toBe("ARCHIVED");
    const audits = await pool.query(
      "SELECT event_type, actor_user_id, metadata FROM activity_events " +
      "WHERE subject_type='lms_group' AND subject_id=$1 ORDER BY occurred_at, id",
      [created.id],
    );
    expect(audits.rows.map((row) => row.event_type)).toEqual([
      "academics.group.created",
      "academics.group.updated",
      "academics.group.status_changed",
      "academics.group.status_changed",
      "academics.group.status_changed",
    ]);
    expect(audits.rows.every((row) => row.actor_user_id === admin.user.id)).toBe(true);
    await expect(changeCollegeStudyGroup(admin, created.id, {
      action: "EDIT", expectedVersion: created.version,
      name: prefix + "-Bad", description: "", capacity: null,
    })).rejects.toBeInstanceOf(CollegeGroupManagementError);
  });

  it("denies cross-college changes, forged role and unsafe client scope", async () => {
    const created = await createCollegeStudyGroup(admin, {
      name: prefix + "-Scope", description: "", capacity: null,
    });
    createdIds.push(created.id);
    await expect(changeCollegeStudyGroup(foreign, created.id, {
      action: "STATUS", expectedVersion: created.version, transition: "ACTIVATE",
    })).rejects.toBeInstanceOf(AuthorizationError);
    await expect(changeCollegeStudyGroup(realForeignAdmin, created.id, {
      action: "STATUS", expectedVersion: created.version, transition: "ACTIVATE",
    })).rejects.toMatchObject({ code: "GROUP_NOT_FOUND" });
    await expect(changeCollegeStudyGroup(learner, created.id, {
      action: "EDIT", expectedVersion: created.version,
      name: "No", description: "", capacity: null,
    })).rejects.toBeInstanceOf(AuthorizationError);
    await expect(createCollegeStudyGroup(admin, {
      name: "Bad", description: "", capacity: null, collegeId: SEED_IDS.collegeB,
    })).rejects.toBeDefined();
  });

  it("rejects names differing only by case and capacity below existing members", async () => {
    if (!pool) throw new Error("Disposable PostgreSQL required");
    const created = await createCollegeStudyGroup(admin, {
      name: prefix + "-Duplicate", description: "", capacity: 3,
    });
    createdIds.push(created.id);
    await expect(createCollegeStudyGroup(admin, {
      name: (prefix + "-Duplicate").toLowerCase(), description: "", capacity: 3,
    })).rejects.toMatchObject({ code: "GROUP_NAME_TAKEN" });
    await pool.query(
      "INSERT INTO lms_group_members(group_id, membership_id, member_type, state, source, joined_at) " +
      "VALUES($1,$2,'LEARNER','ACTIVE','MANUAL',now()), " +
      "($1,$3,'LEARNER','ACTIVE','MANUAL',now())",
      [created.id, SEED_IDS.learnerCollegeAMembership, secondLearnerIds.membership],
    );
    await pool.query("UPDATE lms_groups SET active_count = 2 WHERE id=$1", [created.id]);
    const live = await pool.query(
      "SELECT active_count, capacity, version FROM lms_groups WHERE id=$1",
      [created.id],
    );
    const count = Number(live.rows[0].active_count);
    const currentVersion = Number(live.rows[0].version);
    const members = await pool.query(
      "SELECT count(*)::int AS total FROM lms_group_members WHERE group_id=$1 AND state='ACTIVE'",
      [created.id],
    );
    expect(members.rows[0].total).toBe(2);
    expect(count).toBe(2);
    const lowerCapacity = count - 1;
    expect(lowerCapacity).toBeGreaterThanOrEqual(1); // Valid Zod input; exercises the DB-backed guard.
    await expect(changeCollegeStudyGroup(admin, created.id, {
      action: "EDIT", expectedVersion: currentVersion,
      name: created.name, description: "", capacity: lowerCapacity,
    })).rejects.toMatchObject({ code: "GROUP_HAS_MEMBERS" });
    const afterRejectedEdit = await pool.query(
      "SELECT active_count, capacity, version FROM lms_groups WHERE id=$1",
      [created.id],
    );
    expect(afterRejectedEdit.rows[0]).toEqual(live.rows[0]);
    await expect(changeCollegeStudyGroup(admin, created.id, {
      action: "STATUS", expectedVersion: currentVersion, transition: "ARCHIVE",
    })).rejects.toMatchObject({ code: "GROUP_TRANSITION_INVALID" });
  });
});
