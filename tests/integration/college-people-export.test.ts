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
const pageMarker = "paged-export-" + ids.user.slice(0,8);
const pageRows = Array.from({length:105},()=>({
  user:randomUUID(), member:randomUUID(), role:randomUUID(),
}));

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
    // Real PostgreSQL multi-page directory export fixture: 105 distinct
    // memberships span the 100-row pagination boundary.
    const userIds=pageRows.map(row=>row.user);
    const memberIds=pageRows.map(row=>row.member);
    const roleIds=pageRows.map(row=>row.role);
    await pool!.query(`
      INSERT INTO users(id,identity_uid,display_name,email)
      SELECT u.id,'ux-csv-'||u.id,$2||'-row-'||u.n::text,
        'ux-csv-'||u.id||'@example.test'
      FROM unnest($1::uuid[]) WITH ORDINALITY AS u(id,n)
    `,[userIds,pageMarker]);
    await pool!.query(`
      INSERT INTO college_memberships(id,user_id,college_id)
      SELECT m.id,m.user_id,$3 FROM unnest($1::uuid[],$2::uuid[]) AS m(id,user_id)
    `,[memberIds,userIds,SEED_IDS.collegeA]);
    await pool!.query(`
      INSERT INTO membership_roles(id,membership_id,role)
      SELECT r.id,r.membership_id,'MENTOR'
      FROM unnest($1::uuid[],$2::uuid[]) AS r(id,membership_id)
    `,[roleIds,memberIds]);
  });
  afterAll(async () => {
    try {
      await pool?.query("DELETE FROM membership_roles WHERE id = ANY($1::uuid[])",
        [pageRows.map(row=>row.role)]);
      await pool?.query("DELETE FROM college_memberships WHERE id = ANY($1::uuid[])",
        [pageRows.map(row=>row.member)]);
      await pool?.query("DELETE FROM users WHERE id = ANY($1::uuid[])",
        [pageRows.map(row=>row.user)]);
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
  it("paginates 105 real memberships exactly once, without claiming truncated data", async () => {
    const result=await exportCollegePeopleCsv(admin,{q:pageMarker,role:"MENTOR"});
    expect(result.total).toBe(105);
    expect(result.exported).toBe(105);
    expect(result.truncated).toBe(false);
    const rows=result.csv.replace(/^\uFEFF/,"").trim().split("\r\n");
    expect(rows).toHaveLength(106);
    expect(rows[0]).toContain("Membership ID");
    for(const item of pageRows)
      expect(result.csv.split(item.member).length-1).toBe(1);
    const otherCollege=await exportCollegePeopleCsv(foreign,{q:pageMarker,role:"MENTOR"});
    expect(otherCollege.exported).toBe(0);
  });

  it("rejects role forgery and never exports a foreign college row", async () => {
    expect((await exportCollegePeopleCsv(foreign,{q:marker})).exported).toBe(0);
    await expect(exportCollegePeopleCsv(learner,{q:marker}))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(exportCollegePeopleCsv(admin,{collegeId:SEED_IDS.collegeB}))
      .rejects.toBeDefined();
  });
});
