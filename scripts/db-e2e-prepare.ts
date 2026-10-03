import type { RequestContext } from "../src/modules/identity/context";

async function main() {
  const databaseUrl =
    process.env.E2E_DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "E2E_DATABASE_URL is required for browser E2E preparation",
    );
  }

  process.env.DATABASE_URL = databaseUrl;
  process.env.TEST_DATABASE_URL = databaseUrl;

  const [
    dbLib,
    seedData,
    dbClient,
    programService,
    periodService,
    cohortService,
    sectionService,
    enrollmentService,
    rosterService,
    courseService,
    offeringService,
    deliveryService,
    teachingService,
    pathService,
    lessonService,
    contentService,
  ] = await Promise.all([
    import("./db-lib"),
    import("./db-seed-data"),
    import("../src/db/client"),
    import("../src/modules/academics/program-service"),
    import("../src/modules/academics/period-service"),
    import("../src/modules/academics/cohort-service"),
    import("../src/modules/academics/section-service"),
    import("../src/modules/academics/enrollment-service"),
    import("../src/modules/academics/roster-service"),
    import("../src/modules/courses/course-service"),
    import("../src/modules/courses/offering-service"),
    import("../src/modules/courses/delivery-service"),
    import("../src/modules/courses/teaching-assignment-service"),
    import("../src/modules/courses/learning-path-service"),
    import("../src/modules/courses/lesson-service"),
    import("../src/modules/courses/lesson-content-service"),
  ]);

  await dbLib.resetDatabase(databaseUrl);
  await dbLib.seedDatabase(databaseUrl);

  const ids = seedData.SEED_IDS;
  const collegeAdmin: RequestContext = {
    user: {
      id: ids.collegeAdminUser,
      identityUid: "seed-college-admin",
      platformStatus: "ACTIVE",
      systemRoles: [],
    },
    membership: {
      id: ids.collegeAdminMembership,
      collegeId: ids.collegeA,
      organizationId: ids.organization,
      status: "ACTIVE",
      roles: ["COLLEGE_ADMIN"],
    },
  };
  const faculty: RequestContext = {
    user: {
      id: ids.facultyUser,
      identityUid: "seed-shared-faculty",
      platformStatus: "ACTIVE",
      systemRoles: [],
    },
    membership: {
      id: ids.facultyCollegeAMembership,
      collegeId: ids.collegeA,
      organizationId: ids.organization,
      status: "ACTIVE",
      roles: ["FACULTY", "MENTOR"],
    },
  };

  try {
    const program =
      await programService.createProgram(
        collegeAdmin,
        {
          departmentId: ids.departmentA,
          name: "E2E Computer Science",
          code: "E2E-PROGRAM",
          durationTerms: 8,
        },
      );
    const period =
      await periodService.createAcademicPeriod(
        collegeAdmin,
        {
          collegeId: ids.collegeA,
          name: "E2E 2026-27",
          code: "E2E-PERIOD",
          startDate: "2026-07-01",
          endDate: "2027-06-30",
        },
      );
    const cohort =
      await cohortService.createCohort(
        collegeAdmin,
        {
          programId: program.id,
          name: "E2E 2026 Intake",
          code: "E2E-COHORT",
          startPeriodId: period.id,
        },
      );
    const sectionA =
      await sectionService.createSection(
        collegeAdmin,
        {
          cohortId: cohort.id,
          academicPeriodId: period.id,
          name: "E2E Section A",
          code: "E2E-A",
          capacity: 60,
        },
      );
    const sectionB =
      await sectionService.createSection(
        collegeAdmin,
        {
          cohortId: cohort.id,
          academicPeriodId: period.id,
          name: "E2E Section B",
          code: "E2E-B",
          capacity: 60,
        },
      );
    const course =
      await courseService.createCourse(
        collegeAdmin,
        {
          departmentId: ids.departmentA,
          name: "E2E Browser Course",
          code: "E2E-COURSE",
          description:
            "Browser regression fixture",
        },
      );
    const offering =
      await offeringService.createCourseOffering(
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
      await deliveryService.createCourseSectionDelivery(
        collegeAdmin,
        {
          offeringId: offering.id,
          sectionId: sectionA.id,
        },
      );
    const deliveryB =
      await deliveryService.createCourseSectionDelivery(
        collegeAdmin,
        {
          offeringId: offering.id,
          sectionId: sectionB.id,
        },
      );

    await teachingService.createCourseTeachingAssignment(
      collegeAdmin,
      {
        deliveryId: deliveryA.id,
        membershipId:
          ids.facultyCollegeAMembership,
        role: "PRIMARY",
      },
    );

    const enrollment =
      await enrollmentService.createLearnerProgramEnrollment(
        collegeAdmin,
        {
          membershipId:
            ids.learnerCollegeAMembership,
          programId: program.id,
          cohortId: cohort.id,
        },
      );
    await rosterService.assignLearnerToSection(
      collegeAdmin,
      {
        learnerEnrollmentId: enrollment.id,
        sectionId: sectionA.id,
      },
    );

    const path =
      await pathService.createLearningPath(
        collegeAdmin,
        {
          offeringId: offering.id,
          title: "E2E Learning Path",
          description:
            "Deterministic browser regression path",
        },
      );
    const lesson =
      await lessonService.createCourseLesson(
        collegeAdmin,
        {
          learningPathId: path.id,
          name: "E2E Foundations",
          sequence: 0,
        },
      );

    const shared =
      await contentService.createLessonContent(
        collegeAdmin,
        {
          lessonId: lesson.id,
          contentType: "RESOURCE",
          title: "E2E Shared Notes",
          notes: "Shared browser fixture",
          sequence: 0,
        },
      );
    const sectionAOnly =
      await contentService.createLessonContent(
        faculty,
        {
          lessonId: lesson.id,
          deliveryId: deliveryA.id,
          contentType: "RESOURCE",
          title: "E2E Section A Notes",
          notes: "Visible only in Section A",
          sequence: 1,
        },
      );
    const sectionBOnly =
      await contentService.createLessonContent(
        collegeAdmin,
        {
          lessonId: lesson.id,
          deliveryId: deliveryB.id,
          contentType: "RESOURCE",
          title: "E2E Section B Secret",
          notes: "Must not leak into Section A",
          sequence: 2,
        },
      );

    await contentService.transitionLessonContent(
      collegeAdmin,
      shared.id,
      { action: "PUBLISH" },
    );
    await contentService.transitionLessonContent(
      faculty,
      sectionAOnly.id,
      { action: "PUBLISH" },
    );
    await contentService.transitionLessonContent(
      collegeAdmin,
      sectionBOnly.id,
      { action: "PUBLISH" },
    );
    await pathService.transitionLearningPath(
      collegeAdmin,
      path.id,
      { action: "PUBLISH" },
    );

    process.stdout.write(
      "Deterministic Course browser E2E fixture applied.\n",
    );
  } finally {
    await dbClient.closeDatabaseConnection();
  }
}

main().catch((error) => {
  const message =
    error instanceof Error
      ? error.stack ?? error.message
      : String(error);
  process.stderr.write(message + "\n");
  process.exitCode = 1;
});
