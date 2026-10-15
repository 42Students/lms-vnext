import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  addRecruiterApplicantNote,
  addTpoApplicantNote,
  listRecruiterApplicantNotes,
  listTpoApplicantNotes,
} from "@/modules/placements/applicant-notes-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = process.env.DB09_ISOLATED_TEST_DATABASE === "1" && Boolean(process.env.TEST_DATABASE_URL);
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 }) : null;
const nonce = randomUUID().replaceAll("-", "").slice(0, 10);

const tpo: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "notes-tpo", platformStatus: "ACTIVE", systemRoles: [] },
  membership: {
    id: SEED_IDS.facultyCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["TPO"],
  },
};

const ids = {
  company: "",
  relationship: "",
  job: "",
  role: "",
  application: "",
  withdrawn: "",
  recruiterA: randomUUID(),
  recruiterB: randomUUID(),
  grantA: "",
  grantB: "",
};
const roleIds: string[] = [];

async function one(sql: string, params: unknown[]) {
  if (!pool) throw Error("PG required");
  return (await pool.query<{ id: string }>(sql, params)).rows[0]!.id;
}

function recruiterContext(userId: string, grantId: string, companyId: string): RequestContext {
  return {
    user: { id: userId, identityUid: "notes-recruiter-" + userId, platformStatus: "ACTIVE", systemRoles: [] },
    membership: null,
    recruiter: {
      userId,
      companyId,
      companyName: "Notes Co",
      status: "ACTIVE",
      title: null,
      grants: [
        {
          id: grantId,
          collegeId: SEED_IDS.collegeA,
          organizationId: SEED_IDS.organization,
          collegeName: "Fixture",
          companyRelationshipId: ids.relationship,
        },
      ],
    },
  };
}

async function cleanup() {
  if (!pool || !ids.job) return;
  const apps = [ids.application, ids.withdrawn].filter(Boolean);
  await pool.query("DELETE FROM activity_events WHERE subject_id = ANY($1::text[]) AND event_type='PLACEMENTS_APPLICANT_NOTE_ADDED'", [apps]);
  await pool.query("DELETE FROM placement_application_notes WHERE application_id = ANY($1::uuid[])", [apps]);
  await pool.query("DELETE FROM placement_application_screenings WHERE application_id = ANY($1::uuid[])", [apps]);
  await pool.query("DELETE FROM placement_applications WHERE id = ANY($1::uuid[])", [apps]);
  await pool.query("DELETE FROM placement_job_role_options WHERE id=$1", [ids.role]);
  await pool.query("DELETE FROM placement_jobs WHERE id=$1", [ids.job]);
  await pool.query("DELETE FROM placement_recruiter_college_grants WHERE company_relationship_id=$1", [ids.relationship]);
  await pool.query("DELETE FROM placement_recruiter_profiles WHERE user_id = ANY($1::uuid[])", [[ids.recruiterA, ids.recruiterB]]);
  await pool.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [[ids.recruiterA, ids.recruiterB]]);
  await pool.query("DELETE FROM placement_company_relationships WHERE id=$1", [ids.relationship]);
  await pool.query("DELETE FROM placement_companies WHERE id=$1", [ids.company]);
}

