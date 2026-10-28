import { randomUUID } from "node:crypto";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { Pool } from "pg";
import { ZodError } from "zod";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
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
import {
  createLearningPath,
  listLearningPaths,
  transitionLearningPath,
} from "@/modules/courses/learning-path-service";
import {
  createCourseLesson,
  listCourseLessons,
} from "@/modules/courses/lesson-service";
import {
  createLessonContent,
  getAuthorizedLessonContent,
  listLessonContents,
  transitionLessonContent,
  updateLessonContent,
} from "@/modules/courses/lesson-content-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import {
  getLearnerCourseWorkspace,
  listLearnerCourseDeliveries,
} from "@/modules/courses/learner-course-service";
import {
  getLearnerContentProgress,
  listMyLearnerContentProgressBatch,
} from "@/modules/courses/progress-service";

const databaseUrl =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL or DATABASE_URL is required for DB integration tests",
  );
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
});

const collegeAdmin: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser,
    identityUid: "seed-college-admin",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.collegeAdminMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["COLLEGE_ADMIN"],
  },
};

const faculty: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "seed-faculty",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["FACULTY", "MENTOR"],
  },
};

// Give this suite its own learner; the seed learner already has an ACTIVE
// program enrollment and must not be reused for unrelated course fixtures.
const learnerUserId = randomUUID();
const learnerMembershipId = randomUUID();
const learner: RequestContext = {
  user: {
    id: learnerUserId,
    identityUid: `c2-fixture-${learnerUserId}`,
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: learnerMembershipId,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["LEARNER"],
  },
};

async function cleanupC2() {
  await pool.query(
    `delete from lesson_contents
     where lesson_id in (
       select cl.id
       from course_lessons cl
       join course_learning_paths lp
         on lp.id = cl.learning_path_id
       join course_offerings co
         on co.id = lp.offering_id
       join courses c on c.id = co.course_id
       where c.code like 'C2-%'
     )`,
  );
  await pool.query(
    `delete from course_lessons
     where learning_path_id in (
       select lp.id
       from course_learning_paths lp
       join course_offerings co
         on co.id = lp.offering_id
       join courses c on c.id = co.course_id
       where c.code like 'C2-%'
     )`,
  );
  await pool.query(
    `delete from course_learning_paths
     where offering_id in (
       select co.id
       from course_offerings co
       join courses c on c.id = co.course_id
       where c.code like 'C2-%'
     )`,
  );
  await pool.query(
    `delete from course_teaching_assignments
     where delivery_id in (
       select csd.id
       from course_section_deliveries csd
       join course_offerings co
         on co.id = csd.offering_id
       join courses c on c.id = co.course_id
       where c.code like 'C2-%'
     )`,
  );
  await pool.query(
    `delete from course_section_deliveries
     where offering_id in (
       select co.id
       from course_offerings co
       join courses c on c.id = co.course_id
       where c.code like 'C2-%'
     )`,
  );
  await pool.query(
    `delete from course_offerings
     where course_id in (
       select id from courses
       where code like 'C2-%'
     )`,
  );
  await pool.query(
    "delete from courses where code like 'C2-%'",
  );

  await pool.query(
    `delete from section_enrollments
     where learner_enrollment_id in (
       select lpe.id
       from learner_program_enrollments lpe
       join programs p on p.id = lpe.program_id
       where p.code like 'C2-%'
     )`,
  );
  await pool.query(
    `delete from learner_program_enrollments
     where program_id in (
       select id from programs
       where code like 'C2-%'
     )`,
  );
  await pool.query(
    `delete from sections
     where cohort_id in (
       select c.id
       from cohorts c
       join programs p on p.id = c.program_id
       where p.code like 'C2-%'
     )`,
  );
  await pool.query(
    `delete from cohorts
     where program_id in (
       select id from programs
       where code like 'C2-%'
     )`,
  );
  await pool.query(
    "delete from programs where code like 'C2-%'",
  );
  await pool.query(
    "delete from academic_periods where code like 'C2-%'",
  );
}

