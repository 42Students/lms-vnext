import { and, eq, ne } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  colleges,
  courseLearningPaths,
  courseLessons,
  courseOfferings,
  courseSectionDeliveries,
  courseTeachingAssignments,
  courses,
  lessonContents,
  departments,
  membershipRoles,
  organizations,
} from "@/db/schema";
import type { MembershipRole } from "@/modules/identity/constants";
import {
  loadAcademicPeriodScope,
  loadCohortScope,
  loadSectionScope,
} from "@/modules/academics/scope";
import { CoursesServiceError } from "./errors";

export async function loadCourseScope(
  courseId: string,
  includeArchived = false,
) {
  const db = getDb();
  const conditions = [
    eq(courses.id, courseId),
    eq(colleges.status, "ACTIVE"),
    eq(organizations.status, "ACTIVE"),
  ];

  if (!includeArchived) {
    conditions.push(eq(courses.status, "ACTIVE"));
  }

  const [course] = await db
    .select({
      id: courses.id,
      departmentId: courses.departmentId,
      collegeId: departments.collegeId,
      organizationId: colleges.organizationId,
      status: courses.status,
      enabled: courses.enabled,
      legacyAllowedForDisplay: courses.legacyAllowedForDisplay,
      name: courses.name,
      code: courses.code,
    })
    .from(courses)
    .innerJoin(
      departments,
      eq(departments.id, courses.departmentId),
    )
    .innerJoin(
      colleges,
      eq(colleges.id, departments.collegeId),
    )
    .innerJoin(
      organizations,
      eq(organizations.id, colleges.organizationId),
    )
    .where(and(...conditions))
    .limit(1);

  if (!course) {
    throw new CoursesServiceError("COURSE_NOT_FOUND");
  }

  return course;
}

export async function loadCourseOfferingScope(
  offeringId: string,
  includeArchived = false,
) {
  const db = getDb();
  const conditions = [
    eq(courseOfferings.id, offeringId),
  ];

  if (!includeArchived) {
    conditions.push(
      eq(courseOfferings.status, "ACTIVE"),
    );
  }

  const [offering] = await db
    .select({
      id: courseOfferings.id,
      courseId: courseOfferings.courseId,
      cohortId: courseOfferings.cohortId,
      academicPeriodId:
        courseOfferings.academicPeriodId,
      type: courseOfferings.type,
      credits: courseOfferings.credits,
      displayOrder: courseOfferings.displayOrder,
      status: courseOfferings.status,
    })
    .from(courseOfferings)
    .where(and(...conditions))
    .limit(1);

  if (!offering) {
    throw new CoursesServiceError("OFFERING_NOT_FOUND");
  }

  const [course, cohort, period] =
    await Promise.all([
      loadCourseScope(
        offering.courseId,
        includeArchived,
      ),
      loadCohortScope(offering.cohortId),
      loadAcademicPeriodScope(
        offering.academicPeriodId,
      ),
    ]);

  if (
    course.collegeId !== cohort.collegeId ||
    course.collegeId !== period.collegeId
  ) {
    throw new CoursesServiceError(
      "COURSE_COLLEGE_MISMATCH",
    );
  }

  return {
    ...offering,
    collegeId: course.collegeId,
    organizationId: course.organizationId,
    cohortStatus: cohort.status,
    cohortStartPeriodId: cohort.startPeriodId,
    cohortExpectedEndPeriodId:
      cohort.expectedEndPeriodId,
    periodStatus: period.status,
    periodStartDate: period.startDate,
    periodEndDate: period.endDate,
  };
}

export async function loadCourseSectionDeliveryScope(
  deliveryId: string,
  includeEnded = false,
) {
  const db = getDb();
  const [delivery] = await db
    .select()
    .from(courseSectionDeliveries)
    .where(
      eq(courseSectionDeliveries.id, deliveryId),
    )
    .limit(1);

  if (
    !delivery ||
    (!includeEnded && delivery.endedAt)
  ) {
    throw new CoursesServiceError(
      "SECTION_DELIVERY_NOT_FOUND",
    );
  }

  const [offering, section] =
    await Promise.all([
      loadCourseOfferingScope(
        delivery.offeringId,
        includeEnded,
      ),
      loadSectionScope(delivery.sectionId),
    ]);

  if (
    offering.collegeId !== section.collegeId ||
    offering.cohortId !== section.cohortId ||
    offering.academicPeriodId !==
      section.academicPeriodId
  ) {
    throw new CoursesServiceError(
      "OFFERING_COHORT_PERIOD_MISMATCH",
    );
  }

  return {
    ...delivery,
    courseId: offering.courseId,
    cohortId: offering.cohortId,
    academicPeriodId:
      offering.academicPeriodId,
    collegeId: offering.collegeId,
    organizationId: offering.organizationId,
    offeringStatus: offering.status,
  };
}

