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
  listLearnerCourseInstructors,
} from "@/modules/courses/learner-course-service";
import { createCourseTeachingAssignment } from "@/modules/courses/teaching-assignment-service";
import {
 previewAdminCourseProgressRetake,startAdminCourseProgressRetake,
} from "@/modules/courses/admin-progress-retake-service";
import {
  createCourseDiscussionMessage,
  deleteCourseDiscussionMessage,
  listCourseDiscussionMessages,
} from "@/modules/courses/discussion-service";
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

// The seeded learner belongs to another active program. Course C3 must use
// an isolated membership so its tests exercise learning behavior, not a unique
// active-enrollment conflict caused by an unrelated baseline fixture.
const learnerUserId = randomUUID();
const learnerMembershipId = randomUUID();
const learner: RequestContext = {
  user: {
    id: learnerUserId,
    identityUid: `c3-fixture-${learnerUserId}`,
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
  await pool.query("delete from program_term_courses where course_id in (select id from courses where code like 'C3-%')");
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
  await pool.query("delete from program_terms where program_id in (select id from programs where code like 'C3-%')");
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
  const sectionEnrollment =
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
        points: 1,
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
      points: 1,
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
        points: 1,
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
    sectionEnrollment,
    period,
    path,
    lesson,
    resource,
    video,
    sectionBOnly,
  };
}

