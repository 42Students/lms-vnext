import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { recordTpoOfferLifecycle } from "@/modules/placements/tpo-offer-lifecycle-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = process.env.DB12_ISOLATED_TEST_DATABASE === "1" &&
  Boolean(process.env.TEST_DATABASE_URL);
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled
  ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 })
  : null;
const offers: string[] = [];
const applications: string[] = [];
const roleOptions: string[] = [];
const jobs: string[] = [];
const relationships: string[] = [];
const companies: string[] = [];
const tpo: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser, identityUid: "tpo-offer-lifecycle-test",
    platformStatus: "ACTIVE", systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeAMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["TPO"],
  },
};
async function fixture(collegeId = SEED_IDS.collegeA) {
  if (!pool) throw new Error("Disposable PG required");
  const token = randomUUID();
  const [company] = (await pool.query<{id:string}>(
    "INSERT INTO placement_companies(name,created_by_user_id) VALUES ($1,$2) RETURNING id",
    ["TPO offer lifecycle " + token, SEED_IDS.facultyUser],
  )).rows;
  if (!company) throw new Error("No company");
  companies.push(company.id);
  const [relationship] = (await pool.query<{id:string}>(
    "INSERT INTO placement_company_relationships(college_id,company_id,created_by_user_id) VALUES ($1,$2,$3) RETURNING id",
    [collegeId, company.id, SEED_IDS.facultyUser],
  )).rows;
  if (!relationship) throw new Error("No relationship");
  relationships.push(relationship.id);
  const [job] = (await pool.query<{id:string}>(
    "INSERT INTO placement_jobs(college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,created_by_user_id) " +
    "VALUES($1,$2,$3,$4,'Test', 'FULL_TIME','HYBRID',$5) RETURNING id",
    [collegeId, collegeId === SEED_IDS.collegeA ? SEED_IDS.placementSeasonA :
      SEED_IDS.placementSeasonB, relationship.id, "TPO role " + token, SEED_IDS.facultyUser],
  )).rows;
  if (!job) throw new Error("No job");
  jobs.push(job.id);
  const rows: string[] = [];
  for (let i = 0; i < 2; i++) {
    const [role] = (await pool.query<{id:string}>(
      "INSERT INTO placement_job_role_options(job_id,title,employment_type,work_mode,is_primary) " +
      "VALUES ($1,$2,'FULL_TIME','HYBRID',$3) RETURNING id",
      [job.id, "Role " + i, i === 0],
    )).rows;
    if (!role) throw new Error("No role");
    roleOptions.push(role.id);
    const [app] = (await pool.query<{id:string}>(
      "INSERT INTO placement_applications(job_id,role_option_id,membership_id,channel,status,eligibility_status,eligibility_snapshot,submitted_by_user_id) " +
      "VALUES ($1,$2,$3,'INTERNAL','SUBMITTED','ELIGIBLE','{}'::jsonb,$4) RETURNING id",
      [job.id, role.id, SEED_IDS.learnerCollegeAMembership, SEED_IDS.learnerUser],
    )).rows;
    if (!app) throw new Error("No application");
    applications.push(app.id);
    const [offer] = (await pool.query<{id:string}>(
      "INSERT INTO placement_offers(application_id,version,status,role_title,issued_by_user_id) " +
      "VALUES ($1,1,'ISSUED',$2,$3) RETURNING id",
      [app.id, "Backend " + i, SEED_IDS.facultyUser],
    )).rows;
    if (!offer) throw new Error("No offer");
    offers.push(offer.id);
    rows.push(offer.id);
  }
  return { jobId: job.id, offerIds: rows };
}
async function cleanup() {
  if (!pool) return;
  if (offers.length) {
    await pool.query("DELETE FROM in_app_notifications WHERE event_id IN (SELECT id FROM activity_events WHERE subject_id = ANY($1::uuid[]))", [offers]);
    await pool.query("DELETE FROM activity_events WHERE subject_id = ANY($1::uuid[])", [offers]);
    for (const table of ["placement_joining_history", "placement_joining_outcomes", "placement_offer_status_history"]) {
      await pool.query("DELETE FROM " + table + " WHERE offer_id = ANY($1::uuid[])", [offers]);
    }
    await pool.query("DELETE FROM placement_offers WHERE id = ANY($1::uuid[])", [offers]);
  }
  if (applications.length) await pool.query("DELETE FROM placement_applications WHERE id = ANY($1::uuid[])", [applications]);
  if (roleOptions.length) await pool.query("DELETE FROM placement_job_role_options WHERE id = ANY($1::uuid[])", [roleOptions]);
  if (jobs.length) await pool.query("DELETE FROM placement_jobs WHERE id = ANY($1::uuid[])", [jobs]);
  if (relationships.length) await pool.query("DELETE FROM placement_company_relationships WHERE id = ANY($1::uuid[])", [relationships]);
  if (companies.length) await pool.query("DELETE FROM placement_companies WHERE id = ANY($1::uuid[])", [companies]);
  offers.length = applications.length = roleOptions.length = jobs.length =
    relationships.length = companies.length = 0;
}
describe.skipIf(!enabled)("TPO lifecycle writes on disposable PostgreSQL", () => {
  afterEach(cleanup);
  afterAll(async () => { await cleanup(); await pool?.end(); await closeDatabaseConnection(); });
  it("records an atomic evidence-backed accept, join and immutable actor history", async () => {
    if (!pool) throw new Error("PG required");
    const { jobId, offerIds } = await fixture();
    const accepted = await recordTpoOfferLifecycle(tpo, jobId, {
      confirmed: true, action: "RECORD_ACCEPTED", offerIds, expectedStatus: "ISSUED",
      reason: "Learners acknowledged acceptance through the college placement office",
    });
    expect(accepted.updated).toBe(2);
    const states = await pool.query("SELECT status FROM placement_offers WHERE id = ANY($1::uuid[])", [offerIds]);
    expect(states.rows.map((r) => r.status)).toEqual(["ACCEPTED", "ACCEPTED"]);
    await recordTpoOfferLifecycle(tpo, jobId, {
      confirmed: true, action: "RECORD_JOINED", offerIds: [offerIds[0]], expectedStatus: "ACCEPTED",
      reason: "Recruiter confirmed joining and official joining date",
      joiningDate: "2027-12-18",
    });
    const joined = await pool.query<{status:string; joining_date:string}>(
      "SELECT status, joining_date::text AS joining_date FROM placement_joining_outcomes WHERE offer_id=$1",
      [offerIds[0]],
    );
    expect(joined.rows[0]).toEqual({ status: "JOINED", joining_date: "2027-12-18" });
    const audit = await pool.query<{actor_user_id:string}>(
      "SELECT actor_user_id FROM placement_offer_status_history WHERE offer_id = ANY($1::uuid[]) AND to_status='ACCEPTED'",
      [offerIds],
    );
    expect(audit.rows).toHaveLength(2);
    expect(audit.rows.every((row) => row.actor_user_id === SEED_IDS.facultyUser)).toBe(true);
  });
  it("rejects stale status and rolls back the entire selection", async () => {
    if (!pool) throw new Error("PG required");
    const {jobId, offerIds} = await fixture();
    await expect(recordTpoOfferLifecycle(tpo, jobId, {
      confirmed: true, action: "RECORD_JOINED", offerIds, expectedStatus: "ACCEPTED",
      reason: "Confirmed by recruiter", joiningDate: "2027-12-18",
    })).rejects.toBeDefined();
    const rows = await pool.query("SELECT status FROM placement_offers WHERE id = ANY($1::uuid[])", [offerIds]);
    expect(rows.rows.every((row) => row.status === "ISSUED")).toBe(true);
  });
  it("denies a wrong role and cross-college job without mutation", async () => {
    const {jobId,offerIds} = await fixture();
    const payload = {
      confirmed: true, action: "WITHDRAW", offerIds, expectedStatus: "ISSUED",
      reason: "Employer cancelled all available vacancies",
    };
    await expect(recordTpoOfferLifecycle({
      ...tpo, membership: { ...tpo.membership!, roles: ["COLLEGE_ADMIN"] },
    }, jobId, payload)).rejects.toBeInstanceOf(AuthorizationError);
    await expect(recordTpoOfferLifecycle({
      ...tpo, membership: { ...tpo.membership!, collegeId: SEED_IDS.collegeB },
    }, jobId, payload)).rejects.toMatchObject({ code: "PLACEMENT_JOB_NOT_FOUND" });
  });
});
