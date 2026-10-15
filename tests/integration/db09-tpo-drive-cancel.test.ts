import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  cancelTpoDriveWithPreview,
  getTpoDriveCancelPreview,
} from "@/modules/placements/tpo-drive-cancel-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = process.env.DB09_ISOLATED_TEST_DATABASE === "1" && Boolean(process.env.TEST_DATABASE_URL);
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 }) : null;
const tpo: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "tpo-cancel", platformStatus: "ACTIVE", systemRoles: [] },
  membership: {
    id: SEED_IDS.facultyCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["TPO"],
  },
};
type Ids = { company?: string; relationship?: string; job?: string; role?: string; application?: string; round?: string; offer?: string };
const ids: Ids = {};
const roleIds: string[] = [];

async function one(sql: string, params: unknown[]) {
  if (!pool) throw Error("PG required");
  return (await pool.query<{ id: string }>(sql, params)).rows[0]!.id;
}

async function fixture(acceptOffer: boolean) {
  const name = "Cancel " + randomUUID();
  ids.company = await one("INSERT INTO placement_companies(name,created_by_user_id) VALUES($1,$2) RETURNING id", [name, SEED_IDS.facultyUser]);
  ids.relationship = await one("INSERT INTO placement_company_relationships(college_id,company_id,created_by_user_id) VALUES($1,$2,$3) RETURNING id", [SEED_IDS.collegeA, ids.company, SEED_IDS.facultyUser]);
  ids.job = await one(
    "INSERT INTO placement_jobs(college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,application_mode,status,published_at,created_by_user_id) VALUES($1,$2,$3,$4,'Cancel fixture','FULL_TIME','ONSITE','INTERNAL','PUBLISHED',now(),$5) RETURNING id",
    [SEED_IDS.collegeA, SEED_IDS.placementSeasonA, ids.relationship, name, SEED_IDS.facultyUser],
  );
  ids.role = await one("INSERT INTO placement_job_role_options(job_id,title,employment_type,work_mode,is_primary) VALUES($1,'Main','FULL_TIME','ONSITE',true) RETURNING id", [ids.job]);
  ids.application = await one(
    "INSERT INTO placement_applications(job_id,role_option_id,membership_id,channel,eligibility_status,eligibility_snapshot,submitted_by_user_id) VALUES($1,$2,$3,'INTERNAL','ELIGIBLE','{}'::jsonb,$4) RETURNING id",
    [ids.job, ids.role, SEED_IDS.learnerCollegeAMembership, SEED_IDS.learnerUser],
  );
  ids.round = await one("INSERT INTO placement_job_rounds(job_id,sequence,kind,name,created_by_user_id,status) VALUES($1,1,'INTERVIEW','Panel',$2,'PENDING') RETURNING id", [ids.job, SEED_IDS.facultyUser]);
  ids.offer = acceptOffer
    ? await one(
        "INSERT INTO placement_offers(application_id,version,status,role_title,issued_by_user_id,issued_at,expires_at,responded_at,responded_by_user_id) VALUES($1,1,'ACCEPTED','Main',$2,now()-interval '1 day',now()+interval '2 days',now(),$3) RETURNING id",
        [ids.application, SEED_IDS.facultyUser, SEED_IDS.learnerUser],
      )
    : await one(
        "INSERT INTO placement_offers(application_id,version,status,role_title,issued_by_user_id,issued_at,expires_at) VALUES($1,1,'ISSUED','Main',$2,now()-interval '1 day',now()+interval '2 days') RETURNING id",
        [ids.application, SEED_IDS.facultyUser],
      );
  await pool!.query("UPDATE placement_jobs SET updated_at=date_trunc('milliseconds',updated_at)+interval '321 microseconds' WHERE id=$1", [ids.job]);
  return ids.job;
}

async function cleanup() {
  if (!pool) return;
  if (ids.round) await pool.query("DELETE FROM placement_job_round_events WHERE round_id=$1", [ids.round]);
  if (ids.offer) await pool.query("DELETE FROM placement_offers WHERE id=$1", [ids.offer]);
  if (ids.round) await pool.query("DELETE FROM placement_job_rounds WHERE id=$1", [ids.round]);
  if (ids.application) await pool.query("DELETE FROM placement_applications WHERE id=$1", [ids.application]);
  if (ids.role) await pool.query("DELETE FROM placement_job_role_options WHERE id=$1", [ids.role]);
  if (ids.job) await pool.query("DELETE FROM placement_jobs WHERE id=$1", [ids.job]);
  if (ids.relationship) await pool.query("DELETE FROM placement_company_relationships WHERE id=$1", [ids.relationship]);
  if (ids.company) await pool.query("DELETE FROM placement_companies WHERE id=$1", [ids.company]);
  for (const key of Object.keys(ids) as (keyof Ids)[]) delete ids[key];
}

