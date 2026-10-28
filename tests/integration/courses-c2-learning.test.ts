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
    `delete from lesson_content_settings where lesson_content_id in (
       select content.id from lesson_contents content
       join course_lessons lesson on lesson.id=content.lesson_id
       join course_learning_paths path on path.id=lesson.learning_path_id
       join course_offerings offering on offering.id=path.offering_id
       join courses course_row on course_row.id=offering.course_id
       where course_row.code like 'C2-%'
    )`,
  );
  // Progress and classroom rows are linked to the fixture offering/delivery.
  // Do not remove parent lessons before their history rows are retired.
  await pool.query(
    `delete from learner_content_progress
     where lesson_content_id in (
       select content.id from lesson_contents content
       join course_lessons lesson on lesson.id=content.lesson_id
       join course_learning_paths path on path.id=lesson.learning_path_id
       join course_offerings offering on offering.id=path.offering_id
       join courses course_row on course_row.id=offering.course_id
       where course_row.code like 'C2-%'
     )`,
  );
  await pool.query(
    `delete from course_discussion_messages where delivery_id in (
       select delivery.id from course_section_deliveries delivery
       join course_offerings offering on offering.id=delivery.offering_id
       join courses course_row on course_row.id=offering.course_id
       where course_row.code like 'C2-%'
     )`,
  );
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
  // Registered DB-005 curriculum rows now refer to these fixture courses.
  // Remove only fixture mappings before deleting their course parents.
  await pool.query(
    `delete from program_term_courses
     where course_id in (select id from courses where code like 'C2-%')`,
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
  // The canonical DB-005 term is an independently persisted program
  // parent, even after all section/course rows are removed.
  await pool.query(
    `delete from program_term_courses where program_term_id in (
       select pt.id from program_terms pt join programs p on p.id=pt.program_id
       where p.code like 'C2-%'
     )`,
  );
  await pool.query(
    `delete from program_terms where program_id in (
       select id from programs where code like 'C2-%'
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
  it("makes first completion immutable across rewatch and snapshots classroom sender", async () => {
    const structure = await createStructure();
    const path = await createLearningPath(collegeAdmin, {
      offeringId: structure.offering.id, title: "C2 history integrity path",
    });
    const lesson = await createCourseLesson(collegeAdmin, {
      learningPathId: path.id, name: "C2 history lesson", sequence: 0,
    });
    const content = await createLessonContent(collegeAdmin, {
      lessonId: lesson.id, title: "C2 history resource",
      contentType: "RESOURCE", points: 1, notes: "History guard",
      sequence: 0,
    });
    const completed = await pool.query<{ id: string; first_completed_at: Date }>(
      `insert into learner_content_progress
         (membership_id,lesson_content_id,last_position_seconds,completed_at)
       values($1,$2,0,now()) returning id,first_completed_at`,
      [learnerMembershipId,content.id],
    );
    const progressId = completed.rows[0]!.id;
    const firstAt = completed.rows[0]!.first_completed_at;
    expect(firstAt).toBeInstanceOf(Date);
    const reset = await pool.query<{completed_at: Date|null;first_completed_at:Date}>(
      `update learner_content_progress set completed_at=null where id=$1
       returning completed_at,first_completed_at`,[progressId],
    );
    expect(reset.rows[0]!.completed_at).toBeNull();
    expect(reset.rows[0]!.first_completed_at.getTime()).toBe(firstAt.getTime());
    await expect(pool.query(
      "update learner_content_progress set first_completed_at=null where id=$1",
      [progressId],
    )).rejects.toMatchObject({code:"23514"});
    await expect(pool.query(
      `insert into learner_content_progress
       (membership_id,lesson_content_id,attempt,first_completed_at)
       values($1,$2,2,now())`,[learnerMembershipId,content.id],
    )).rejects.toMatchObject({code:"23514"});
    const second = await pool.query<{first_completed_at:Date|null}>(
      `insert into learner_content_progress
       (membership_id,lesson_content_id,attempt,last_position_seconds)
       values($1,$2,2,0) returning first_completed_at`,
      [learnerMembershipId,content.id],
    );
    expect(second.rows[0]!.first_completed_at).toBeNull();

    const trusted=await pool.query<{display_name:string}>(
      "select display_name from users where id=$1",[SEED_IDS.facultyUser],
    );
    const message=await pool.query<{id:string;sender_name_snapshot:string}>(
      `insert into course_discussion_messages
       (delivery_id,sender_membership_id,sender_role,message_text,sender_name_snapshot)
       values($1,$2,'FACULTY','Trusted history','Spoofed client name')
       returning id,sender_name_snapshot`,
      [structure.deliveryA.id,SEED_IDS.facultyCollegeAMembership],
    );
    const messageId=message.rows[0]!.id;
    expect(message.rows[0]!.sender_name_snapshot).toBe(
      trusted.rows[0]!.display_name.slice(0,160),
    );
    await expect(pool.query(
      `update course_discussion_messages set sender_name_snapshot='Tampered'
       where id=$1`,[messageId],
    )).rejects.toMatchObject({code:"23514"});
    await expect(pool.query(
      `update course_discussion_messages set sender_membership_id=$1 where id=$2`,
      [learnerMembershipId,messageId],
    )).rejects.toMatchObject({code:"23514"});
    const edited=await pool.query<{sender_name_snapshot:string}>(
      `update course_discussion_messages set message_text='Edited historical text'
       where id=$1 returning sender_name_snapshot`,[messageId],
    );
    expect(edited.rows[0]!.sender_name_snapshot).toBe(
      trusted.rows[0]!.display_name.slice(0,160),
    );
  });

  it("persists scoped lesson settings and rejects tenant, actor, CAS and reparent bypasses", async () => {
    const structure=await createStructure();
    const path=await createLearningPath(collegeAdmin,{
      offeringId:structure.offering.id,title:"C2 settings path",
    });
    const lesson=await createCourseLesson(collegeAdmin,{
      learningPathId:path.id,name:"C2 settings lesson",sequence:0,
    });
    const content=await createLessonContent(collegeAdmin,{
      lessonId:lesson.id,title:"C2 Settings Resource",contentType:"RESOURCE",
      notes:"Persist content configuration",sequence:0,points:1,
    });
    const input=[content.id,SEED_IDS.collegeA,SEED_IDS.collegeAdminUser];
    const created=await pool.query<{version:string;legacy_due_date_raw:string}>(
      `insert into lesson_content_settings
       (lesson_content_id,college_id,updated_by_user_id,legacy_due_date_raw,
        allow_discussions,view_after_schedule,view_before_schedule)
       values($1,$2,$3,'tomorrow maybe',true,true,true)
       returning version,legacy_due_date_raw`,input,
    );
    expect(Number(created.rows[0]!.version)).toBe(0);
    expect(created.rows[0]!.legacy_due_date_raw).toBe("tomorrow maybe");
    const updated=await pool.query<{version:string;allow_discussions:boolean}>(
      `update lesson_content_settings set version=version+1,
       allow_discussions=false where lesson_content_id=$1
       returning version,allow_discussions`,[content.id],
    );
    expect(Number(updated.rows[0]!.version)).toBe(1);
    expect(updated.rows[0]!.allow_discussions).toBe(false);
    await expect(pool.query(
      `update lesson_content_settings set allow_discussions=true
       where lesson_content_id=$1`,[content.id],
    )).rejects.toMatchObject({code:"23514"});
    await expect(pool.query(
      `update lesson_content_settings set version=version+1,college_id=$1
       where lesson_content_id=$2`,[SEED_IDS.collegeB,content.id],
    )).rejects.toMatchObject({code:"23514"});
    await expect(pool.query(
      `update lesson_contents set delivery_id=$1 where id=$2`,
      [structure.deliveryA.id,content.id],
    )).rejects.toMatchObject({code:"23514"});
    const other=await createLessonContent(collegeAdmin,{
      lessonId:lesson.id,title:"C2 Second Settings Resource",contentType:"RESOURCE",
      notes:"Tenant negative",sequence:1,points:1,
    });
    await expect(pool.query(
      `insert into lesson_content_settings
       (lesson_content_id,college_id,updated_by_user_id)
       values($1,$2,$3)`,
      [other.id,SEED_IDS.collegeB,SEED_IDS.collegeAdminUser],
    )).rejects.toMatchObject({code:"23514"});
    await expect(pool.query(
      `insert into lesson_content_settings
       (lesson_content_id,college_id,updated_by_user_id)
       values($1,$2,$3)`,
      [other.id,SEED_IDS.collegeA,learnerUserId],
    )).rejects.toMatchObject({code:"23514"});
    const legit=await pool.query<{lesson_content_id:string}>(
      `insert into lesson_content_settings
       (lesson_content_id,college_id,updated_by_user_id)
       values($1,$2,$3) returning lesson_content_id`,
      [other.id,SEED_IDS.collegeA,SEED_IDS.facultyUser],
    );
    expect(legit.rows[0]!.lesson_content_id).toBe(other.id);
  });

  it("rejects wrong-college progress and classroom writes at the database boundary", async () => {
    const structure=await createStructure();
    const path=await createLearningPath(collegeAdmin,{
      offeringId:structure.offering.id,title:"C2 college-scope integrity path",
    });
    const lesson=await createCourseLesson(collegeAdmin,{
      learningPathId:path.id,name:"C2 college-scope lesson",sequence:0,
    });
    const content=await createLessonContent(collegeAdmin,{
      lessonId:lesson.id,title:"C2 scope resource",
      contentType:"RESOURCE",notes:"Visible notes",sequence:0,points:1,
    });
    await expect(pool.query(
      `insert into learner_content_progress(membership_id,lesson_content_id)
       values($1,$2)`,[SEED_IDS.facultyCollegeBMembership,content.id],
    )).rejects.toMatchObject({code:"23514"});
    const progress=await pool.query<{id:string}>(
      `insert into learner_content_progress(membership_id,lesson_content_id)
       values($1,$2) returning id`,[learnerMembershipId,content.id],
    );
    await expect(pool.query(
      `update learner_content_progress set membership_id=$1 where id=$2`,
      [SEED_IDS.facultyCollegeBMembership,progress.rows[0]!.id],
    )).rejects.toMatchObject({code:"23514"});
    await expect(pool.query(
      `update lesson_contents set delivery_id=$1 where id=$2`,
      [structure.deliveryA.id,content.id],
    )).rejects.toMatchObject({code:"23514"});
    await expect(pool.query(
      `insert into course_discussion_messages
       (delivery_id,sender_membership_id,sender_role,message_text)
       values($1,$2,'FACULTY','Wrong-college classroom sender')`,
      [structure.deliveryA.id,SEED_IDS.facultyCollegeBMembership],
    )).rejects.toMatchObject({code:"23514"});
    const accepted=await pool.query<{id:string}>(
      `insert into course_discussion_messages
       (delivery_id,sender_membership_id,sender_role,message_text)
       values($1,$2,'FACULTY','College-authorized classroom sender')
       returning id`,
      [structure.deliveryA.id,SEED_IDS.facultyCollegeAMembership],
    );
    expect(accepted.rows[0]!.id).toBeTruthy();
    await expect(pool.query(
      "update course_discussion_messages set delivery_id=$1 where id=$2",
      [structure.deliveryB.id,accepted.rows[0]!.id],
    )).rejects.toMatchObject({code:"23514"});
    const after=await pool.query<{delivery_id:string}>(
      "select delivery_id from course_discussion_messages where id=$1",
      [accepted.rows[0]!.id],
    );
    expect(after.rows[0]!.delivery_id).toBe(structure.deliveryA.id);
  });

});
