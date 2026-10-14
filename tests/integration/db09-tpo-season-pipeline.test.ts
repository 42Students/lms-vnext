import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getTpoSeasonPipeline } from "@/modules/placements/tpo-season-pipeline-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
const enabled = process.env.DB09_ISOLATED_TEST_DATABASE === "1" && Boolean(process.env.TEST_DATABASE_URL);
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 }) : null;
const tpo: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "tpo-season-pipeline",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.facultyCollegeAMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["TPO"] },
};
const ids: { company?: string; relationship?: string; job?: string; role?: string; application?: string; offer?: string } = {};
let roleId: string | null = null;
async function fixture() {
  if (!pool) throw new Error("Isolated PostgreSQL required");
  const token = randomUUID();
  const company = (await pool.query<{ id: string }>(
    "INSERT INTO placement_companies(name,created_by_user_id) VALUES($1,$2) RETURNING id",
    ["Season pipeline " + token, SEED_IDS.facultyUser])).rows[0]!;
  ids.company = company.id;
  const rel = (await pool.query<{ id: string }>(
    "INSERT INTO placement_company_relationships(college_id,company_id,created_by_user_id) VALUES($1,$2,$3) RETURNING id",
    [SEED_IDS.collegeA, company.id, SEED_IDS.facultyUser])).rows[0]!;
  ids.relationship = rel.id;
  const job = (await pool.query<{ id: string }>(
    "INSERT INTO placement_jobs(college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,application_mode,status,published_at,created_by_user_id) " +
    "VALUES($1,$2,$3,$4,$5,'FULL_TIME','ONSITE','INTERNAL','PUBLISHED',now(),$6) RETURNING id",
    [SEED_IDS.collegeA, SEED_IDS.placementSeasonA, rel.id, "Funnel " + token, "Report fixture", SEED_IDS.facultyUser])).rows[0]!;
  ids.job = job.id;
  const role = (await pool.query<{ id: string }>(
    "INSERT INTO placement_job_role_options(job_id,title,employment_type,work_mode,is_primary) VALUES($1,'Main','FULL_TIME','ONSITE',true) RETURNING id",
    [job.id])).rows[0]!;
  ids.role = role.id;
  const app = (await pool.query<{ id: string }>(
    "INSERT INTO placement_applications(job_id,role_option_id,membership_id,channel,eligibility_status,eligibility_snapshot,submitted_by_user_id) " +
    "VALUES($1,$2,$3,'INTERNAL','ELIGIBLE','{}'::jsonb,$4) RETURNING id",
    [job.id, role.id, SEED_IDS.learnerCollegeAMembership, SEED_IDS.learnerUser])).rows[0]!;
  ids.application = app.id;
  await pool.query(
    "INSERT INTO placement_application_screenings(application_id,status,decided_by_user_id,decided_at) " +
    "VALUES($1,'SHORTLISTED',$2,now())", [app.id, SEED_IDS.facultyUser]);
  const offer = (await pool.query<{ id: string }>(
    "INSERT INTO placement_offers(application_id,version,status,role_title,issued_by_user_id,responded_by_user_id,responded_at) " +
    "VALUES($1,1,'ACCEPTED','Main',$2,$2,now()) RETURNING id",
    [app.id, SEED_IDS.facultyUser])).rows[0]!;
  ids.offer = offer.id;
  await pool.query("INSERT INTO placement_joining_outcomes(offer_id,status,joining_date,recorded_by_user_id,recorded_at) " +
    "VALUES($1,'JOINED','2026-10-14',$2,now())", [offer.id, SEED_IDS.facultyUser]);
  return job.id;
}
async function cleanup() {
  if (!pool) return;
  if (ids.offer) {
    await pool.query("DELETE FROM placement_joining_outcomes WHERE offer_id=$1", [ids.offer]);
    await pool.query("DELETE FROM placement_offers WHERE id=$1", [ids.offer]);
  }
  if (ids.application) {
    await pool.query("DELETE FROM placement_application_screenings WHERE application_id=$1", [ids.application]);
    await pool.query("DELETE FROM placement_applications WHERE id=$1", [ids.application]);
  }
  if (ids.role) await pool.query("DELETE FROM placement_job_role_options WHERE id=$1", [ids.role]);
  if (ids.job) await pool.query("DELETE FROM placement_jobs WHERE id=$1", [ids.job]);
  if (ids.relationship) await pool.query("DELETE FROM placement_company_relationships WHERE id=$1", [ids.relationship]);
  if (ids.company) await pool.query("DELETE FROM placement_companies WHERE id=$1", [ids.company]);
}
describe.skipIf(!enabled)("TPO season pipeline isolated PostgreSQL", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("Pool required");
    const inserted = await pool.query<{ id: string }>(
      "INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING RETURNING id",
      [SEED_IDS.facultyCollegeAMembership]);
    roleId = inserted.rows[0]?.id ?? null;
  });
  afterAll(async () => {
    await cleanup();
    if (roleId && pool) await pool.query("DELETE FROM membership_roles WHERE id=$1", [roleId]);
    await pool?.end();
    await closeDatabaseConnection();
  });
  it("counts a scoped submitted/shortlisted/accepted/joined pipeline without final selection inference", async () => {
    const jobId = await fixture();
    const report = await getTpoSeasonPipeline(tpo, {
      seasonId: SEED_IDS.placementSeasonA, jobId,
    });
    expect(report.rows).toHaveLength(1);
    expect(report.totals).toEqual({
      applied: 1, currentlySubmitted: 1, shortlisted: 1, selected: null,
      offered: 1, accepted: 1, joined: 1,
    });
    const foreign: RequestContext = { ...tpo, membership: {
      ...tpo.membership!, id: SEED_IDS.facultyCollegeBMembership, collegeId: SEED_IDS.collegeB } };
    await expect(getTpoSeasonPipeline(foreign, { seasonId: SEED_IDS.placementSeasonA }))
      .rejects.toMatchObject({ code: "PLACEMENT_SEASON_NOT_FOUND" });
    const wrong: RequestContext = { ...tpo, membership: { ...tpo.membership!, roles: ["LEARNER"] } };
    await expect(getTpoSeasonPipeline(wrong, { seasonId: SEED_IDS.placementSeasonA }))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(getTpoSeasonPipeline(tpo, { seasonId: randomUUID() }))
      .rejects.toMatchObject({ code: "PLACEMENT_SEASON_NOT_FOUND" });
  });
});