describe.skipIf(!enabled)("TPO drive cancellation isolated PostgreSQL", () => {
  beforeAll(async () => {
    if (!pool) throw Error("PG required");
    for (const id of [SEED_IDS.facultyCollegeAMembership, SEED_IDS.facultyCollegeBMembership]) {
      const r = await pool.query<{ id: string }>("INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING RETURNING id", [id]);
      if (r.rows[0]?.id) roleIds.push(r.rows[0].id);
    }
  });
  afterAll(async () => {
    await cleanup();
    if (pool) {
      for (const id of roleIds) await pool.query("DELETE FROM membership_roles WHERE id=$1", [id]);
      await pool.end();
    }
    await closeDatabaseConnection();
  });

  it("previews impact, denies foreign/wrong-role/stale writes, then cancels rounds and audits", async () => {
    if (!pool) throw Error("PG required");
    const jobId = await fixture(false);
    const snapshot = await getTpoDriveCancelPreview(tpo, jobId);
    expect(snapshot.impact).toEqual({ submittedApplications: 1, openRounds: 1, issuedOffers: 1, acceptedOffers: 0 });
    expect(snapshot.cancellable).toBe(true);
    const write = {
      action: "CANCEL",
      confirmed: true,
      expectedUpdatedAt: snapshot.expectedUpdatedAt,
      expectedImpact: snapshot.impact,
      reason: "Company withdrew the opening",
    };
    const foreign: RequestContext = { ...tpo, membership: { ...tpo.membership!, id: SEED_IDS.facultyCollegeBMembership, collegeId: SEED_IDS.collegeB } };
    await expect(getTpoDriveCancelPreview(foreign, jobId)).rejects.toMatchObject({ code: "PLACEMENT_JOB_NOT_FOUND" });
    await expect(cancelTpoDriveWithPreview(foreign, jobId, write)).rejects.toMatchObject({ code: "PLACEMENT_JOB_NOT_FOUND" });
    const wrong: RequestContext = { ...tpo, membership: { ...tpo.membership!, roles: ["LEARNER"] } };
    await expect(cancelTpoDriveWithPreview(wrong, jobId, write)).rejects.toBeInstanceOf(AuthorizationError);
    await expect(cancelTpoDriveWithPreview(tpo, jobId, { ...write, expectedImpact: { ...snapshot.impact, openRounds: 0 } })).rejects.toMatchObject({ code: "PLACEMENT_JOB_PREVIEW_STALE" });
    await expect(cancelTpoDriveWithPreview(tpo, jobId, { ...write, expectedUpdatedAt: "2020-01-01T00:00:00.000Z" })).rejects.toMatchObject({ code: "PLACEMENT_JOB_STALE" });
    const saved = await cancelTpoDriveWithPreview(tpo, jobId, write);
    expect(saved.status).toBe("CLOSED");
    expect(saved.roundsCancelled).toBe(1);
    const round = await pool.query<{ status: string }>("SELECT status FROM placement_job_rounds WHERE id=$1", [ids.round]);
    expect(round.rows[0]?.status).toBe("CANCELLED");
    const offer = await pool.query<{ status: string }>("SELECT status FROM placement_offers WHERE id=$1", [ids.offer]);
    expect(offer.rows[0]?.status).toBe("ISSUED");
    await expect(cancelTpoDriveWithPreview(tpo, jobId, write)).rejects.toMatchObject({ code: "PLACEMENT_JOB_STALE" });
    const audit = await pool.query<{ count: number }>("SELECT count(*)::int AS count FROM activity_events WHERE subject_id=$1 AND event_type='PLACEMENTS_TPO_DRIVE_CANCELLED'", [jobId]);
    expect(audit.rows[0]?.count).toBe(1);
    await cleanup();
  });

  it("blocks cancellation while an accepted offer exists and changes nothing", async () => {
    if (!pool) throw Error("PG required");
    const jobId = await fixture(true);
    const snapshot = await getTpoDriveCancelPreview(tpo, jobId);
    expect(snapshot.blockedByAcceptedOffers).toBe(true);
    await expect(cancelTpoDriveWithPreview(tpo, jobId, {
      action: "CANCEL",
      confirmed: true,
      expectedUpdatedAt: snapshot.expectedUpdatedAt,
      expectedImpact: snapshot.impact,
      reason: "Attempt with accepted offer",
    })).rejects.toMatchObject({ code: "PLACEMENT_JOB_CANCEL_BLOCKED" });
    const job = await pool.query<{ status: string }>("SELECT status FROM placement_jobs WHERE id=$1", [jobId]);
    expect(job.rows[0]?.status).toBe("PUBLISHED");
    await cleanup();
  });
});