async function fixture() {
  if (!pool) throw Error("PG required");
  const name = "Notes Co " + nonce;
  ids.company = await one("INSERT INTO placement_companies(name,created_by_user_id) VALUES($1,$2) RETURNING id", [name, SEED_IDS.facultyUser]);
  ids.relationship = await one("INSERT INTO placement_company_relationships(college_id,company_id,created_by_user_id) VALUES($1,$2,$3) RETURNING id", [SEED_IDS.collegeA, ids.company, SEED_IDS.facultyUser]);
  ids.job = await one(
    "INSERT INTO placement_jobs(college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,application_mode,status,published_at,created_by_user_id) VALUES($1,$2,$3,$4,'Notes fixture','FULL_TIME','ONSITE','INTERNAL','PUBLISHED',now(),$5) RETURNING id",
    [SEED_IDS.collegeA, SEED_IDS.placementSeasonA, ids.relationship, name, SEED_IDS.facultyUser],
  );
  ids.role = await one("INSERT INTO placement_job_role_options(job_id,title,employment_type,work_mode,is_primary) VALUES($1,'Main','FULL_TIME','ONSITE',true) RETURNING id", [ids.job]);
  ids.application = await one(
    "INSERT INTO placement_applications(job_id,role_option_id,membership_id,channel,eligibility_status,eligibility_snapshot,submitted_by_user_id) VALUES($1,$2,$3,'INTERNAL','ELIGIBLE','{}'::jsonb,$4) RETURNING id",
    [ids.job, ids.role, SEED_IDS.learnerCollegeAMembership, SEED_IDS.learnerUser],
  );
  await pool.query(
    "INSERT INTO placement_application_screenings(application_id,status,decided_by_user_id,decided_at) VALUES($1,'SHORTLISTED',$2,now())",
    [ids.application, SEED_IDS.facultyUser],
  );
  for (const [id, label] of [[ids.recruiterA, "a"], [ids.recruiterB, "b"]] as const) {
    await pool.query(
      "INSERT INTO users(id,identity_uid,email,display_name,platform_status) VALUES($1,$2,$3,$4,'ACTIVE')",
      [id, "notes-recruiter-" + id, "notes-" + label + "-" + nonce + "@example.invalid", "Recruiter " + label.toUpperCase()],
    );
    await pool.query("INSERT INTO placement_recruiter_profiles(user_id,company_id,created_by_user_id) VALUES($1,$2,$3)", [id, ids.company, SEED_IDS.facultyUser]);
  }
  ids.grantA = await one("INSERT INTO placement_recruiter_college_grants(recruiter_user_id,company_relationship_id,granted_by_user_id) VALUES($1,$2,$3) RETURNING id", [ids.recruiterA, ids.relationship, SEED_IDS.facultyUser]);
  ids.grantB = await one("INSERT INTO placement_recruiter_college_grants(recruiter_user_id,company_relationship_id,granted_by_user_id) VALUES($1,$2,$3) RETURNING id", [ids.recruiterB, ids.relationship, SEED_IDS.facultyUser]);
}