async function createStructure() {
  const program = await createProgram(
    collegeAdmin,
    {
      departmentId: SEED_IDS.departmentA,
      name: "C2 Computer Science",
      code: "C2-PROGRAM",
      durationTerms: 8,
    },
  );
  const period = await createAcademicPeriod(
    collegeAdmin,
    {
      collegeId: SEED_IDS.collegeA,
      name: "C2 Semester 1",
      code: "C2-PERIOD",
      startDate: "2026-07-01",
      endDate: "2026-12-15",
    },
  );
  const cohort = await createCohort(
    collegeAdmin,
    {
      programId: program.id,
      name: "C2 2026 Intake",
      code: "C2-COHORT",
      startPeriodId: period.id,
    },
  );
  const sectionA = await createSection(
    collegeAdmin,
    {
      cohortId: cohort.id,
      academicPeriodId: period.id,
      name: "C2 Section A",
      code: "C2-A",
      capacity: 60,
    },
  );
  const sectionB = await createSection(
    collegeAdmin,
    {
      cohortId: cohort.id,
      academicPeriodId: period.id,
      name: "C2 Section B",
      code: "C2-B",
      capacity: 60,
    },
  );
  const course = await createCourse(
    collegeAdmin,
    {
      departmentId: SEED_IDS.departmentA,
      name: "C2 Data Structures",
      code: "C2-DS",
    },
  );
  const offering = await createCourseOffering(
    collegeAdmin,
    {
      courseId: course.id,
      cohortId: cohort.id,
      academicPeriodId: period.id,
      type: "CORE",
      credits: 4,
      displayOrder: 0,
    },
  );
  const deliveryA =
    await createCourseSectionDelivery(
      collegeAdmin,
      {
        offeringId: offering.id,
        sectionId: sectionA.id,
      },
    );
  const deliveryB =
    await createCourseSectionDelivery(
      collegeAdmin,
      {
        offeringId: offering.id,
        sectionId: sectionB.id,
      },
    );

  await createCourseTeachingAssignment(
    collegeAdmin,
    {
      deliveryId: deliveryA.id,
      membershipId:
        SEED_IDS.facultyCollegeAMembership,
      role: "PRIMARY",
    },
  );

  const enrollment =
    await createLearnerProgramEnrollment(
      collegeAdmin,
      {
        membershipId:
          learnerMembershipId,
        programId: program.id,
        cohortId: cohort.id,
      },
    );

  await assignLearnerToSection(
    collegeAdmin,
    {
      learnerEnrollmentId: enrollment.id,
      sectionId: sectionA.id,
    },
  );

  return {
    program,
    period,
    cohort,
    sectionA,
    sectionB,
    course,
    offering,
    deliveryA,
    deliveryB,
  };
}

beforeAll(async () => {
  await pool.query(
    "insert into users (id, identity_uid, display_name) values ($1,$2,$3)",
    [learnerUserId, `c2-fixture-${learnerUserId}`, "C2 learner fixture"],
  );
  await pool.query(
    "insert into college_memberships (id, user_id, college_id) values ($1,$2,$3)",
    [learnerMembershipId, learnerUserId, SEED_IDS.collegeA],
  );
  await pool.query(
    "insert into membership_roles (membership_id, role) values ($1,'LEARNER')",
    [learnerMembershipId],
  );
});

beforeEach(async () => {
  await cleanupC2();
});

afterAll(async () => {
  await cleanupC2();
  // Keep the ephemeral identity rows on this disposable database: immutable
  // audit events may still reference their actor IDs. The DB is discarded.
  await pool.end();
  await closeDatabaseConnection();
});

