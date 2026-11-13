import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Pool } from "pg";
import { ZodError } from "zod";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { PlacementsServiceError } from "@/modules/placements/errors";
import { listOwnRecruiterPlacementJobs } from "@/modules/placements/recruiter-service";
import { getRecruiterPlacementWorkspace } from "@/modules/placements/recruiter-workspace-service";
import { grantRecruiterSharedResume, RecruiterResumeUnavailable } from "@/modules/placements/recruiter-applicant-resume-service";
import { recruiterOwnJobExists } from "@/modules/placements/recruiter-job-ownership";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
import { createPersistedJobRecruiter, persistedRecruiterContext } from "../support/persisted-job-recruiter-fixture";
import { seedPlacementCollege, type PlacementCollege } from "../support/placement-college";

// Storage is stubbed so that only the access rules decide the outcome; the spy records every signed link that was requested.
const grants = vi.hoisted(() => ({ calls: [] as unknown[] }));
vi.mock("@/modules/profile-verification/private-receipts", () => ({ verifyPrivateDocumentReceipt: async () => true }));
vi.mock("@/modules/storage/private-object-storage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/modules/storage/private-object-storage")>()),
  createPrivateReadGrant: vi.fn(async (input: unknown) => {
    grants.calls.push(input);
    return { readUrl: "https://files.example.test/resume", expiresAt: new Date(Date.now() + 60_000), generation: "1", sha256Hex: "a".repeat(64), contentType: "application/pdf" } as never;
  }),
}));

/**
 * Recruiter and company data: access between recruiters of the SAME college.
 *
 * Recruiter 1 and recruiter 2 work for company X and each owns one drive; recruiter 3 works for company Y, which also recruits
 * at this college. Every recruiter may see only their own drives. A recruiter of another company, or a colleague of the same
 * company who does not own the drive, must not reach its workspace, its applicants, or an applicant's résumé; students, faculty
 * and staff have no recruiter access at all.
 */
if (!process.env.TEST_DATABASE_URL || process.env.DB03_ISOLATED_TEST_DATABASE !== "1") {
  throw new Error("sec-cross-user-recruiters needs TEST_DATABASE_URL and DB03_ISOLATED_TEST_DATABASE=1 (disposable database)");
}
assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 });

let c: PlacementCollege;
const companyY = randomUUID();
const relationY = randomUUID();
const seasonJobY = randomUUID();
const roleY = randomUUID();
let companyX = "";
let relationX = "";
let seasonId = "";
const recruiters: { userId: string; grantId: string }[] = [];
const resumeReceipt = randomUUID();
let r1: RequestContext;
let r2: RequestContext;
let r3: RequestContext;

/** Refused by an access rule or the not-available answer: never a validation error or a crash. */
async function refused(call: Promise<unknown>, who: string) {
  let error: unknown = null;
  try {
    await call;
  } catch (caught) {
    error = caught;
  }
  expect(error, who + " must be refused").not.toBeNull();
  expect(error instanceof ZodError, who + " was refused for invalid input, not for access").toBe(false);
  expect(
    error instanceof AuthorizationError || error instanceof PlacementsServiceError || error instanceof RecruiterResumeUnavailable,
    who + ": " + String(error),
  ).toBe(true);
}

