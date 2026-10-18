import { randomUUID } from "node:crypto";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { changeTpoRecruiterGrant, TpoRecruiterGrantConflict } from "@/modules/placements/tpo-recruiter-grant-write-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = process.env.DB09_ISOLATED_TEST_DATABASE === "1" && Boolean(process.env.TEST_DATABASE_URL);
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 }) : null;
const fixtureRows = { users: [] as string[], companies: [] as string[], relationships: [] as string[] };
const tpo: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "db09-tpo-recruiter-grants", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.facultyCollegeAMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["TPO"] },
};
async function fixture(collegeId: string = SEED_IDS.collegeA) {
  if (!pool) throw new Error("DB required");
  const token = randomUUID();
  const user = (await pool.query<{ id: string }>(
    "INSERT INTO users (identity_uid,email,display_name) VALUES ($1,$2,$3) RETURNING id",
    ["tpo-grant-" + token, "tpo-grant-" + token + "@example.test", "Recruiter " + token],
  )).rows[0];
  const company = (await pool.query<{ id: string }>(
    "INSERT INTO placement_companies (name, created_by_user_id) VALUES ($1,$2) RETURNING id",
    ["TPO grant " + token, SEED_IDS.facultyUser],
  )).rows[0];
  // T-S1-01: grants take their validity from the college setting; ensure the row exists.
  await pool.query("INSERT INTO placement_tpo_college_settings (college_id) VALUES ($1) ON CONFLICT (college_id) DO NOTHING", [collegeId]);
  if (!user || !company) throw new Error("Fixture failed");
  fixtureRows.users.push(user.id);
  fixtureRows.companies.push(company.id);
  const rel = (await pool.query<{ id: string }>(
    "INSERT INTO placement_company_relationships (college_id, company_id, created_by_user_id) " +
    "VALUES ($1,$2,$3) RETURNING id",
    [collegeId, company.id, SEED_IDS.facultyUser],
  )).rows[0];
  if (!rel) throw new Error("Relationship fixture failed");
  fixtureRows.relationships.push(rel.id);
  return { userId: user.id, email: "tpo-grant-" + token + "@example.test", relationshipId: rel.id };
}
async function cleanup() {
  if (!pool) return;
  await pool.query("DELETE FROM placement_recruiter_college_grants WHERE company_relationship_id = ANY($1::uuid[])", [fixtureRows.relationships]);
  await pool.query("DELETE FROM placement_recruiter_profiles WHERE user_id = ANY($1::uuid[])", [fixtureRows.users]);
  await pool.query("DELETE FROM placement_company_relationships WHERE id = ANY($1::uuid[])", [fixtureRows.relationships]);
  await pool.query("DELETE FROM placement_companies WHERE id = ANY($1::uuid[])", [fixtureRows.companies]);
  await pool.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [fixtureRows.users]);
  fixtureRows.relationships.length = 0; fixtureRows.companies.length = 0; fixtureRows.users.length = 0;
  // Do NOT remove immutable activity_events rows; they remain for audit even in disposable DB.
}
afterEach(cleanup);
afterAll(async () => { await cleanup(); await pool?.end(); await closeDatabaseConnection(); });
describe.skipIf(!enabled)("DB09 TPO recruiter grants PostgreSQL", () => {
  it("creates one grant, preserves duplicate, revokes with actor audits and rejects stale", async () => {
    if (!pool) throw new Error("DB required");
    const created = await fixture();
    const payload = { action: "GRANT" as const, confirmed: true,
      companyRelationshipId: created.relationshipId, email: created.email };
    const granted = await changeTpoRecruiterGrant(tpo, payload);
    expect(granted.outcome).toBe("granted");
    const duplicate = await changeTpoRecruiterGrant(tpo, payload);
    expect(duplicate.outcome).toBe("already-active");
    const row = (await pool.query<{ updated_at: Date }>(
      "SELECT updated_at FROM placement_recruiter_college_grants WHERE id=$1", [granted.grantId],
    )).rows[0];
    if (!row) throw new Error("Grant not found");
    await expect(changeTpoRecruiterGrant(tpo, {
      action: "REVOKE", confirmed: true, grantId: granted.grantId,
      expectedUpdatedAt: new Date(0).toISOString(),
    })).rejects.toBeInstanceOf(TpoRecruiterGrantConflict);
    const removed = await changeTpoRecruiterGrant(tpo, {
      action: "REVOKE", confirmed: true, grantId: granted.grantId,
      expectedUpdatedAt: row.updated_at.toISOString(),
    });
    expect(removed.outcome).toBe("revoked");
    const audits = (await pool.query<{ total: number }>(
      "SELECT count(*)::integer AS total FROM activity_events " +
      "WHERE subject_id=$1 AND event_type IN ('PLACEMENTS_RECRUITER_ACCESS_GRANTED','PLACEMENTS_RECRUITER_ACCESS_REVOKED')",
      [granted.grantId],
    )).rows[0];
    expect(audits?.total).toBe(2);
  });
  it("T-S1-01 refuses duplicate grant reuse when the persisted grant expires, is unverified or lacks DRIVES", async () => {
    if (!pool) throw new Error("DB required");
    const created=await fixture();
    const request={action:"GRANT" as const,confirmed:true,
      companyRelationshipId:created.relationshipId,email:created.email};
    const initial=await changeTpoRecruiterGrant(tpo,request);
    expect(initial.outcome).toBe("granted");
    const grantId=initial.grantId;
    await pool.query("update placement_recruiter_college_grants set capabilities=ARRAY['MESSAGES']::text[] where id=$1",[grantId]);
    await expect(changeTpoRecruiterGrant(tpo,request))
      .rejects.toBeInstanceOf(TpoRecruiterGrantConflict);
    await pool.query("update placement_recruiter_college_grants set capabilities=ARRAY['DRIVES']::text[],verification_status='PENDING' where id=$1",[grantId]);
    await expect(changeTpoRecruiterGrant(tpo,request))
      .rejects.toBeInstanceOf(TpoRecruiterGrantConflict);
    await pool.query("update placement_recruiter_college_grants set verification_status='VERIFIED',valid_until=created_at+interval '1 millisecond' where id=$1",[grantId]);
    await expect(changeTpoRecruiterGrant(tpo,request))
      .rejects.toBeInstanceOf(TpoRecruiterGrantConflict);
  });
  it("TPO-settings-recruiter-grant-CAS-01 rejects a rapid stale extend retry and advances every revision", async () => {
    if (!pool) throw new Error("DB required");
    const created = await fixture();
    const granted = await changeTpoRecruiterGrant(tpo, {
      action:"GRANT",confirmed:true,
      companyRelationshipId:created.relationshipId,email:created.email,
    });
    const read = async () => {
      const row = (await pool.query<{updated_at:Date;valid_until:Date}>(`
        SELECT updated_at,valid_until
        FROM placement_recruiter_college_grants WHERE id=$1`,[granted.grantId])).rows[0];
      if (!row) throw new Error("Missing recruiter grant");
      return row;
    };
    const first = await read();
    const stale = {
      action:"EXTEND" as const,confirmed:true,grantId:granted.grantId,
      expectedUpdatedAt:first.updated_at.toISOString(),months:3 as const,
    };
    expect((await changeTpoRecruiterGrant(tpo,stale)).outcome).toBe("extended");
    const second = await read();
    expect(second.updated_at.getTime()).toBeGreaterThan(first.updated_at.getTime());
    expect(second.valid_until.getTime()).toBeGreaterThan(first.valid_until.getTime());
    await expect(changeTpoRecruiterGrant(tpo,stale))
      .rejects.toBeInstanceOf(TpoRecruiterGrantConflict);
    const thirdResult = await changeTpoRecruiterGrant(tpo,{
      ...stale,expectedUpdatedAt:second.updated_at.toISOString(),months:6,
    });
    expect(thirdResult.outcome).toBe("extended");
    const third = await read();
    expect(third.updated_at.getTime()).toBeGreaterThan(second.updated_at.getTime());
    expect(third.valid_until.getTime()).toBeGreaterThan(second.valid_until.getTime());
    const revoked = await changeTpoRecruiterGrant(tpo,{
      action:"REVOKE",confirmed:true,grantId:granted.grantId,
      expectedUpdatedAt:third.updated_at.toISOString(),
    });
    expect(revoked.outcome).toBe("revoked");
    const fourth = await read();
    expect(fourth.updated_at.getTime()).toBeGreaterThan(third.updated_at.getTime());
    await expect(changeTpoRecruiterGrant(tpo,{
      action:"REVOKE",confirmed:true,grantId:granted.grantId,
      expectedUpdatedAt:third.updated_at.toISOString(),
    })).rejects.toBeInstanceOf(TpoRecruiterGrantConflict);
    const event = (await pool.query<{total:number}>(`
      SELECT count(*)::integer AS total FROM activity_events
      WHERE subject_id=$1 AND event_type IN
        ('PLACEMENTS_RECRUITER_ACCESS_GRANTED','PLACEMENTS_RECRUITER_ACCESS_EXTENDED','PLACEMENTS_RECRUITER_ACCESS_REVOKED')`,
      [granted.grantId])).rows[0];
    expect(event?.total).toBe(4);
  });
  it("rejects wrong role and foreign relationship before any grants", async () => {
    if (!pool) throw new Error("DB required");
    const local = await fixture();
    const foreign = await fixture(SEED_IDS.collegeB);
    const wrong: RequestContext = { ...tpo, membership: { ...tpo.membership!, roles: ["LEARNER"] } };
    const grant = (relationshipId: string, email: string) => ({
      action: "GRANT", confirmed: true, companyRelationshipId: relationshipId, email,
    });
    await expect(changeTpoRecruiterGrant(wrong, grant(local.relationshipId, local.email)))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(changeTpoRecruiterGrant(tpo, grant(foreign.relationshipId, foreign.email)))
      .rejects.toBeInstanceOf(TpoRecruiterGrantConflict);
    const count = (await pool.query<{ total: number }>(
      "SELECT count(*)::integer AS total FROM placement_recruiter_college_grants WHERE company_relationship_id = ANY($1::uuid[])",
      [[local.relationshipId, foreign.relationshipId]],
    )).rows[0];
    expect(count?.total).toBe(0);
  });
});
