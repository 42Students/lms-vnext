import { facultyAssessmentFixtureToken } from "../support/faculty-assessment-token";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import type { MembershipRole } from "@/modules/identity/constants";
import { createProgram } from "@/modules/academics/program-service";
import { createAcademicPeriod } from "@/modules/academics/period-service";
import { createCohort } from "@/modules/academics/cohort-service";
import { createSection } from "@/modules/academics/section-service";
import { createLearnerProgramEnrollment } from "@/modules/academics/enrollment-service";
import { assignLearnerToSection } from "@/modules/academics/roster-service";
import { createCourse } from "@/modules/courses/course-service";
import { createCourseOffering } from "@/modules/courses/offering-service";
import { createCourseSectionDelivery } from "@/modules/courses/delivery-service";
import { createCourseTeachingAssignment } from "@/modules/courses/teaching-assignment-service";
import { createLearningPath, transitionLearningPath } from "@/modules/courses/learning-path-service";
import { createCourseLesson } from "@/modules/courses/lesson-service";
import { createLessonContent, transitionLessonContent } from "@/modules/courses/lesson-content-service";
import { createCourseAssignment, transitionCourseAssignment } from "@/modules/courses/assignment-service";
import {
  completeSubmissionFileUpload,
  issueSubmissionFileDownloadGrant,
  issueSubmissionFileUploadGrant,
  listMySubmissionFiles,
  listSubmissionFiles,
  removeStagedSubmissionFile,
  submitAssignmentWithFiles,
} from "@/modules/courses/assignment-submission-file-service";
import {
  completeVideoThumbnailUpload,
  completeVideoUpload,
  issueVideoPlaybackGrant,
  issueVideoThumbnailUploadGrant,
  issueVideoUploadGrant,
  listLessonVideosForManagement,
  listLessonVideosForViewer,
  removeLessonVideo,
  updateLessonVideo,
} from "@/modules/courses/lesson-video-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import {
  deleted,
  mp4Bytes,
  objects,
  pdfBytes,
  pngBytes,
  putFromGrant,
  resetFakeObjectStore,
  touchObject,
} from "../support/fake-object-store";

vi.mock("@/modules/storage/s3-client", async (importOriginal) => {
  const fake = await import("../support/fake-object-store");
  return {
    ...(await importOriginal<typeof import("@/modules/storage/s3-client")>()),
    headObject: fake.fakeHead,
    getObjectStream: fake.fakeGetObjectStream,
    deleteObject: fake.fakeDelete,
  };
});

const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("TEST_DATABASE_URL or DATABASE_URL is required for DB integration tests");
}
const pool = new Pool({ connectionString: databaseUrl, max: 1 });

const ctx = (userId: string, membershipId: string, collegeId: string, roles: MembershipRole[]): RequestContext => ({
  user: { id: userId, identityUid: `seed-${userId}`, platformStatus: "ACTIVE", systemRoles: [] },
  membership: {
    id: membershipId,
    collegeId,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles,
  },
});
const collegeAdmin = ctx(SEED_IDS.collegeAdminUser, SEED_IDS.collegeAdminMembership, SEED_IDS.collegeA, ["COLLEGE_ADMIN"]);
const faculty = ctx(SEED_IDS.facultyUser, SEED_IDS.facultyCollegeAMembership, SEED_IDS.collegeA, ["FACULTY", "MENTOR"]);
const learner = ctx(SEED_IDS.learnerUser, SEED_IDS.learnerCollegeAMembership, SEED_IDS.collegeA, ["LEARNER"]);
const outsider = ctx(SEED_IDS.facultyUser, SEED_IDS.facultyCollegeBMembership, SEED_IDS.collegeB, ["FACULTY"]);

const PREFIX = "SFV-";

