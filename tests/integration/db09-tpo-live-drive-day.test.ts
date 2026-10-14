import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getTpoLiveDriveDaySummary } from "@/modules/placements/tpo-live-drive-day-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
const enabled = process.env.DB09_ISOLATED_TEST_DATABASE === "1" && Boolean(process.env.TEST_DATABASE_URL);
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 }) : null;
const tpo: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "tpo-live-round",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.facultyCollegeAMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["TPO"] },
};
const ids: { company?: string; relationship?: string; job?: string; role?: string; round?: string; application?: string } = {};
async function fixture() {
  if (!pool) throw new Error("Isolated PG required");
  const token = randomUUID();
  const c = (await pool.query<{ id: string }>(
    "INSERT INTO placement_companies(name,created_by_user_id) VALUES($1,$2) RETURNING id",
    ["Live " + token, SEED_IDS.facultyUser])).rows[0]!;
  ids.company = c.id;
  const rel = (await pool.query<{ id: string }>(
    "INSERT INTO placement_company_relationships(college_id,company_id,created_by_user_id) VALUES($1,$2,$3) RETURNING id",
    [SEED_IDS.collegeA, c.id, SEED_IDS.facultyUser])).rows[0]!;
  ids.relationship = rel.id;
  const job = (await pool.query<{ id: string }>(
    "INSERT INTO placement_jobs(college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,application_mode,status,published_at,created_by_user_id) " +
    "VALUES($1,$2,$3,$4,$5,'FULL_TIME','ONSITE','INTERNAL','PUBLISHED',now(),$6) RETURNING id",
    [SEED_IDS.collegeA, SEED_IDS.placementSeasonA, rel.id, "Live " + token, "Live fixture", SEED_IDS.facultyUser])).rows[0]!;
  ids.job = job.id;
  const role = (await pool.query<{ id: string }>(
    "INSERT INTO placement_job_role_options(job_id,title,employment_type,work_mode,is_primary) VALUES($1,'Main','FULL_TIME','ONSITE',true) RETURNING id",
    [job.id])).rows[0]!;
  ids.role = role.id;
  const round = (await pool.query<{ id: string }>(
    "INSERT INTO placement_job_rounds(job_id,sequence,kind,name,created_by_user_id,status,scheduled_at,duration_minutes,timezone,mode,venue) " +
    "VALUES($1,1,'INTERVIEW','Live',$2,'SCHEDULED',now()-interval '5 minutes',60,'Asia/Kolkata','ON_CAMPUS','Hall') RETURNING id",
    [job.id, SEED_IDS.facultyUser])).rows[0]!;
  ids.round = round.id;
  const app = (await pool.query<{ id: string }>(
    "INSERT INTO placement_applications(job_id,role_option_id,membership_id,channel,eligibility_status,eligibility_snapshot,submitted_by_user_id) " +
    "VALUES($1,$2,$3,'INTERNAL','ELIGIBLE','{}'::jsonb,$4) RETURNING id",
    [job.id, role.id, SEED_IDS.learnerCollegeAMembership, SEED_IDS.learnerUser])).rows[0]!;
  ids.application = app.id;
  await pool.query("INSERT INTO placement_application_screenings(application_id,status,decided_by_user_id,decided_at) VALUES($1,'SHORTLISTED',$2,now())",
    [app.id, SEED_IDS.facultyUser]);
  return { roundId: round.id, applicationId: app.id };
}
async function cleanup() {
  if (!pool) return;
  if (ids.round) await pool.query("DELETE FROM placement_round_attendance WHERE round_id=$1", [ids.round]);
  if (ids.application) {
    await pool.query("DELETE FROM placement_application_screenings WHERE application_id=$1", [ids.application]);
    await pool.query("DELETE FROM placement_applications WHERE id=$1", [ids.application]);
  }
  if (ids.round) await pool.query("DELETE FROM placement_job_rounds WHERE id=$1", [ids.round]);
  if (ids.role) await pool.query("DELETE FROM placement_job_role_options WHERE id=$1", [ids.role]);
  if (ids.job) await pool.query("DELETE FROM placement_jobs WHERE id=$1", [ids.job]);
  if (ids.relationship) await pool.query("DELETE FROM placement_company_relationships WHERE id=$1", [ids.relationship]);
  if (ids.company) await pool.query("DELETE FROM placement_companies WHERE id=$1", [ids.company]);
  // There are no activity deletions: audit tables are immutable.
}
describe.skipIf(!enabled)("DB09 TPO live Drive Day snapshot", () => {
  afterAll(async () => { await cleanup(); await pool?.end(); await closeDatabaseConnection(); });
  it("shows current persisted presence, rejects foreign roles and expires after the window", async () => {
    if (!pool) throw new Error("PG required");
    const { roundId, applicationId } = await fixture();
    await pool.query(
      "INSERT INTO placement_round_attendance(round_id,application_id,status,marked_by_user_id,marked_at) VALUES($1,$2,'PRESENT',$3,now())",
      [roundId, applicationId, SEED_IDS.facultyUser]);
    const current = await getTpoLiveDriveDaySummary(tpo);
    const live = current.rows.find((row) => row.id === roundId);
    expect(live).toBeDefined();
    expect(live?.counts.checkedIn).toBe(1);
    expect(live?.counts.noShow).toBe(0);
    const foreign: RequestContext = { ...tpo, membership: {
      ...tpo.membership!, id: SEED_IDS.facultyCollegeBMembership, collegeId: SEED_IDS.collegeB } };
    expect((await getTpoLiveDriveDaySummary(foreign)).rows.some((row) => row.id === roundId)).toBe(false);
    const wrong: RequestContext = { ...tpo, membership: { ...tpo.membership!, roles: ["LEARNER"] } };
    await expect(getTpoLiveDriveDaySummary(wrong)).rejects.toBeInstanceOf(AuthorizationError);
    expect((await getTpoLiveDriveDaySummary(tpo, new Date(Date.now() + 90 * 60_000)))
      .rows.some((row) => row.id === roundId)).toBe(false);
  });
});
