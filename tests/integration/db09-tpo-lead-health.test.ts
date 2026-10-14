import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getPlacementLeadsReport } from "@/modules/placements/report-extra-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
const enabled = process.env.DB09_ISOLATED_TEST_DATABASE === "1" && Boolean(process.env.TEST_DATABASE_URL);
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 }) : null;
const tpo: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "tpo-lead-health", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.facultyCollegeAMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["TPO"] },
};
const foreign: RequestContext = { ...tpo, membership: { ...tpo.membership!,
  id: SEED_IDS.facultyCollegeBMembership, collegeId: SEED_IDS.collegeB } };
let roleId: string | null = null;
async function fixture(collegeId: string) {
  if (!pool) throw new Error("Requires isolated PG");
  const row = await pool.query<{ id: string }>(
    "INSERT INTO placement_tpo_leads(college_id,name,email_norm,manual_stage) VALUES($1,$2,$3,'CONTACTED') RETURNING id",
    [collegeId, "Health " + randomUUID(), randomUUID() + "@example.org"]);
  if (!row.rows[0]) throw new Error("Fixture missing");
  return row.rows[0].id;
}
describe.skipIf(!enabled)("DB09 TPO lead health scopes and reads", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("Pool required");
    const row = await pool.query<{ id: string }>(
      "INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING RETURNING id",
      [SEED_IDS.facultyCollegeAMembership]);
    roleId = row.rows[0]?.id ?? null;
  });
  afterAll(async () => {
    // Leads with immutable activity must remain until the disposable DB is destroyed.
    if (roleId && pool) await pool.query("DELETE FROM membership_roles WHERE id=$1", [roleId]);
    await pool?.end();
    await closeDatabaseConnection();
  });
  it("counts persisted activity, scoped due followups and denies foreign/wrong role", async () => {
    if (!pool) throw new Error("Pool required");
    const own = await fixture(SEED_IDS.collegeA);
    const other = await fixture(SEED_IDS.collegeB);
    await pool.query(
      "INSERT INTO placement_tpo_lead_activities(college_id,lead_id,type,is_system,created_by_user_id,created_at) " +
      "VALUES($1,$2,'CALL',false,$3,now()-interval '20 days')",
      [SEED_IDS.collegeA, own, SEED_IDS.facultyUser]);
    await pool.query("INSERT INTO placement_tpo_followups(college_id,lead_id,due_at) VALUES($1,$2,now()-interval '1 day')",
      [SEED_IDS.collegeA, own]);
    const a = await getPlacementLeadsReport(tpo, SEED_IDS.collegeA);
    const b = await getPlacementLeadsReport(foreign, SEED_IDS.collegeB);
    expect(a.leads.byStage.some((item) => item.label === "CONTACTED" && item.leads >= 1)).toBe(true);
    expect(a.health.goneQuiet14Days).toBeGreaterThanOrEqual(1);
    expect(a.health.dueFollowups).toBeGreaterThanOrEqual(1);
    expect(b.health.actionableLeads).toBeGreaterThanOrEqual(1);
    expect(other).not.toBe(own);
    const wrong: RequestContext = { ...tpo, membership: { ...tpo.membership!, roles: ["LEARNER"] } };
    await expect(getPlacementLeadsReport(wrong, SEED_IDS.collegeA)).rejects.toBeInstanceOf(AuthorizationError);
  });
});
