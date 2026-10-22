import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getCollegeApplicationPipeline, mutateCollegeApplicationStages } from "@/modules/placements/college-application-stage-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) && process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 }) : null;
const tag = "CP-" + randomUUID().slice(0, 8);
const adminA: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "col-pl-pipe-a", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.collegeAdminMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const adminB: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "col-pl-pipe-b", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.facultyCollegeBMembership, collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const learner: RequestContext = { ...adminA, membership: { ...adminA.membership!, roles: ["LEARNER"] } };

const created: { company: string; relationship: string; season: string; jobs: string[] } =
  { company: randomUUID(), relationship: randomUUID(), season: randomUUID(), jobs: [] };

async function makeDrive(status = "PUBLISHED", screening = "PENDING") {
  const p = pool!;
  const job = randomUUID(), role = randomUUID(), app = randomUUID();
  await p.query(
    "INSERT INTO placement_jobs(id,college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,created_by_user_id,status,application_deadline,published_at,closed_at) " +
    "VALUES($1,$2,$3,$4,$5,'fixture','FULL_TIME','HYBRID',$6,$7::varchar,'2099-12-31',now(),CASE WHEN $7::varchar='CLOSED' THEN now() ELSE NULL END)",
    [job, SEED_IDS.collegeA, created.season, created.relationship, tag + "-" + job.slice(0, 4), SEED_IDS.collegeAdminUser, status]);
  await p.query("INSERT INTO placement_job_role_options(id,job_id,title,employment_type,work_mode) VALUES($1,$2,$3,'FULL_TIME','HYBRID')", [role, job, tag]);
  await p.query("INSERT INTO placement_applications(id,job_id,role_option_id,membership_id,channel,status,eligibility_status,eligibility_snapshot,submitted_by_user_id) " +
    "VALUES($1,$2,$3,$4,'INTERNAL','SUBMITTED','ELIGIBLE','{}'::jsonb,$5)",
    [app, job, role, SEED_IDS.learnerCollegeAMembership, SEED_IDS.learnerUser]);
  await p.query("INSERT INTO placement_application_screenings(application_id,status) VALUES($1,$2) ON CONFLICT (application_id) DO UPDATE SET status=EXCLUDED.status", [app, screening]);
  created.jobs.push(job);
  return { job, role, app };
}
const move = (job: string, ids: string[], stage: string, reason = "Reviewed by placement cell") =>
  mutateCollegeApplicationStages(adminA, job, { action: "MOVE", applicationIds: ids, stage, reason, confirmed: true });

