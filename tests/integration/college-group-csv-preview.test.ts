import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  GroupCsvPreviewNotFoundError, previewCollegeGroupCsv,
} from "@/modules/groups/college-group-csv-preview-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 }) : null;
const admin: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "group-import-a",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.collegeAdminMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const foreign: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "group-import-b",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.facultyCollegeBMembership, collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const groupId = randomUUID();
const learnerUserId = randomUUID();
const learnerMembershipId = randomUUID();
const learnerRoleId = randomUUID();
const groupName = "W-Group-Csv-" + groupId.slice(0, 8);
const learnerEmail = "csv-" + groupId.slice(0, 8) + "@example.test";

describe.skipIf(!enabled)("Student Group CSV preview — disposable PostgreSQL", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("Isolated PostgreSQL is required");
    await pool.query("INSERT INTO users(id,identity_uid,email,display_name) VALUES($1,$2,$3,$4)",
      [learnerUserId, "csv-" + learnerUserId, learnerEmail, groupName]);
    await pool.query("INSERT INTO college_memberships(id,user_id,college_id) VALUES($1,$2,$3)",
      [learnerMembershipId, learnerUserId, SEED_IDS.collegeA]);
    await pool.query("INSERT INTO membership_roles(id,membership_id,role) VALUES($1,$2,'LEARNER')",
      [learnerRoleId, learnerMembershipId]);
    await pool.query("INSERT INTO lms_groups(id,kind,owner_scope,college_id,name,status,capacity,created_by_user_id) " +
      "VALUES($1,'STUDY_GROUP','COLLEGE',$2,$3,'ACTIVE',2,$4)",
      [groupId, SEED_IDS.collegeA, groupName, SEED_IDS.collegeAdminUser]);
  });
  afterAll(async () => {
    try {
      if (pool) {
        await pool.query("DELETE FROM lms_groups WHERE id=$1", [groupId]);
        await pool.query("DELETE FROM membership_roles WHERE id=$1", [learnerRoleId]);
        await pool.query("DELETE FROM college_memberships WHERE id=$1", [learnerMembershipId]);
        await pool.query("DELETE FROM users WHERE id=$1", [learnerUserId]);
      }
    } finally { await pool?.end(); await closeDatabaseConnection(); }
  });
  it("validates a persisted active college learner and a missing email without writes", async () => {
    if (!pool) throw new Error("Pool required");
    const result = await previewCollegeGroupCsv(admin, {
      groupId, csv: "email\n" + learnerEmail + "\nmissing-" + groupId.slice(0, 8) + "@example.com\n",
    });
    expect(result.total).toBe(2);
    expect(result.rows.map(row => row.status)).toEqual(["READY", "NOT_FOUND"]);
    const persisted = await pool.query("SELECT id FROM lms_group_members WHERE group_id=$1", [groupId]);
    expect(persisted.rows).toEqual([]);
  });
  it("hides cross-college group IDs and denies non-admin roles", async () => {
    await expect(previewCollegeGroupCsv(foreign, {
      groupId, csv: "email\nunknown@example.com",
    })).rejects.toBeInstanceOf(GroupCsvPreviewNotFoundError);
    await expect(previewCollegeGroupCsv({
      ...admin, membership: { ...admin.membership!, roles: ["LEARNER"] },
    }, { groupId, csv: "email\nunknown@example.com" }))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(previewCollegeGroupCsv(admin, {
      groupId, csv: "email\n", collegeId: SEED_IDS.collegeB,
    })).rejects.toBeDefined();
  });
});