describe.skipIf(!enabled)("applicant private notes isolated PostgreSQL", () => {
  beforeAll(async () => {
    if (!pool) throw Error("PG required");
    for (const id of [SEED_IDS.facultyCollegeAMembership, SEED_IDS.facultyCollegeBMembership]) {
      const r = await pool.query<{ id: string }>("INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING RETURNING id", [id]);
      if (r.rows[0]?.id) roleIds.push(r.rows[0].id);
    }
    await fixture();
  });
  afterAll(async () => {
    await cleanup();
    if (pool) {
      for (const id of roleIds) await pool.query("DELETE FROM membership_roles WHERE id=$1", [id]);
      await pool.end();
    }
    await closeDatabaseConnection();
  });

  it("TPO notes persist with audit, enforce the stale token and stay inside the college", async () => {
    if (!pool) throw Error("PG required");
    const empty = await listTpoApplicantNotes(tpo, ids.job, ids.application);
    expect(empty).toMatchObject({ notes: [], total: 0, latestNoteId: null });
    const first = await addTpoApplicantNote(tpo, ids.job, ids.application, { body: "  Strong communicator  ", expectedLatestNoteId: null });
    expect(first.snapshot.notes[0]).toMatchObject({ body: "Strong communicator", mine: true });
    await expect(addTpoApplicantNote(tpo, ids.job, ids.application, { body: "late", expectedLatestNoteId: null })).rejects.toMatchObject({ code: "PLACEMENT_APPLICATION_NOTE_STALE" });
    const second = await addTpoApplicantNote(tpo, ids.job, ids.application, { body: "Follow up on bond terms", expectedLatestNoteId: first.id });
    expect(second.snapshot.total).toBe(2);
    expect(second.snapshot.latestNoteId).toBe(second.id);
    await expect(addTpoApplicantNote(tpo, ids.job, ids.application, { body: "x", expectedLatestNoteId: first.id, collegeId: "forged" })).rejects.toBeDefined();
    await expect(addTpoApplicantNote(tpo, ids.job, ids.application, { body: "   ", expectedLatestNoteId: second.id })).rejects.toBeDefined();
    const foreign: RequestContext = { ...tpo, membership: { ...tpo.membership!, id: SEED_IDS.facultyCollegeBMembership, collegeId: SEED_IDS.collegeB } };
    await expect(listTpoApplicantNotes(foreign, ids.job, ids.application)).rejects.toMatchObject({ code: "PLACEMENT_APPLICATION_NOT_FOUND" });
    await expect(addTpoApplicantNote(foreign, ids.job, ids.application, { body: "leak", expectedLatestNoteId: second.id })).rejects.toMatchObject({ code: "PLACEMENT_APPLICATION_NOT_FOUND" });
    const wrong: RequestContext = { ...tpo, membership: { ...tpo.membership!, roles: ["LEARNER"] } };
    await expect(addTpoApplicantNote(wrong, ids.job, ids.application, { body: "x", expectedLatestNoteId: second.id })).rejects.toBeInstanceOf(AuthorizationError);
    const audit = await pool.query<{ summary: string; metadata: Record<string, unknown> }>(
      "SELECT summary, metadata FROM activity_events WHERE subject_id=$1 AND event_type='PLACEMENTS_APPLICANT_NOTE_ADDED' AND metadata->>'side'='TPO'",
      [ids.application],
    );
    expect(audit.rows).toHaveLength(2);
    expect(JSON.stringify(audit.rows)).not.toContain("Strong communicator");
  });

  it("recruiter notes are company-private, never mixed with TPO notes, and need live authority", async () => {
    if (!pool) throw Error("PG required");
    const a = recruiterContext(ids.recruiterA, ids.grantA, ids.company);
    const b = recruiterContext(ids.recruiterB, ids.grantB, ids.company);
    const initial = await listRecruiterApplicantNotes(a, ids.job, ids.application);
    expect(initial.total).toBe(0);
    const made = await addRecruiterApplicantNote(a, ids.job, ids.application, { body: "Call after round 2", expectedLatestNoteId: null });
    const teammate = await listRecruiterApplicantNotes(b, ids.job, ids.application);
    expect(teammate.notes).toHaveLength(1);
    expect(teammate.notes[0]).toMatchObject({ body: "Call after round 2", mine: false, authorName: "Recruiter A" });
    await expect(addRecruiterApplicantNote(b, ids.job, ids.application, { body: "stale", expectedLatestNoteId: null })).rejects.toMatchObject({ code: "PLACEMENT_APPLICATION_NOTE_STALE" });
    expect((await listTpoApplicantNotes(tpo, ids.job, ids.application)).notes.some((note) => note.body === "Call after round 2")).toBe(false);
    const otherCompany = recruiterContext(ids.recruiterA, ids.grantA, randomUUID());
    await expect(listRecruiterApplicantNotes(otherCompany, ids.job, ids.application)).rejects.toMatchObject({ code: "PLACEMENT_APPLICATION_NOT_FOUND" });
    await expect(addRecruiterApplicantNote(tpo, ids.job, ids.application, { body: "x", expectedLatestNoteId: made.id })).rejects.toMatchObject({ code: "PLACEMENT_APPLICATION_NOT_FOUND" });
    // Not shortlisted: the applicant is not shared with the employer.
    await pool.query("UPDATE placement_application_screenings SET status='HOLD', internal_reason='hold for review' WHERE application_id=$1", [ids.application]);
    await expect(listRecruiterApplicantNotes(a, ids.job, ids.application)).rejects.toMatchObject({ code: "PLACEMENT_APPLICATION_NOT_FOUND" });
    await pool.query("UPDATE placement_application_screenings SET status='SHORTLISTED', internal_reason=NULL WHERE application_id=$1", [ids.application]);
    // Revoke in the database while the request snapshot still carries the grant.
    await pool.query("UPDATE placement_recruiter_college_grants SET status='REVOKED', revoked_by_user_id=$2, revoked_at=now() WHERE id=$1", [ids.grantB, SEED_IDS.facultyUser]);
    await expect(addRecruiterApplicantNote(b, ids.job, ids.application, { body: "after revoke", expectedLatestNoteId: made.id })).rejects.toBeInstanceOf(AuthorizationError);
    const count = await pool.query<{ n: number }>("SELECT count(*)::int AS n FROM placement_application_notes WHERE side='RECRUITER' AND application_id=$1", [ids.application]);
    expect(count.rows[0]?.n).toBe(1);
  });
});
