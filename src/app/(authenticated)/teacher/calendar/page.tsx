import { getCurrentRequestContext } from "@/auth/request-context";
import {
  LearnerClassSchedule,
  type LearnerScheduleEvent,
} from "@/components/academics/learner-class-schedule";
import { PageHeader } from "@/components/ui/page-header";
import { getFacultyClassSchedule } from "@/modules/courses/faculty-schedule-service";

export default async function FacultyCalendarPage() {
  const context = await getCurrentRequestContext();
  const schedule = await getFacultyClassSchedule(context);
  const events: LearnerScheduleEvent[] = schedule.events.map((event) => ({
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
        eyebrow="Faculty"
        title="Class Schedule"
        description="Your active teaching Sections and upcoming class sessions, with day/week/month views and course filters."
      />
      <LearnerClassSchedule
        sections={schedule.sections}
        courses={schedule.courses}
        events={events}
        courseBasePath="/teach/courses"
      />
    </div>
  );
}
