import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { listCollegeDrives } from "@/modules/placements/college-drive-read-service";
import { getCollegeDriveOverview } from "@/modules/placements/college-drive-overview-service";
import { exportCollegeDriveApplicationsCsv, listCollegeDriveApplications } from "@/modules/placements/college-drive-applications-service";
import { listCollegeDriveInterviews } from "@/modules/placements/college-drive-interviews-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 }) : null;
const ids = { company: randomUUID(), relationship: randomUUID(), season: randomUUID(), job: randomUUID(), roleOption:randomUUID(), application:randomUUID(), round:randomUUID() };
const code = "W-CA-" + ids.company.slice(0, 8);

const adminA: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "college-drive-view-admin", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.collegeAdminMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const adminB: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "college-drive-view-foreign", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.facultyCollegeBMembership, collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const learner: RequestContext = {
  ...adminA, membership: { ...adminA.membership!, roles: ["LEARNER"] },
};

describe.skipIf(!enabled)("College Admin drive read views: isolated PostgreSQL", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("Disposable PG is required");
    await pool.query("INSERT INTO placement_companies(id,name,created_by_user_id) VALUES($1,$2,$3)",
      [ids.company, code, SEED_IDS.collegeAdminUser]);
    await pool.query("INSERT INTO placement_company_relationships(id,college_id,company_id,created_by_user_id) VALUES($1,$2,$3,$4)",
      [ids.relationship, SEED_IDS.collegeA, ids.company, SEED_IDS.collegeAdminUser]);
    await pool.query(
      "INSERT INTO placement_seasons(id,college_id,name,code,start_date,end_date,created_by_user_id,status,closed_by_user_id,closed_at) " +
      "VALUES($1,$2,$3,$4,'2026-01-01','2026-12-31',$5,'CLOSED',$5,now())",
      [ids.season, SEED_IDS.collegeA, code, code, SEED_IDS.collegeAdminUser],
    );
    await pool.query(
      "INSERT INTO placement_jobs(id,college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,created_by_user_id) " +
      "VALUES($1,$2,$3,$4,$5,'Isolated read-only fixture','FULL_TIME','HYBRID',$6)",
      [ids.job, SEED_IDS.collegeA, ids.season, ids.relationship, code, SEED_IDS.collegeAdminUser],
    );
    await pool.query("INSERT INTO placement_job_role_options(id,job_id,title,employment_type,work_mode) VALUES($1,$2,$3,'FULL_TIME','HYBRID')",
      [ids.roleOption,ids.job,code]);
    await pool.query("INSERT INTO placement_applications(id,job_id,role_option_id,membership_id,channel,status,eligibility_status,eligibility_snapshot,submitted_by_user_id) " +
      "VALUES($1,$2,$3,$4,'INTERNAL','SUBMITTED','ELIGIBLE','{}'::jsonb,$5)",
      [ids.application,ids.job,ids.roleOption,SEED_IDS.learnerCollegeAMembership,SEED_IDS.learnerUser]);
    await pool.query("INSERT INTO placement_job_rounds(id,job_id,sequence,kind,name,created_by_user_id) VALUES($1,$2,1,'INTERVIEW',$3,$4)",
      [ids.round,ids.job,code,SEED_IDS.collegeAdminUser]);
  });
  afterAll(async () => {
    try {
      if (pool) {
        // No activity/history/append-only deletion.
        await pool.query("DELETE FROM placement_job_rounds WHERE id=$1", [ids.round]);
        await pool.query("DELETE FROM placement_applications WHERE id=$1", [ids.application]);
        await pool.query("DELETE FROM placement_job_role_options WHERE id=$1", [ids.roleOption]);
        await pool.query("DELETE FROM placement_jobs WHERE id=$1", [ids.job]);
        await pool.query("DELETE FROM placement_seasons WHERE id=$1", [ids.season]);
        await pool.query("DELETE FROM placement_company_relationships WHERE id=$1", [ids.relationship]);
        await pool.query("DELETE FROM placement_companies WHERE id=$1", [ids.company]);
      }
    } finally { await pool?.end(); await closeDatabaseConnection(); }
  });

  it("shows persisted own-college drive and its season/company, not to foreign college", async () => {
    const [own, foreign] = await Promise.all([
      listCollegeDrives(adminA, { q: code, status: "ALL" }),
      listCollegeDrives(adminB, { q: code, status: "ALL" }),
    ]);
    expect(own.items).toContainEqual(expect.objectContaining({ id: ids.job, companyName: code, seasonName: code }));
    expect(foreign.items).toEqual([]);
  });
  it("resolves the drive, keeps selected null, and does not leak a foreign job", async () => {
    const overview = await getCollegeDriveOverview(adminA, ids.job);
    expect(overview.drive.companyName).toBe(code);
    expect(overview.counts).toEqual({
      applications: 1, shortlisted: 0, selected: null, offered: 0,
    });
    await expect(getCollegeDriveOverview(adminB, ids.job))
      .rejects.toMatchObject({ code: "PLACEMENT_JOB_NOT_FOUND" });
    await expect(getCollegeDriveOverview(learner, ids.job)).rejects.toBeInstanceOf(AuthorizationError);
  });
  it("lists the scoped applicant and produces neutralized, bounded CSV; foreign job looks absent", async () => {
    const own = await listCollegeDriveApplications(adminA, ids.job, { status:"SUBMITTED" });
    expect(own.items).toContainEqual(expect.objectContaining({id:ids.application,status:"SUBMITTED"}));
    const exportResult=await exportCollegeDriveApplicationsCsv(adminA,ids.job,{});
    expect(exportResult.total).toBe(1);
    expect(exportResult.truncated).toBe(false);
    expect(exportResult.csv).toContain("Application status");
    await expect(listCollegeDriveApplications(adminB,ids.job,{}))
      .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
    await expect(exportCollegeDriveApplicationsCsv(adminB,ids.job,{}))
      .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
    await expect(listCollegeDriveApplications(learner,ids.job,{})).rejects.toBeInstanceOf(AuthorizationError);
  });
  it("lists persisted own-college interview round with unknown individual slots and denies foreign job", async () => {
    const own=await listCollegeDriveInterviews(adminA,ids.job,{kind:"INTERVIEW"});
    expect(own.items).toContainEqual(expect.objectContaining({id:ids.round,kind:"INTERVIEW",status:"PENDING",venue:null}));
    expect(own.individualSlotsAvailable).toBe(false);
    await expect(listCollegeDriveInterviews(adminB,ids.job,{}))
      .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
    await expect(listCollegeDriveInterviews(learner,ids.job,{}))
      .rejects.toBeInstanceOf(AuthorizationError);
  });
  it("rejects non-admin and caller-supplied college scope", async () => {
    await expect(listCollegeDrives(learner, {})).rejects.toBeInstanceOf(AuthorizationError);
    await expect(listCollegeDrives(adminA, { collegeId: SEED_IDS.collegeB })).rejects.toBeDefined();
  });
});
