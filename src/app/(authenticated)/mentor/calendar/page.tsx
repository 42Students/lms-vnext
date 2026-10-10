import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { MentorMeetingsCalendar } from "@/components/projects/mentor-meetings-calendar";
import { listMyMentorCalendarMeetings } from "@/modules/projects/mentor-calendar-service";

export const dynamic = "force-dynamic";

export default async function MentorCalendarPage() {
  const context = await getCurrentRequestContext();
  const meetings = await listMyMentorCalendarMeetings(context);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Mentor" title="Meetings"
        description="Every meeting across your assigned Projects, in one place." />
      <MentorMeetingsCalendar meetings={meetings}
        initialNow={new Date().toISOString()} />
    </div>
  );
}
