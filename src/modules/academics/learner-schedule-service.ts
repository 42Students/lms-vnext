import "server-only";

import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNull,
  leftJoin,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  academicPeriods,
  collegeMemberships,
  courseOfferings,
  courseSectionDeliveries,
  courses,
  learnerProgramEnrollments,
  sectionEnrollments,
  sectionScheduleEventCourses,
  sectionScheduleEvents,
  sections,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { AcademicsServiceError } from "./errors";

function requireLearnerMembership(
  context: RequestContext,
) {
  if (
    !context.membership ||
    context.membership.status !== "ACTIVE" ||
    !context.membership.roles.includes("LEARNER")
  ) {
    throw new AcademicsServiceError(
      "LEARNER_SCHEDULE_ACCESS_DENIED",
    );
  }

  return context.membership;
}

export async function getLearnerClassSchedule(
  context: RequestContext,
) {
  const membership =
    requireLearnerMembership(context);
  const db = getDb();

  const placements = await db
    .select({
      sectionId: sections.id,
      sectionName: sections.name,
      sectionCode: sections.code,
      academicPeriodId: academicPeriods.id,
      academicPeriodName: academicPeriods.name,
      periodStartDate: academicPeriods.startDate,
      periodEndDate: academicPeriods.endDate,
      periodStatus: academicPeriods.status,
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
      eq(sections.id, sectionEnrollments.sectionId),
    )
    .innerJoin(
      academicPeriods,
      eq(
        academicPeriods.id,
        sectionEnrollments.academicPeriodId,
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
        eq(sectionEnrollments.status, "ACTIVE"),
        eq(sections.status, "ACTIVE"),
        inArray(academicPeriods.status, [
          "PLANNED",
          "ACTIVE",
        ]),
      ),
    )
    .orderBy(
      desc(academicPeriods.startDate),
      asc(sections.name),
    );

  if (placements.length === 0) {
    return {
      sections: [],
      courses: [],
      events: [],
    };
  }

  const sectionIds = placements.map(
    (placement) => placement.sectionId,
  );

  const [courseRows, eventRows] =
    await Promise.all([
      db
        .select({
          deliveryId:
            courseSectionDeliveries.id,
          sectionId:
            courseSectionDeliveries.sectionId,
          courseId: courses.id,
          courseName: courses.name,
          courseCode: courses.code,
        })
        .from(courseSectionDeliveries)
        .innerJoin(
          courseOfferings,
          and(
            eq(
              courseOfferings.id,
              courseSectionDeliveries.offeringId,
            ),
            eq(courseOfferings.status, "ACTIVE"),
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
        .where(
          and(
            inArray(
              courseSectionDeliveries.sectionId,
              sectionIds,
            ),
            isNull(
              courseSectionDeliveries.endedAt,
            ),
          ),
        )
        .orderBy(asc(courses.name)),
      db
        .select({
          id: sectionScheduleEvents.id,
          sectionId:
            sectionScheduleEvents.sectionId,
          sectionName: sections.name,
          title: sectionScheduleEvents.title,
          description:
            sectionScheduleEvents.description,
          startsAt:
            sectionScheduleEvents.startsAt,
          endsAt: sectionScheduleEvents.endsAt,
          location:
            sectionScheduleEvents.location,
          facultyName: users.displayName,
          deliveryId:
            sectionScheduleEventCourses.deliveryId,
          courseId: courses.id,
          courseName: courses.name,
          courseCode: courses.code,
        })
        .from(sectionScheduleEvents)
        .innerJoin(
          sections,
          eq(
            sections.id,
            sectionScheduleEvents.sectionId,
          ),
        )
        .leftJoin(
          sectionScheduleEventCourses,
          eq(
            sectionScheduleEventCourses.scheduleEventId,
            sectionScheduleEvents.id,
          ),
        )
        .leftJoin(
          courseSectionDeliveries,
          eq(
            courseSectionDeliveries.id,
            sectionScheduleEventCourses.deliveryId,
          ),
        )
        .leftJoin(
          courseOfferings,
          eq(
            courseOfferings.id,
            courseSectionDeliveries.offeringId,
          ),
        )
        .leftJoin(
          courses,
          eq(
            courses.id,
            courseOfferings.courseId,
          ),
        )
        .leftJoin(
          collegeMemberships,
          eq(
            collegeMemberships.id,
            sectionScheduleEvents.facultyMembershipId,
          ),
        )
        .leftJoin(
          users,
          eq(
            users.id,
            collegeMemberships.userId,
          ),
        )
        .where(
          and(
            inArray(
              sectionScheduleEvents.sectionId,
              sectionIds,
            ),
            eq(
              sectionScheduleEvents.status,
              "SCHEDULED",
            ),
          ),
        )
        .orderBy(
          asc(sectionScheduleEvents.startsAt),
        ),
    ]);

  return {
    sections: placements,
    courses: courseRows,
    events: eventRows,
  };
}