async function cleanup() {
  const q = (text: string) => pool.query(text);
  await q(`delete from storage_file_events where subject_id in (
      select id from assignment_submission_files union select id from lesson_video_assets)`);
  await q(`update lesson_video_assets set replaces_asset_id = null where replaces_asset_id is not null`);
  await q(`delete from lesson_video_assets where lesson_id in (
      select cl.id from course_lessons cl join course_learning_paths lp on lp.id = cl.learning_path_id
      join course_offerings co on co.id = lp.offering_id join courses c on c.id = co.course_id where c.code like '${PREFIX}%')`);
  await q(`delete from assignment_submission_files where assignment_id in (
      select a.id from course_assignments a join course_lessons cl on cl.id = a.lesson_id
      join course_learning_paths lp on lp.id = cl.learning_path_id join course_offerings co on co.id = lp.offering_id
      join courses c on c.id = co.course_id where c.code like '${PREFIX}%')`);
  await q(`delete from assignment_submissions where assignment_id in (
      select a.id from course_assignments a join course_lessons cl on cl.id = a.lesson_id
      join course_learning_paths lp on lp.id = cl.learning_path_id join course_offerings co on co.id = lp.offering_id
      join courses c on c.id = co.course_id where c.code like '${PREFIX}%')`);
  await q(`delete from course_assignments where lesson_id in (
      select cl.id from course_lessons cl join course_learning_paths lp on lp.id = cl.learning_path_id
      join course_offerings co on co.id = lp.offering_id join courses c on c.id = co.course_id where c.code like '${PREFIX}%')`);
  await q(`delete from learner_content_progress where lesson_content_id in (
      select id from lesson_contents where lesson_id in (
        select cl.id from course_lessons cl join course_learning_paths lp on lp.id = cl.learning_path_id
        join course_offerings co on co.id = lp.offering_id join courses c on c.id = co.course_id where c.code like '${PREFIX}%'))`);
  await q(`delete from lesson_contents where lesson_id in (
      select cl.id from course_lessons cl join course_learning_paths lp on lp.id = cl.learning_path_id
      join course_offerings co on co.id = lp.offering_id join courses c on c.id = co.course_id where c.code like '${PREFIX}%')`);
  await q(`delete from course_lessons where learning_path_id in (
      select lp.id from course_learning_paths lp join course_offerings co on co.id = lp.offering_id
      join courses c on c.id = co.course_id where c.code like '${PREFIX}%')`);
  await q(`delete from course_learning_paths where offering_id in (
      select co.id from course_offerings co join courses c on c.id = co.course_id where c.code like '${PREFIX}%')`);
  await q(`delete from course_teaching_assignments where delivery_id in (
      select csd.id from course_section_deliveries csd join course_offerings co on co.id = csd.offering_id
      join courses c on c.id = co.course_id where c.code like '${PREFIX}%')`);
  await q(`delete from course_section_deliveries where offering_id in (
      select co.id from course_offerings co join courses c on c.id = co.course_id where c.code like '${PREFIX}%')`);
  await q(`delete from course_offerings where course_id in (select id from courses where code like '${PREFIX}%')`);
  await q(`delete from courses where code like '${PREFIX}%'`);
  await q(`delete from section_enrollments where learner_enrollment_id in (
      select lpe.id from learner_program_enrollments lpe join programs p on p.id = lpe.program_id where p.code like '${PREFIX}%')`);
  await q(`delete from learner_program_enrollments where program_id in (select id from programs where code like '${PREFIX}%')`);
  await q(`delete from sections where cohort_id in (
      select c.id from cohorts c join programs p on p.id = c.program_id where p.code like '${PREFIX}%')`);
  await q(`delete from cohorts where program_id in (select id from programs where code like '${PREFIX}%')`);
  await q(`delete from programs where code like '${PREFIX}%'`);
  await q(`delete from academic_periods where code like '${PREFIX}%'`);
}

async function createStructure() {
  const program = await createProgram(collegeAdmin, {
    departmentId: SEED_IDS.departmentA,
    name: "SFV Computer Science",
    code: "SFV-PROGRAM",
    durationTerms: 8,
  });
  const period = await createAcademicPeriod(collegeAdmin, {
    collegeId: SEED_IDS.collegeA,
    name: "SFV Semester 1",
    code: "SFV-PERIOD",
    startDate: "2026-07-01",
    endDate: "2027-12-31",
  });
  const cohort = await createCohort(collegeAdmin, {
    programId: program.id,
    name: "SFV 2026 Intake",
    code: "SFV-COHORT",
    startPeriodId: period.id,
  });
  const sectionA = await createSection(collegeAdmin, {
    cohortId: cohort.id,
    academicPeriodId: period.id,
    name: "SFV Section A",
    code: "SFV-A",
    capacity: 60,
  });
  const sectionB = await createSection(collegeAdmin, {
    cohortId: cohort.id,
    academicPeriodId: period.id,
    name: "SFV Section B",
    code: "SFV-B",
    capacity: 60,
  });
  const course = await createCourse(collegeAdmin, {
    departmentId: SEED_IDS.departmentA,
    name: "SFV Data Structures",
    code: "SFV-DS",
  });
  const offering = await createCourseOffering(collegeAdmin, {
    courseId: course.id,
    cohortId: cohort.id,
    academicPeriodId: period.id,
    type: "CORE",
    credits: 4,
    displayOrder: 0,
  });
  const deliveryA = await createCourseSectionDelivery(collegeAdmin, { offeringId: offering.id, sectionId: sectionA.id });
  const deliveryB = await createCourseSectionDelivery(collegeAdmin, { offeringId: offering.id, sectionId: sectionB.id });
  await createCourseTeachingAssignment(collegeAdmin, {
    deliveryId: deliveryA.id,
    membershipId: SEED_IDS.facultyCollegeAMembership,
    role: "PRIMARY",
  });
  const enrollment = await createLearnerProgramEnrollment(collegeAdmin, {
    membershipId: SEED_IDS.learnerCollegeAMembership,
    programId: program.id,
    cohortId: cohort.id,
  });
  await assignLearnerToSection(collegeAdmin, { learnerEnrollmentId: enrollment.id, sectionId: sectionA.id });
  const path = await createLearningPath(collegeAdmin, { offeringId: offering.id, title: "SFV Learning Path" });
  const lesson = await createCourseLesson(collegeAdmin, { learningPathId: path.id, name: "SFV Arrays", sequence: 0 });
  await transitionLearningPath(collegeAdmin, path.id, { action: "PUBLISH" });
  return { offering, deliveryA, deliveryB, path, lesson };
}

