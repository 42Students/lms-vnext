import "server-only";

import type { RequestContext } from "@/modules/identity/context";
import { getAcademicsWorkspace } from "@/modules/academics/workspace";
import {
  listCollegePeopleWithRuntime,
} from "@/modules/people/runtime";
import { listCourses } from "./course-service";
import { listCourseOfferings } from "./offering-service";
import {
  listCourseSectionDeliveries,
} from "./delivery-service";
import {
  listCourseTeachingAssignments,
} from "./teaching-assignment-service";

async function listAllCollegePeople(
  context: RequestContext,
  collegeId: string,
) {
  const items: Awaited<
    ReturnType<
      typeof listCollegePeopleWithRuntime
    >
  >["items"] = [];
  let offset = 0;

  while (true) {
    const page =
      await listCollegePeopleWithRuntime(
        context,
        {
          collegeId,
          limit: 100,
          offset,
        },
      );

    items.push(...page.items);
    offset += page.items.length;

    if (
      page.items.length === 0 ||
      offset >= page.pagination.total
    ) {
      break;
    }
  }

  return items;
}

export async function getAdminCourseWorkspace(
  context: RequestContext,
  collegeId: string,
) {
  const [academics, courses, people] =
    await Promise.all([
      getAcademicsWorkspace(
        context,
        collegeId,
      ),
      listCourses(context, collegeId),
      listAllCollegePeople(
        context,
        collegeId,
      ),
    ]);

  const activeCohorts =
    academics.cohorts.filter(
      (cohort) =>
        cohort.status !== "ARCHIVED",
    );

  const offeringGroups = await Promise.all(
    activeCohorts.map(
      async (cohort) => ({
        cohort,
        offerings:
          await listCourseOfferings(
            context,
            cohort.id,
          ),
      }),
    ),
  );

  const courseById = new Map(
    courses.map((course) => [
      course.id,
      course,
    ]),
  );
  const periodById = new Map(
    academics.periods.map((period) => [
      period.id,
      period,
    ]),
  );

  const offerings = offeringGroups.flatMap(
    ({ cohort, offerings: items }) =>
      items.map((offering) => ({
        ...offering,
        cohortName: cohort.name,
        cohortCode: cohort.code,
        programId: cohort.programId,
        programName: cohort.programName,
        departmentId:
          courseById.get(
            offering.courseId,
          )?.departmentId ?? null,
        departmentName:
          courseById.get(
            offering.courseId,
          )?.departmentName ??
          "Unknown department",
        academicPeriodCode:
          periodById.get(
            offering.academicPeriodId,
          )?.code ?? "—",
      })),
  );

  const deliveryGroups = await Promise.all(
    offerings.map(
      async (offering) => ({
        offering,
        deliveries:
          await listCourseSectionDeliveries(
            context,
            offering.id,
          ),
      }),
    ),
  );

  const deliveries =
    deliveryGroups.flatMap(
      ({ offering, deliveries: items }) =>
        items.map((delivery) => ({
          ...delivery,
          courseId: offering.courseId,
          courseName:
            offering.courseName,
          courseCode:
            offering.courseCode,
          cohortId: offering.cohortId,
          cohortName:
            offering.cohortName,
          academicPeriodId:
            offering.academicPeriodId,
          academicPeriodName:
            offering.academicPeriodName,
        })),
    );

  const teachingGroups =
    await Promise.all(
      deliveries.map(
        async (delivery) => ({
          delivery,
          assignments:
            await listCourseTeachingAssignments(
              context,
              delivery.id,
            ),
        }),
      ),
    );

  const teachingAssignments =
    teachingGroups.flatMap(
      ({ delivery, assignments }) =>
        assignments.map((assignment) => ({
          ...assignment,
          courseName:
            delivery.courseName,
          courseCode:
            delivery.courseCode,
          sectionName:
            delivery.sectionName,
          sectionCode:
            delivery.sectionCode,
        })),
    );

  const faculty = people
    .filter(
      (person) =>
        person.membership.status ===
          "ACTIVE" &&
        person.membership.roles.includes(
          "FACULTY",
        ),
    )
    .map((person) => ({
      membershipId:
        person.membership.id,
      displayName:
        person.user.displayName ??
        person.user.email ??
        "Unnamed Faculty",
      email: person.user.email,
    }))
    .sort((a, b) =>
      a.displayName.localeCompare(
        b.displayName,
      ),
    );

  return {
    collegeId,
    departments: academics.departments,
    periods: academics.periods,
    programs: academics.programs,
    cohorts: academics.cohorts,
    sections: academics.sections,
    faculty,
    courses,
    offerings,
    deliveries,
    teachingAssignments,
    summary: {
      courses: courses.length,
      offerings: offerings.length,
      deliveries: deliveries.length,
      teachingAssignments:
        teachingAssignments.length,
    },
  };
}