describe("courses C2 learning structure against PostgreSQL", () => {
  it("combines generic and exact-section content without leaking another delivery", async () => {
    const structure = await createStructure();
    const path = await createLearningPath(
      collegeAdmin,
      {
        offeringId: structure.offering.id,
        title: "C2 Learning Path",
        description: "Semester learning path",
      },
    );
    const lesson = await createCourseLesson(
      collegeAdmin,
      {
        learningPathId: path.id,
        name: "C2 Arrays",
        sequence: 0,
      },
    );

    const generic =
      await createLessonContent(
        collegeAdmin,
        {
          lessonId: lesson.id,
          contentType: "RESOURCE",
          points: 1,
          title: "C2 Array Notes",
          notes: "Shared notes",
          sequence: 0,
        },
      );

    const sectionAContent =
      await createLessonContent(
        faculty,
        {
          lessonId: lesson.id,
          deliveryId:
            structure.deliveryA.id,
          contentType: "YOUTUBE",
          points: 1,
          title: "C2 Section A Walkthrough",
          externalUrl:
            "https://www.youtube.com/watch?v=abc123",
          durationSeconds: 600,
          sequence: 1,
        },
      );

    await expect(
      createLessonContent(faculty, {
        lessonId: lesson.id,
        contentType: "RESOURCE",
        points: 1,
        title: "C2 Unsafe Generic",
        notes: "Faculty cannot create shared content",
        sequence: 2,
      }),
    ).rejects.toBeInstanceOf(
      AuthorizationError,
    );

    await expect(
      listLearningPaths(
        learner,
        structure.offering.id,
        structure.deliveryA.id,
      ),
    ).resolves.toEqual([]);

    await transitionLessonContent(
      collegeAdmin,
      generic.id,
      { action: "PUBLISH" },
    );
    const publishedSection = await transitionLessonContent(
      faculty,
      sectionAContent.id,
      { action: "PUBLISH" },
    );
    expect(publishedSection.version).toBe(sectionAContent.version + 1);
    expect(publishedSection.updatedAt.getTime()).toBeGreaterThan(
      sectionAContent.updatedAt.getTime(),
    );

    const sectionBContent =
      await createLessonContent(
        collegeAdmin,
        {
          lessonId: lesson.id,
          deliveryId:
            structure.deliveryB.id,
          contentType: "RESOURCE",
          points: 1,
          title: "C2 Section B Notes",
          notes: "Only Section B",
          sequence: 2,
        },
      );
    await transitionLessonContent(
      collegeAdmin,
      sectionBContent.id,
      { action: "PUBLISH" },
    );
    await transitionLearningPath(
      collegeAdmin,
      path.id,
      { action: "PUBLISH" },
    );

    const learnerPaths =
      await listLearningPaths(
        learner,
        structure.offering.id,
        structure.deliveryA.id,
      );
    expect(learnerPaths).toEqual([
      expect.objectContaining({
        id: path.id,
        status: "PUBLISHED",
      }),
    ]);

    await expect(
      listCourseLessons(
        learner,
        path.id,
        structure.deliveryA.id,
      ),
    ).resolves.toEqual([
      expect.objectContaining({
        id: lesson.id,
      }),
    ]);

    const learnerContents =
      await listLessonContents(
        learner,
        lesson.id,
        structure.deliveryA.id,
      );

    expect(
      learnerContents.map((item) => item.id),
    ).toEqual([
      generic.id,
      sectionAContent.id,
    ]);
    expect(
      learnerContents.some(
        (item) =>
          item.id === sectionBContent.id,
      ),
    ).toBe(false);

    const activity = await pool.query<{
      event_type: string;
    }>(
      `select event_type
         from activity_events
        where subject_id in ($1, $2)
           or (
             event_type = 'academics.learner.enrolled'
             and metadata ->> 'programId' = $1
           )`,
      [structure.program.id, path.id],
    );
    expect(
      activity.rows.map(
        (row) => row.event_type,
      ),
    ).toEqual(
      expect.arrayContaining([
        "academics.program.created",
        "academics.learner.enrolled",
        "courses.learning_path.published",
      ]),
    );

    await expect(
      listLessonContents(
        learner,
        lesson.id,
        structure.deliveryB.id,
      ),
    ).rejects.toMatchObject({
      code: "LEARNER_ENROLLMENT_SCOPE_REQUIRED",
    });

    await expect(
      listLessonContents(
        faculty,
        lesson.id,
        structure.deliveryB.id,
      ),
    ).rejects.toMatchObject({
      code: "FACULTY_TEACHING_SCOPE_REQUIRED",
    });

    const edited =
      await updateLessonContent(
        faculty,
        sectionAContent.id,
        {
          title:
            "C2 Section A Walkthrough Updated",
        },
      );
    expect(edited.title).toBe(
      "C2 Section A Walkthrough Updated",
    );
    expect(edited.version).toBe(publishedSection.version + 1);
    expect(edited.updatedAt.getTime()).toBeGreaterThan(
      publishedSection.updatedAt.getTime(),
    );
    const editedAgain = await updateLessonContent(
      faculty,
      sectionAContent.id,
      { title: "C2 Section A Walkthrough Second Edit" },
    );
    expect(editedAgain.version).toBe(edited.version + 1);
    expect(editedAgain.updatedAt.getTime()).toBeGreaterThan(
      edited.updatedAt.getTime(),
    );
  });


  it("does not disclose unpublished-by-flag or soft-deleted lesson content through listing or direct lookup", async () => {
    const structure = await createStructure();
    const path = await createLearningPath(collegeAdmin, {
      offeringId: structure.offering.id,
      title: "C2 Private content gate",
    });
    const lesson = await createCourseLesson(collegeAdmin, {
      learningPathId: path.id,
      name: "C2 Learner-safe content",
      sequence: 0,
    });
    const contents = [];
    for (const [index, title] of [
      "Visible",
      "Hidden by author",
      "Legacy inactive",
      "Soft deleted",
      "Deleted with lesson",
    ].entries()) {
      const content = await createLessonContent(collegeAdmin, {
        lessonId: lesson.id,
        contentType: "RESOURCE",
        points: 1,
        title: "C2 " + title,
        notes: "private content visibility case",
        sequence: index,
      });
      await transitionLessonContent(collegeAdmin, content.id, { action: "PUBLISH" });
      contents.push(content);
    }
    await transitionLearningPath(collegeAdmin, path.id, { action: "PUBLISH" });

    await pool.query(
      "update lesson_contents set visible_to_students = false where id = $1",
      [contents[1]!.id],
    );
    await pool.query(
      "update lesson_contents set legacy_active = false where id = $1",
      [contents[2]!.id],
    );
    await pool.query(
      "update lesson_contents set deleted_at = clock_timestamp() where id = $1",
      [contents[3]!.id],
    );
    await pool.query(
      "update lesson_contents set deleted_with_lesson = true where id = $1",
      [contents[4]!.id],
    );

    const visible = await listLessonContents(
      learner, lesson.id, structure.deliveryA.id,
    );
    expect(visible.map((content) => content.id)).toEqual([contents[0]!.id]);

    for (const hidden of contents.slice(1)) {
      await expect(
        getAuthorizedLessonContent(
          learner, hidden.id, structure.deliveryA.id,
        ),
      ).rejects.toMatchObject({ code: "LESSON_CONTENT_NOT_FOUND" });
    }
    const batch = await listMyLearnerContentProgressBatch(
      learner,
      structure.deliveryA.id,
      contents.map((content) => content.id),
    );
    expect(batch.map((entry) => entry.contentId)).toEqual([contents[0]!.id]);
    for (const hidden of contents.slice(1)) {
      await expect(
        getLearnerContentProgress(learner, hidden.id, structure.deliveryA.id),
      ).rejects.toMatchObject({ code: "LESSON_CONTENT_NOT_PUBLISHED" });
    }

    // A tombstoned parent with a stale ACTIVE label is not a learner route.
    await pool.query(
      "update course_lessons set deleted_at = clock_timestamp() where id = $1",
      [lesson.id],
    );
    await expect(
      listLessonContents(learner, lesson.id, structure.deliveryA.id),
    ).rejects.toMatchObject({ code: "LESSON_NOT_FOUND" });
    await expect(
      getLearnerContentProgress(
        learner, contents[0]!.id, structure.deliveryA.id,
      ),
    ).rejects.toMatchObject({ code: "LESSON_CONTENT_NOT_PUBLISHED" });

    await pool.query("update course_lessons set deleted_at = null where id = $1", [
      lesson.id,
    ]);
    await pool.query("update courses set enabled = false where id = $1", [
      structure.course.id,
    ]);
    await expect(
      listLessonContents(learner, lesson.id, structure.deliveryA.id),
    ).rejects.toMatchObject({ code: "LEARNING_ACCESS_DENIED" });
    await expect(
      getLearnerContentProgress(
        learner, contents[0]!.id, structure.deliveryA.id,
      ),
    ).rejects.toMatchObject({ code: "LEARNING_ACCESS_DENIED" });
    await pool.query("update courses set enabled = true, legacy_allowed_for_display = 0 where id = $1", [
      structure.course.id,
    ]);
    await expect(
      listLessonContents(learner, lesson.id, structure.deliveryA.id),
    ).rejects.toMatchObject({ code: "LEARNING_ACCESS_DENIED" });

    // A soft-deleted course with a stale ACTIVE/enabled label is not
    // visible via catalog cards, workspace URLs or direct lesson endpoints.
    await pool.query(
      "update courses set enabled = true, legacy_allowed_for_display = null, deleted_at = clock_timestamp() where id = $1",
      [structure.course.id],
    );
    const cards = await listLearnerCourseDeliveries(learner);
    expect(cards.some((card) => card.courseId === structure.course.id)).toBe(false);
    await expect(
      getLearnerCourseWorkspace(learner, structure.deliveryA.id),
    ).rejects.toMatchObject({ code: "LEARNING_ACCESS_DENIED" });
    await expect(
      listLessonContents(learner, lesson.id, structure.deliveryA.id),
    ).rejects.toMatchObject({ code: "LEARNING_ACCESS_DENIED" });
  });

  it("protects shared structure with admin authority and database uniqueness", async () => {
    const structure = await createStructure();
    const path = await createLearningPath(
      collegeAdmin,
      {
        offeringId: structure.offering.id,
        title: "C2 Canonical Path",
      },
    );

    await expect(
      createLearningPath(collegeAdmin, {
        offeringId: structure.offering.id,
        title: "C2 Duplicate Path",
      }),
    ).rejects.toMatchObject({
      code: "LEARNING_PATH_CONFLICT",
    });

    await expect(
      createCourseLesson(faculty, {
        learningPathId: path.id,
        name: "C2 Faculty Shared Lesson",
        sequence: 0,
      }),
    ).rejects.toBeInstanceOf(
      AuthorizationError,
    );

    const lesson = await createCourseLesson(
      collegeAdmin,
      {
        learningPathId: path.id,
        name: "C2 Linked Lists",
        sequence: 0,
      },
    );

    await expect(
      createCourseLesson(collegeAdmin, {
        learningPathId: path.id,
        name: "c2 linked lists",
        sequence: 1,
      }),
    ).rejects.toMatchObject({
      code: "LESSON_NAME_CONFLICT",
    });

    // Legacy contract (049f87d3ad): sequence 0 means "append after the last
    // active lesson"; an explicit occupied position hits the DB uniqueness.
    const appended = await createCourseLesson(collegeAdmin, {
      learningPathId: path.id,
      name: "C2 Stacks",
      sequence: 0,
    });
    expect(appended.sequence).toBe(lesson.sequence + 1);

    await expect(
      createCourseLesson(collegeAdmin, {
        learningPathId: path.id,
        name: "C2 Queues",
        sequence: appended.sequence,
      }),
    ).rejects.toMatchObject({
      code: "LESSON_SEQUENCE_CONFLICT",
    });

    await expect(
      createLessonContent(collegeAdmin, {
        lessonId: lesson.id,
        contentType: "YOUTUBE",
        points: 1,
        title: "C2 Bad Video Link",
        externalUrl:
          "https://example.com/video",
        durationSeconds: 300,
        sequence: 0,
      }),
    ).rejects.toBeInstanceOf(ZodError);

    await expect(
      pool.query(
        `insert into lesson_contents
          (lesson_id, content_type, title, sequence, created_by_user_id)
         values ($1, 'VIDEO', 'C2 Invalid Video', 0, $2)`,
        [
          lesson.id,
          SEED_IDS.collegeAdminUser,
        ],
      ),
    ).rejects.toMatchObject({
      code: "23514",
    });
  });

  it("rejects caller-selected content scope that does not belong to the lesson offering", async () => {
    const structure = await createStructure();
    const path = await createLearningPath(
      collegeAdmin,
      {
        offeringId: structure.offering.id,
        title: "C2 Scope Path",
      },
    );
    const lesson = await createCourseLesson(
      collegeAdmin,
      {
        learningPathId: path.id,
        name: "C2 Trees",
        sequence: 0,
      },
    );

    const otherCourse = await createCourse(
      collegeAdmin,
      {
        departmentId: SEED_IDS.departmentA,
        name: "C2 Operating Systems",
        code: "C2-OS",
      },
    );
    const otherOffering =
      await createCourseOffering(
        collegeAdmin,
        {
          courseId: otherCourse.id,
          cohortId: structure.cohort.id,
          academicPeriodId:
            structure.period.id,
          type: "CORE",
          credits: 4,
          displayOrder: 1,
        },
      );
    const otherDelivery =
      await createCourseSectionDelivery(
        collegeAdmin,
        {
          offeringId: otherOffering.id,
          sectionId: structure.sectionA.id,
        },
      );

    await expect(
      createLessonContent(collegeAdmin, {
        lessonId: lesson.id,
        deliveryId: otherDelivery.id,
        contentType: "RESOURCE",
        points: 1,
        title: "C2 Wrong Scope",
        notes: "Must be rejected",
        sequence: 0,
      }),
    ).rejects.toMatchObject({
      code: "CONTENT_DELIVERY_MISMATCH",
    });
  });
});
