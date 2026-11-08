import { notFound } from "next/navigation";
import { ErrorState } from "@/components/ui/error-state";
import { resolveOwnLearnerCalendarFilters } from "@/modules/academics/learner-calendar-filter-model";
import {learnerCalendarQuerySchema} from "@/modules/academics/learner-calendar-filter-model";
import {learnerCalendarVisibleWindow, learnerCalendarMetricWindows} from "@/modules/academics/learner-calendar-window-model";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  LearnerClassSchedule,
  type LearnerScheduleEvent,
} from "@/components/academics/learner-class-schedule";
import { PageHeader } from "@/components/ui/page-header";
import { getLearnerClassSchedule } from "@/modules/academics/learner-schedule-service";
import { AuthorizationError } from "@/modules/permissions/policy";
import { AcademicsServiceError } from "@/modules/academics/errors";
import { CoursesServiceError } from "@/modules/courses/errors";
import { ButtonLink } from "@/components/ui/button-link";

export default async function LearnerCalendarPage({searchParams}:{
  searchParams:Promise<{view?:string|string[];month?:string|string[];deliveryId?:string|string[]}>;
}) {
  const [rawQuery, context] = await Promise.all([searchParams, getCurrentRequestContext()]);
  const validated=learnerCalendarQuerySchema.safeParse(rawQuery);
  if(!validated.success) return <section className="min-w-0 space-y-4">
    <PageHeader title="Class Schedule" />
    <ErrorState title="Invalid calendar filters"
      description="The calendar link includes an invalid or repeated month, view or course filter. Clear the filters to return to your schedule."
      retryHref="/learn/calendar" retryLabel="Clear calendar filters" />
  </section>;
  const now = new Date();
  const window=learnerCalendarVisibleWindow(validated.data.month,now);
  let schedule: Awaited<ReturnType<typeof getLearnerClassSchedule>>;
  let scheduleWarning: string | null = null;
  try {
    schedule = await getLearnerClassSchedule(context, window);
  } catch (error) {
    // Access and validation failures must still reach the authenticated error
    // boundary. A transient timetable failure stays within the page as a
    // dismissible warning, so the learner can navigate or retry.
    if (error instanceof AuthorizationError ||
        error instanceof AcademicsServiceError ||
        error instanceof CoursesServiceError) throw error;
    scheduleWarning = "Unable to load class schedule. Please try again.";
    schedule = { sections: [], courses: [], events: [], courseLookupWarning: null,
      lookupStatus: "LOOKUP_FAILED" };
  }
  // A transient schedule failure cannot resolve the requested delivery against
  // an empty fallback course list. That is a failed read, not a missing course.
  // Do not convert it into a misleading 404 or infer that the learner has no
  // enrolled courses; let them retry from their own calendar instead.
  if (scheduleWarning && validated.data.deliveryId) return <section className="min-w-0 space-y-4">
    <PageHeader title="Class Schedule" />
    <ErrorState title="Class schedule temporarily unavailable"
      description="We could not confirm the classes for this selected course. No attendance or course records were changed. Try the calendar again."
      retryHref="/learn/calendar" retryLabel="Open class schedule" />
  </section>;
  // Today and upcoming are independent of whichever calendar month is visible.
  // Each metric window is bounded and re-authorized for this learner.
  const metrics = await Promise.allSettled(
    learnerCalendarMetricWindows(now).map(range => getLearnerClassSchedule(context,range)),
  );
  // A revoked membership or cross-college scope must not be masked as a
  // transient schedule warning while partial metrics are still displayed.
  for (const result of metrics) {
    if (result.status === "rejected" && result.reason instanceof AuthorizationError) {
      throw result.reason;
    }
  }
  const metricsWarning = metrics.some(result => result.status === "rejected")
    ? "Unable to load the complete upcoming class schedule. Please try again." : null;
  const metricRows = metrics.flatMap(result =>
    result.status === "fulfilled" ? result.value.events : []);
  const filters = resolveOwnLearnerCalendarFilters(rawQuery, schedule.courses, new Date());
  if (!filters) notFound();

  /** ClassIdAndDateRangeResponse -> vNext crosswalk:
   * classScheduleId -> event.id (UUID), classId -> sectionId (UUID),
   * courseId -> courseId (UUID), facultyId -> facultyName (scoped display),
   * hallId -> location, courseSlug -> courseCode / deliveryId,
   * start/end -> startsAt/endsAt ISO. No legacy integer IDs are fabricated.
   * vNext also retains description, section and authorized course delivery.
   */
  function toScheduleEvent(event: (typeof schedule.events)[number]): LearnerScheduleEvent {
    return {
      id: event.id,
      sectionId: event.sectionId,
      sectionName: event.sectionName,
      title: event.title,
      description: event.description,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt.toISOString(),
      location: event.location,
      facultyName: event.facultyName,
      deliveryId: event.deliveryId,
      courseId: event.courseId,
      courseName: event.courseName,
      courseCode: event.courseCode,
    };
  }
  const events = schedule.events.map(toScheduleEvent);
  const metricEvents = metricRows.map(toScheduleEvent);

  return (
    <div className="min-w-0 space-y-4 md:space-y-6">
      <PageHeader title="Class Schedule" actions={(
        <ButtonLink variant="secondary" href="/learn/attendance/calendar"
          className="w-full md:w-auto">
          Attendance calendar →
        </ButtonLink>
      )} />
      
      <LearnerClassSchedule
        calendarMode="IST"
        initialAnchorDay={filters.anchorDay}
        sections={schedule.sections.map(
          (section) => ({
            sectionId: section.sectionId,
            sectionName: section.sectionName,
            sectionCode: section.sectionCode,
            academicPeriodName:
              section.academicPeriodName,
          }),
        )}
        courses={schedule.courses}
        events={events}
        metricEvents={metricEvents}
        courseLookupWarning={schedule.courseLookupWarning}
        metricsWarning={metricsWarning ?? scheduleWarning}
        initialView={filters.view}
        initialAnchor={filters.anchor}
        initialSelectedDeliveryIds={filters.selectedDeliveryIds}
      />
    </div>
  );
}
