import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { listCollegePeople } from "@/modules/people/service";
import { drizzlePeopleRepository } from "@/modules/people/repository";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = !!process.env.TEST_DATABASE_URL && process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL }) : null;
const id = { user: randomUUID(), member: randomUUID(), role: randomUUID() };
const unique = "people-filter-" + id.user.slice(0, 12);
const admin: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "people-directory-admin", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.collegeAdminMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const foreign: RequestContext = { ...admin,
  membership: { ...admin.membership!, collegeId: SEED_IDS.collegeB } };
const learner: RequestContext = { ...admin,
  membership: { ...admin.membership!, roles: ["LEARNER"] } };

describe.skipIf(!enabled)("College people filter PostgreSQL tenant boundary", () => {
  beforeAll(async () => {
    await pool!.query("INSERT INTO users(id,identity_uid,display_name,email) VALUES($1,$2,$3,$4)",
      [id.user, unique, unique, unique + "@example.test"]);
    await pool!.query("INSERT INTO college_memberships(id,user_id,college_id) VALUES($1,$2,$3)",
      [id.member, id.user, SEED_IDS.collegeA]);
    await pool!.query("INSERT INTO membership_roles(id,membership_id,role) VALUES($1,$2,'MENTOR')",
      [id.role, id.member]);
  });
  afterAll(async () => {
    try {
      await pool?.query("DELETE FROM membership_roles WHERE id=$1", [id.role]);
      await pool?.query("DELETE FROM college_memberships WHERE id=$1", [id.member]);
      await pool?.query("DELETE FROM users WHERE id=$1", [id.user]);
    } finally {
      await pool?.end(); await closeDatabaseConnection();
    }
  });
  it("filters role/status/search before pagination and counts", async () => {
    const result = await listCollegePeople(admin, {
      collegeId: SEED_IDS.collegeA, role: "MENTOR", status: "ACTIVE", q: unique,
    }, drizzlePeopleRepository);
    expect(result.pagination.total).toBe(1);
    expect(result.items.map(x => x.membership.id)).toEqual([id.member]);
    const hidden = await listCollegePeople(admin, {
      collegeId: SEED_IDS.collegeA, role: "FACULTY", q: unique,
    }, drizzlePeopleRepository);
    expect(hidden.items).toEqual([]);
    expect(hidden.pagination.total).toBe(0);
  });
  it("foreign college gets no matching membership; wrong role is denied", async () => {
    const foreignResult = await listCollegePeople(foreign, {
      collegeId: SEED_IDS.collegeB, role: "MENTOR", q: unique,
    }, drizzlePeopleRepository);
    expect(foreignResult.items).toEqual([]);
    await expect(listCollegePeople(foreign, {
      collegeId: SEED_IDS.collegeA, q: unique,
    }, drizzlePeopleRepository)).rejects.toBeInstanceOf(AuthorizationError);
    await expect(listCollegePeople(learner, {
      collegeId: SEED_IDS.collegeA, q: unique,
    }, drizzlePeopleRepository)).rejects.toBeInstanceOf(AuthorizationError);
  });
});
