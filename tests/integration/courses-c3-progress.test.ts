import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { createProgram } from "@/modules/academics/program-service";
import { createAcademicPeriod } from "@/modules/academics/period-service";
import { createCohort } from "@/modules/academics/cohort-service";
import { createSection } from "@/modules/academics/section-service";
import { createLearnerProgramEnrollment } from "@/modules/academics/enrollment-service";
import { assignLearnerToSection } from "@/modules/academics/roster-service";
import { createCourse } from "@/modules/courses/course-service";
import { createCourseOffering } from "@/modules/courses/offering-service";
import { createCourseSectionDelivery } from "@/modules/courses/delivery-service";
import {
  createLearningPath,
  transitionLearningPath,
} from "@/modules/courses/learning-path-service";
import { createCourseLesson } from "@/modules/courses/lesson-service";
import {
  createLessonContent,
  transitionLessonContent,
} from "@/modules/courses/lesson-content-service";
import {
  getLearnerContentProgress,
  saveLearnerContentProgress,
} from "@/modules/courses/progress-service";
import {
  getLearnerCourseWorkspace,
  listLearnerCourseDeliveries,
} from "@/modules/courses/learner-course-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

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

const learner: RequestContext = {
  user: {
    id: SEED_IDS.learnerUser,
    identityUid: "seed-learner",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.learnerCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["LEARNER"],
  },
};

async function cleanupC3() {
  await pool.query(
    `delete from learner_content_progress
     where lesson_content_id in (
       select lc.id
       from lesson_contents lc
       join course_lessons cl
         on cl.id = lc.lesson_id
       join course_learning_paths lp
         on lp.id = cl.learning_path_id
       join course_offerings co
         on co.id = lp.offering_id
       join courses c on c.id = co.course_id
       where c.code like 'C3-%'
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
       where c.code like 'C3-%'
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
       where c.code like 'C3-%'
     )`,
  );
  await pool.query(
    `delete from course_learning_paths
     where offering_id in (
       select co.id
       from course_offerings co
       join courses c on c.id = co.course_id
       where c.code like 'C3-%'
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
       where c.code like 'C3-%'
     )`,
  );
  await pool.query(
    `delete from course_section_deliveries
     where offering_id in (
       select co.id
       from course_offerings co
       join courses c on c.id = co.course_id
       where c.code like 'C3-%'
     )`,
  );
  await pool.query(
    `delete from course_offerings
     where course_id in (
       select id from courses
       where code like 'C3-%'
     )`,
  );
  await pool.query(
    "delete from courses where code like 'C3-%'",
  );
  await pool.query(
    `delete from section_enrollments
     where learner_enrollment_id in (
       select lpe.id
       from learner_program_enrollments lpe
       join programs p on p.id = lpe.program_id
       where p.code like 'C3-%'
     )`,
  );
  await pool.query(
    `delete from learner_program_enrollments
     where program_id in (
       select id from programs
       where code like 'C3-%'
     )`,
  );
  await pool.query(
    `delete from sections
     where cohort_id in (
       select c.id
       from cohorts c
       join programs p on p.id = c.program_id
       where p.code like 'C3-%'
     )`,
  );
  await pool.query(
    `delete from cohorts
     where program_id in (
       select id from programs
       where code like 'C3-%'
     )`,
  );
  await pool.query(
    "delete from programs where code like 'C3-%'",
  );
  await pool.query(
    "delete from academic_periods where code like 'C3-%'",
  );
}

