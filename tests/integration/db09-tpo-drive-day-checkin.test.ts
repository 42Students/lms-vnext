import { randomUUID } from "node:crypto";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { confirmTpoDriveDayCheckIn, TpoAttendanceStaleError } from "@/modules/placements/tpo-drive-day-checkin-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = process.env.DB09_ISOLATED_TEST_DATABASE === "1" && Boolean(process.env.TEST_DATABASE_URL);
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 }) : null;
const ids: { company?: string; relationship?: string; job?: string; role?: string; round?: string; application?: string } = {};
const tpo: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "db09-tpo-checkin", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.facultyCollegeAMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["TPO"] },
};
async function fixture() {
  if (!pool) throw new Error("Disposable PostgreSQL required");
  const token = randomUUID();
  const company = (await pool.query<{ id: string }>(
    "INSERT INTO placement_companies (name,created_by_user_id) VALUES ($1,$2) RETURNING id",
    ["TPO checkin " + token, SEED_IDS.facultyUser],
  )).rows[0];
  if (!company) throw new Error("Company fixture failed");
  ids.company = company.id;
  const rel = (await pool.query<{ id: string }>(
    "INSERT INTO placement_company_relationships (college_id,company_id,created_by_user_id) VALUES ($1,$2,$3) RETURNING id",
    [SEED_IDS.collegeA, company.id, SEED_IDS.facultyUser],
  )).rows[0];
  if (!rel) throw new Error("Relationship fixture failed");
  ids.relationship = rel.id;
  const job = (await pool.query<{ id: string }>(
    "INSERT INTO placement_jobs " +
    "(college_id,season_id,company_relationship_id,title,description,employment_type,work_mode," +
    "application_mode,status,published_at,created_by_user_id) " +
    "VALUES ($1,$2,$3,$4,$5,'FULL_TIME','ONSITE','INTERNAL','PUBLISHED',now(),$6) RETURNING id",
    [SEED_IDS.collegeA, SEED_IDS.placementSeasonA, rel.id, "TPO checkin " + token,
      "Drive Day check-in fixture", SEED_IDS.facultyUser],
  )).rows[0];
  if (!job) throw new Error("Job fixture failed");
  ids.job = job.id;
  const role = (await pool.query<{ id: string }>(
    "INSERT INTO placement_job_role_options (job_id,title,employment_type,work_mode,is_primary) " +
    "VALUES ($1,'Primary','FULL_TIME','ONSITE',true) RETURNING id", [job.id],
  )).rows[0];
  if (!role) throw new Error("Role fixture failed");
  ids.role = role.id;
  const round = (await pool.query<{ id: string }>(
    "INSERT INTO placement_job_rounds " +
    "(job_id,sequence,kind,name,created_by_user_id,status,scheduled_at,timezone,mode,venue) " +
    "VALUES ($1,1,'INTERVIEW','Interview',$2,'SCHEDULED',now(),'Asia/Kolkata','ON_CAMPUS','Hall 1') RETURNING id",
    [job.id, SEED_IDS.facultyUser],
  )).rows[0];
  if (!round) throw new Error("Round fixture failed");
  ids.round = round.id;
  const app = (await pool.query<{ id: string }>(
    "INSERT INTO placement_applications " +
    "(job_id,role_option_id,membership_id,channel,eligibility_status,eligibility_snapshot,submitted_by_user_id) " +
    "VALUES ($1,$2,$3,'INTERNAL','ELIGIBLE','{}'::jsonb,$4) RETURNING id",
    [job.id, role.id, SEED_IDS.learnerCollegeAMembership, SEED_IDS.learnerUser],
  )).rows[0];
  if (!app) throw new Error("Application fixture failed");
  ids.application = app.id;
  await pool.query(
    "INSERT INTO placement_application_screenings " +
    "(application_id,status,decided_by_user_id,decided_at) VALUES ($1,'SHORTLISTED',$2,now())",
    [app.id, SEED_IDS.facultyUser],
  );
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
  for (const key of Object.keys(ids)) delete ids[key as keyof typeof ids];
  // Immutable activity_events are preserved, never deleted.
}
afterEach(cleanup);
afterAll(async () => { await cleanup(); await pool?.end(); await closeDatabaseConnection(); });
describe.skipIf(!enabled)("DB09 TPO Drive Day check-in PostgreSQL", () => {
  it("records a check-in and one immutable audit; idempotent repeat, stale reversal denied", async () => {
    if (!pool) throw new Error("DB required");
    const { roundId, applicationId } = await fixture();
    const payload = { confirmed: true, applicationId, expectedAttendance: "WAITING", status: "PRESENT" };
    const first = await confirmTpoDriveDayCheckIn(tpo, roundId, payload);
    expect(first.changed).toBe(true);
    const same = await confirmTpoDriveDayCheckIn(tpo, roundId,
      { ...payload, expectedAttendance: "PRESENT" });
    expect(same.changed).toBe(false);
    await expect(confirmTpoDriveDayCheckIn(tpo, roundId, payload))
      .rejects.toBeInstanceOf(TpoAttendanceStaleError);
    const audited = (await pool.query<{ total: number }>(
      "SELECT count(*)::integer AS total FROM activity_events WHERE subject_id=$1 " +
      "AND event_type='PLACEMENTS_DRIVE_DAY_ATTENDANCE_CONFIRMED'", [first.attendance.id],
    )).rows[0];
    expect(audited?.total).toBe(1);
  });
  it("denies wrong role, foreign college, forged candidate and unconfirmed writes", async () => {
    const { roundId } = await fixture();
    const appId = ids.application;
    if (!appId) throw new Error("Missing application fixture");
    const input = { confirmed: true, applicationId: appId, expectedAttendance: "WAITING", status: "ABSENT" };
    const wrong: RequestContext = { ...tpo, membership: { ...tpo.membership!, roles: ["LEARNER"] } };
    const foreign: RequestContext = { ...tpo, membership: { ...tpo.membership!, collegeId: SEED_IDS.collegeB } };
    await expect(confirmTpoDriveDayCheckIn(wrong, roundId, input)).rejects.toBeInstanceOf(AuthorizationError);
    await expect(confirmTpoDriveDayCheckIn(foreign, roundId, input)).rejects.toBeDefined();
    await expect(confirmTpoDriveDayCheckIn(tpo, roundId, { ...input, applicationId: randomUUID() })).rejects.toBeDefined();
    await expect(confirmTpoDriveDayCheckIn(tpo, roundId, { ...input, confirmed: false })).rejects.toBeDefined();
  });
});
