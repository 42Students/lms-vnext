import {
  and,
  asc,
  desc,
  eq,
  isNull,
  ne,
  or,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  academicPeriods,
  courseLearningPaths,
  courseLessons,
  courseOfferings,
  courseSectionDeliveries,
  courses,
  learnerContentProgress,
  learnerProgramEnrollments,
  lessonContents,
  sectionEnrollments,
  sections,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { CoursesServiceError } from "./errors";
import {
  requireLearningReadAccess,
} from "./learning-access";
import {
  buildLearnerProgressView,
} from "./progress-service";
import {
  loadCourseScope,
  loadCourseSectionDeliveryScope,
} from "./scope";
import {
  courseSectionDeliveryIdSchema,
} from "./validation";

function requireLearnerMembership(
  context: RequestContext,
) {
  if (
    !context.membership ||
    context.membership.status !== "ACTIVE" ||
    !context.membership.roles.includes("LEARNER")
  ) {
    throw new CoursesServiceError(
      "LEARNER_PROGRESS_ACCESS_DENIED",
    );
  }

  return context.membership;
}

export async function listLearnerCourseDeliveries(
  context: RequestContext,
) {
  const membership =
    requireLearnerMembership(context);

  return getDb()
    .select({
      deliveryId: courseSectionDeliveries.id,
      offeringId: courseOfferings.id,
      courseId: courses.id,
      courseName: courses.name,
      courseCode: courses.code,
      courseDescription: courses.description,
      offeringType: courseOfferings.type,
      credits: courseOfferings.credits,
      displayOrder:
        courseOfferings.displayOrder,
      sectionId: sections.id,
      sectionName: sections.name,
      sectionCode: sections.code,
      academicPeriodId: academicPeriods.id,
      academicPeriodName:
        academicPeriods.name,
      periodStartDate:
        academicPeriods.startDate,
      periodEndDate: academicPeriods.endDate,
      learningPathId:
        courseLearningPaths.id,
      learningPathStatus:
        courseLearningPaths.status,
    })
    .from(sectionEnrollments)
    .innerJoin(
      learnerProgramEnrollments,
      eq(
        learnerProgramEnrollments.id,
        sectionEnrollments.learnerEnrollmentId,
      ),
    )
    .innerJoin(
      sections,
      eq(
        sections.id,
        sectionEnrollments.sectionId,
      ),
    )
    .innerJoin(
      courseSectionDeliveries,
      and(
        eq(
          courseSectionDeliveries.sectionId,
          sections.id,
        ),
        isNull(
          courseSectionDeliveries.endedAt,
        ),
      ),
    )
    .innerJoin(
      courseOfferings,
      and(
        eq(
          courseOfferings.id,
          courseSectionDeliveries.offeringId,
        ),
        eq(
          courseOfferings.academicPeriodId,
          sectionEnrollments.academicPeriodId,
        ),
        eq(
          courseOfferings.status,
          "ACTIVE",
        ),
      ),
    )
    .innerJoin(
      courses,
      and(
        eq(
          courses.id,
          courseOfferings.courseId,
        ),
        eq(courses.status, "ACTIVE"),
      ),
    )
    .innerJoin(
      academicPeriods,
      eq(
        academicPeriods.id,
        courseOfferings.academicPeriodId,
      ),
    )
    .leftJoin(
      courseLearningPaths,
      and(
        eq(
          courseLearningPaths.offeringId,
          courseOfferings.id,
        ),
        ne(
          courseLearningPaths.status,
          "ARCHIVED",
        ),
      ),
    )
    .where(
      and(
        eq(
          learnerProgramEnrollments.membershipId,
          membership.id,
        ),
        eq(
          learnerProgramEnrollments.status,
          "ACTIVE",
        ),
        eq(
          sectionEnrollments.status,
          "ACTIVE",
        ),
        eq(sections.status, "ACTIVE"),
      ),
    )
    .orderBy(
      desc(academicPeriods.startDate),
      asc(courseOfferings.displayOrder),
      asc(courses.name),
    );
}

export async function getLearnerCourseWorkspace(
  context: RequestContext,
  deliveryIdInput: string,
) {
  const membership =
    requireLearnerMembership(context);
  const deliveryId =
    courseSectionDeliveryIdSchema.parse(
      deliveryIdInput,
    );
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

  if (access !== "LEARNER") {
    throw new CoursesServiceError(
      "LEARNER_PROGRESS_ACCESS_DENIED",
    );
  }

  const course = await loadCourseScope(
    delivery.courseId,
  );
  const [path] = await getDb()
    .select()
    .from(courseLearningPaths)
    .where(
      and(
        eq(
          courseLearningPaths.offeringId,
          delivery.offeringId,
        ),
        eq(
          courseLearningPaths.status,
          "PUBLISHED",
        ),
      ),
    )
    .limit(1);

  if (!path) {
    return {
      course: {
        id: course.id,
        name: course.name,
        code: course.code,
      },
      offering: {
        id: delivery.offeringId,
        academicPeriodId:
          delivery.academicPeriodId,
      },
      delivery: {
        id: delivery.id,
        sectionId: delivery.sectionId,
      },
      learningPath: null,
      summary: {
        overallPercent: 0,
        lessonsCompleted: 0,
        lessonsTotal: 0,
        contentsCompleted: 0,
        contentsTotal: 0,
      },
      nextContent: null,
      lessons: [],
    };
  }

  const rows = await getDb()
    .select({
      lessonId: courseLessons.id,
      lessonName: courseLessons.name,
      lessonDescription:
        courseLessons.description,
      lessonSequence:
        courseLessons.sequence,
      contentId: lessonContents.id,
      contentType:
        lessonContents.contentType,
      contentTitle: lessonContents.title,
      contentNotes: lessonContents.notes,
      contentExternalUrl:
        lessonContents.externalUrl,
      contentStorageKey:
        lessonContents.storageKey,
      contentDurationSeconds:
        lessonContents.durationSeconds,
      contentStartsAt:
        lessonContents.startsAt,
      contentEndsAt:
        lessonContents.endsAt,
      contentSequence:
        lessonContents.sequence,
      progressPosition:
        learnerContentProgress.lastPositionSeconds,
      progressCompletedAt:
        learnerContentProgress.completedAt,
    })
    .from(courseLessons)
    .leftJoin(
      lessonContents,
      and(
        eq(
          lessonContents.lessonId,
          courseLessons.id,
        ),
        eq(
          lessonContents.status,
          "PUBLISHED",
        ),
        or(
          isNull(lessonContents.deliveryId),
          eq(
            lessonContents.deliveryId,
            deliveryId,
          ),
        ),
      ),
    )
    .leftJoin(
      learnerContentProgress,
      and(
        eq(
          learnerContentProgress.lessonContentId,
          lessonContents.id,
        ),
        eq(
          learnerContentProgress.membershipId,
          membership.id,
        ),
      ),
    )
    .where(
      and(
        eq(
          courseLessons.learningPathId,
          path.id,
        ),
        eq(courseLessons.status, "ACTIVE"),
      ),
    )
    .orderBy(
      asc(courseLessons.sequence),
      asc(lessonContents.sequence),
      asc(lessonContents.createdAt),
      asc(lessonContents.id),
    );

  type ContentItem = {
    id: string;
    type: string;
    title: string;
    notes: string | null;
    externalUrl: string | null;
    storageKey: string | null;
    durationSeconds: number | null;
    startsAt: Date | null;
    endsAt: Date | null;
    sequence: number;
    progress: ReturnType<
      typeof buildLearnerProgressView
    >;
  };
  type LessonItem = {
    id: string;
    name: string;
    description: string | null;
    sequence: number;
    contents: ContentItem[];
  };

  const lessons = new Map<
    string,
    LessonItem
  >();

  for (const row of rows) {
    let lesson = lessons.get(row.lessonId);
    if (!lesson) {
      lesson = {
        id: row.lessonId,
        name: row.lessonName,
        description: row.lessonDescription,
        sequence: row.lessonSequence,
        contents: [],
      };
      lessons.set(row.lessonId, lesson);
    }

    if (!row.contentId) {
      continue;
    }

    lesson.contents.push({
      id: row.contentId,
      type: row.contentType!,
      title: row.contentTitle!,
      notes: row.contentNotes,
      externalUrl: row.contentExternalUrl,
      storageKey: row.contentStorageKey,
      durationSeconds:
        row.contentDurationSeconds,
      startsAt: row.contentStartsAt,
      endsAt: row.contentEndsAt,
      sequence: row.contentSequence!,
      progress: buildLearnerProgressView(
        {
          id: row.contentId,
          durationSeconds:
            row.contentDurationSeconds,
        },
        row.progressPosition === null &&
          row.progressCompletedAt === null
          ? null
          : {
              lastPositionSeconds:
                row.progressPosition ?? 0,
              completedAt:
                row.progressCompletedAt,
            },
      ),
    });
  }

  const lessonList = [...lessons.values()];
  const allContents = lessonList.flatMap(
    (lesson) =>
      lesson.contents.map((content) => ({
        lesson,
        content,
      })),
  );
  const contentsCompleted =
    allContents.filter(
      ({ content }) =>
        content.progress.status ===
        "COMPLETED",
    ).length;
  const progressPoints = allContents.reduce(
    (sum, { content }) =>
      sum + content.progress.percentComplete,
    0,
  );
  const lessonsCompleted =
    lessonList.filter(
      (lesson) =>
        lesson.contents.length > 0 &&
        lesson.contents.every(
          (content) =>
            content.progress.status ===
            "COMPLETED",
        ),
    ).length;
  const next =
    allContents.find(
      ({ content }) =>
        content.progress.status !==
        "COMPLETED",
    ) ?? null;

  return {
    course: {
      id: course.id,
      name: course.name,
      code: course.code,
    },
    offering: {
      id: delivery.offeringId,
      academicPeriodId:
        delivery.academicPeriodId,
    },
    delivery: {
      id: delivery.id,
      sectionId: delivery.sectionId,
    },
    learningPath: {
      id: path.id,
      title: path.title,
      description: path.description,
    },
    summary: {
      overallPercent:
        allContents.length > 0
          ? Math.round(
              progressPoints /
                allContents.length,
            )
          : 0,
      lessonsCompleted,
      lessonsTotal: lessonList.length,
      contentsCompleted,
      contentsTotal: allContents.length,
    },
    nextContent: next
      ? {
          lessonId: next.lesson.id,
          lessonName: next.lesson.name,
          contentId: next.content.id,
          contentTitle:
            next.content.title,
          contentType: next.content.type,
          progress:
            next.content.progress,
        }
      : null,
    lessons: lessonList,
  };
}
