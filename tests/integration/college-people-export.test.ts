import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import { exportCollegePeopleCsv } from "@/modules/people/college-people-export-service";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
const enabled = !!process.env.TEST_DATABASE_URL && process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound:true });
const pool = enabled ? new Pool({ connectionString:process.env.TEST_DATABASE_URL }) : null;
const ids = { user:randomUUID(), member:randomUUID(), role:randomUUID() };
const marker = "people-csv-" + ids.user.slice(0,8);
const admin: RequestContext = {
  user:{ id:SEED_IDS.collegeAdminUser, identityUid:"csv-actor", platformStatus:"ACTIVE", systemRoles:[] },
  membership:{ id:SEED_IDS.collegeAdminMembership, collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization, status:"ACTIVE", roles:["COLLEGE_ADMIN"] },
};
const foreign: RequestContext = {...admin, membership:{...admin.membership!, collegeId:SEED_IDS.collegeB}};
const learner: RequestContext = {...admin, membership:{...admin.membership!, roles:["LEARNER"]}};
describe.skipIf(!enabled)("College people CSV PostgreSQL scope", () => {
  beforeAll(async () => {
    await pool!.query("INSERT INTO users(id,identity_uid,display_name,email) VALUES($1,$2,$3,$4)",
      [ids.user,marker,"=formula",marker+"@example.test"]);
    await pool!.query("INSERT INTO college_memberships(id,user_id,college_id) VALUES($1,$2,$3)",
      [ids.member,ids.user,SEED_IDS.collegeA]);
    await pool!.query("INSERT INTO membership_roles(id,membership_id,role) VALUES($1,$2,'MENTOR')",
      [ids.role,ids.member]);
  });
  afterAll(async () => {
    try {
      await pool?.query("DELETE FROM membership_roles WHERE id=$1",[ids.role]);
      await pool?.query("DELETE FROM college_memberships WHERE id=$1",[ids.member]);
      await pool?.query("DELETE FROM users WHERE id=$1",[ids.user]);
    } finally { await pool?.end(); await closeDatabaseConnection(); }
  });
  it("exports filtered college row with safe formula and no private identity UID", async () => {
    const result = await exportCollegePeopleCsv(admin,{ q:marker, role:"MENTOR" });
    expect(result.exported).toBe(1);
    expect(result.truncated).toBe(false);
    expect(result.csv).toContain(ids.member);
    expect(result.csv).toContain("'=formula");
    expect(result.csv).not.toContain("identity_uid");
    const learners = await exportCollegePeopleCsv(admin,{q:marker,role:"LEARNER"});
    expect(learners.exported).toBe(0);
    const faculty = await exportCollegePeopleCsv(admin,{q:marker,role:"FACULTY"});
    expect(faculty.exported).toBe(0);
  });
  it("rejects role forgery and never exports a foreign college row", async () => {
    expect((await exportCollegePeopleCsv(foreign,{q:marker})).exported).toBe(0);
    await expect(exportCollegePeopleCsv(learner,{q:marker}))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(exportCollegePeopleCsv(admin,{collegeId:SEED_IDS.collegeB}))
      .rejects.toBeDefined();
  });
});