describe("recruiters: nobody can reach another recruiter's drives or candidates", () => {
  beforeAll(async () => {
    c = await seedPlacementCollege(pool, "sec-rec");
    const row = await pool.query<{ company_id: string; id: string; season_id: string }>(
      "SELECT r.company_id, r.id, j.season_id FROM placement_jobs j JOIN placement_company_relationships r ON r.id=j.company_relationship_id WHERE j.id=$1",
      [c.jobA],
    );
    companyX = row.rows[0]!.company_id;
    relationX = row.rows[0]!.id;
    seasonId = row.rows[0]!.season_id;
    // Company Y also recruits at this college, with one published drive of its own.
    await pool.query("INSERT INTO placement_companies(id,name,created_by_user_id) VALUES($1,$2,$3)", [companyY, "SEC-REC Company Y " + companyY, SEED_IDS.collegeAdminUser]);
    await pool.query("INSERT INTO placement_company_relationships(id,college_id,company_id,created_by_user_id) VALUES($1,$2,$3,$4)", [relationY, c.college, companyY, SEED_IDS.collegeAdminUser]);
    await pool.query(
      "INSERT INTO placement_jobs(id,college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,status,published_at,application_deadline,created_by_user_id) VALUES($1,$2,$3,$4,'SEC-REC drive Y','Company Y drive','FULL_TIME','REMOTE','PUBLISHED',now()-interval '1 day',now()+interval '10 days',$5)",
      [seasonJobY, c.college, seasonId, relationY, SEED_IDS.collegeAdminUser],
    );
    await pool.query(
      "INSERT INTO placement_job_role_options(id,job_id,title,employment_type,work_mode,is_primary) VALUES($1,$2,'Engineer Y','FULL_TIME','REMOTE',true)",
      [roleY, seasonJobY],
    );
    const make = async (companyId: string, relationshipId: string, jobId: string, tag: string) => {
      const made = await createPersistedJobRecruiter({
        companyId, companyRelationshipId: relationshipId, collegeId: c.college, jobId,
        grantedByUserId: SEED_IDS.collegeAdminUser, identityUid: `sec-rec-${tag}-${randomUUID()}`,
      });
      recruiters.push(made);
      return persistedRecruiterContext({
        userId: made.userId, identityUid: `sec-rec-${tag}`, companyId, grantId: made.grantId,
        collegeId: c.college, organizationId: SEED_IDS.organization, companyRelationshipId: relationshipId,
      });
    };
    r1 = await make(companyX, relationX, c.jobA, "r1"); // company X, owns drive A
    r2 = await make(companyX, relationX, c.jobB, "r2"); // company X, owns drive B
    r3 = await make(companyY, relationY, seasonJobY, "r3"); // company Y, owns drive Y
    // Applicant A is shortlisted on drive A and has a clean résumé, and both companies may see résumés: a recruiter who owns the
    // drive could legitimately ask for it, so a refusal below can only be about who is asking.
    await pool.query("UPDATE placement_company_relationships SET share_column_defaults='[\"resume\"]'::jsonb WHERE id=ANY($1::uuid[])", [[relationX, relationY]]);
    await pool.query(
      "INSERT INTO profile_private_document_receipts(id,owning_membership_id,purpose,private_object_key,object_generation,sha256_hex,mime_type,size_bytes,scan_status,uploaded_by_user_id) VALUES($1,$2,'RESUME',$3,'1',$4,'application/pdf',100,'CLEAN',$5)",
      [resumeReceipt, c.membershipA, "private/sec-rec/" + resumeReceipt, "a".repeat(64), c.learnerA.user.id],
    );
  }, 120_000);

  beforeEach(() => {
    grants.calls.length = 0;
  });

  afterAll(async () => {
    try {
      const q = (sql: string, args: unknown[]) => pool.query(sql, args).catch(() => undefined);
      const users = recruiters.map((r) => r.userId);
      await q("DELETE FROM profile_private_document_receipts WHERE id=$1", [resumeReceipt]);
      await q("DELETE FROM placement_recruiter_drive_requests WHERE recruiter_user_id=ANY($1::uuid[])", [users]);
      await q("DELETE FROM placement_recruiter_college_grants WHERE recruiter_user_id=ANY($1::uuid[])", [users]);
      await q("DELETE FROM placement_recruiter_profiles WHERE user_id=ANY($1::uuid[])", [users]);
      await q("DELETE FROM users WHERE id=ANY($1::uuid[])", [users]);
      await q("DELETE FROM placement_job_role_options WHERE id=$1", [roleY]);
      await q("DELETE FROM placement_jobs WHERE id=$1", [seasonJobY]);
      await q("DELETE FROM placement_company_relationships WHERE id=$1", [relationY]);
      await q("DELETE FROM placement_companies WHERE id=$1", [companyY]);
      await c?.cleanup();
    } finally {
      await pool.end();
      await closeDatabaseConnection();
    }
  }, 120_000);

  it("each recruiter sees only the drives they own, even within the same company", async () => {
    const jobs = async (ctx: RequestContext) => (await listOwnRecruiterPlacementJobs(ctx)).map((row: { job: { id: string } }) => row.job.id);
    expect(await jobs(r1)).toEqual([c.jobA]);
    expect(await jobs(r2)).toEqual([c.jobB]);
    expect(await jobs(r3)).toEqual([seasonJobY]);
  });

  it("ownership is recorded per recruiter and per drive", async () => {
    expect(await recruiterOwnJobExists(r1.user.id, c.jobA)).toBe(true);
    expect(await recruiterOwnJobExists(r1.user.id, c.jobB)).toBe(false); // same company, a colleague's drive
    expect(await recruiterOwnJobExists(r1.user.id, seasonJobY)).toBe(false); // another company's drive
    expect(await recruiterOwnJobExists(r3.user.id, c.jobA)).toBe(false);
  });

  it("a recruiter opens the workspace of their own drive and no one else's", async () => {
    expect((await getRecruiterPlacementWorkspace(r1, c.jobA)).job.id).toBe(c.jobA);
    expect((await getRecruiterPlacementWorkspace(r2, c.jobB)).job.id).toBe(c.jobB);
    expect((await getRecruiterPlacementWorkspace(r3, seasonJobY)).job.id).toBe(seasonJobY);
    await refused(getRecruiterPlacementWorkspace(r1, c.jobB), "recruiter 1 on a colleague's drive");
    await refused(getRecruiterPlacementWorkspace(r2, c.jobA), "recruiter 2 on a colleague's drive");
    await refused(getRecruiterPlacementWorkspace(r3, c.jobA), "company Y recruiter on company X's drive");
    await refused(getRecruiterPlacementWorkspace(r1, seasonJobY), "company X recruiter on company Y's drive");
  });

  it("students, faculty and college staff have no recruiter workspace", async () => {
    for (const [who, actor] of [["learner A", c.learnerA], ["learner B", c.learnerB], ["faculty", c.faculty], ["tpo", c.tpo], ["admin", c.admin]] as const) {
      await refused(getRecruiterPlacementWorkspace(actor, c.jobA), who);
      await refused(listOwnRecruiterPlacementJobs(actor), who + " own jobs");
    }
  });

  it("the drive's own recruiter can obtain a shortlisted applicant's résumé link", async () => {
    const grant = await grantRecruiterSharedResume(r1, c.jobA, c.applicationA);
    expect(grant.url).toBe("https://files.example.test/resume");
    expect(grants.calls).toHaveLength(1);
  });

  it("nobody but the drive's own recruiter can ask for an applicant's résumé, and no link is ever requested for them", async () => {
    for (const [who, actor, job] of [
      ["recruiter 2 (same company) on A's drive", r2, c.jobA],
      ["recruiter 3 (other company) on A's drive", r3, c.jobA],
      ["recruiter 1 on company Y's drive", r1, seasonJobY],
    ] as const) {
      await refused(grantRecruiterSharedResume(actor, job, c.applicationA), who);
    }
    for (const [who, actor] of [["learner B", c.learnerB], ["faculty", c.faculty], ["tpo", c.tpo]] as const) {
      await refused(grantRecruiterSharedResume(actor, c.jobA, c.applicationA), who);
    }
    expect(grants.calls).toEqual([]);
  });

  it("an applicant of one drive cannot be fetched through another drive of the same recruiter's company", async () => {
    // Recruiter 2 owns drive B; asking for applicant A's résumé through drive B must not work: A did not apply there.
    await refused(grantRecruiterSharedResume(r2, c.jobB, c.applicationA), "recruiter 2 asking for A through drive B");
    expect(grants.calls).toEqual([]);
  });
});