async function publishedAssignment(structure: Awaited<ReturnType<typeof createStructure>>) {
  const assignment = await createCourseAssignment(faculty, {
    lessonId: structure.lesson.id,
    deliveryId: structure.deliveryA.id,
    title: "SFV File Assignment",
    dueAt: "2027-12-01T12:00:00.000Z",
    maxPoints: 10,
    sequence: 0,
  });
  await transitionCourseAssignment(faculty, assignment.id, {
    ...(await facultyAssessmentFixtureToken(pool, "ASSIGNMENT", assignment.id)),
    action: "PUBLISH",
  });
  return assignment;
}

async function stagedReadyFile(
  assignmentId: string,
  deliveryId: string,
  name = "report.pdf",
  extra = "body",
) {
  const bytes = pdfBytes(extra);
  const { grant, file } = await issueSubmissionFileUploadGrant(learner, assignmentId, {
    deliveryId,
    originalName: name,
    contentType: "application/pdf",
    sizeBytes: bytes.length,
  });
  putFromGrant(grant, bytes);
  const done = await completeSubmissionFileUpload(learner, assignmentId, file.id);
  return { done, grant };
}

beforeAll(() => {
  process.env.APP_ENV = "test";
  process.env.R2_ACCOUNT_ID = "test-account";
  process.env.R2_ACCESS_KEY = "TESTACCESSKEYID";
  process.env.R2_SECRET_KEY = "test-secret-not-real";
  process.env.R2_PRIVATE_BUCKET = "test-private";
  delete process.env.R2_BUCKET_NAME;
  delete process.env.R2_PRIVATE_PREFIX;
});

beforeEach(async () => {
  resetFakeObjectStore();
  await cleanup();
});

afterAll(async () => {
  await cleanup();
  await pool.end();
  await closeDatabaseConnection();
});

