import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { RequestContext } from "../src/modules/identity/context";

function assertDestructiveE2ETargetPreflight(databaseUrl: string) {
  const guardPath = fileURLToPath(
    new URL("./db01-test-database-guard.mjs", import.meta.url),
  );
  // Preserve the full process-env index signature: deleting DATABASE_URL
  // is intentional and must typecheck without weakening fail-closed preflight.
  const guardEnv: NodeJS.ProcessEnv = {
    ...process.env,
    TEST_DATABASE_URL: databaseUrl,
  };
  delete guardEnv.DATABASE_URL;

  const result = spawnSync(process.execPath, [guardPath], {
    env: guardEnv,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || "").trim();
    throw new Error(
      detail || "Destructive E2E database target preflight refused",
    );
  }

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
}

async function main() {
  const databaseUrl =
    process.env.E2E_DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "E2E_DATABASE_URL is required for browser E2E preparation",
    );
  }

  assertDestructiveE2ETargetPreflight(databaseUrl);

  process.env.TEST_DATABASE_URL = databaseUrl;
  process.env.DATABASE_URL = databaseUrl;

  const [
    dbLib,
    seedData,
    dbClient,
    dbSchema,
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
    projectTemplateService,
    projectInstanceService,
    projectMemberService,
  ] = await Promise.all([
    import("./db-lib"),
    import("./db-seed-data"),
    import("../src/db/client"),
    import("../src/db/schema"),
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
    import("../src/modules/projects/template-service"),
    import("../src/modules/projects/instance-service"),
    import("../src/modules/projects/member-service"),
  ]);

  await dbLib.resetDatabase(databaseUrl);
  await dbLib.seedDatabase(databaseUrl);

  const ids = seedData.SEED_IDS;
  await dbClient
    .getDb()
    .insert(dbSchema.membershipRoles)
    .values({
      membershipId:
        ids.facultyCollegeAMembership,
      role: "TPO",
    })
    .onConflictDoNothing();

  await dbClient
    .getDb()
    .insert(dbSchema.users)
    .values({
      id: "60000000-0000-4000-8000-000000000002",
      identityUid: "seed-placement-recruiter-e2e",
      email: "recruiter-e2e@example.com",
      displayName: "E2E Recruiter",
    })
    .onConflictDoNothing();

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
  const superAdmin: RequestContext = {
    user: {
      id: ids.superAdminUser,
      identityUid: "seed-superadmin",
      platformStatus: "ACTIVE",
      systemRoles: ["SUPER_ADMIN"],
    },
    membership: null,
    adminScope: null,
  };
  const scopedSuperAdmin: RequestContext = {
    ...superAdmin,
    adminScope: {
      organizationId: ids.organization,
      collegeId: ids.collegeA,
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
      roles: ["FACULTY", "MENTOR", "TPO"],
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
          points: 1,
          title: "E2E Shared Notes",
          notes: "Shared browser fixture",
          externalUrl:
            "https://example.com/e2e-shared-notes",
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
          points: 1,
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
          points: 1,
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

    const projectTemplate =
      await projectTemplateService.createProjectTemplate(
        superAdmin,
        {
          slug: "e2e-project-template",
          title: "E2E Project Template",
          summary: "Deterministic Project browser fixture",
          blueprint: {
            overview: {
              goal: "Exercise Project creation and team setup in the browser.",
              deliverables: ["E2E Project delivery"],
            },
            releases: [
              {
                key: "release-1",
                title: "E2E Release",
                sequence: 0,
              },
            ],
            sprints: [
              {
                key: "sprint-1",
                releaseKey: "release-1",
                title: "E2E Sprint",
                sequence: 0,
              },
            ],
            tasks: [
              {
                key: "task-1",
                sprintKey: "sprint-1",
                title: "E2E Project Task",
                taskType: "STORY",
                priority: "MEDIUM",
                sequence: 0,
              },
            ],
            resources: [],
          },
        },
      );
    await projectTemplateService.publishProjectTemplate(
      superAdmin,
      projectTemplate.template.id,
    );
    await projectTemplateService.assignProjectTemplateToCollege(
      scopedSuperAdmin,
      projectTemplate.template.id,
      ids.collegeA,
    );

    // Only isolated Mentor acceptance uses this production-service fixture.
    // Full browser jobs keep their normal data and separate workflows.
    if(process.env["MENTOR_E2E_SEED_PROJECT"]==="true"){
      const project=await projectInstanceService.createProjectInstance(
        collegeAdmin,{
          collegeId:ids.collegeA,
          templateId:projectTemplate.template.id,
          slug:"mentor-acceptance-e2e-project",
          title:"E2E Mentor Acceptance Project",
        });
      await projectMemberService.addProjectMember(collegeAdmin,project.id,{
        membershipId:ids.facultyCollegeAMembership,
        role:"MENTOR",
        isPrimary:true,
      });
      await projectMemberService.addProjectMember(collegeAdmin,project.id,{
        membershipId:ids.learnerCollegeAMembership,role:"LEARNER",
      });
      process.stdout.write("Persisted Mentor browser project "+project.id+"\\n");
    }

    process.stdout.write(
      "Deterministic Course + Project + Placement browser E2E fixtures applied.\n",
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
