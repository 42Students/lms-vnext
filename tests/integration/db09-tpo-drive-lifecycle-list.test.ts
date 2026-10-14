import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getTpoDriveLifecycleList } from "@/modules/placements/tpo-drive-lifecycle-list-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
const enabled = process.env.DB09_ISOLATED_TEST_DATABASE === "1" && Boolean(process.env.TEST_DATABASE_URL);
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 }) : null;
const tpo: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "tpo-drive-lifecycle-list", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.facultyCollegeAMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["TPO"] },
};
const addedTpoRoleIds:string[]=[];
const ids: { company?: string; relationship?: string; job?: string } = {};
async function fixture() {
  if (!pool) throw new Error("Isolated PostgreSQL required");
  const token = randomUUID();
  const company = (await pool.query<{ id: string }>(
    "INSERT INTO placement_companies(name,created_by_user_id) VALUES($1,$2) RETURNING id",
    ["Lifecycle list " + token, SEED_IDS.facultyUser])).rows[0]!;
  ids.company = company.id;
  const rel = (await pool.query<{ id: string }>(
    "INSERT INTO placement_company_relationships(college_id,company_id,created_by_user_id) VALUES($1,$2,$3) RETURNING id",
    [SEED_IDS.collegeA, company.id, SEED_IDS.facultyUser])).rows[0]!;
  ids.relationship = rel.id;
  const job = (await pool.query<{ id: string }>(
    "INSERT INTO placement_jobs(college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,application_mode,status,created_by_user_id) " +
    "VALUES($1,$2,$3,$4,$5,'FULL_TIME','ONSITE','INTERNAL','DRAFT',$6) RETURNING id",
    [SEED_IDS.collegeA, SEED_IDS.placementSeasonA, rel.id, "Lifecycle " + token,
      "Lifecycle fixture", SEED_IDS.facultyUser])).rows[0]!;
  ids.job = job.id;
  return job.id;
}
async function cleanup() {
  if (!pool) return;
  if (ids.job) await pool.query("DELETE FROM placement_jobs WHERE id=$1", [ids.job]);
  if (ids.relationship) await pool.query("DELETE FROM placement_company_relationships WHERE id=$1", [ids.relationship]);
  if (ids.company) await pool.query("DELETE FROM placement_companies WHERE id=$1", [ids.company]);
}
describe.skipIf(!enabled)("TPO drive lifecycle listing on disposable PostgreSQL", () => {
  beforeAll(async()=>{
 if(!pool)throw Error("Isolated PostgreSQL required");
 for(const membershipId of [SEED_IDS.facultyCollegeAMembership,SEED_IDS.facultyCollegeBMembership]){
  const inserted=await pool.query<{id:string}>(
   "INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING RETURNING id",
   [membershipId]);
  if(inserted.rows[0]?.id)addedTpoRoleIds.push(inserted.rows[0].id);
 }
});
afterAll(async()=>{
 await cleanup();
 if(pool)for(const id of addedTpoRoleIds)
  await pool.query("DELETE FROM membership_roles WHERE id=$1",[id]);
 await pool?.end();
 await closeDatabaseConnection();
});
it("lists a real draft and fences off foreign colleges and wrong roles", async () => {
    const id = await fixture();
    const own = await getTpoDriveLifecycleList(tpo, { seasonId: SEED_IDS.placementSeasonA, view: "DRAFT" });
    expect(own.rows.some((row) => row.id === id)).toBe(true);
    const foreign: RequestContext = { ...tpo, membership: { ...tpo.membership!,
      id: SEED_IDS.facultyCollegeBMembership, collegeId: SEED_IDS.collegeB } };
    await expect(getTpoDriveLifecycleList(foreign, { seasonId: SEED_IDS.placementSeasonA }))
      .rejects.toMatchObject({ code: "PLACEMENT_SEASON_NOT_FOUND" });
    const wrong: RequestContext = { ...tpo, membership: { ...tpo.membership!, roles: ["LEARNER"] } };
    await expect(getTpoDriveLifecycleList(wrong, {})).rejects.toBeInstanceOf(AuthorizationError);
  });
});