describe("assignment submission files against PostgreSQL", () => {
  it("runs upload, verification, submit, grants and audit end to end", async () => {
    const structure = await createStructure();
    const assignment = await publishedAssignment(structure);
    const { done } = await stagedReadyFile(assignment.id, structure.deliveryA.id);
    expect(done).toMatchObject({ status: "READY", submissionId: null, originalName: "report.pdf" });
    expect(JSON.stringify(done)).not.toMatch(/private\/|https?:/);

    // A staged file is private to the learner: faculty cannot fetch it before submission.
    await expect(issueSubmissionFileDownloadGrant(faculty, done.id)).rejects.toMatchObject({ code: "STORAGE_NOT_FOUND" });
    await expect(issueSubmissionFileDownloadGrant(outsider, done.id)).rejects.toMatchObject({ code: "STORAGE_NOT_FOUND" });
    const own = await issueSubmissionFileDownloadGrant(learner, done.id, { disposition: "inline" });
    expect(own.url).toContain("X-Amz-Signature=");
    expect(own.expiresInSeconds).toBeLessThanOrEqual(900);
    expect(new URL(own.url).searchParams.get("response-content-disposition")).toMatch(/^inline;/);

    const submitted = await submitAssignmentWithFiles(learner, assignment.id, {
      deliveryId: structure.deliveryA.id,
      fileIds: [done.id],
      links: [],
    });
    expect(submitted.submission.submissionType).toBe("FILE");
    expect(submitted.files).toMatchObject([{ id: done.id, sequence: 0, status: "READY" }]);

    await expect(
      submitAssignmentWithFiles(learner, assignment.id, { deliveryId: structure.deliveryA.id, fileIds: [done.id], links: [] }),
    ).rejects.toMatchObject({ code: "STORAGE_ALREADY_SUBMITTED" });
    await expect(
      issueSubmissionFileUploadGrant(learner, assignment.id, {
        deliveryId: structure.deliveryA.id,
        originalName: "again.pdf",
        contentType: "application/pdf",
        sizeBytes: 100,
      }),
    ).rejects.toMatchObject({ code: "STORAGE_ALREADY_SUBMITTED" });
    await expect(removeStagedSubmissionFile(learner, assignment.id, done.id)).rejects.toMatchObject({
      code: "STORAGE_ALREADY_SUBMITTED",
    });

    // After submission the teaching faculty and the college admin can fetch it; strangers cannot.
    const forFaculty = await issueSubmissionFileDownloadGrant(faculty, done.id);
    const forAdmin = await issueSubmissionFileDownloadGrant(collegeAdmin, done.id);
    expect(forFaculty.url).toContain("X-Amz-Signature=");
    expect(forAdmin.file.id).toBe(done.id);
    await expect(issueSubmissionFileDownloadGrant(outsider, done.id)).rejects.toMatchObject({ code: "STORAGE_NOT_FOUND" });

    expect((await listSubmissionFiles(faculty, submitted.submission.id)).map((f) => f.id)).toEqual([done.id]);
    await expect(listSubmissionFiles(outsider, submitted.submission.id)).rejects.toMatchObject({ code: "STORAGE_NOT_FOUND" });
    expect(await listMySubmissionFiles(learner, assignment.id, structure.deliveryA.id)).toHaveLength(1);

    const events = await pool.query<{ event_type: string; detail: unknown }>(
      `select event_type, detail from storage_file_events where subject_id = $1 order by occurred_at, event_type`,
      [done.id],
    );
    const types = events.rows.map((row) => row.event_type);
    expect(types).toEqual(
      expect.arrayContaining(["UPLOAD_GRANTED", "UPLOAD_COMPLETED", "SCAN_ATTESTED", "DOWNLOAD_GRANTED", "SUBMITTED"]),
    );
    expect(types.filter((type) => type === "DOWNLOAD_GRANTED")).toHaveLength(3);
    expect(JSON.stringify(events.rows)).not.toMatch(/https?:|X-Amz|private\//);

    const activity = await pool.query(
      `select 1 from activity_events where event_type = 'courses.assignment.submitted' and subject_id = $1`,
      [assignment.id],
    );
    expect(activity.rowCount).toBe(1);
  });

  it("quarantines content that does not match its declared type and deletes the object", async () => {
    const structure = await createStructure();
    const assignment = await publishedAssignment(structure);
    const html = new TextEncoder().encode("<html><script>alert(1)</script></html>");
    const { grant, file } = await issueSubmissionFileUploadGrant(learner, assignment.id, {
      deliveryId: structure.deliveryA.id,
      originalName: "evil.pdf",
      contentType: "application/pdf",
      sizeBytes: html.length,
    });
    putFromGrant(grant, html);
    await expect(completeSubmissionFileUpload(learner, assignment.id, file.id)).rejects.toMatchObject({
      code: "STORAGE_CONTENT_REJECTED",
    });
    const row = await pool.query(`select status, scan_status, failure_code from assignment_submission_files where id = $1`, [file.id]);
    expect(row.rows[0]).toMatchObject({ status: "QUARANTINED", scan_status: "REJECTED", failure_code: "STORAGE_CONTENT_REJECTED" });
    expect(deleted.length).toBe(1);
    await expect(issueSubmissionFileDownloadGrant(learner, file.id)).rejects.toMatchObject({ code: "STORAGE_FILE_NOT_READY" });
    await expect(
      submitAssignmentWithFiles(learner, assignment.id, { deliveryId: structure.deliveryA.id, fileIds: [file.id], links: [] }),
    ).rejects.toMatchObject({ code: "STORAGE_FILE_NOT_READY" });
  });

  it("fails a tampered upload (wrong size) and an unfinished upload without serving anything", async () => {
    const structure = await createStructure();
    const assignment = await publishedAssignment(structure);
    const bytes = pdfBytes();
    const { grant, file } = await issueSubmissionFileUploadGrant(learner, assignment.id, {
      deliveryId: structure.deliveryA.id,
      originalName: "a.pdf",
      contentType: "application/pdf",
      sizeBytes: bytes.length,
    });
    await expect(completeSubmissionFileUpload(learner, assignment.id, file.id)).rejects.toMatchObject({
      code: "STORAGE_UPLOAD_NOT_FOUND",
    });
    putFromGrant(grant, pdfBytes("a much longer body than the declared one"));
    await expect(completeSubmissionFileUpload(learner, assignment.id, file.id)).rejects.toMatchObject({
      code: "STORAGE_UPLOAD_MISMATCH",
    });
    const row = await pool.query(`select status from assignment_submission_files where id = $1`, [file.id]);
    expect(row.rows[0].status).toBe("FAILED");
  });

  it("does not serve a READY file whose object was overwritten after attestation", async () => {
    const structure = await createStructure();
    const assignment = await publishedAssignment(structure);
    const { done } = await stagedReadyFile(assignment.id, structure.deliveryA.id);
    const key = [...objects.keys()][0]!;
    touchObject(key);
    await expect(issueSubmissionFileDownloadGrant(learner, done.id)).rejects.toMatchObject({ code: "STORAGE_FILE_NOT_READY" });
  });

  it("enforces per-learner staging limits, ownership and non-leaking denials", async () => {
    const structure = await createStructure();
    const assignment = await publishedAssignment(structure);
    for (let index = 0; index < 10; index += 1) {
      await issueSubmissionFileUploadGrant(learner, assignment.id, {
        deliveryId: structure.deliveryA.id,
        originalName: `f${index}.pdf`,
        contentType: "application/pdf",
        sizeBytes: 100 + index,
      });
    }
    await expect(
      issueSubmissionFileUploadGrant(learner, assignment.id, {
        deliveryId: structure.deliveryA.id,
        originalName: "f11.pdf",
        contentType: "application/pdf",
        sizeBytes: 100,
      }),
    ).rejects.toMatchObject({ code: "STORAGE_FILE_LIMIT_REACHED" });
    await expect(
      issueSubmissionFileUploadGrant(learner, assignment.id, {
        deliveryId: structure.deliveryA.id,
        originalName: "x.exe",
        contentType: "application/x-msdownload",
        sizeBytes: 100,
      }),
    ).rejects.toMatchObject({ code: "STORAGE_TYPE_NOT_ALLOWED" });
    await expect(
      issueSubmissionFileUploadGrant(faculty, assignment.id, {
        deliveryId: structure.deliveryA.id,
        originalName: "f.pdf",
        contentType: "application/pdf",
        sizeBytes: 100,
      }),
    ).rejects.toMatchObject({ code: "STORAGE_NOT_FOUND" });
    await expect(
      issueSubmissionFileUploadGrant(learner, assignment.id, {
        deliveryId: structure.deliveryB.id,
        originalName: "f.pdf",
        contentType: "application/pdf",
        sizeBytes: 100,
      }),
    ).rejects.toMatchObject({ code: "STORAGE_NOT_FOUND" });
  });

  it("lets the learner remove a staged file", async () => {
    const structure = await createStructure();
    const assignment = await publishedAssignment(structure);
    const { done } = await stagedReadyFile(assignment.id, structure.deliveryA.id);
    const removed = await removeStagedSubmissionFile(learner, assignment.id, done.id);
    expect(removed.status).toBe("DELETED");
    expect(await listMySubmissionFiles(learner, assignment.id, structure.deliveryA.id)).toEqual([]);
    await expect(issueSubmissionFileDownloadGrant(learner, done.id)).rejects.toMatchObject({ code: "STORAGE_NOT_FOUND" });
  });
});

describe("database guarantees for submission files", () => {
  it("rejects a FILE submission without a READY file at commit and cross-college owner pairs", async () => {
    const structure = await createStructure();
    const assignment = await publishedAssignment(structure);

    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query(
        `insert into assignment_submissions (assignment_id, delivery_id, membership_id, submission_type)
         values ($1, $2, $3, 'FILE')`,
        [assignment.id, structure.deliveryA.id, SEED_IDS.learnerCollegeAMembership],
      );
      await expect(client.query("commit")).rejects.toMatchObject({
        constraint: "assignment_submissions_file_required_trg",
      });
    } finally {
      await client.query("rollback").catch(() => undefined);
      client.release();
    }

    // Composite tenant FK: the owner membership must belong to the stated college.
    const objectKey = `private/${SEED_IDS.collegeB}/${SEED_IDS.learnerCollegeAMembership}/assignment-submission/70000000-0000-4000-8000-000000000001`;
    await expect(
      pool.query(
        `insert into assignment_submission_files
          (college_id, assignment_id, delivery_id, owner_membership_id, object_key, upload_token_hash,
           upload_expires_at, original_name, declared_content_type, declared_size_bytes, created_by_user_id)
         values ($1,$2,$3,$4,$5,$6, now() + interval '10 minutes','a.pdf','application/pdf',10,$7)`,
        [SEED_IDS.collegeB, assignment.id, structure.deliveryA.id, SEED_IDS.learnerCollegeAMembership, objectKey, "a".repeat(64), SEED_IDS.learnerUser],
      ),
    ).rejects.toMatchObject({ constraint: "assignment_submission_files_owner_college_fk" });
  });

  it("checks sizes, statuses, key scope and the READY invariant", async () => {
    const structure = await createStructure();
    const assignment = await publishedAssignment(structure);
    const base = [
      SEED_IDS.collegeA,
      assignment.id,
      structure.deliveryA.id,
      SEED_IDS.learnerCollegeAMembership,
      SEED_IDS.learnerUser,
    ];
    const insert = (key: string, size: number, status = "UPLOADING") =>
      pool.query(
        `insert into assignment_submission_files
          (college_id, assignment_id, delivery_id, owner_membership_id, created_by_user_id, object_key, upload_token_hash,
           upload_expires_at, original_name, declared_content_type, declared_size_bytes, status)
         values ($1,$2,$3,$4,$5,$6,$7, now() + interval '10 minutes','a.pdf','application/pdf',$8,$9)`,
        [...base, key, "b".repeat(64), size, status],
      );
    const goodKey = (id: string) =>
      `private/${SEED_IDS.collegeA}/${SEED_IDS.learnerCollegeAMembership}/assignment-submission/${id}`;

    await expect(insert(goodKey("70000000-0000-4000-8000-000000000011"), 52428801)).rejects.toMatchObject({
      constraint: "assignment_submission_files_declared_size_ck",
    });
    await expect(insert(goodKey("70000000-0000-4000-8000-000000000012"), 0)).rejects.toMatchObject({
      constraint: "assignment_submission_files_declared_size_ck",
    });
    await expect(insert("private/other/scope/assignment-submission/x", 10)).rejects.toMatchObject({
      constraint: "assignment_submission_files_object_key_ck",
    });
    await expect(insert(goodKey("70000000-0000-4000-8000-000000000013"), 10, "BOGUS")).rejects.toMatchObject({
      constraint: "assignment_submission_files_status_ck",
    });
    await expect(insert(goodKey("70000000-0000-4000-8000-000000000014"), 10, "READY")).rejects.toMatchObject({
      constraint: "assignment_submission_files_ready_ck",
    });
    await insert(goodKey("70000000-0000-4000-8000-000000000015"), 52428800);
    await expect(insert(goodKey("70000000-0000-4000-8000-000000000015"), 10)).rejects.toMatchObject({
      constraint: "assignment_submission_files_object_key_uq",
    });
  });
});