beforeAll(async () => {
  await pool.query(
    "insert into users (id, identity_uid, display_name) values ($1,$2,$3)",
    [learnerUserId, `c3-fixture-${learnerUserId}`, "C3 learner fixture"],
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
  await cleanupC3();
});

afterAll(async () => {
  await cleanupC3();
  // Preserve actor identities referenced by append-only activity events in
  // this isolated database; CI discards the database after integration.
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
        programName: "C3 Computer Science",
        programCode: "C3-PROGRAM",
        learningPathStatus: "PUBLISHED",
      }),
    ]);

    const instructors =
      await listLearnerCourseInstructors(
        learner,
        structure.deliveryA.id,
      );

    expect(instructors).toEqual([
      expect.objectContaining({
        membershipId:
          SEED_IDS.facultyCollegeAMembership,
        role: "PRIMARY",
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

    // LEARNER-course-detail-R01 (7c4726406b): the resume position is the
    // learner's actual latest position, not a high-water mark.
    expect(stale.lastPositionSeconds).toBe(20);

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

  it("keeps scheduled content locked and Course discussions isolated to the learner's delivery", async () => {
    const structure = await createStructure();

    const futureLiveClass =
      await createLessonContent(
        collegeAdmin,
        {
          lessonId: structure.lesson.id,
          deliveryId: structure.deliveryA.id,
          contentType: "LIVE_CLASS",
          points: 1,
          title: "C3 Future Live Class",
          externalUrl:
            "https://meet.example.com/c3-future",
          startsAt:
            "2099-01-01T10:00:00+05:30",
          endsAt:
            "2099-01-01T11:00:00+05:30",
          sequence: 3,
        },
      );
    await transitionLessonContent(
      collegeAdmin,
      futureLiveClass.id,
      { action: "PUBLISH" },
    );

    const workspace =
      await getLearnerCourseWorkspace(
        learner,
        structure.deliveryA.id,
      );
    const future =
      workspace.lessons[0]?.contents.find(
        (item) =>
          item.id === futureLiveClass.id,
      );

    // LEARNER-course-detail-R03: a published future live meeting link is
    // joinable before startsAt; it stays SCHEDULED and cannot be completed.
    expect(future).toMatchObject({
      availability: "SCHEDULED",
      externalUrl: "https://meet.example.com/c3-future",
      storageKey: null,
    });

    await expect(
      saveLearnerContentProgress(
        learner,
        futureLiveClass.id,
        {
          deliveryId: structure.deliveryA.id,
          completed: true,
        },
      ),
    ).rejects.toMatchObject({
      code: "CONTENT_NOT_STARTED",
    });

    const created =
      await createCourseDiscussionMessage(
        learner,
        structure.deliveryA.id,
        {
          messageText: "C3 learner question",
        },
      );

    const discussion =
      await listCourseDiscussionMessages(
        learner,
        structure.deliveryA.id,
      );

    expect(discussion.messages).toEqual([
      expect.objectContaining({
        id: created.id,
        messageText: "C3 learner question",
        isMine: true,
      }),
    ]);

    await expect(
      listCourseDiscussionMessages(
        learner,
        structure.deliveryB.id,
      ),
    ).rejects.toMatchObject({
      code:
        "LEARNER_ENROLLMENT_SCOPE_REQUIRED",
    });

    await deleteCourseDiscussionMessage(
      learner,
      created.id,
    );

    await expect(
      listCourseDiscussionMessages(
        learner,
        structure.deliveryA.id,
      ),
    ).resolves.toMatchObject({
      messages: [],
    });
  });

  it("keeps completed-semester Courses readable but blocks new learner mutations", async () => {
    const structure = await createStructure();

    await pool.query(
      `update section_enrollments
       set status = 'COMPLETED',
           ended_at = now(),
           updated_at = now()
       where id = $1`,
      [structure.sectionEnrollment.id],
    );
    await pool.query(
      `update academic_periods
       set status = 'CLOSED'
       where id = $1`,
      [structure.period.id],
    );
    // DB05 forbids ending a delivery while teachers are still assigned.
    // Assert that safety guard, then close the teaching roster first.
    await expect(pool.query(
      `update course_section_deliveries set ended_at = now() where id = $1`,
      [structure.deliveryA.id],
    )).rejects.toMatchObject({ code: "23514" });
    await pool.query(
      `update course_teaching_assignments set ended_at = now()
       where delivery_id = $1 and ended_at is null`,
      [structure.deliveryA.id],
    );
    await pool.query(
      `update course_section_deliveries set ended_at = now() where id = $1`,
      [structure.deliveryA.id],
    );

    await expect(
      listLearnerCourseDeliveries(learner),
    ).resolves.toEqual([]);

    const history =
      await listLearnerCourseDeliveries(
        learner,
        { includeHistorical: true },
      );

    expect(history).toEqual([
      expect.objectContaining({
        deliveryId: structure.deliveryA.id,
        sectionEnrollmentStatus: "COMPLETED",
        periodStatus: "CLOSED",
      }),
    ]);

    await expect(
      getLearnerCourseWorkspace(
        learner,
        structure.deliveryA.id,
      ),
    ).resolves.toMatchObject({
      course: {
        id: structure.course.id,
      },
      delivery: {
        id: structure.deliveryA.id,
      },
    });

    const historicalDiscussion =
      await listCourseDiscussionMessages(
        learner,
        structure.deliveryA.id,
      );
    expect(historicalDiscussion.canPost).toBe(false);

    // The mutation scope intentionally hides ended deliveries from active
    // readers; historical reads work, but writes fail closed as NOT_FOUND.
    await expect(
      createCourseDiscussionMessage(
        learner,
        structure.deliveryA.id,
        {
          messageText: "Should not post",
        },
      ),
    ).rejects.toMatchObject({
      code: "SECTION_DELIVERY_NOT_FOUND",
    });

    await expect(
      saveLearnerContentProgress(
        learner,
        structure.resource.id,
        {
          deliveryId: structure.deliveryA.id,
          completed: true,
        },
      ),
    ).rejects.toMatchObject({
      code: "SECTION_DELIVERY_NOT_FOUND",
    });
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
      // Learner-only courses.read permission is checked before the domain guard.
      name: "AuthorizationError",
    });

    await pool.query(
      `insert into learner_content_progress
        (membership_id, lesson_content_id, last_position_seconds)
       values ($1, $2, 1)`,
      [
        learnerMembershipId,
        structure.resource.id,
      ],
    );

    await expect(
      pool.query(
        `insert into learner_content_progress
          (membership_id, lesson_content_id, last_position_seconds)
         values ($1, $2, 2)`,
        [
          learnerMembershipId,
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
          learnerMembershipId,
          structure.video.id,
        ],
      ),
    ).rejects.toMatchObject({
      code: "23514",
    });
  });
  it("admin retake preserves first attempt, resets only this learner's Section and detects stale confirmation", async () => {
    const structure=await createStructure();
    await saveLearnerContentProgress(learner,structure.resource.id,{
      deliveryId:structure.deliveryA.id,completed:true,
    });
    await saveLearnerContentProgress(learner,structure.video.id,{
      deliveryId:structure.deliveryA.id,positionSeconds:90,
    });
    const preview=await previewAdminCourseProgressRetake(collegeAdmin,{
      offeringId:structure.offering.id,membershipId:learnerMembershipId,
    });
    expect(preview).toMatchObject({attempt:1,alreadyFresh:false,contentItems:2});
    const retake=await startAdminCourseProgressRetake(collegeAdmin,{
      offeringId:structure.offering.id,membershipId:learnerMembershipId,
      expectedAttempt:1,confirmed:true,
    });
    expect(retake).toMatchObject({
      attempt:2,previousAttempt:1,contentItemsReset:2,alreadyFresh:false,
    });
    const preserved=await pool.query<{
      lesson_content_id:string;attempt:number;last_position_seconds:number;
      completed_at:Date|null;
    }>(`select lesson_content_id,attempt,last_position_seconds,completed_at
      from learner_content_progress where membership_id=$1 and
      lesson_content_id in ($2,$3,$4) order by attempt,lesson_content_id`,
      [learnerMembershipId,structure.resource.id,structure.video.id,
       structure.sectionBOnly.id]);
    expect(preserved.rows).toHaveLength(4);
    expect(preserved.rows.filter(row=>row.attempt===1)
      .every(row=>row.completed_at!==null)).toBe(true);
    expect(preserved.rows.filter(row=>row.attempt===2)
      .every(row=>row.last_position_seconds===0&&row.completed_at===null)).toBe(true);
    expect(preserved.rows.some(row=>row.lesson_content_id===structure.sectionBOnly.id))
      .toBe(false);
    expect(await getLearnerContentProgress(learner,structure.resource.id,
      structure.deliveryA.id)).toMatchObject({
      attempt:2,status:"NOT_STARTED",lastPositionSeconds:0,completedAt:null,
    });
    await expect(startAdminCourseProgressRetake(collegeAdmin,{
      offeringId:structure.offering.id,membershipId:learnerMembershipId,
      expectedAttempt:1,confirmed:true,
    })).rejects.toMatchObject({code:"RETAKE_STALE"});
    const after=await pool.query(`select count(*)::int as total from learner_content_progress
      where membership_id=$1 and attempt=3`,[learnerMembershipId]);
    expect(after.rows[0]?.total).toBe(0);
  });

});
