import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import {
  completeSubmissionFileUpload,
  issueSubmissionFileDownloadGrant,
  issueSubmissionFileUploadGrant,
  listMySubmissionFiles,
  listSubmissionFiles,
  removeStagedSubmissionFile,
  submitAssignmentWithFiles,
} from "@/modules/courses/assignment-submission-file-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
import {
  cleanupLearnerCourseWriteFixture,
  newLearnerCourseWriteFixture,
  seedLearnerCourseWriteFixture,
} from "../support/learner-course-write-fixture";
import { objects, pdfBytes, putFromGrant, resetFakeObjectStore } from "../support/fake-object-store";

vi.mock("@/modules/storage/s3-client", async (importOriginal) => {
  const fake = await import("../support/fake-object-store");
  return {
    ...(await importOriginal<typeof import("@/modules/storage/s3-client")>()),
    headObject: fake.fakeHead,
    getObjectStream: fake.fakeGetObjectStream,
    deleteObject: fake.fakeDelete,
  };
});

/**
 * Uploaded assignment files: object-level access between people of the SAME college.
 *
 * Learner A stages and then submits a file. Learner B is a classmate, learner C is in the other section, teacher 1 teaches
 * A's section, teacher 2 teaches the other section, teacher 0 teaches nothing. A staged (not yet submitted) file is private
 * to its learner. A submitted file is visible only to its learner, to the section's teacher and to the college admin.
 * Every refusal must be the same non-leaking STORAGE_NOT_FOUND, and a refused attempt must not mint a download grant.
 */
if (!process.env.TEST_DATABASE_URL || process.env.DB03_ISOLATED_TEST_DATABASE !== "1") {
  throw new Error("sec-cross-user-files needs TEST_DATABASE_URL and DB03_ISOLATED_TEST_DATABASE=1 (disposable database)");
}
assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 });

const fixture = newLearnerCourseWriteFixture();
const { ids } = fixture;
const college = SEED_IDS.collegeA;

type Person = { user: string; membership: string; role: string };
const person = (): Person => ({ user: randomUUID(), membership: randomUUID(), role: randomUUID() });
const learnerBp = person();
const learnerCp = person();
const teacher1 = person();
const teacher2 = person();
const teacher0 = person();
const section2 = randomUUID();
const delivery2 = randomUUID();
const assignment = randomUUID();
const enrollment = { b: randomUUID(), c: randomUUID() };
const sectionEnrollment = { b: randomUUID(), c: randomUUID() };
const teaching = { t1: randomUUID(), t2: randomUUID() };

const as = (p: Person, role: "LEARNER" | "FACULTY" | "COLLEGE_ADMIN", collegeId = college): RequestContext => ({
  user: { id: p.user, identityUid: "sec-file-" + p.user, platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: p.membership, collegeId, organizationId: SEED_IDS.organization, status: "ACTIVE", roles: [role] },
});
const learnerA = fixture.context;
const learnerB = as(learnerBp, "LEARNER");
const learnerC = as(learnerCp, "LEARNER");
const t1 = as(teacher1, "FACULTY");
const t2 = as(teacher2, "FACULTY");
const t0 = as(teacher0, "FACULTY");
const admin: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "sec-file-admin", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.collegeAdminMembership, collegeId: college, organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const otherCollegeAdmin = as(person(), "COLLEGE_ADMIN", SEED_IDS.collegeB);

const NOT_FOUND = { code: "STORAGE_NOT_FOUND" };

async function insertPerson(p: Person, role: string, name: string) {
  await pool.query("INSERT INTO users(id,identity_uid,display_name,platform_status) VALUES($1,$2,$3,'ACTIVE')", [p.user, "sec-file-" + p.user, name]);
  await pool.query("INSERT INTO college_memberships(id,user_id,college_id,status) VALUES($1,$2,$3,'ACTIVE')", [p.membership, p.user, college]);
  await pool.query("INSERT INTO membership_roles(id,membership_id,role) VALUES($1,$2,$3)", [p.role, p.membership, role]);
}

