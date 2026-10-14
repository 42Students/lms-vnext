import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  LearnerClassSchedule,
  type LearnerScheduleEvent,
} from "@/components/academics/learner-class-schedule";
import { PageHeader } from "@/components/ui/page-header";
import { getLearnerClassSchedule } from "@/modules/academics/learner-schedule-service";

export default async function LearnerCalendarPage() {
  const context =
    await getCurrentRequestContext();
  const schedule =
    await getLearnerClassSchedule(context);

  const events: LearnerScheduleEvent[] =
    schedule.events.map((event) => ({
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
    }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learner"
        title="Class Schedule"
        description="Your current Section schedule, Course filters and upcoming classes."
      />
      <div className="flex flex-wrap justify-end">
        <Link href="/learn/attendance/calendar"
          className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:underline">
          Attendance calendar →
        </Link>
      </div>
      <LearnerClassSchedule
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
      />
    </div>
  );
}
