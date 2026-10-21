import Link from "next/link";
import { notFound } from "next/navigation";
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

export default async function LearnerCalendarPage({searchParams}:{
  searchParams:Promise<{view?:string|string[];month?:string|string[];deliveryId?:string|string[]}>;
}) {
  const rawQuery=await searchParams;
  const validated=learnerCalendarQuerySchema.safeParse(rawQuery);
  if(!validated.success)notFound();
  const now = new Date();
  const window=learnerCalendarVisibleWindow(validated.data.month,now);
  const context =
    await getCurrentRequestContext();
  const schedule =
    await getLearnerClassSchedule(context,window);
  // Today and upcoming are independent of whichever calendar month is visible.
  // Each metric window is bounded and re-authorized for this learner.
  const metrics = await Promise.allSettled(
    learnerCalendarMetricWindows(now).map(range => getLearnerClassSchedule(context,range)),
  );
  const metricsWarning = metrics.some(result => result.status === "rejected")
    ? "Unable to load the complete upcoming class schedule. Please try again." : null;
  const metricRows = metrics.flatMap(result =>
    result.status === "fulfilled" ? result.value.events : []);
  const filters = resolveOwnLearnerCalendarFilters(rawQuery, schedule.courses, new Date());
  if (!filters) notFound();

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
        <Link href="/learn/attendance/calendar"
          className="inline-flex min-h-[var(--lms-control-height)] w-full max-md:min-h-11 items-center justify-center md:w-auto rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text transition-colors duration-[var(--lms-motion-fast)] motion-reduce:transition-none hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
          Attendance calendar →
        </Link>
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
        metricsWarning={metricsWarning}
        initialView={filters.view}
        initialAnchor={filters.anchor}
        initialSelectedDeliveryIds={filters.selectedDeliveryIds}
      />
    </div>
  );
}