async function videoFixture() {
  const structure = await createStructure();
  const bytes = mp4Bytes();
  const upload = async (ctxUser: RequestContext, extra: Record<string, unknown> = {}) => {
    const { grant, video } = await issueVideoUploadGrant(ctxUser, structure.lesson.id, {
      title: "Arrays lecture",
      originalName: "lecture.mp4",
      contentType: "video/mp4",
      sizeBytes: bytes.length,
      durationSeconds: 600,
      deliveryId: structure.deliveryA.id,
      ...extra,
    });
    putFromGrant(grant, bytes);
    const done = await completeVideoUpload(ctxUser, video.id);
    return { video, done };
  };
  return { structure, bytes, upload };
}

describe("lesson videos against PostgreSQL", () => {
  it("keeps a verified draft away from learners until it is published and visible", async () => {
    const { structure, upload } = await videoFixture();
    const { done } = await upload(faculty);
    expect(done).toMatchObject({ processingStatus: "READY", publishStatus: "DRAFT", durationSeconds: 600 });

    expect(await listLessonVideosForViewer(learner, structure.lesson.id, structure.deliveryA.id)).toEqual([]);
    await expect(
      issueVideoPlaybackGrant(learner, done.id, { deliveryId: structure.deliveryA.id }),
    ).rejects.toMatchObject({ code: "STORAGE_NOT_FOUND" });
    // Instructors can preview a verified draft.
    const preview = await issueVideoPlaybackGrant(faculty, done.id, { deliveryId: structure.deliveryA.id });
    expect(preview.supportsRange).toBe(true);

    const published = await updateLessonVideo(faculty, done.id, { publishStatus: "PUBLISHED" });
    expect(published.publishStatus).toBe("PUBLISHED");
    const listed = await listLessonVideosForViewer(learner, structure.lesson.id, structure.deliveryA.id);
    expect(listed).toMatchObject([{ id: done.id, title: "Arrays lecture", durationSeconds: 600 }]);
    expect(JSON.stringify(listed)).not.toMatch(/objectKey|private\/|processingStatus/);

    const grant = await issueVideoPlaybackGrant(learner, done.id, { deliveryId: structure.deliveryA.id, ttlSeconds: 600 });
    expect(grant.url).toContain("X-Amz-Signature=");
    expect(grant.expiresInSeconds).toBe(600);
    expect(grant.contentType).toBe("video/mp4");
    expect(grant.resumePositionSeconds).toBe(0);
    const defaultTtl = await issueVideoPlaybackGrant(learner, done.id, { deliveryId: structure.deliveryA.id });
    expect(defaultTtl.expiresInSeconds).toBe(3600);

    // Hidden from learners but still playable by staff.
    await updateLessonVideo(faculty, done.id, { visibleToStudents: false });
    await expect(
      issueVideoPlaybackGrant(learner, done.id, { deliveryId: structure.deliveryA.id }),
    ).rejects.toMatchObject({ code: "STORAGE_NOT_FOUND" });
    expect((await listLessonVideosForManagement(faculty, structure.lesson.id, structure.deliveryA.id))).toHaveLength(1);

    // Wrong delivery, other college and unauthenticated-style contexts are all non-leaking.
    await expect(
      issueVideoPlaybackGrant(learner, done.id, { deliveryId: structure.deliveryB.id }),
    ).rejects.toMatchObject({ code: "STORAGE_NOT_FOUND" });
    await expect(
      issueVideoPlaybackGrant(outsider, done.id, { deliveryId: structure.deliveryA.id }),
    ).rejects.toMatchObject({ code: "STORAGE_NOT_FOUND" });

    const events = await pool.query<{ event_type: string; detail: unknown }>(
      `select event_type, detail from storage_file_events where subject_id = $1`,
      [done.id],
    );
    const types = events.rows.map((row) => row.event_type);
    expect(types.filter((type) => type === "PLAYBACK_GRANTED")).toHaveLength(3);
    expect(types).toEqual(expect.arrayContaining(["UPLOAD_GRANTED", "SCAN_ATTESTED", "PUBLISHED", "UPDATED"]));
    expect(JSON.stringify(events.rows)).not.toMatch(/https?:|X-Amz|private\//);
  });

  it("restricts management to admins and faculty teaching that delivery", async () => {
    const { structure, upload } = await videoFixture();
    await expect(
      issueVideoUploadGrant(faculty, structure.lesson.id, {
        title: "Section B video",
        originalName: "b.mp4",
        contentType: "video/mp4",
        sizeBytes: 100,
        deliveryId: structure.deliveryB.id,
      }),
    ).rejects.toMatchObject({ code: "FACULTY_TEACHING_SCOPE_REQUIRED" });
    await expect(
      issueVideoUploadGrant(faculty, structure.lesson.id, {
        title: "Whole offering",
        originalName: "b.mp4",
        contentType: "video/mp4",
        sizeBytes: 100,
      }),
    ).rejects.toMatchObject({ code: "STORAGE_FORBIDDEN" });
    await expect(
      issueVideoUploadGrant(learner, structure.lesson.id, {
        title: "Learner video",
        originalName: "l.mp4",
        contentType: "video/mp4",
        sizeBytes: 100,
        deliveryId: structure.deliveryA.id,
      }),
    ).rejects.toBeTruthy();
    await expect(
      issueVideoUploadGrant(faculty, structure.lesson.id, {
        title: "Too big",
        originalName: "b.mp4",
        contentType: "video/mp4",
        sizeBytes: 5_200_000_000,
        deliveryId: structure.deliveryA.id,
      }),
    ).rejects.toMatchObject({ code: "STORAGE_FILE_TOO_LARGE" });

    const adminVideo = await issueVideoUploadGrant(collegeAdmin, structure.lesson.id, {
      title: "Whole offering admin video",
      originalName: "a.mp4",
      contentType: "video/mp4",
      sizeBytes: 100,
    });
    expect(adminVideo.video.deliveryId).toBeNull();

    const { done } = await upload(faculty);
    await expect(updateLessonVideo(outsider, done.id, { title: "hijack" })).rejects.toBeTruthy();
    await expect(removeLessonVideo(learner, done.id)).rejects.toBeTruthy();
  });

  it("rejects mismatched bytes, never publishes unverified videos and survives replacement", async () => {
    const { structure, upload, bytes } = await videoFixture();

    const bad = await issueVideoUploadGrant(faculty, structure.lesson.id, {
      title: "Not a video",
      originalName: "fake.mp4",
      contentType: "video/mp4",
      sizeBytes: 50,
      deliveryId: structure.deliveryA.id,
    });
    putFromGrant(bad.grant, new TextEncoder().encode("x".repeat(50)));
    await expect(completeVideoUpload(faculty, bad.video.id)).rejects.toMatchObject({ code: "STORAGE_CONTENT_REJECTED" });
    const status = await pool.query(`select processing_status, scan_status from lesson_video_assets where id = $1`, [bad.video.id]);
    expect(status.rows[0]).toMatchObject({ processing_status: "BLOCKED", scan_status: "REJECTED" });
    await expect(updateLessonVideo(faculty, bad.video.id, { publishStatus: "PUBLISHED" })).rejects.toMatchObject({
      code: "STORAGE_FILE_NOT_READY",
    });
    // The database also refuses a PUBLISHED video that is not READY.
    await expect(
      pool.query(`update lesson_video_assets set publish_status = 'PUBLISHED' where id = $1`, [bad.video.id]),
    ).rejects.toMatchObject({ constraint: "lesson_video_assets_published_ready_ck" });

    const { done: original } = await upload(faculty);
    await updateLessonVideo(faculty, original.id, { publishStatus: "PUBLISHED", sequence: 3 });
    const replacement = await issueVideoUploadGrant(faculty, structure.lesson.id, {
      title: "Arrays lecture v2",
      originalName: "lecture2.mp4",
      contentType: "video/mp4",
      sizeBytes: bytes.length,
      deliveryId: structure.deliveryA.id,
      replaceVideoId: original.id,
    });
    // While the replacement is in flight the original keeps playing.
    expect(
      (await issueVideoPlaybackGrant(learner, original.id, { deliveryId: structure.deliveryA.id })).supportsRange,
    ).toBe(true);
    putFromGrant(replacement.grant, bytes);
    const finished = await completeVideoUpload(faculty, replacement.video.id);
    expect(finished).toMatchObject({ processingStatus: "READY", publishStatus: "PUBLISHED", sequence: 3 });
    await expect(
      issueVideoPlaybackGrant(learner, original.id, { deliveryId: structure.deliveryA.id }),
    ).rejects.toMatchObject({ code: "STORAGE_NOT_FOUND" });
    const learnerList = await listLessonVideosForViewer(learner, structure.lesson.id, structure.deliveryA.id);
    expect(learnerList.map((video) => video.id)).toEqual([finished.id]);
    expect(deleted.length).toBeGreaterThanOrEqual(2);

    const removed = await removeLessonVideo(faculty, finished.id);
    expect(removed.deleted).toBe(true);
    await expect(
      issueVideoPlaybackGrant(learner, finished.id, { deliveryId: structure.deliveryA.id }),
    ).rejects.toMatchObject({ code: "STORAGE_NOT_FOUND" });
    expect(await listLessonVideosForViewer(learner, structure.lesson.id, structure.deliveryA.id)).toEqual([]);
  });

  it("follows the linked lesson content visibility and returns the saved resume position", async () => {
    const { structure, upload } = await videoFixture();
    const { done } = await upload(faculty);
    const content = await createLessonContent(collegeAdmin, {
      lessonId: structure.lesson.id,
      contentType: "VIDEO",
      points: 1,
      title: "Arrays video",
      sequence: 0,
      storageKey: `video-asset/${done.id}`,
      durationSeconds: 600,
    });
    await updateLessonVideo(faculty, done.id, { publishStatus: "PUBLISHED", lessonContentId: content.id });
    // Content is still a draft, so learners cannot see the video.
    expect(await listLessonVideosForViewer(learner, structure.lesson.id, structure.deliveryA.id)).toEqual([]);
    await transitionLessonContent(collegeAdmin, content.id, { action: "PUBLISH" });
    expect(await listLessonVideosForViewer(learner, structure.lesson.id, structure.deliveryA.id)).toHaveLength(1);

    await pool.query(
      `insert into learner_content_progress (membership_id, lesson_content_id, last_position_seconds) values ($1, $2, 125)`,
      [SEED_IDS.learnerCollegeAMembership, content.id],
    );
    const grant = await issueVideoPlaybackGrant(learner, done.id, { deliveryId: structure.deliveryA.id });
    expect(grant.resumePositionSeconds).toBe(125);

    await pool.query(`update lesson_contents set visible_to_students = false where id = $1`, [content.id]);
    await expect(
      issueVideoPlaybackGrant(learner, done.id, { deliveryId: structure.deliveryA.id }),
    ).rejects.toMatchObject({ code: "STORAGE_NOT_FOUND" });
  });

  it("supports an optional thumbnail that is returned only with a playback grant", async () => {
    const { structure, upload } = await videoFixture();
    const { done } = await upload(faculty);
    await updateLessonVideo(faculty, done.id, { publishStatus: "PUBLISHED" });
    const png = pngBytes();
    const grant = await issueVideoThumbnailUploadGrant(faculty, done.id, {
      originalName: "poster.png",
      contentType: "image/png",
      sizeBytes: png.length,
    });
    putFromGrant(grant.grant, png);
    const withThumb = await completeVideoThumbnailUpload(faculty, done.id);
    expect(withThumb.thumbnailStatus).toBe("READY");
    const playback = await issueVideoPlaybackGrant(learner, done.id, { deliveryId: structure.deliveryA.id });
    expect(playback.thumbnailUrl).toContain("X-Amz-Signature=");
    expect(playback.video.hasThumbnail).toBe(true);

    await expect(
      issueVideoThumbnailUploadGrant(faculty, done.id, {
        originalName: "poster.gif",
        contentType: "image/gif",
        sizeBytes: 10,
      }),
    ).rejects.toMatchObject({ code: "STORAGE_TYPE_NOT_ALLOWED" });
  });
});