async function createStructure() {
  const program = await createProgram(
    collegeAdmin,
    {
      departmentId: SEED_IDS.departmentA,
      name: "C3 Computer Science",
      code: "C3-PROGRAM",
      durationTerms: 8,
    },
  );
  const period = await createAcademicPeriod(
    collegeAdmin,
    {
      collegeId: SEED_IDS.collegeA,
      name: "C3 Semester 1",
      code: "C3-PERIOD",
      startDate: "2026-07-01",
      endDate: "2026-12-15",
    },
  );
  const cohort = await createCohort(
    collegeAdmin,
    {
      programId: program.id,
      name: "C3 2026 Intake",
      code: "C3-COHORT",
      startPeriodId: period.id,
    },
  );
  const sectionA = await createSection(
    collegeAdmin,
    {
      cohortId: cohort.id,
      academicPeriodId: period.id,
      name: "C3 Section A",
      code: "C3-A",
      capacity: 60,
    },
  );
  const sectionB = await createSection(
    collegeAdmin,
    {
      cohortId: cohort.id,
      academicPeriodId: period.id,
      name: "C3 Section B",
      code: "C3-B",
      capacity: 60,
    },
  );
  const course = await createCourse(
    collegeAdmin,
    {
      departmentId: SEED_IDS.departmentA,
      name: "C3 Data Structures",
      code: "C3-DS",
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
  const enrollment =
    await createLearnerProgramEnrollment(
      collegeAdmin,
      {
        membershipId:
          SEED_IDS.learnerCollegeAMembership,
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

  const path = await createLearningPath(
    collegeAdmin,
    {
      offeringId: offering.id,
      title: "C3 Learning Path",
    },
  );
  const lesson = await createCourseLesson(
    collegeAdmin,
    {
      learningPathId: path.id,
      name: "C3 Arrays",
      sequence: 0,
    },
  );
  const resource =
    await createLessonContent(
      collegeAdmin,
      {
        lessonId: lesson.id,
        contentType: "RESOURCE",
        title: "C3 Array Notes",
        notes: "Read the shared notes",
        sequence: 0,
      },
    );
  const video = await createLessonContent(
    collegeAdmin,
    {
      lessonId: lesson.id,
      deliveryId: deliveryA.id,
      contentType: "VIDEO",
      title: "C3 Arrays Walkthrough",
      storageKey:
        "courses/c3/arrays-walkthrough.mp4",
      durationSeconds: 100,
      sequence: 1,
    },
  );
  const sectionBOnly =
    await createLessonContent(
      collegeAdmin,
      {
        lessonId: lesson.id,
        deliveryId: deliveryB.id,
        contentType: "RESOURCE",
        title: "C3 Section B Notes",
        notes: "Section B only",
        sequence: 2,
      },
    );

  for (const item of [
    resource,
    video,
    sectionBOnly,
  ]) {
    await transitionLessonContent(
      collegeAdmin,
      item.id,
      { action: "PUBLISH" },
    );
  }
  await transitionLearningPath(
    collegeAdmin,
    path.id,
    { action: "PUBLISH" },
  );

  return {
    course,
    offering,
    deliveryA,
    deliveryB,
    path,
    lesson,
    resource,
    video,
    sectionBOnly,
  };
}

beforeEach(async () => {
  await cleanupC3();
});

afterAll(async () => {
  await cleanupC3();
  await pool.end();
  await closeDatabaseConnection();
});

describe("courses C3 learner progress against PostgreSQL", () => {
  it("discovers only the learner's exact delivery and builds a filtered learning workspace", async () => {
    const structure = await createStructure();

    const courses =
      await listLearnerCourseDeliveries(
        learner,
      );

    expect(courses).toEqual([
      expect.objectContaining({
        deliveryId: structure.deliveryA.id,
        offeringId: structure.offering.id,
        courseId: structure.course.id,
        learningPathStatus: "PUBLISHED",
      }),
    ]);

    const workspace =
      await getLearnerCourseWorkspace(
        learner,
        structure.deliveryA.id,
      );

    expect(
      workspace.lessons[0]?.contents.map(
        (item) => item.id,
      ),
    ).toEqual([
      structure.resource.id,
      structure.video.id,
    ]);
    expect(
      workspace.lessons[0]?.contents.some(
        (item) =>
          item.id === structure.sectionBOnly.id,
      ),
    ).toBe(false);
    expect(workspace.summary).toMatchObject({
      overallPercent: 0,
      contentsCompleted: 0,
      contentsTotal: 2,
    });
    expect(workspace.nextContent).toMatchObject({
      contentId: structure.resource.id,
    });
  });

  it("keeps media progress monotonic and completes only from authored duration", async () => {
    const structure = await createStructure();

    await expect(
      saveLearnerContentProgress(
        learner,
        structure.video.id,
        {
          deliveryId: structure.deliveryA.id,
          completed: true,
        },
      ),
    ).rejects.toMatchObject({
      code:
        "TIMED_CONTENT_MANUAL_COMPLETION_NOT_ALLOWED",
    });

    const half =
      await saveLearnerContentProgress(
        learner,
        structure.video.id,
        {
          deliveryId: structure.deliveryA.id,
          positionSeconds: 50,
        },
      );

    expect(half).toMatchObject({
      status: "IN_PROGRESS",
      lastPositionSeconds: 50,
      durationSeconds: 100,
      percentComplete: 50,
      completedAt: null,
    });

    const stale =
      await saveLearnerContentProgress(
        learner,
        structure.video.id,
        {
          deliveryId: structure.deliveryA.id,
          positionSeconds: 20,
        },
      );

    expect(stale.lastPositionSeconds).toBe(50);

    const done =
      await saveLearnerContentProgress(
        learner,
        structure.video.id,
        {
          deliveryId: structure.deliveryA.id,
          positionSeconds: 90,
        },
      );

    expect(done).toMatchObject({
      status: "COMPLETED",
      lastPositionSeconds: 90,
      percentComplete: 100,
    });
    expect(done.completedAt).toBeInstanceOf(Date);

    const reread =
      await getLearnerContentProgress(
        learner,
        structure.video.id,
        structure.deliveryA.id,
      );
    expect(reread.status).toBe("COMPLETED");
  });

  it("tracks manual resource completion and recalculates continue-learning summary", async () => {
    const structure = await createStructure();

    await saveLearnerContentProgress(
      learner,
      structure.resource.id,
      {
        deliveryId: structure.deliveryA.id,
        completed: true,
      },
    );
    await saveLearnerContentProgress(
      learner,
      structure.video.id,
      {
        deliveryId: structure.deliveryA.id,
        positionSeconds: 50,
      },
    );

    const partial =
      await getLearnerCourseWorkspace(
        learner,
        structure.deliveryA.id,
      );

    expect(partial.summary).toMatchObject({
      overallPercent: 75,
      contentsCompleted: 1,
      contentsTotal: 2,
    });
    expect(partial.nextContent).toMatchObject({
      contentId: structure.video.id,
    });

    await saveLearnerContentProgress(
      learner,
      structure.video.id,
      {
        deliveryId: structure.deliveryA.id,
        positionSeconds: 100,
      },
    );

    const complete =
      await getLearnerCourseWorkspace(
        learner,
        structure.deliveryA.id,
      );
    expect(complete.summary).toMatchObject({
      overallPercent: 100,
      lessonsCompleted: 1,
      contentsCompleted: 2,
      contentsTotal: 2,
    });
    expect(complete.nextContent).toBeNull();
  });

  it("rejects progress outside the learner audience and enforces database uniqueness", async () => {
    const structure = await createStructure();

    await expect(
      saveLearnerContentProgress(
        learner,
        structure.sectionBOnly.id,
        {
          deliveryId: structure.deliveryA.id,
          completed: true,
        },
      ),
    ).rejects.toMatchObject({
      code: "CONTENT_DELIVERY_MISMATCH",
    });

    await expect(
      saveLearnerContentProgress(
        collegeAdmin,
        structure.resource.id,
        {
          deliveryId: structure.deliveryA.id,
          completed: true,
        },
      ),
    ).rejects.toMatchObject({
      code: "LEARNER_PROGRESS_ACCESS_DENIED",
    });

    await pool.query(
      `insert into learner_content_progress
        (membership_id, lesson_content_id, last_position_seconds)
       values ($1, $2, 1)`,
      [
        SEED_IDS.learnerCollegeAMembership,
        structure.resource.id,
      ],
    );

    await expect(
      pool.query(
        `insert into learner_content_progress
          (membership_id, lesson_content_id, last_position_seconds)
         values ($1, $2, 2)`,
        [
          SEED_IDS.learnerCollegeAMembership,
          structure.resource.id,
        ],
      ),
    ).rejects.toMatchObject({
      code: "23505",
    });

    await expect(
      pool.query(
        `insert into learner_content_progress
          (membership_id, lesson_content_id, last_position_seconds)
         values ($1, $2, -1)`,
        [
          SEED_IDS.learnerCollegeAMembership,
          structure.video.id,
        ],
      ),
    ).rejects.toMatchObject({
      code: "23514",
    });
  });
});
