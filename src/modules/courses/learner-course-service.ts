import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNull,
  ne,
  or,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  academicPeriods,
  cohorts,
  assignmentSubmissions,
  courseAssignments,
  collegeMemberships,
  courseLearningPaths,
  courseLessons,
  courseOfferings,
  courseQuizzes,
  courseSectionDeliveries,
  courseTeachingAssignments,
  courses,
  learnerContentProgress,
  learnerProgramEnrollments,
  lessonContents,
  programs,
  quizAttempts,
  sectionEnrollments,
  sections,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { CoursesServiceError } from "./errors";
import { listActiveElectiveDeliveryIds, listBoundElectiveDeliveryIds } from "@/modules/groups/roster-access";
import { applyDeliveryContentOrderIfReady } from "./lesson-content-order-service";
import { sql } from "drizzle-orm";
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
    context.user.platformStatus !== "ACTIVE" ||
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
  options: {
    includeHistorical?: boolean;
  } = {},
) {
  const membership =
    requireLearnerMembership(context);
  const includeHistorical =
    options.includeHistorical ?? false;

  const primaryRows = await getDb()
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
      cohortName: cohorts.name,
      academicPeriodId: academicPeriods.id,
      academicPeriodName:
        academicPeriods.name,
      programId: programs.id,
      programName: programs.name,
      programCode: programs.code,
      periodStartDate:
        academicPeriods.startDate,
      periodEndDate: academicPeriods.endDate,
      learningPathId:
        courseLearningPaths.id,
      learningPathStatus:
        courseLearningPaths.status,
      deliveryEndedAt:
        courseSectionDeliveries.endedAt,
      sectionEnrollmentStatus:
        sectionEnrollments.status,
      programEnrollmentStatus:
        learnerProgramEnrollments.status,
      periodStatus:
        academicPeriods.status,
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
      programs,
      eq(
        programs.id,
        learnerProgramEnrollments.programId,
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
      cohorts,
      eq(cohorts.id, sections.cohortId),
    )
    .innerJoin(
      courseSectionDeliveries,
      includeHistorical
        ? eq(
            courseSectionDeliveries.sectionId,
            sections.id,
          )
        : and(
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
      includeHistorical
        ? and(
            eq(
              courseOfferings.id,
              courseSectionDeliveries.offeringId,
            ),
            eq(
              courseOfferings.academicPeriodId,
              sectionEnrollments.academicPeriodId,
            ),
          )
        : and(
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
      includeHistorical
        ? eq(
            courses.id,
            courseOfferings.courseId,
          )
        : and(
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
        includeHistorical
          ? inArray(
              learnerProgramEnrollments.status,
              ["ACTIVE", "COMPLETED"],
            )
          : eq(
              learnerProgramEnrollments.status,
              "ACTIVE",
            ),
        includeHistorical
          ? inArray(
              sectionEnrollments.status,
              ["ACTIVE", "COMPLETED"],
            )
          : eq(
              sectionEnrollments.status,
              "ACTIVE",
            ),
        includeHistorical
          ? inArray(
              sections.status,
              ["ACTIVE", "ARCHIVED"],
            )
          : eq(sections.status, "ACTIVE"),
      ),
    )
    .orderBy(
      desc(academicPeriods.startDate),
      asc(courseOfferings.displayOrder),
      asc(courses.name),
    );
  // Group-backed electives do not change the student's primary section
  // enrollment. An existing host-section enrollment does not confer access.
  const [groupDeliveryIds, boundDeliveryIds] = await Promise.all([
    listActiveElectiveDeliveryIds(membership.id, membership.collegeId),
    listBoundElectiveDeliveryIds(primaryRows.map(row => row.deliveryId)),
  ]);
  const bound = new Set(boundDeliveryIds);

  if (groupDeliveryIds.length === 0) {
    return primaryRows.filter(row => !bound.has(row.deliveryId));
  }

  const groupRows = await getDb()
    .select({
      deliveryId: courseSectionDeliveries.id,
      offeringId: courseOfferings.id,
      courseId: courses.id,
      courseName: courses.name,
      courseCode: courses.code,
      courseDescription: courses.description,
      offeringType: courseOfferings.type,
      credits: courseOfferings.credits,
      displayOrder: courseOfferings.displayOrder,
      sectionId: sections.id,
      sectionName: sections.name,
      sectionCode: sections.code,
      cohortName: cohorts.name,
      academicPeriodId: academicPeriods.id,
      academicPeriodName: academicPeriods.name,
      programId: programs.id,
      programName: programs.name,
      programCode: programs.code,
      periodStartDate: academicPeriods.startDate,
      periodEndDate: academicPeriods.endDate,
      learningPathId: courseLearningPaths.id,
      learningPathStatus: courseLearningPaths.status,
      deliveryEndedAt: courseSectionDeliveries.endedAt,
      sectionEnrollmentStatus: sql<"ACTIVE">`'ACTIVE'`,
      programEnrollmentStatus: sql<"ACTIVE">`'ACTIVE'`,
      periodStatus: academicPeriods.status,
    })
    .from(courseSectionDeliveries)
    .innerJoin(courseOfferings, eq(courseOfferings.id, courseSectionDeliveries.offeringId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .innerJoin(sections, eq(sections.id, courseSectionDeliveries.sectionId))
    .innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
    .innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(academicPeriods, eq(academicPeriods.id, courseOfferings.academicPeriodId))
    .leftJoin(courseLearningPaths, and(
      eq(courseLearningPaths.offeringId, courseOfferings.id),
      ne(courseLearningPaths.status, "ARCHIVED"),
    ))
    .where(and(
      inArray(courseSectionDeliveries.id, groupDeliveryIds),
      eq(courseOfferings.status, "ACTIVE"),
      eq(courses.status, "ACTIVE"),
      eq(sections.status, "ACTIVE"),
      eq(sections.cohortId, courseOfferings.cohortId),
      eq(sections.academicPeriodId, courseOfferings.academicPeriodId),
      isNull(courseSectionDeliveries.endedAt),
    ))
    .orderBy(desc(academicPeriods.startDate), asc(courseOfferings.displayOrder), asc(courses.name));

  // An elective-backed course appears once, even if this learner is also in
  // its host section; eligibility remains group-owned.
  return [...primaryRows.filter(row => !bound.has(row.deliveryId)), ...groupRows];

}

export async function listLearnerCourseInstructors(
  context: RequestContext,
  deliveryIdInput: string,
) {
  const membership = requireLearnerMembership(context);
  const deliveryId =
    courseSectionDeliveryIdSchema.parse(deliveryIdInput);
  const delivery =
    await loadCourseSectionDeliveryScope(
      deliveryId,
      true,
    );
  const access = await requireLearningReadAccess(
    context,
    delivery.offeringId,
    deliveryId,
    { includeHistorical: true },
  );

  if (access !== "LEARNER") {
    throw new CoursesServiceError(
      "LEARNER_PROGRESS_ACCESS_DENIED",
    );
  }

  const rows = await getDb()
    .select({
      membershipId: courseTeachingAssignments.membershipId,
      role: courseTeachingAssignments.role,
      name: users.displayName,
      endedAt: courseTeachingAssignments.endedAt,
    })
    .from(courseTeachingAssignments)
    .innerJoin(
      collegeMemberships,
      eq(
        collegeMemberships.id,
        courseTeachingAssignments.membershipId,
      ),
    )
    .innerJoin(
      users,
      eq(users.id, collegeMemberships.userId),
    )
    .where(
      and(
        eq(
          courseTeachingAssignments.deliveryId,
          deliveryId,
        ),
        eq(
          collegeMemberships.collegeId,
          membership.collegeId,
        ),
      ),
    )
    .orderBy(
      asc(courseTeachingAssignments.role),
      asc(users.displayName),
    );

  const active = rows.filter(
    (row) => !row.endedAt,
  );
  const visible = active.length > 0
    ? active
    : rows;

  return visible.map((row) => ({
    membershipId: row.membershipId,
    role: row.role,
    name: row.name,
  }));
}

type AssessmentProgressStatus =
  | "NOT_STARTED"
  | "COMPLETED"
  | "MISSED";

type AssessmentProgress = {
  status: AssessmentProgressStatus;
  percentComplete: number;
  completedAt: Date | null;
};

function assessmentProgress(
  completedAt: Date | null,
  missed: boolean,
): AssessmentProgress {
  if (completedAt) {
    return {
      status: "COMPLETED",
      percentComplete: 100,
      completedAt,
    };
  }

  return {
    status: missed
      ? "MISSED"
      : "NOT_STARTED",
    percentComplete: 0,
    completedAt: null,
  };
}

export async function getLearnerCourseWorkspace(
  context: RequestContext,
  deliveryIdInput: string,
) {
  // Capture once for consistent deadline/availability and UI-activity decisions.
  const snapshotNowMs = Date.now();
  const membership =
    requireLearnerMembership(context);
  const deliveryId =
    courseSectionDeliveryIdSchema.parse(
      deliveryIdInput,
    );
  const delivery =
    await loadCourseSectionDeliveryScope(
      deliveryId,
      true,
    );
  const access =
    await requireLearningReadAccess(
      context,
      delivery.offeringId,
      deliveryId,
      { includeHistorical: true },
    );

  if (access !== "LEARNER") {
    throw new CoursesServiceError(
      "LEARNER_PROGRESS_ACCESS_DENIED",
    );
  }

  const course = await loadCourseScope(
    delivery.courseId,
    true,
  );
  let [path] = await getDb()
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

  if (!path && delivery.endedAt) {
    [path] = await getDb()
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
            "ARCHIVED",
          ),
        ),
      )
      .orderBy(
        desc(courseLearningPaths.updatedAt),
      )
      .limit(1);
  }

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
      snapshotNowMs,
      summary: {
        overallPercent: 0,
        lessonsCompleted: 0,
        lessonsTotal: 0,
        contentsCompleted: 0,
        contentsTotal: 0,
        assignmentsCompleted: 0,
        assignmentsTotal: 0,
        assignmentsMissed: 0,
        quizzesCompleted: 0,
        quizzesTotal: 0,
        quizzesMissed: 0,
        itemsCompleted: 0,
        itemsTotal: 0,
        itemsMissed: 0,
      },
      nextContent: null,
      nextItem: null,
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
        eq(courseLessons.visibleToStudents, true),
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
    availability:
      | "SCHEDULED"
      | "AVAILABLE"
      | "ENDED";
    progress: ReturnType<
      typeof buildLearnerProgressView
    >;
  };

  type AssignmentItem = {
    id: string;
    title: string;
    description: string | null;
    dueAt: Date | null;
    createdAt: Date;
    maxPoints: number;
    sequence: number;
    submissionId: string | null;
    submissionType: "TEXT" | "LINK" | "FILE" | null;
    submissionText: string | null;
    submissionUrl: string | null;
    submittedAt: Date | null;
    gradePublished: boolean;
    pointsAwarded: number | null;
    feedback: string | null;
    gradingStatus:
      | "NOT_GRADED"
      | "GRADED";
    progress: AssessmentProgress;
  };

  type QuizItem = {
    id: string;
    title: string;
    description: string | null;
    dueAt: Date | null;
    createdAt: Date;
    maxAttempts: number;
    totalPoints: number;
    sequence: number;
    status:
      | "PUBLISHED"
      | "CLOSED";
    resultsPublished: boolean;
    attemptsUsed: number;
    attemptsRemaining: number;
    progress: AssessmentProgress;
  };

  type LessonItem = {
    id: string;
    name: string;
    description: string | null;
    sequence: number;
    contents: ContentItem[];
    assignments: AssignmentItem[];
    quizzes: QuizItem[];
    items: Array<{
      kind:
        | "CONTENT"
        | "ASSIGNMENT"
        | "QUIZ";
      id: string;
      title: string;
      sequence: number;
      progress:
        | ContentItem["progress"]
        | AssessmentProgress;
    }>;
  };

  const lessons = new Map<
    string,
    LessonItem
  >();
  const now = snapshotNowMs;

  for (const row of rows) {
    let lesson = lessons.get(row.lessonId);
    if (!lesson) {
      lesson = {
        id: row.lessonId,
        name: row.lessonName,
        description: row.lessonDescription,
        sequence: row.lessonSequence,
        contents: [],
        assignments: [],
        quizzes: [],
        items: [],
      };
      lessons.set(row.lessonId, lesson);
    }

    if (!row.contentId) {
      continue;
    }

    const contentAvailability =
      row.contentStartsAt &&
      row.contentStartsAt.getTime() > now
        ? "SCHEDULED"
        : row.contentType === "LIVE_CLASS" &&
            row.contentEndsAt &&
            row.contentEndsAt.getTime() < now
          ? "ENDED"
          : "AVAILABLE";

    lesson.contents.push({
      id: row.contentId,
      type: row.contentType!,
      title: row.contentTitle!,
      notes: row.contentNotes,
      externalUrl:
        (contentAvailability === "AVAILABLE" || row.contentType === "LIVE_CLASS")
          ? row.contentExternalUrl
          : null,
      storageKey:
        contentAvailability === "AVAILABLE"
          ? row.contentStorageKey
          : null,
      durationSeconds:
        row.contentDurationSeconds,
      startsAt: row.contentStartsAt,
      endsAt: row.contentEndsAt,
      sequence: row.contentSequence!,
      availability: contentAvailability,
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
  await Promise.all(
    lessonList.map(async (lesson) => {
      lesson.contents =
        await applyDeliveryContentOrderIfReady(
          lesson.contents,
          deliveryId,
        );
    }),
  );
  const lessonIds = lessonList.map(
    (lesson) => lesson.id,
  );

  if (lessonIds.length > 0) {
    const assignments = await getDb()
      .select({
        id: courseAssignments.id,
        lessonId: courseAssignments.lessonId,
        title: courseAssignments.title,
        description:
          courseAssignments.description,
        dueAt: courseAssignments.dueAt,
        createdAt: courseAssignments.createdAt,
        maxPoints: courseAssignments.maxPoints,
        sequence: courseAssignments.sequence,
        submissionId:
          assignmentSubmissions.id,
        submissionType:
          assignmentSubmissions.submissionType,
        submissionText:
          assignmentSubmissions.textContent,
        submissionUrl:
          assignmentSubmissions.submissionUrl,
        submittedAt:
          assignmentSubmissions.submittedAt,
        gradePublished:
          assignmentSubmissions.gradePublished,
        pointsAwarded:
          assignmentSubmissions.pointsAwarded,
        feedback:
          assignmentSubmissions.feedback,
        gradingStatus:
          assignmentSubmissions.gradingStatus,
      })
      .from(courseAssignments)
      .leftJoin(
        assignmentSubmissions,
        and(
          eq(
            assignmentSubmissions.assignmentId,
            courseAssignments.id,
          ),
          eq(
            assignmentSubmissions.membershipId,
            membership.id,
          ),
          eq(
            assignmentSubmissions.deliveryId,
            deliveryId,
          ),
        ),
      )
      .where(
        and(
          inArray(
            courseAssignments.lessonId,
            lessonIds,
          ),
          eq(
            courseAssignments.status,
            "PUBLISHED",
          ),
          or(
            isNull(
              courseAssignments.deliveryId,
            ),
            eq(
              courseAssignments.deliveryId,
              deliveryId,
            ),
          ),
        ),
      )
      .orderBy(
        asc(courseAssignments.sequence),
        asc(courseAssignments.createdAt),
        asc(courseAssignments.id),
      );

    for (const row of assignments) {
      const lesson = lessons.get(
        row.lessonId,
      );
      if (!lesson) continue;

      // Legacy LMS parity: overdue assignments remain actionable.
      // Only quizzes use MISSED to mean the attempt window is closed.
      const progress = assessmentProgress(
        row.submittedAt,
        false,
      );

      lesson.assignments.push({
        id: row.id,
        title: row.title,
        description: row.description,
        dueAt: row.dueAt,
        createdAt: row.createdAt,
        maxPoints: row.maxPoints,
        sequence: row.sequence,
        submissionId: row.submissionId,
        submissionType: row.submissionType,
        submissionText: row.submissionText,
        submissionUrl: row.submissionUrl,
        submittedAt: row.submittedAt,
        gradePublished:
          row.gradePublished ?? false,
        pointsAwarded:
          row.gradePublished
            ? row.pointsAwarded
            : null,
        feedback:
          row.gradePublished
            ? row.feedback
            : null,
        gradingStatus:
          row.gradePublished &&
          row.gradingStatus === "GRADED"
            ? "GRADED"
            : "NOT_GRADED",
        progress,
      });
    }

    const quizzes = await getDb()
      .select({
        id: courseQuizzes.id,
        lessonId: courseQuizzes.lessonId,
        title: courseQuizzes.title,
        description: courseQuizzes.description,
        dueAt: courseQuizzes.dueAt,
        createdAt: courseQuizzes.createdAt,
        maxAttempts:
          courseQuizzes.maxAttempts,
        totalPoints: courseQuizzes.totalPoints,
        sequence: courseQuizzes.sequence,
        status: courseQuizzes.status,
        resultsPublished:
          courseQuizzes.resultsPublished,
      })
      .from(courseQuizzes)
      .where(
        and(
          inArray(
            courseQuizzes.lessonId,
            lessonIds,
          ),
          inArray(courseQuizzes.status, [
            "PUBLISHED",
            "CLOSED",
          ]),
          or(
            isNull(courseQuizzes.deliveryId),
            eq(
              courseQuizzes.deliveryId,
              deliveryId,
            ),
          ),
        ),
      )
      .orderBy(
        asc(courseQuizzes.sequence),
        asc(courseQuizzes.createdAt),
        asc(courseQuizzes.id),
      );

    const quizIds = quizzes.map(
      (quiz) => quiz.id,
    );
    const quizAttemptRows =
      quizIds.length > 0
        ? await getDb()
            .select({
              quizId: quizAttempts.quizId,
              id: quizAttempts.id,
              submittedAt:
                quizAttempts.submittedAt,
            })
            .from(quizAttempts)
            .where(
              and(
                inArray(
                  quizAttempts.quizId,
                  quizIds,
                ),
                eq(
                  quizAttempts.membershipId,
                  membership.id,
                ),
                eq(
                  quizAttempts.deliveryId,
                  deliveryId,
                ),
              ),
            )
            .orderBy(
              asc(quizAttempts.submittedAt),
            )
        : [];

    const attemptsByQuiz = new Map<
      string,
      Array<{
        id: string;
        submittedAt: Date;
      }>
    >();

    for (const attempt of quizAttemptRows) {
      const bucket =
        attemptsByQuiz.get(attempt.quizId) ??
        [];
      bucket.push({
        id: attempt.id,
        submittedAt: attempt.submittedAt,
      });
      attemptsByQuiz.set(
        attempt.quizId,
        bucket,
      );
    }

    for (const row of quizzes) {
      const lesson = lessons.get(
        row.lessonId,
      );
      if (!lesson) continue;

      const attempts =
        attemptsByQuiz.get(row.id) ?? [];
      const completedAt =
        attempts.length > 0
          ? attempts[0]!.submittedAt
          : null;
      const missed =
        !completedAt &&
        (row.status === "CLOSED" ||
          (Boolean(row.dueAt) &&
            row.dueAt!.getTime() < now));
      const progress =
        assessmentProgress(
          completedAt,
          missed,
        );

      lesson.quizzes.push({
        id: row.id,
        title: row.title,
        description: row.description,
        dueAt: row.dueAt,
        createdAt: row.createdAt,
        maxAttempts: row.maxAttempts,
        totalPoints: row.totalPoints,
        sequence: row.sequence,
        status:
          row.status === "CLOSED"
            ? "CLOSED"
            : "PUBLISHED",
        resultsPublished:
          row.resultsPublished,
        attemptsUsed: attempts.length,
        attemptsRemaining:
          row.status === "PUBLISHED"
            ? Math.max(
                0,
                row.maxAttempts -
                  attempts.length,
              )
            : 0,
        progress,
      });
    }
  }

  const kindOrder = {
    CONTENT: 0,
    ASSIGNMENT: 1,
    QUIZ: 2,
  } as const;

  for (const lesson of lessonList) {
    lesson.items = [
      ...lesson.contents.map((content) => ({
        kind: "CONTENT" as const,
        id: content.id,
        title: content.title,
        sequence: content.sequence,
        progress: content.progress,
      })),
      ...lesson.assignments.map(
        (assignment) => ({
          kind: "ASSIGNMENT" as const,
          id: assignment.id,
          title: assignment.title,
          sequence: assignment.sequence,
          progress: assignment.progress,
        }),
      ),
      ...lesson.quizzes.map((quiz) => ({
        kind: "QUIZ" as const,
        id: quiz.id,
        title: quiz.title,
        sequence: quiz.sequence,
        progress: quiz.progress,
      })),
    ].sort(
      (a, b) =>
        a.sequence - b.sequence ||
        kindOrder[a.kind] -
          kindOrder[b.kind] ||
        a.id.localeCompare(b.id),
    );
  }

  const allContents = lessonList.flatMap(
    (lesson) =>
      lesson.contents.map((content) => ({
        lesson,
        content,
      })),
  );
  const allAssignments =
    lessonList.flatMap((lesson) =>
      lesson.assignments.map(
        (assignment) => ({
          lesson,
          assignment,
        }),
      ),
    );
  const allQuizzes = lessonList.flatMap(
    (lesson) =>
      lesson.quizzes.map((quiz) => ({
        lesson,
        quiz,
      })),
  );
  const allItems = lessonList.flatMap(
    (lesson) =>
      lesson.items.map((item) => ({
        lesson,
        item,
      })),
  );

  const contentsCompleted =
    allContents.filter(
      ({ content }) =>
        content.progress.status ===
        "COMPLETED",
    ).length;
  const assignmentsCompleted =
    allAssignments.filter(
      ({ assignment }) =>
        assignment.progress.status ===
        "COMPLETED",
    ).length;
  const assignmentsMissed =
    allAssignments.filter(
      ({ assignment }) =>
        assignment.progress.status ===
        "MISSED",
    ).length;
  const quizzesCompleted =
    allQuizzes.filter(
      ({ quiz }) =>
        quiz.progress.status ===
        "COMPLETED",
    ).length;
  const quizzesMissed = allQuizzes.filter(
    ({ quiz }) =>
      quiz.progress.status === "MISSED",
  ).length;

  const progressPoints = allItems.reduce(
    (sum, { item }) =>
      sum + item.progress.percentComplete,
    0,
  );
  const itemsCompleted = allItems.filter(
    ({ item }) =>
      item.progress.status === "COMPLETED",
  ).length;
  const itemsMissed = allItems.filter(
    ({ item }) =>
      item.progress.status === "MISSED",
  ).length;

  const lessonsCompleted =
    lessonList.filter(
      (lesson) =>
        lesson.items.length > 0 &&
        lesson.items.every(
          (item) =>
            item.progress.status ===
            "COMPLETED",
        ),
    ).length;

  const nextContent =
    allContents.find(
      ({ content }) =>
        content.progress.status !==
        "COMPLETED",
    ) ?? null;

  const nextItem =
    allItems.find(({ lesson, item }) => {
      if (
        item.progress.status !== "NOT_STARTED" &&
        item.progress.status !== "IN_PROGRESS"
      ) {
        return false;
      }

      if (item.kind !== "CONTENT") {
        return true;
      }

      const content = lesson.contents.find(
        (candidate) => candidate.id === item.id,
      );

      return content?.availability === "AVAILABLE";
    }) ?? null;

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
    snapshotNowMs,
    summary: {
      overallPercent:
        allItems.length > 0
          ? Math.round(
              progressPoints /
                allItems.length,
            )
          : 0,
      lessonsCompleted,
      lessonsTotal: lessonList.length,
      contentsCompleted,
      contentsTotal: allContents.length,
      assignmentsCompleted,
      assignmentsTotal:
        allAssignments.length,
      assignmentsMissed,
      quizzesCompleted,
      quizzesTotal: allQuizzes.length,
      quizzesMissed,
      itemsCompleted,
      itemsTotal: allItems.length,
      itemsMissed,
    },
    nextContent: nextContent
      ? {
          lessonId: nextContent.lesson.id,
          lessonName:
            nextContent.lesson.name,
          contentId:
            nextContent.content.id,
          contentTitle:
            nextContent.content.title,
          contentType:
            nextContent.content.type,
          progress:
            nextContent.content.progress,
        }
      : null,
    nextItem: nextItem
      ? {
          lessonId: nextItem.lesson.id,
          lessonName: nextItem.lesson.name,
          kind: nextItem.item.kind,
          itemId: nextItem.item.id,
          title: nextItem.item.title,
          sequence: nextItem.item.sequence,
          progress: nextItem.item.progress,
        }
      : null,
    lessons: lessonList,
  };
}