export async function loadCourseTeachingAssignmentScope(
  assignmentId: string,
  includeEnded = false,
) {
  const db = getDb();
  const [assignment] = await db
    .select()
    .from(courseTeachingAssignments)
    .where(
      eq(
        courseTeachingAssignments.id,
        assignmentId,
      ),
    )
    .limit(1);

  if (
    !assignment ||
    (!includeEnded && assignment.endedAt)
  ) {
    throw new CoursesServiceError(
      "TEACHING_ASSIGNMENT_NOT_FOUND",
    );
  }

  const delivery =
    await loadCourseSectionDeliveryScope(
      assignment.deliveryId,
      true,
    );

  return {
    ...assignment,
    collegeId: delivery.collegeId,
    organizationId: delivery.organizationId,
    deliveryEndedAt: delivery.endedAt,
  };
}

export async function loadCourseMembership(
  membershipId: string,
) {
  const db = getDb();
  const [membership] = await db
    .select({
      id: collegeMemberships.id,
      collegeId: collegeMemberships.collegeId,
      organizationId: colleges.organizationId,
      status: collegeMemberships.status,
    })
    .from(collegeMemberships)
    .innerJoin(
      colleges,
      eq(colleges.id, collegeMemberships.collegeId),
    )
    .innerJoin(
      organizations,
      eq(organizations.id, colleges.organizationId),
    )
    .where(
      and(
        eq(collegeMemberships.id, membershipId),
        eq(colleges.status, "ACTIVE"),
        eq(organizations.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (!membership) {
    throw new CoursesServiceError(
      "MEMBERSHIP_NOT_FOUND",
    );
  }

  const roles = await db
    .select({ role: membershipRoles.role })
    .from(membershipRoles)
    .where(
      eq(
        membershipRoles.membershipId,
        membershipId,
      ),
    );

  return {
    ...membership,
    roles: roles.map(
      (row) => row.role,
    ) as MembershipRole[],
  };
}

export async function loadLearningPathScope(
  learningPathId: string,
  includeArchived = false,
) {
  const db = getDb();
  const conditions = [
    eq(courseLearningPaths.id, learningPathId),
  ];

  if (!includeArchived) {
    conditions.push(
      ne(courseLearningPaths.status, "ARCHIVED"),
    );
  }

  const [path] = await db
    .select()
    .from(courseLearningPaths)
    .where(and(...conditions))
    .limit(1);

  if (!path) {
    throw new CoursesServiceError(
      "LEARNING_PATH_NOT_FOUND",
    );
  }

  const offering =
    await loadCourseOfferingScope(
      path.offeringId,
      includeArchived,
    );

  return {
    ...path,
    courseId: offering.courseId,
    cohortId: offering.cohortId,
    academicPeriodId:
      offering.academicPeriodId,
    collegeId: offering.collegeId,
    organizationId: offering.organizationId,
  };
}

export async function loadCourseLessonScope(
  lessonId: string,
  includeArchived = false,
) {
  const db = getDb();
  const conditions = [
    eq(courseLessons.id, lessonId),
  ];

  if (!includeArchived) {
    conditions.push(
      eq(courseLessons.status, "ACTIVE"),
    );
  }

  const [lesson] = await db
    .select()
    .from(courseLessons)
    .where(and(...conditions))
    .limit(1);

  if (!lesson) {
    throw new CoursesServiceError(
      "LESSON_NOT_FOUND",
    );
  }

  const path = await loadLearningPathScope(
    lesson.learningPathId,
    includeArchived,
  );

  return {
    ...lesson,
    offeringId: path.offeringId,
    learningPathStatus: path.status,
    collegeId: path.collegeId,
    organizationId: path.organizationId,
  };
}

export async function loadLessonContentScope(
  contentId: string,
  includeArchived = false,
) {
  const db = getDb();
  const conditions = [
    eq(lessonContents.id, contentId),
  ];

  if (!includeArchived) {
    conditions.push(
      ne(lessonContents.status, "ARCHIVED"),
    );
  }

  const [content] = await db
    .select()
    .from(lessonContents)
    .where(and(...conditions))
    .limit(1);

  if (!content) {
    throw new CoursesServiceError(
      "LESSON_CONTENT_NOT_FOUND",
    );
  }

  const lesson = await loadCourseLessonScope(
    content.lessonId,
    includeArchived,
  );

  if (content.deliveryId) {
    const delivery =
      await loadCourseSectionDeliveryScope(
        content.deliveryId,
        true,
      );

    if (
      delivery.offeringId !== lesson.offeringId
    ) {
      throw new CoursesServiceError(
        "CONTENT_DELIVERY_MISMATCH",
      );
    }
  }

  return {
    ...content,
    offeringId: lesson.offeringId,
    learningPathId: lesson.learningPathId,
    learningPathStatus:
      lesson.learningPathStatus,
    lessonVisibleToStudents: lesson.visibleToStudents,
    collegeId: lesson.collegeId,
    organizationId: lesson.organizationId,
  };
}
