import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  changeTpoDriveLifecycle, getTpoDriveLifecycleReadiness,
} from "@/modules/placements/tpo-drive-lifecycle-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = process.env.DB12_ISOLATED_TEST_DATABASE === "1" &&
  Boolean(process.env.TEST_DATABASE_URL);
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({
  connectionString: process.env.TEST_DATABASE_URL, max: 2,
}) : null;

const jobs: string[] = [];
const companies: string[] = [];
const relationships: string[] = [];
const tpo: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser, identityUid: "tpo-drive-lifecycle-test",
    platformStatus: "ACTIVE", systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeAMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["TPO"],
  },
};

async function createDrive() {
  if (!pool) throw new Error("Disposable PostgreSQL required");
  const name = "TPO lifecycle " + randomUUID();
  const [company] = (await pool.query<{id:string}>(
    "INSERT INTO placement_companies(name,created_by_user_id) VALUES($1,$2) RETURNING id",
    [name, SEED_IDS.facultyUser],
  )).rows;
  if (!company) throw new Error("No company created");
  companies.push(company.id);
  const [relationship] = (await pool.query<{id:string}>(
    "INSERT INTO placement_company_relationships(college_id,company_id,created_by_user_id) " +
    "VALUES($1,$2,$3) RETURNING id",
    [SEED_IDS.collegeA,company.id,SEED_IDS.facultyUser],
  )).rows;
  if (!relationship) throw new Error("No relationship created");
  relationships.push(relationship.id);
  const [job] = (await pool.query<{id:string}>(
    "INSERT INTO placement_jobs(college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,created_by_user_id) " +
    "VALUES($1,$2,$3,$4,'Test','FULL_TIME','HYBRID',$5) RETURNING id",
    [SEED_IDS.collegeA,SEED_IDS.placementSeasonA,relationship.id,name,SEED_IDS.facultyUser],
  )).rows;
  if (!job) throw new Error("No job created");
  jobs.push(job.id);
  await pool.query(
    "INSERT INTO placement_job_role_options(job_id,title,employment_type,work_mode,is_primary) " +
    "VALUES($1,'Engineer','FULL_TIME','HYBRID',true)",
    [job.id],
  );
  await pool.query(
    "INSERT INTO placement_job_rounds(job_id,sequence,kind,name,created_by_user_id) " +
    "VALUES($1,1,'INTERVIEW','Final', $2)",
    [job.id,SEED_IDS.facultyUser],
  );
  await pool.query(
    "INSERT INTO placement_job_eligibility_policies(job_id,updated_by_user_id) VALUES($1,$2)",
    [job.id,SEED_IDS.facultyUser],
  );
  return job.id;
}
async function cleanup() {
  if (!pool) return;
  for (const jobId of jobs) {
    await pool.query(
      "DELETE FROM in_app_notifications WHERE event_id IN " +
      "(SELECT id FROM activity_events WHERE subject_id=$1)", [jobId],
    );
    await pool.query("DELETE FROM activity_events WHERE subject_id=$1", [jobId]);
    await pool.query("DELETE FROM placement_job_eligibility_policies WHERE job_id=$1", [jobId]);
    await pool.query("DELETE FROM placement_job_rounds WHERE job_id=$1", [jobId]);
    await pool.query("DELETE FROM placement_job_role_options WHERE job_id=$1", [jobId]);
    await pool.query("DELETE FROM placement_jobs WHERE id=$1", [jobId]);
  }
  for (const id of relationships) {
    await pool.query("DELETE FROM placement_company_relationships WHERE id=$1", [id]);
  }
  for (const id of companies) {
    await pool.query("DELETE FROM placement_companies WHERE id=$1", [id]);
  }
  jobs.length = 0;
  relationships.length = 0;
  companies.length = 0;
}
describe.skipIf(!enabled)("TPO drive lifecycle on real disposable PostgreSQL", () => {
  afterEach(cleanup);
  afterAll(async () => { await cleanup(); await pool?.end(); await closeDatabaseConnection(); });
  it("publishes, closes and reopens, preserving distinct audit rows", async () => {
    if (!pool) throw new Error("PG required");
    const jobId = await createDrive();
    expect((await getTpoDriveLifecycleReadiness(tpo, jobId)).publish.allowed).toBe(true);
    for (const [action, expectedStatus, newStatus] of [
      ["PUBLISH", "DRAFT", "PUBLISHED"],
      ["CLOSE", "PUBLISHED", "CLOSED"],
      ["REOPEN", "CLOSED", "PUBLISHED"],
    ] as const) {
      const result = await changeTpoDriveLifecycle(tpo, jobId, {
        action, expectedStatus, confirmed: true,
        reason: "Verified preparation and college operation approval",
      });
      expect(result.status).toBe(newStatus);
    }
    const events = await pool.query<{actor_user_id:string;event_type:string}>(
      "SELECT actor_user_id,event_type FROM activity_events WHERE subject_id=$1 ORDER BY occurred_at",
      [jobId],
    );
    expect(events.rows).toHaveLength(3);
    expect(events.rows.every((event) => event.actor_user_id === SEED_IDS.facultyUser)).toBe(true);
  });
  it("denies stale, foreign college and wrong-role writes", async () => {
    if (!pool) throw new Error("PG required");
    const jobId = await createDrive();
    const payload = {
      action: "PUBLISH", expectedStatus: "DRAFT", confirmed: true,
      reason: "Verified preparation and college operation approval",
    };
    await expect(changeTpoDriveLifecycle({
      ...tpo, membership: { ...tpo.membership!, roles: ["COLLEGE_ADMIN"] },
    }, jobId, payload)).rejects.toBeInstanceOf(AuthorizationError);
    await expect(changeTpoDriveLifecycle({
      ...tpo, membership: { ...tpo.membership!, collegeId: SEED_IDS.collegeB },
    }, jobId, payload)).rejects.toMatchObject({ code: "PLACEMENT_JOB_NOT_FOUND" });
    await changeTpoDriveLifecycle(tpo, jobId, payload);
    await expect(changeTpoDriveLifecycle(tpo, jobId, payload)).rejects.toBeDefined();
    const state = await pool.query<{status:string}>(
      "SELECT status FROM placement_jobs WHERE id=$1", [jobId],
    );
    expect(state.rows[0]?.status).toBe("PUBLISHED");
  });
});
