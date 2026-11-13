import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  getPlacementApplication,
  listOwnPlacementApplications,
  listPlacementJobApplications,
  withdrawPlacementApplication,
} from "@/modules/placements/application-service";
import {
  getOwnLearnerApplicationCompany,
  getOwnLearnerApplicationHistory,
} from "@/modules/placements/learner-application-detail-service";
import { readOwnApplicationResume, updateOwnApplicationResume } from "@/modules/placements/learner-application-resume-service";
import { appendCollegeApplicationNote, getCollegeApplicationDetail } from "@/modules/placements/college-application-detail-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
import {
  cleanupLearnerCareerCalendarFixture,
  newLearnerCareerCalendarFixture,
  seedLearnerCareerCalendarFixture,
} from "../support/learner-career-calendar-fixture";

/**
 * Placement applications: object-level access between people of the SAME college.
 *
 * Learner A owns an application. Learner B is in the same college, same program, fully eligible for placements, so any
 * denial below is about ownership, not eligibility. A TPO and a College Admin of that college may manage applications; a
 * faculty member and a TPO of another college may not. Nothing here may let anyone read, withdraw, edit or annotate an
 * application that is not theirs to touch.
 */
if (!process.env.TEST_DATABASE_URL || process.env.DB03_ISOLATED_TEST_DATABASE !== "1") {
  throw new Error("sec-cross-user-applications needs TEST_DATABASE_URL and DB03_ISOLATED_TEST_DATABASE=1 (disposable database)");
}
assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 });

const fixture = newLearnerCareerCalendarFixture();
const college = fixture.drive.learner.ids.college;
const jobId = fixture.drive.ids.newerJob; // learner A applied here
const otherJobId = fixture.drive.ids.olderJob; // learner B applied here
const applicationA = fixture.applicationId;
const applicationB = randomUUID();

type Person = { user: string; membership: string; role: string };
const person = (): Person => ({ user: randomUUID(), membership: randomUUID(), role: randomUUID() });
const learnerBp = person();
const tpoP = person();
const adminP = person();
const facultyP = person();
const enrollmentB = randomUUID();
const decisionB = randomUUID();

const as = (p: Person, role: "LEARNER" | "TPO" | "COLLEGE_ADMIN" | "FACULTY", collegeId = college): RequestContext => ({
  user: { id: p.user, identityUid: "sec-app-" + p.user, platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: p.membership, collegeId, organizationId: SEED_IDS.organization, status: "ACTIVE", roles: [role] },
});

const learnerA = fixture.drive.learner.context;
const learnerB = as(learnerBp, "LEARNER");
const tpo = as(tpoP, "TPO");
const admin = as(adminP, "COLLEGE_ADMIN");
const faculty = as(facultyP, "FACULTY");
// A TPO of a different college: same platform, wrong college.
const otherCollegeTpo = as(person(), "TPO", SEED_IDS.collegeB);

async function insertPerson(p: Person, role: string, name: string) {
  await pool.query("INSERT INTO users(id,identity_uid,display_name,platform_status) VALUES($1,$2,$3,'ACTIVE')", [p.user, "sec-app-" + p.user, name]);
  await pool.query("INSERT INTO college_memberships(id,user_id,college_id,status) VALUES($1,$2,$3,'ACTIVE')", [p.membership, p.user, college]);
  await pool.query("INSERT INTO membership_roles(id,membership_id,role) VALUES($1,$2,$3)", [p.role, p.membership, role]);
}

const status = async (id: string) =>
  (await pool.query("SELECT status FROM placement_applications WHERE id=$1", [id])).rows[0]?.status as string | undefined;

