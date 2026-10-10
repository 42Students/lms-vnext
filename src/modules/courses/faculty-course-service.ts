import {
  and,
  asc,
  desc,
  eq,
  isNull,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  academicPeriods,
  collegeMemberships,
  membershipRoles,
  courseOfferings,
  courseSectionDeliveries,
  courseTeachingAssignments,
  courses,
  sections,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { CoursesServiceError } from "./errors";
import {
  requireLearningReadAccess,
} from "./learning-access";
import { listLearningPaths } from "./learning-path-service";
import { listCourseLessons } from "./lesson-service";
import { listLessonContents } from "./lesson-content-service";
import { listCourseAssignments } from "./assignment-service";
import { listCourseQuizzes } from "./quiz-service";
import {
  courseSectionDeliveryIdSchema,
} from "./validation";
import {
  loadCourseSectionDeliveryScope,
} from "./scope";

function requireFacultyMembership(
  context: RequestContext,
) {
  if (
    context.user.platformStatus !== "ACTIVE" ||
    !context.membership ||
    context.membership.status !== "ACTIVE" ||
    !context.membership.roles.includes("FACULTY")
  ) {
    throw new CoursesServiceError(
      "FACULTY_TEACHING_SCOPE_REQUIRED",
    );
  }

  return context.membership;
}

export async function listFacultyCourseDeliveries(
  context: RequestContext,
) {
  const membership =
    requireFacultyMembership(context);

  return getDb()
    .select({
      teachingAssignmentId:
        courseTeachingAssignments.id,
      teachingRole:
        courseTeachingAssignments.role,
      deliveryId:
        courseSectionDeliveries.id,
      offeringId:
        courseOfferings.id,
      offeringType:
        courseOfferings.type,
      credits: courseOfferings.credits,
      courseId: courses.id,
      courseName: courses.name,
      courseCode: courses.code,
      courseDescription:
        courses.description,
      sectionId: sections.id,
      sectionName: sections.name,
      sectionCode: sections.code,
      academicPeriodId:
        academicPeriods.id,
      academicPeriodName:
        academicPeriods.name,
      academicPeriodCode:
        academicPeriods.code,
      academicPeriodStatus:
        academicPeriods.status,
      startedAt:
        courseTeachingAssignments.startedAt,
    })
    .from(courseTeachingAssignments)
    // A stale identity cookie cannot preserve faculty read access once the
    // authoritative membership is suspended, reassigned or de-roled.
    .innerJoin(
      collegeMemberships,
      and(
        eq(collegeMemberships.id, courseTeachingAssignments.membershipId),
        eq(collegeMemberships.userId, context.user.id),
        eq(collegeMemberships.collegeId, membership.collegeId),
        eq(collegeMemberships.status, "ACTIVE"),
      ),
    )
    .innerJoin(
      membershipRoles,
      and(
        eq(membershipRoles.membershipId, collegeMemberships.id),
        eq(membershipRoles.role, "FACULTY"),
      ),
    )
    .innerJoin(
      courseSectionDeliveries,
      eq(
        courseSectionDeliveries.id,
        courseTeachingAssignments.deliveryId,
      ),
    )
    .innerJoin(
      courseOfferings,
      eq(
        courseOfferings.id,
        courseSectionDeliveries.offeringId,
      ),
    )
    .innerJoin(
      courses,
      eq(
        courses.id,
        courseOfferings.courseId,
      ),
    )
    .innerJoin(
      sections,
      eq(
        sections.id,
        courseSectionDeliveries.sectionId,
      ),
    )
    .innerJoin(
      academicPeriods,
      eq(
        academicPeriods.id,
        courseOfferings.academicPeriodId,
      ),
    )
    .where(
      and(
        eq(
          courseTeachingAssignments.membershipId,
          membership.id,
        ),
        isNull(
          courseTeachingAssignments.endedAt,
        ),
        isNull(
          courseSectionDeliveries.endedAt,
        ),
        eq(
          courseOfferings.status,
          "ACTIVE",
        ),
        eq(courses.status, "ACTIVE"),
        eq(sections.status, "ACTIVE"),
      ),
    )
    .orderBy(
      desc(academicPeriods.startDate),
      asc(courses.name),
      asc(sections.name),
    );
}

export async function getFacultyCourseWorkspace(
  context: RequestContext,
  deliveryIdInput: string,
) {
  const deliveryId =
    courseSectionDeliveryIdSchema.parse(
      deliveryIdInput,
    );
  requireFacultyMembership(context);

  const delivery =
    await loadCourseSectionDeliveryScope(
      deliveryId,
    );
  const access =
    await requireLearningReadAccess(
      context,
      delivery.offeringId,
      deliveryId,
    );

  if (access !== "FACULTY") {
    throw new CoursesServiceError(
      "FACULTY_TEACHING_SCOPE_REQUIRED",
    );
  }

  const assigned =
    await listFacultyCourseDeliveries(context);
  const course = assigned.find(
    (row) => row.deliveryId === deliveryId,
  );

  if (!course) {
    throw new CoursesServiceError(
      "FACULTY_TEACHING_SCOPE_REQUIRED",
    );
  }

  const paths = await listLearningPaths(
    context,
    course.offeringId,
    deliveryId,
  );
  const learningPath = paths[0] ?? null;

  if (!learningPath) {
    return {
      course,
      learningPath: null,
      lessons: [],
      summary: {
        lessons: 0,
        contents: 0,
        assignments: 0,
        quizzes: 0,
        draftItems: 0,
        publishedItems: 0,
      },
    };
  }

  const lessonRows = await listCourseLessons(
    context,
    learningPath.id,
    deliveryId,
  );

  const lessons = await Promise.all(
    lessonRows.map(async (lesson) => {
      const [contents, assignments, quizzes] =
        await Promise.all([
          listLessonContents(
            context,
            lesson.id,
            deliveryId,
          ),
          listCourseAssignments(
            context,
            lesson.id,
            deliveryId,
          ),
          listCourseQuizzes(
            context,
            lesson.id,
            deliveryId,
          ),
        ]);

      return {
        ...lesson,
        contents,
        assignments,
        quizzes,
      };
    }),
  );

  const contents = lessons.flatMap(
    (lesson) => lesson.contents,
  );
  const assignments = lessons.flatMap(
    (lesson) => lesson.assignments,
  );
  const quizzes = lessons.flatMap(
    (lesson) => lesson.quizzes,
  );
  const statuses = [
    ...contents.map((item) => item.status),
    ...assignments.map((item) => item.status),
    ...quizzes.map((item) => item.status),
  ];

  return {
    course,
    learningPath,
    lessons,
    summary: {
      lessons: lessons.length,
      contents: contents.length,
      assignments: assignments.length,
      quizzes: quizzes.length,
      draftItems: statuses.filter(
        (status) => status === "DRAFT",
      ).length,
      publishedItems: statuses.filter(
        (status) => status === "PUBLISHED",
      ).length,
    },
  };
}
