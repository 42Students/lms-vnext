import { getCurrentRequestContext } from "@/auth/request-context";
import {
  LearnerAttendanceWorkspace,
} from "@/components/attendance/learner-attendance-workspace";
import { PageHeader } from "@/components/ui/page-header";
import {
  getLearnerAttendanceWorkspace,
} from "@/modules/attendance/learner-service";

export default async function LearnerAttendancePage() {
  const context =
    await getCurrentRequestContext();
  const workspace =
    await getLearnerAttendanceWorkspace(
      context,
    );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learner"
        title="Attendance"
        description="Your marked attendance, unmarked sessions and College threshold across active Courses."
      />
      <LearnerAttendanceWorkspace
        courses={workspace.courses}
        summaries={workspace.summaries}
        threshold={
          workspace.policy
            .eligibilityThresholdPercent
        }
        records={workspace.records.map(
          (record) => ({
            ...record,
            startsAt:
              record.startsAt.toISOString(),
            endsAt:
              record.endsAt.toISOString(),
            markedAt:
              record.markedAt?.toISOString() ??
              null,
          }),
        )}
      />
    </div>
  );
}