describe("placement applications: nobody can reach another person's application", () => {
  beforeAll(async () => {
    await seedLearnerCareerCalendarFixture(pool, fixture);
    const { ids } = fixture.drive.learner;
    await insertPerson(learnerBp, "LEARNER", "SEC-APP Learner B");
    await insertPerson(tpoP, "TPO", "SEC-APP TPO");
    await insertPerson(adminP, "COLLEGE_ADMIN", "SEC-APP Admin");
    await insertPerson(facultyP, "FACULTY", "SEC-APP Faculty");
    // Learner B is enrolled in the same program and is eligible, so B is never denied for eligibility reasons.
    await pool.query(
      "INSERT INTO learner_program_enrollments(id,membership_id,program_id,cohort_id,status) VALUES($1,$2,$3,$4,'ACTIVE')",
      [enrollmentB, learnerBp.membership, ids.program, ids.cohort],
    );
    await pool.query(
      "INSERT INTO placement_eligibility_decisions(id,college_id,scope_type,scope_id,status,decided_by_user_id) VALUES($1,$2,'MEMBERSHIP',$3,'ELIGIBLE',$4)",
      [decisionB, college, learnerBp.membership, SEED_IDS.collegeAdminUser],
    );
    await pool.query(
      "INSERT INTO placement_applications(id,job_id,role_option_id,membership_id,channel,status,eligibility_status,eligibility_snapshot,submitted_by_user_id) VALUES($1,$2,$3,$4,'INTERNAL','SUBMITTED','ELIGIBLE','{}'::jsonb,$5)",
      [applicationB, otherJobId, fixture.drive.ids.olderRole, learnerBp.membership, learnerBp.user],
    );
  }, 60_000);

  afterAll(async () => {
    try {
      await pool.query("DELETE FROM placement_application_private_notes WHERE application_id=ANY($1::uuid[])", [[applicationA, applicationB]]).catch(() => undefined);
      await pool.query("DELETE FROM placement_applications WHERE id=$1", [applicationB]);
      await pool.query("DELETE FROM placement_eligibility_decisions WHERE id=$1", [decisionB]);
      await pool.query("DELETE FROM learner_program_enrollments WHERE id=$1", [enrollmentB]);
      for (const p of [learnerBp, tpoP, adminP, facultyP]) {
        await pool.query("DELETE FROM membership_roles WHERE id=$1", [p.role]).catch(() => undefined);
        await pool.query("DELETE FROM college_memberships WHERE id=$1", [p.membership]).catch(() => undefined);
        await pool.query("DELETE FROM users WHERE id=$1", [p.user]).catch(() => undefined);
      }
      await cleanupLearnerCareerCalendarFixture(pool, fixture);
    } finally {
      await pool.end();
      await closeDatabaseConnection();
    }
  }, 60_000);

  describe("reading", () => {
    it("the owner and the college's placement staff can read it", async () => {
      expect((await getPlacementApplication(learnerA, applicationA)).application.id).toBe(applicationA);
      expect((await getPlacementApplication(tpo, applicationA)).application.id).toBe(applicationA);
      expect((await getPlacementApplication(admin, applicationA)).application.id).toBe(applicationA);
    });

    it("learner B is fully entitled to their own application, so the denials below are about ownership", async () => {
      expect((await getPlacementApplication(learnerB, applicationB)).application.id).toBe(applicationB);
      expect(await getOwnLearnerApplicationHistory(learnerB, applicationB)).not.toBeNull();
      expect((await listOwnPlacementApplications(learnerB)).length).toBeGreaterThan(0);
    });

    it("another eligible learner in the same college cannot read it", async () => {
      await expect(getPlacementApplication(learnerB, applicationA)).rejects.toBeInstanceOf(AuthorizationError);
    });

    it("faculty and another college's placement officer cannot read it", async () => {
      await expect(getPlacementApplication(faculty, applicationA)).rejects.toBeInstanceOf(AuthorizationError);
      await expect(getPlacementApplication(otherCollegeTpo, applicationA)).rejects.toBeInstanceOf(AuthorizationError);
    });

    it("each learner's own list holds only their own application", async () => {
      const a = (await listOwnPlacementApplications(learnerA)).map((row) => row.application.id);
      const b = (await listOwnPlacementApplications(learnerB)).map((row) => row.application.id);
      expect(a).toContain(applicationA);
      expect(a).not.toContain(applicationB);
      expect(b).toContain(applicationB);
      expect(b).not.toContain(applicationA);
    });

    it("the learner-facing history and company views return nothing for someone else's application", async () => {
      expect(await getOwnLearnerApplicationHistory(learnerA, applicationA)).not.toBeNull();
      expect(await getOwnLearnerApplicationHistory(learnerB, applicationA)).toBeNull();
      expect(await getOwnLearnerApplicationCompany(learnerB, applicationA)).toBeNull();
    });

    it("the drive's applicant list and the staff detail are closed to learners and faculty", async () => {
      for (const [who, actor] of [["learner A", learnerA], ["learner B", learnerB], ["faculty", faculty], ["other college TPO", otherCollegeTpo]] as const) {
        await expect(listPlacementJobApplications(actor, jobId), who).rejects.toThrow();
        await expect(getCollegeApplicationDetail(actor, jobId, applicationA), who).rejects.toThrow();
      }
      const rows = await listPlacementJobApplications(tpo, jobId);
      expect(rows.map((row) => row.application.id)).toContain(applicationA);
      // The list for one drive never includes an application to a different drive.
      expect(rows.map((row) => row.application.id)).not.toContain(applicationB);
    });

    it("an application cannot be fetched through the wrong drive", async () => {
      await expect(getCollegeApplicationDetail(tpo, otherJobId, applicationA)).rejects.toThrow();
    });
  });

  describe("changing", () => {
    it("another learner cannot withdraw it", async () => {
      await expect(withdrawPlacementApplication(learnerB, applicationA, "Not mine to withdraw")).rejects.toBeInstanceOf(AuthorizationError);
      expect(await status(applicationA)).toBe("SUBMITTED");
    });

    it("placement staff cannot withdraw on a learner's behalf through the learner path", async () => {
      await expect(withdrawPlacementApplication(tpo, applicationA, "Staff trying the learner path")).rejects.toThrow();
      await expect(withdrawPlacementApplication(faculty, applicationA, "Faculty trying")).rejects.toThrow();
      expect(await status(applicationA)).toBe("SUBMITTED");
    });

    it("another learner cannot read or replace the résumé", async () => {
      await expect(readOwnApplicationResume(learnerB, applicationA)).rejects.toThrow();
      await expect(
        updateOwnApplicationResume(learnerB, applicationA, { action: "INITIATE", contentType: "application/pdf", sizeBytes: 1024 }),
      ).rejects.toThrow();
    });

    it("learners and faculty cannot annotate it; staff of another college cannot either", async () => {
      for (const [who, actor] of [["learner A", learnerA], ["learner B", learnerB], ["faculty", faculty], ["other college TPO", otherCollegeTpo]] as const) {
        await expect(appendCollegeApplicationNote(actor, jobId, applicationA, { body: "A note that must not be stored" }), who).rejects.toThrow();
      }
      const notes = await pool.query(
        "SELECT count(*)::int AS n FROM placement_application_private_notes WHERE application_id=$1",
        [applicationA],
      ).catch(() => ({ rows: [{ n: 0 }] }));
      expect(notes.rows[0].n).toBe(0);
    });
  });
});
