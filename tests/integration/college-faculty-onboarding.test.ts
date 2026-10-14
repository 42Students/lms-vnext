import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import type { IdentityDirectory } from "@/modules/people/identity";
import { onboardPerson } from "@/modules/people/service";
import { drizzlePeopleRepository } from "@/modules/people/repository";
import { AuthorizationError } from "@/modules/permissions/policy";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = !!process.env.TEST_DATABASE_URL && process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL }) : null;
const uid = "faculty-onboarding-" + randomUUID();
const phone = "+91" + Math.floor(8000000000 + Math.random() * 1000000000).toString();
const collegeAdmin: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "faculty-create-actor",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.collegeAdminMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const wrongRole: RequestContext = { ...collegeAdmin,
  membership: { ...collegeAdmin.membership!, roles: ["LEARNER"] } };
const foreignAdmin: RequestContext = { ...collegeAdmin,
  membership: { ...collegeAdmin.membership!, collegeId: SEED_IDS.collegeB } };
const directory: IdentityDirectory = {
  async findByPhone() { return null; },
  async findByEmail() { return null; },
  async createUser(input) {
    return { uid, phoneNumber: input.phoneNumber ?? null,
      email: input.email ?? null, displayName: input.displayName };
  },
  async updateUser() { throw new Error("Unexpected update"); },
};

describe.skipIf(!enabled)("College Admin Faculty onboarding persisted path", () => {
  afterAll(async () => { await pool?.end(); await closeDatabaseConnection(); });
  it("creates Faculty-only membership and immutable onboarding audit without sending", async () => {
    const result = await onboardPerson(collegeAdmin, {
      collegeId: SEED_IDS.collegeA, displayName: uid, phoneE164: phone, roles: ["FACULTY"],
    }, { identityDirectory: directory, repository: drizzlePeopleRepository });
    const check = await pool!.query(
      "select role from membership_roles where membership_id=$1", [result.membership.id]);
    expect(check.rows.map(row => row.role)).toEqual(["FACULTY"]);
    const audit = await pool!.query("select id from activity_events where subject_id=$1", [result.membership.id]);
    expect(audit.rowCount).toBeGreaterThan(0);
    // Preserve append-only activity and its referenced subject/membership/user on disposable DB.
  });
  it("denies non-admin and foreign-college creation before provisioning", async () => {
    for (const context of [wrongRole, foreignAdmin]) {
      await expect(onboardPerson(context, {
        collegeId: SEED_IDS.collegeA, displayName: uid, phoneE164: phone,
        roles: ["FACULTY"],
      }, { identityDirectory: directory, repository: drizzlePeopleRepository }))
        .rejects.toBeInstanceOf(AuthorizationError);
    }
  });
});