/** Stage a READY (verified, not yet submitted) pdf for a learner. */
async function stage(actor: RequestContext, name: string, body: string) {
  const bytes = pdfBytes(body);
  const { grant, file } = await issueSubmissionFileUploadGrant(actor, assignment, {
    deliveryId: ids.delivery, originalName: name, contentType: "application/pdf", sizeBytes: bytes.length,
  });
  putFromGrant(grant, bytes);
  return completeSubmissionFileUpload(actor, assignment, file.id);
}
const fileRow = async (id: string) =>
  (await pool.query("SELECT status, submission_id, owner_membership_id FROM assignment_submission_files WHERE id=$1", [id])).rows[0];
const grantEvents = async (id: string) =>
  Number((await pool.query("SELECT count(*)::int AS n FROM storage_file_events WHERE subject_id=$1 AND event_type='DOWNLOAD_GRANTED'", [id])).rows[0].n);

describe("uploaded assignment files: nobody can reach another person's file", () => {
  let staged: { id: string };
  let bStaged: { id: string };
  let submissionId = "";

  beforeAll(async () => {
    process.env["APP_ENV"] = "test";
    process.env["R2_ACCOUNT_ID"] = "testaccount";
    process.env["R2_ACCESS_KEY"] = "TESTACCESSKEYID";
    process.env["R2_SECRET_KEY"] = "test-secret-not-real";
    process.env["R2_PRIVATE_BUCKET"] = "test-private";
    delete process.env["R2_BUCKET_NAME"];
    delete process.env["R2_PRIVATE_PREFIX"];
    resetFakeObjectStore();
    await seedLearnerCourseWriteFixture(pool, fixture, { content: true });
    const q = pool.query.bind(pool);
    await insertPerson(learnerBp, "LEARNER", "SEC-FILE Learner B");
    await insertPerson(learnerCp, "LEARNER", "SEC-FILE Learner C");
    await insertPerson(teacher1, "FACULTY", "SEC-FILE Teacher 1");
    await insertPerson(teacher2, "FACULTY", "SEC-FILE Teacher 2");
    await insertPerson(teacher0, "FACULTY", "SEC-FILE Teacher 0");
    await q("INSERT INTO sections(id,cohort_id,academic_period_id,name,code) VALUES($1,$2,$3,$4,$5)", [section2, ids.cohort, ids.period, "SEC-FILE s2", "SEC-FILE-" + section2.slice(0, 8)]);
    await q("INSERT INTO course_section_deliveries(id,offering_id,section_id) VALUES($1,$2,$3)", [delivery2, ids.offering, section2]);
    await q("INSERT INTO learner_program_enrollments(id,membership_id,program_id,cohort_id,status) VALUES($1,$2,$3,$4,'ACTIVE')", [enrollment.b, learnerBp.membership, ids.program, ids.cohort]);
    await q("INSERT INTO section_enrollments(id,learner_enrollment_id,section_id,academic_period_id) VALUES($1,$2,$3,$4)", [sectionEnrollment.b, enrollment.b, ids.section, ids.period]);
    await q("INSERT INTO learner_program_enrollments(id,membership_id,program_id,cohort_id,status) VALUES($1,$2,$3,$4,'ACTIVE')", [enrollment.c, learnerCp.membership, ids.program, ids.cohort]);
    await q("INSERT INTO section_enrollments(id,learner_enrollment_id,section_id,academic_period_id) VALUES($1,$2,$3,$4)", [sectionEnrollment.c, enrollment.c, section2, ids.period]);
    await q("INSERT INTO course_teaching_assignments(id,delivery_id,membership_id) VALUES($1,$2,$3)", [teaching.t1, ids.delivery, teacher1.membership]);
    await q("INSERT INTO course_teaching_assignments(id,delivery_id,membership_id) VALUES($1,$2,$3)", [teaching.t2, delivery2, teacher2.membership]);
    await q(
      "INSERT INTO course_assignments(id,lesson_id,title,description,max_points,sequence,status,due_at,allowed_submission_methods,created_by_user_id) VALUES($1,$2,$3,'Shared by both sections',10,0,'PUBLISHED',now()+interval '30 days','[\"FILE_UPLOAD\"]'::jsonb,$4)",
      [assignment, ids.lesson, "SEC-FILE assignment", SEED_IDS.collegeAdminUser],
    );
    staged = await stage(learnerA, "a-private.pdf", "A's private file");
    bStaged = await stage(learnerB, "b-private.pdf", "B's private file");
  }, 90_000);

  beforeEach(() => {
    // The fake store keeps the staged objects across tests; nothing here resets it.
  });

  afterAll(async () => {
    try {
      const q = (sql: string, args: unknown[]) => pool.query(sql, args).catch(() => undefined);
      await q("DELETE FROM storage_file_events WHERE subject_id IN (SELECT id FROM assignment_submission_files WHERE assignment_id=$1)", [assignment]);
      await q("DELETE FROM assignment_submission_files WHERE assignment_id=$1", [assignment]);
      await q("DELETE FROM assignment_submissions WHERE assignment_id=$1", [assignment]);
      await q("DELETE FROM course_assignments WHERE id=$1", [assignment]);
      await q("DELETE FROM course_teaching_assignments WHERE id=ANY($1::uuid[])", [[teaching.t1, teaching.t2]]);
      await q("DELETE FROM section_enrollments WHERE id=ANY($1::uuid[])", [[sectionEnrollment.b, sectionEnrollment.c]]);
      await q("DELETE FROM learner_program_enrollments WHERE id=ANY($1::uuid[])", [[enrollment.b, enrollment.c]]);
      await q("DELETE FROM course_section_deliveries WHERE id=$1", [delivery2]);
      await q("DELETE FROM sections WHERE id=$1", [section2]);
      for (const p of [learnerBp, learnerCp, teacher1, teacher2, teacher0]) {
        await q("DELETE FROM membership_roles WHERE id=$1", [p.role]);
        await q("DELETE FROM college_memberships WHERE id=$1", [p.membership]);
        await q("DELETE FROM users WHERE id=$1", [p.user]);
      }
      await cleanupLearnerCourseWriteFixture(pool, fixture);
    } finally {
      await pool.end();
      await closeDatabaseConnection();
    }
  }, 90_000);

  describe("a staged file (uploaded, not yet submitted) is private to its learner", () => {
    it("the owner can fetch it", async () => {
      const own = await issueSubmissionFileDownloadGrant(learnerA, staged.id);
      expect(own.url).toContain("X-Amz-Signature=");
    });

    it("a classmate, a learner in the other section, every teacher and both admins are refused with the same non-leaking error", async () => {
      for (const [who, actor] of [
        ["classmate B", learnerB], ["learner C", learnerC], ["teacher 1 (teaches this section)", t1],
        ["teacher 2", t2], ["teacher 0", t0], ["college admin", admin], ["other college admin", otherCollegeAdmin],
      ] as const) {
        await expect(issueSubmissionFileDownloadGrant(actor, staged.id), who).rejects.toMatchObject(NOT_FOUND);
      }
    });

    it("a refusal looks exactly like a file that does not exist", async () => {
      await expect(issueSubmissionFileDownloadGrant(learnerB, staged.id)).rejects.toMatchObject(NOT_FOUND);
      await expect(issueSubmissionFileDownloadGrant(learnerB, randomUUID())).rejects.toMatchObject(NOT_FOUND);
    });

    it("a classmate cannot complete, remove or list it", async () => {
      await expect(completeSubmissionFileUpload(learnerB, assignment, staged.id)).rejects.toMatchObject(NOT_FOUND);
      await expect(removeStagedSubmissionFile(learnerB, assignment, staged.id)).rejects.toMatchObject(NOT_FOUND);
      const bList = (await listMySubmissionFiles(learnerB, assignment, ids.delivery)).map((f) => f.id);
      expect(bList).toContain(bStaged.id);
      expect(bList).not.toContain(staged.id);
      expect(JSON.stringify(bList)).not.toContain("a-private");
      expect((await fileRow(staged.id)).status).toBe("READY");
    });

    it("a classmate cannot submit it as their own work", async () => {
      await expect(
        submitAssignmentWithFiles(learnerB, assignment, { deliveryId: ids.delivery, fileIds: [staged.id], links: [] }),
      ).rejects.toThrow();
      const state = await fileRow(staged.id);
      expect(state.submission_id).toBeNull();
      expect(state.owner_membership_id).toBe(ids.membership);
    });

    it("a learner in the other section cannot reach it through either section", async () => {
      await expect(
        submitAssignmentWithFiles(learnerC, assignment, { deliveryId: delivery2, fileIds: [staged.id], links: [] }),
      ).rejects.toThrow();
      await expect(removeStagedSubmissionFile(learnerC, assignment, staged.id)).rejects.toThrow();
      expect((await fileRow(staged.id)).submission_id).toBeNull();
    });

    it("learner A likewise cannot touch B's staged file", async () => {
      await expect(issueSubmissionFileDownloadGrant(learnerA, bStaged.id)).rejects.toMatchObject(NOT_FOUND);
      await expect(removeStagedSubmissionFile(learnerA, assignment, bStaged.id)).rejects.toMatchObject(NOT_FOUND);
      expect((await fileRow(bStaged.id)).status).toBe("READY");
    });

    it("none of the refused attempts minted a download grant", async () => {
      // Only the owner's single fetch above may appear in the audit trail for A's file.
      expect(await grantEvents(staged.id)).toBe(1);
      expect(await grantEvents(bStaged.id)).toBe(0);
    });
  });

  describe("a submitted file is visible only to its learner, the section's teacher and the college admin", () => {
    it("the owner submits it", async () => {
      const submitted = await submitAssignmentWithFiles(learnerA, assignment, { deliveryId: ids.delivery, fileIds: [staged.id], links: [] });
      submissionId = submitted.submission.id;
      expect(submitted.files.map((f) => f.id)).toEqual([staged.id]);
    });

    it("the section's teacher and the college admin can fetch and list it", async () => {
      expect((await issueSubmissionFileDownloadGrant(t1, staged.id)).url).toContain("X-Amz-Signature=");
      expect((await issueSubmissionFileDownloadGrant(admin, staged.id)).url).toContain("X-Amz-Signature=");
      expect((await listSubmissionFiles(t1, submissionId)).map((f) => f.id)).toEqual([staged.id]);
      expect((await listSubmissionFiles(admin, submissionId)).map((f) => f.id)).toEqual([staged.id]);
    });

    it("a classmate, the other section, a teacher of nothing and another college's admin cannot", async () => {
      for (const [who, actor] of [
        ["classmate B", learnerB], ["learner C", learnerC], ["teacher 2 (other section)", t2],
        ["teacher 0 (teaches nothing)", t0], ["other college admin", otherCollegeAdmin],
      ] as const) {
        await expect(issueSubmissionFileDownloadGrant(actor, staged.id), who + " download").rejects.toMatchObject(NOT_FOUND);
        await expect(listSubmissionFiles(actor, submissionId), who + " list").rejects.toMatchObject(NOT_FOUND);
      }
    });

    it("the submitted file is locked: nobody can remove it afterwards", async () => {
      for (const [who, actor] of [["owner", learnerA], ["classmate B", learnerB], ["teacher 1", t1]] as const) {
        await expect(removeStagedSubmissionFile(actor, assignment, staged.id), who).rejects.toThrow();
      }
      expect((await fileRow(staged.id)).status).toBe("READY");
      expect(objects.size).toBeGreaterThan(0);
    });

    it("the audit trail holds exactly the grants that were allowed", async () => {
      // owner (staged) + teacher 1 + college admin = 3; every refusal above added nothing.
      expect(await grantEvents(staged.id)).toBe(3);
    });
  });
});