describe.skipIf(!enabled)("College Admin placement pipeline: isolated PostgreSQL", () => {
  beforeAll(async () => {
    const p = pool!;
    await p.query("INSERT INTO placement_companies(id,name,created_by_user_id) VALUES($1,$2,$3)", [created.company, tag, SEED_IDS.collegeAdminUser]);
    await p.query("INSERT INTO placement_company_relationships(id,college_id,company_id,created_by_user_id) VALUES($1,$2,$3,$4)", [created.relationship, SEED_IDS.collegeA, created.company, SEED_IDS.collegeAdminUser]);
    const season = await p.query("SELECT id FROM placement_seasons WHERE college_id=$1 AND status='ACTIVE' LIMIT 1", [SEED_IDS.collegeA]);
    created.season = season.rows[0]?.id ?? created.season;
    if (!season.rows[0]) await p.query("INSERT INTO placement_seasons(id,college_id,name,code,start_date,end_date,created_by_user_id,status) VALUES($1,$2,$3,$4,'2026-01-01','2099-12-31',$5,'ACTIVE')", [created.season, SEED_IDS.collegeA, tag, tag, SEED_IDS.collegeAdminUser]);
  });
  afterAll(async () => { await pool?.end(); await closeDatabaseConnection(); });

  it("COL-placements-01: shortlist then assessment then interview moves persist stage, history, audit and learner notification", async () => {
    const { job, app } = await makeDrive();
    for (const stage of ["SHORTLISTED", "ASSESSMENT", "INTERVIEW"]) {
      const r = await move(job, [app], stage);
      expect(r).toMatchObject({ moved: 1, skipped: 0 });
    }
    const pipe = await getCollegeApplicationPipeline(adminA, job, {});
    expect(pipe.items.find(x => x.id === app)).toMatchObject({ stage: "INTERVIEW", previousStage: "ASSESSMENT" });
    const hist = await pool!.query("SELECT to_stage FROM placement_college_application_stage_history h JOIN placement_college_application_stages s ON s.id=h.stage_id WHERE s.application_id=$1 ORDER BY h.moved_at", [app]);
    expect(hist.rows.map(r => r.to_stage)).toEqual(["SHORTLISTED", "ASSESSMENT", "INTERVIEW"]);
    const sc = await pool!.query("SELECT status FROM placement_application_screenings WHERE application_id=$1", [app]);
    expect(sc.rows[0].status).toBe("SHORTLISTED");
    const audit = await pool!.query("SELECT count(*)::int n FROM activity_events WHERE subject_id=$1 AND event_type='PLACEMENTS_COLLEGE_APPLICATION_STAGE_MOVED'", [app]);
    expect(audit.rows[0].n).toBe(3);
    const notes = await pool!.query("SELECT count(*)::int n FROM in_app_notifications n JOIN activity_events e ON e.id=n.event_id WHERE e.subject_id=$1", [app]);
    expect(notes.rows[0].n).toBe(3);
  });

  it("COL-placements-01: invalid transitions, Offered without an issued offer and Hired without joining are rejected per row", async () => {
    const { job, app } = await makeDrive();
    expect((await move(job, [app], "HIRED")).results[0].reason).toMatch(/Cannot move from APPLIED to HIRED. Allowed next stages:/);
    await move(job, [app], "SHORTLISTED");
    await move(job, [app], "INTERVIEW");
    const offered = await move(job, [app], "OFFERED");
    expect(offered.skipped).toBe(1);
    expect(offered.results[0].reason).toMatch(/Issue an actual offer/);
  });

  it("COL-placements-01: reject then reinstate returns the application to its previous pipeline stage", async () => {
    const { job, app } = await makeDrive();
    await move(job, [app], "SHORTLISTED");
    expect((await move(job, [app], "REJECTED", "Does not meet criteria")).moved).toBe(1);
    expect((await getCollegeApplicationPipeline(adminA, job, {})).items[0].stage).toBe("REJECTED");
    const back = await mutateCollegeApplicationStages(adminA, job, { action: "REINSTATE", applicationIds: [app], reason: "Reviewed again", confirmed: true });
    expect(back).toMatchObject({ moved: 1 });
    expect((await getCollegeApplicationPipeline(adminA, job, {})).items[0].stage).toBe("SHORTLISTED");
    const again = await mutateCollegeApplicationStages(adminA, job, { action: "REINSTATE", applicationIds: [app], reason: "Reviewed again", confirmed: true });
    expect(again.skipped).toBe(1);
  });

  it("COL-placements-06: bulk move reports partial failure per row and select-all-matching uses the filter", async () => {
    const a = await makeDrive();
    const ok = await move(a.job, [a.app], "SHORTLISTED");
    expect(ok.moved).toBe(1);
    const mixed = await move(a.job, [a.app, randomUUID()], "ASSESSMENT");
    expect(mixed).toMatchObject({ moved: 1, skipped: 1 });
    const all = await mutateCollegeApplicationStages(adminA, a.job, {
      action: "MOVE", matchingFilter: { stage: "ASSESSMENT" }, stage: "INTERVIEW", reason: "Advance all assessed", confirmed: true });
    expect(all).toMatchObject({ moved: 1, skipped: 0 });
    await expect(mutateCollegeApplicationStages(adminA, a.job, {
      action: "MOVE", matchingFilter: { stage: "OFFERED" }, stage: "REJECTED", reason: "none match", confirmed: true })).rejects.toThrow(/No matching/);
  });

  it("COL-placements-06: command schema refuses mixed selection, duplicates, missing confirmation and over 100 ids", async () => {
    const { job, app } = await makeDrive();
    const base = { action: "MOVE", stage: "SHORTLISTED", reason: "Reviewed", confirmed: true };
    await expect(mutateCollegeApplicationStages(adminA, job, { ...base, applicationIds: [app], matchingFilter: {} })).rejects.toThrow();
    await expect(mutateCollegeApplicationStages(adminA, job, { ...base, applicationIds: [app, app] })).rejects.toThrow();
    await expect(mutateCollegeApplicationStages(adminA, job, { ...base, applicationIds: [app], confirmed: false })).rejects.toThrow();
    await expect(mutateCollegeApplicationStages(adminA, job, { ...base, applicationIds: Array.from({ length: 101 }, () => randomUUID()) })).rejects.toThrow();
  });

  it("COL-placements-01: closed drive is read-only, foreign college and learner cannot move or see the pipeline", async () => {
    const closed = await makeDrive("CLOSED");
    expect((await move(closed.job, [closed.app], "SHORTLISTED")).skipped).toBe(1);
    const open = await makeDrive();
    const foreign = await mutateCollegeApplicationStages(adminB, open.job, { action: "MOVE", applicationIds: [open.app], stage: "SHORTLISTED", reason: "Foreign attempt", confirmed: true });
    expect(foreign).toMatchObject({ moved: 0, skipped: 1 });
    await expect(mutateCollegeApplicationStages(learner, open.job, { action: "MOVE", applicationIds: [open.app], stage: "SHORTLISTED", reason: "Learner attempt", confirmed: true })).rejects.toBeInstanceOf(AuthorizationError);
    await expect(getCollegeApplicationPipeline(adminB, open.job, {})).rejects.toMatchObject({ code: "PLACEMENT_JOB_NOT_FOUND" });
    const stages = await pool!.query("SELECT count(*)::int n FROM placement_college_application_stages WHERE application_id=$1", [open.app]);
    expect(stages.rows[0].n).toBe(0);
  });

  it("COL-placements-05: stage, source and withdrawn filters narrow applications and expose per-stage counts", async () => {
    const { job, app } = await makeDrive();
    await move(job, [app], "SHORTLISTED");
    const hit = await getCollegeApplicationPipeline(adminA, job, { stage: "SHORTLISTED" });
    expect(hit.total).toBe(1);
    expect(hit.stageCounts).toMatchObject({ SHORTLISTED: 1 });
    expect((await getCollegeApplicationPipeline(adminA, job, { stage: "APPLIED" })).total).toBe(0);
    expect((await getCollegeApplicationPipeline(adminA, job, { source: "EXTERNAL" })).total).toBe(0);
    expect((await getCollegeApplicationPipeline(adminA, job, { source: "INTERNAL" })).total).toBe(1);
    expect((await getCollegeApplicationPipeline(adminA, job, { stage: "WITHDRAWN" })).total).toBe(0);
    expect((await getCollegeApplicationPipeline(adminA, job, { q: "no-such-person-zz" })).total).toBe(0);
  });
});
