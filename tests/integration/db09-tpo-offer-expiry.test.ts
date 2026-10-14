import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getTpoOfferExpiryWatchlist } from "@/modules/placements/tpo-offer-expiry-service";
import { isoDateInIndia, plusCalendarDays } from "@/modules/placements/tpo-offer-expiry-model";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
const enabled = process.env.DB09_ISOLATED_TEST_DATABASE === "1" && Boolean(process.env.TEST_DATABASE_URL);
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 }) : null;
const tpo: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "tpo-expiry-watch",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.facultyCollegeAMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["TPO"] },
};
const roleIds: string[] = [];
const ids: { company?: string; relationship?: string; job?: string; role?: string; application?: string; offer?: string } = {};
async function fixture() {
  if (!pool) throw new Error("Disposable PostgreSQL required");
  const token = randomUUID();
  const company = (await pool.query<{ id: string }>(
    "INSERT INTO placement_companies(name,created_by_user_id) VALUES($1,$2) RETURNING id",
    ["Expiry " + token, SEED_IDS.facultyUser])).rows[0]!;
  ids.company = company.id;
  const relation = (await pool.query<{ id: string }>(
    "INSERT INTO placement_company_relationships(college_id,company_id,created_by_user_id) VALUES($1,$2,$3) RETURNING id",
    [SEED_IDS.collegeA, company.id, SEED_IDS.facultyUser])).rows[0]!;
  ids.relationship = relation.id;
  const job = (await pool.query<{ id: string }>(
    "INSERT INTO placement_jobs(college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,application_mode,status,published_at,created_by_user_id) " +
    "VALUES($1,$2,$3,$4,$5,'FULL_TIME','ONSITE','INTERNAL','PUBLISHED',now(),$6) RETURNING id",
    [SEED_IDS.collegeA, SEED_IDS.placementSeasonA, relation.id, "Expiring " + token,
      "Expiry watch fixture", SEED_IDS.facultyUser])).rows[0]!;
  ids.job = job.id;
  const role = (await pool.query<{ id: string }>(
    "INSERT INTO placement_job_role_options(job_id,title,employment_type,work_mode,is_primary) " +
    "VALUES($1,'Main','FULL_TIME','ONSITE',true) RETURNING id", [job.id])).rows[0]!;
  ids.role = role.id;
  const app = (await pool.query<{ id: string }>(
    "INSERT INTO placement_applications(job_id,role_option_id,membership_id,channel,eligibility_status,eligibility_snapshot,submitted_by_user_id) " +
    "VALUES($1,$2,$3,'INTERNAL','ELIGIBLE','{}'::jsonb,$4) RETURNING id",
    [job.id, role.id, SEED_IDS.learnerCollegeAMembership, SEED_IDS.learnerUser])).rows[0]!;
  ids.application = app.id;
  const day = plusCalendarDays(isoDateInIndia(new Date()), 3);
  const expiration = day + "T12:00:00+05:30";
  const offer = (await pool.query<{ id: string }>(
    "INSERT INTO placement_offers(application_id,version,status,role_title,issued_by_user_id,expires_at) " +
    "VALUES($1,1,'ISSUED','Main',$2,$3::timestamptz) RETURNING id",
    [app.id, SEED_IDS.facultyUser, expiration])).rows[0]!;
  ids.offer = offer.id;
  return { offerId: offer.id, expiryDay: day };
}
async function cleanup() {
  if (!pool) return;
  if (ids.offer) await pool.query("DELETE FROM placement_offers WHERE id=$1", [ids.offer]);
  if (ids.application) await pool.query("DELETE FROM placement_applications WHERE id=$1", [ids.application]);
  if (ids.role) await pool.query("DELETE FROM placement_job_role_options WHERE id=$1", [ids.role]);
  if (ids.job) await pool.query("DELETE FROM placement_jobs WHERE id=$1", [ids.job]);
  if (ids.relationship) await pool.query("DELETE FROM placement_company_relationships WHERE id=$1", [ids.relationship]);
  if (ids.company) await pool.query("DELETE FROM placement_companies WHERE id=$1", [ids.company]);
}
describe.skipIf(!enabled)("TPO offer expiry watchlist PostgreSQL", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("Pool required");
    for (const id of [SEED_IDS.facultyCollegeAMembership, SEED_IDS.facultyCollegeBMembership]) {
      const row = (await pool.query<{ id: string }>(
        "INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING RETURNING id", [id])).rows[0];
      if (row?.id) roleIds.push(row.id);
    }
  });
  afterAll(async () => {
    await cleanup();
    for (const id of roleIds) await pool?.query("DELETE FROM membership_roles WHERE id=$1", [id]);
    await pool?.end();
    await closeDatabaseConnection();
  });
  it("shows issued expiring offers, excludes accepted state and denies foreign and wrong role", async () => {
    if (!pool) throw new Error("Pool required");
    const { offerId, expiryDay } = await fixture();
    const result = await getTpoOfferExpiryWatchlist(tpo, { days: "7" });
    expect(result.rows.find((row) => row.offerId === offerId)?.expiryDayIst).toBe(expiryDay);
    expect((await getTpoOfferExpiryWatchlist(tpo, { days: 1 }))
      .rows.some((row) => row.offerId === offerId)).toBe(false);
    const foreign: RequestContext = { ...tpo, membership: { ...tpo.membership!,
      id: SEED_IDS.facultyCollegeBMembership, collegeId: SEED_IDS.collegeB } };
    expect((await getTpoOfferExpiryWatchlist(foreign, { days: 7 }))
      .rows.some((row) => row.offerId === offerId)).toBe(false);
    const wrong: RequestContext = { ...tpo, membership: { ...tpo.membership!, roles: ["LEARNER"] } };
    await expect(getTpoOfferExpiryWatchlist(wrong, { days: 7 })).rejects.toBeInstanceOf(AuthorizationError);
    await pool.query(
      "UPDATE placement_offers SET status='ACCEPTED',responded_by_user_id=$2,responded_at=now() WHERE id=$1",
      [offerId, SEED_IDS.facultyUser]);
    expect((await getTpoOfferExpiryWatchlist(tpo, { days: 7 }))
      .rows.some((row) => row.offerId === offerId)).toBe(false);
  });
});
