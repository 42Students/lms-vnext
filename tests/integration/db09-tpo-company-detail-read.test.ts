import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getTpoCompanyDetailReadOnly } from "@/modules/placements/tpo-company-detail-read-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
const enabled = process.env.DB09_ISOLATED_TEST_DATABASE === "1" && Boolean(process.env.TEST_DATABASE_URL);
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 }) : null;
const tpo: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "tpo-company-detail-read", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.facultyCollegeAMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["TPO"] },
};
const ids: { company?: string; relationship?: string; job?: string; contact?: string } = {};
const tpoRoleIds: string[] = [];
async function createCompanyFixture() {
  if (!pool) throw new Error("Isolated PG required");
  const token = randomUUID();
  const company = (await pool.query<{ id: string }>(
    "INSERT INTO placement_companies(name,created_by_user_id) VALUES($1,$2) RETURNING id",
    ["Trust source " + token, SEED_IDS.facultyUser])).rows[0]!;
  ids.company = company.id;
  const rel = (await pool.query<{ id: string }>(
    "INSERT INTO placement_company_relationships(college_id,company_id,is_trusted,created_by_user_id) " +
    "VALUES($1,$2,true,$3) RETURNING id",
    [SEED_IDS.collegeA, company.id, SEED_IDS.facultyUser])).rows[0]!;
  ids.relationship = rel.id;
  const job = (await pool.query<{ id: string }>(
    "INSERT INTO placement_jobs(college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,application_mode,status,published_at,created_by_user_id) " +
    "VALUES($1,$2,$3,$4,$5,'FULL_TIME','ONSITE','INTERNAL','PUBLISHED',now(),$6) RETURNING id",
    [SEED_IDS.collegeA, SEED_IDS.placementSeasonA, rel.id, "Company drive " + token,
      "Scoped company history", SEED_IDS.facultyUser])).rows[0]!;
  ids.job = job.id;
  const contact = (await pool.query<{ id: string }>(
    "INSERT INTO placement_tpo_leads(college_id,company_relationship_id,name,email_norm) " +
    "VALUES($1,$2,$3,$4) RETURNING id",
    [SEED_IDS.collegeA, rel.id, "Recruiter " + token, randomUUID() + "@example.org"])).rows[0]!;
  ids.contact = contact.id;
  return company.id;
}
async function cleanup() {
  if (!pool) return;
  if (ids.contact) await pool.query("DELETE FROM placement_tpo_leads WHERE id=$1", [ids.contact]);
  if (ids.job) await pool.query("DELETE FROM placement_jobs WHERE id=$1", [ids.job]);
  if (ids.relationship) await pool.query("DELETE FROM placement_company_relationships WHERE id=$1", [ids.relationship]);
  if (ids.company) await pool.query("DELETE FROM placement_companies WHERE id=$1", [ids.company]);
}
describe.skipIf(!enabled)("TPO read-only company detail on isolated PostgreSQL", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("Pool required");
    for (const id of [SEED_IDS.facultyCollegeAMembership, SEED_IDS.facultyCollegeBMembership]) {
      const role = (await pool.query<{ id: string }>(
        "INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING RETURNING id",
        [id])).rows[0];
      if (role?.id) tpoRoleIds.push(role.id);
    }
  });
  afterAll(async () => {
    await cleanup();
    for (const id of tpoRoleIds) await pool?.query("DELETE FROM membership_roles WHERE id=$1", [id]);
    await pool?.end();
    await closeDatabaseConnection();
  });
  it("shows linked drive, contact and persisted trust with non-leaking foreign denial", async () => {
    const companyId = await createCompanyFixture();
    const found = await getTpoCompanyDetailReadOnly(tpo, companyId);
    expect(found?.relationship).toMatchObject({ relationshipStatus: "ACTIVE", isTrusted: true });
    expect(found?.company.drives).toBe(1);
    expect(found?.contacts).toHaveLength(1);
    expect(found?.drives).toHaveLength(1);
    expect(found?.hiringPulse.activeDrives).toBe(1);
    expect(found?.hiringPulse.seasonsWithDrives).toBe(1);
    expect(found?.hiringPulse.distinctAcceptedLearners).toBe(0);
    expect(found?.hiringPulse.latestRecordedEventIso).toBeTruthy();
    const foreign: RequestContext = { ...tpo, membership: { ...tpo.membership!,
      id: SEED_IDS.facultyCollegeBMembership, collegeId: SEED_IDS.collegeB } };
    await expect(getTpoCompanyDetailReadOnly(foreign, companyId)).resolves.toBeNull();
    const wrong: RequestContext = { ...tpo, membership: { ...tpo.membership!, roles: ["LEARNER"] } };
    await expect(getTpoCompanyDetailReadOnly(wrong, companyId)).rejects.toBeInstanceOf(AuthorizationError);
    await expect(getTpoCompanyDetailReadOnly(tpo, randomUUID())).resolves.toBeNull();
  });
});
